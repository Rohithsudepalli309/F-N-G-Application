const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir, { withFileTypes: true });
  for (const ent of list) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) results = results.concat(walk(p));
    else if (ent.isFile() && ent.name === 'build.gradle') results.push(p);
  }
  return results;
}

function guardComAndroidVersion(content) {
  if (content.includes('com.android.Version') && !content.includes('try {') && !content.includes("ANDROID_GRADLE_PLUGIN_VERSION")) {
    const replacement = `// Guard access to Android Gradle Plugin (AGP) Version. Try reading it, otherwise fallback to project property or default.\ndef agpVersion = '0.0.0'\ntry {\n  agpVersion = com.android.Version.ANDROID_GRADLE_PLUGIN_VERSION\n} catch (e) {\n  agpVersion = project.hasProperty('agpVersion') ? project.agpVersion : '8.1.1'\n}\n`;
    return content.replace(/(^|\n)([^\n\r]*agpVersion\s*=)/, '\n' + replacement + '$2')
                  .replace(/com.android.Version.ANDROID_GRADLE_PLUGIN_VERSION/g, 'agpVersion');
  }
  return content;
}

function replaceCompileSdkNumbers(content) {
  return content.replace(/(^|\n)\s*(compileSdkVersion|compileSdk)\s+([0-9]{2,3})(\s|\n)/g, (m, p1, p2, p3, p4) => {
    return `${p1}    ${p2} safeExtGet('compileSdkVersion', ${p3})${p4}`;
  });
}

function processFile(file) {
  let content = fs.readFileSync(file, 'utf8');
  const orig = content;
  content = guardComAndroidVersion(content);
  content = replaceCompileSdkNumbers(content);
  if (content !== orig) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Patched', file);
  }
}

function main() {
  const base = path.join(__dirname, '..', 'node_modules');
  if (!fs.existsSync(base)) {
    console.error('node_modules not found at', base);
    process.exit(1);
  }
  const files = walk(base);
  for (const f of files) {
    try { processFile(f); } catch (e) { console.error('Failed', f, e.message); }
  }
  console.log('Done. Run `cd apps/customer-app/android && ./gradlew clean assembleDebug --stacktrace --info`');
}

main();
