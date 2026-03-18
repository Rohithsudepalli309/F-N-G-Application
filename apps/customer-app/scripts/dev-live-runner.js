const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn, spawnSync } = require('child_process');

const appRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(appRoot, '..', '..');
const backendRoot = path.join(repoRoot, 'backend');

function run(command, args, options = {}) {
  return spawnSync(command, args, {
    cwd: appRoot,
    stdio: 'pipe',
    encoding: 'utf8',
    shell: false,
    ...options,
  });
}

function runPrint(command, args, options = {}) {
  return spawnSync(command, args, {
    cwd: appRoot,
    stdio: 'inherit',
    shell: false,
    ...options,
  });
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function checkBackendHealth() {
  return new Promise(resolve => {
    const req = http.get('http://127.0.0.1:3002/health', { timeout: 1500 }, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function ensureBackendRunning() {
  console.log('[FNG] Checking backend health on 3002...');
  if (await checkBackendHealth()) {
    console.log('[FNG] Backend already running.');
    return true;
  }

  if (!fs.existsSync(backendRoot)) {
    console.error('[FNG] Backend folder not found. Expected:', backendRoot);
    return false;
  }

  console.log('[FNG] Starting backend in background...');
  const backend = spawn('cmd.exe', ['/c', 'npx ts-node --transpile-only src/server.ts'], {
    cwd: backendRoot,
    detached: true,
    stdio: 'ignore',
    shell: false,
  });
  backend.unref();

  for (let i = 0; i < 45; i += 1) {
    if (await checkBackendHealth()) {
      console.log('[FNG] Backend is healthy.');
      return true;
    }
    await wait(1000);
  }

  console.error('[FNG] Backend did not become healthy on port 3002.');
  return false;
}

function getAndroidSdkPath() {
  const fromEnv = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT;
  if (fromEnv && fs.existsSync(fromEnv)) {
    return fromEnv;
  }

  const userProfile = process.env.USERPROFILE;
  if (!userProfile) {
    return null;
  }

  const fallback = path.join(userProfile, 'AppData', 'Local', 'Android', 'Sdk');
  return fs.existsSync(fallback) ? fallback : null;
}

function getEmulatorBinary() {
  const sdkPath = getAndroidSdkPath();
  if (!sdkPath) {
    return null;
  }

  const emulatorExe = path.join(sdkPath, 'emulator', 'emulator.exe');
  return fs.existsSync(emulatorExe) ? emulatorExe : null;
}

function hasConnectedEmulator() {
  const devices = run('adb', ['devices']);
  const output = `${devices.stdout || ''}\n${devices.stderr || ''}`;
  return /emulator-\d+\s+device/.test(output);
}

function getFirstAvdName() {
  const emulatorBinary = getEmulatorBinary();
  if (!emulatorBinary) {
    return null;
  }

  const avdResult = run(emulatorBinary, ['-list-avds']);
  const output = `${avdResult.stdout || ''}`.trim();
  if (!output) {
    return null;
  }

  return output.split(/\r?\n/).map(v => v.trim()).filter(Boolean)[0] || null;
}

async function tryStartEmulator() {
  const emulatorBinary = getEmulatorBinary();
  if (!emulatorBinary) {
    console.error('[FNG] Android SDK emulator not found. Set ANDROID_HOME/ANDROID_SDK_ROOT.');
    return false;
  }

  const avdName = getFirstAvdName();
  if (!avdName) {
    console.error('[FNG] No AVD found. Create one in Android Studio Device Manager.');
    return false;
  }

  console.log(`[FNG] Starting emulator: ${avdName}`);
  const emulator = spawn(emulatorBinary, ['-avd', avdName], {
    detached: true,
    stdio: 'ignore',
    shell: false,
  });
  emulator.unref();

  for (let i = 0; i < 120; i += 1) {
    if (hasConnectedEmulator()) {
      console.log('[FNG] Emulator is online.');
      return true;
    }
    await wait(1000);
  }

  console.error('[FNG] Emulator did not reach device state in time.');
  return false;
}

function checkMetroStatus() {
  return new Promise(resolve => {
    const req = http.get('http://127.0.0.1:8081/status', { timeout: 1500 }, (res) => {
      let body = '';
      res.on('data', chunk => {
        body += chunk.toString();
      });
      res.on('end', () => {
        resolve(body.includes('packager-status:running'));
      });
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function ensureMetroLive() {
  console.log('[FNG] Checking Metro status...');
  if (await checkMetroStatus()) {
    console.log('[FNG] Metro already running on 8081.');
    return true;
  }

  console.log('[FNG] Starting Metro (live mode, no reset-cache)...');
  const metro = spawn('cmd.exe', ['/c', 'npx react-native start --port 8081'], {
    cwd: appRoot,
    detached: true,
    stdio: 'ignore',
    shell: false,
  });
  metro.unref();

  for (let i = 0; i < 60; i += 1) {
    if (await checkMetroStatus()) {
      console.log('[FNG] Metro is ready for Fast Refresh.');
      return true;
    }
    await wait(1000);
  }

  console.error('[FNG] Metro did not become ready on 8081.');
  return false;
}

async function ensureEmulator() {
  console.log('[FNG] Checking connected emulator...');
  runPrint('adb', ['start-server']);
  if (hasConnectedEmulator()) {
    return true;
  }

  console.log('[FNG] No emulator detected. Attempting auto-start...');
  return tryStartEmulator();
}

function wireReversePorts() {
  console.log('[FNG] Wiring reverse ports (8081, 3002)...');
  runPrint('adb', ['reverse', 'tcp:8081', 'tcp:8081']);
  runPrint('adb', ['reverse', 'tcp:3002', 'tcp:3002']);
}

function isAppInstalled() {
  const result = run('adb', ['shell', 'pm', 'list', 'packages', 'com.customerapp']);
  const output = `${result.stdout || ''}`;
  return output.includes('package:com.customerapp');
}

function launchApp() {
  console.log('[FNG] Launching app...');
  const launch = runPrint('adb', ['shell', 'am', 'start', '-n', 'com.customerapp/com.customerapp.MainActivity', '-a', 'android.intent.action.MAIN', '-c', 'android.intent.category.LAUNCHER']);
  return launch.status === 0;
}

function installIfMissing() {
  if (isAppInstalled()) {
    return true;
  }

  console.log('[FNG] App not installed. Running one-time install...');
  const install = runPrint('cmd.exe', ['/c', 'scripts\\dev-android.cmd']);
  return install.status === 0;
}

async function main() {
  if (!(await ensureBackendRunning())) {
    process.exit(1);
  }

  if (!(await ensureEmulator())) {
    process.exit(1);
  }

  if (!(await ensureMetroLive())) {
    process.exit(1);
  }

  wireReversePorts();

  if (!installIfMissing()) {
    process.exit(1);
  }

  if (!launchApp()) {
    process.exit(1);
  }

  console.log('[FNG] Live mode active. Edit files and use Fast Refresh across the app.');
}

main();
