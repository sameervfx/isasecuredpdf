import fs from 'fs';
import path from 'path';

function walk(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.gradle')) {
      results.push(file);
    }
  });
  return results;
}

// 1. Patch Gradle dependencies across all subprojects
const gradleFiles = walk('android').concat(walk('node_modules/@capacitor'));
gradleFiles.forEach(p => {
  let c = fs.readFileSync(p, 'utf8');
  let updated = c.replace(/8\.13\.0/g, '8.4.0')
                 .replace(/8\.2\.2/g, '8.4.0')
                 .replace(/10\.1\.1/g, '14.0.1')
                 .replace(/10\.1\.2/g, '14.0.1');
  if (updated !== c) {
    fs.writeFileSync(p, updated);
    console.log('Patched gradle file:', p);
  }
});

// 2. Auto-bump versionCode in android/app/build.gradle
const appGradle = 'android/app/build.gradle';
if (fs.existsSync(appGradle)) {
  let c = fs.readFileSync(appGradle, 'utf8');
  let runNum = process.env.GITHUB_RUN_NUMBER || '2';
  // Ensure runNum is at least 2
  if (parseInt(runNum, 10) < 2) runNum = '2';
  
  let updated = c.replace(/versionCode\s+\d+/g, `versionCode ${runNum}`)
                 .replace(/versionName\s+["'].*?["']/g, 'versionName "1.3.0"');
  fs.writeFileSync(appGradle, updated);
  console.log(`Bumped android/app/build.gradle versionCode to: ${runNum}`);
}
