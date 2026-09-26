const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const sevenZip = path.resolve('node_modules/7zip-bin/win/x64/7za.exe');
const setupExe = path.resolve('release/ISASecuredPDF Suite Setup 1.6.9.exe');
const tmpDir = path.resolve('release/tmp_test_extract');

if (fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true, force: true });
fs.mkdirSync(tmpDir, { recursive: true });

try {
  const output = execSync(`"${sevenZip}" l "${setupExe}"`).toString();
  console.log('--- 7z list output (first 30 lines) ---');
  console.log(output.split('\n').slice(0, 30).join('\n'));
} catch (e) {
  console.error('Failed to list setup exe:', e);
}
