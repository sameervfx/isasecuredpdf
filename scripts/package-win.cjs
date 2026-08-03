const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const releaseDir = path.resolve('release');
const winDir = path.join(releaseDir, 'Isa_Secure_PDF_Suite_v1.0.0_Beta_Windows');

if (fs.existsSync(winDir)) fs.rmSync(winDir, { recursive: true, force: true });
fs.mkdirSync(winDir, { recursive: true });

console.log('Copying production assets and Electron main script for Windows package...');
cp.execSync(`xcopy /E /I /Y dist "${path.join(winDir, 'dist')}"`);
cp.execSync(`xcopy /E /I /Y electron "${path.join(winDir, 'electron')}"`);
fs.copyFileSync('package.json', path.join(winDir, 'package.json'));

// Clean any accidental zip files copied inside dist
const winDistDir = path.join(winDir, 'dist');
if (fs.existsSync(winDistDir)) {
  const files = fs.readdirSync(winDistDir);
  for (const file of files) {
    if (file.endsWith('.zip')) {
      console.log('Removing nested zip artifact:', file);
      fs.rmSync(path.join(winDistDir, file), { force: true });
    }
  }
}

console.log('Successfully created Windows Desktop Beta package folder at:', winDir);
