#!/usr/bin/env node
// diagnostics.js: Quick check for backend, socket, Metro, adb reverse
const http = require('http');
const { execSync } = require('child_process');

function check(url, name) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      resolve(`${name}: ${res.statusCode === 200 ? 'OK' : 'FAIL'} (${res.statusCode})`);
    });
    req.on('error', () => resolve(`${name}: FAIL (no response)`));
    req.setTimeout(3000, () => {
      req.abort();
      resolve(`${name}: TIMEOUT`);
    });
  });
}

async function main() {
  const results = [];
  results.push(await check('http://127.0.0.1:3002/health', 'Backend /health'));
  results.push(await check('http://127.0.0.1:3002/socket.io/?EIO=4&transport=polling', 'Socket handshake'));

  // Metro check
  try {
    const metro = execSync('curl -s http://127.0.0.1:8081/status', { encoding: 'utf8', timeout: 3000 });
    results.push(`Metro: ${metro.includes('packager-status:running') ? 'OK' : 'FAIL'}`);
  } catch {
    results.push('Metro: FAIL');
  }

  // adb reverse check
  try {
    const adb = execSync('adb reverse --list', { encoding: 'utf8', timeout: 3000 });
    results.push(`adb reverse: ${adb.includes('tcp:8081') ? 'OK' : 'NOT SET'}`);
  } catch {
    results.push('adb reverse: FAIL');
  }

  console.log('\n=== Diagnostics ===');
  results.forEach(r => console.log(r));
}

main();
