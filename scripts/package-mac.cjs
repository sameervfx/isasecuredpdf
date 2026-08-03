const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const releaseDir = path.resolve('release');
const macDir = path.join(releaseDir, 'Isa_Secure_PDF_Suite_v1.0.0_Beta_Mac');

if (fs.existsSync(macDir)) fs.rmSync(macDir, { recursive: true, force: true });
fs.mkdirSync(macDir, { recursive: true });

console.log('Copying production assets and Electron main script for macOS package...');
cp.execSync(`xcopy /E /I /Y dist "${path.join(macDir, 'dist')}"`);
cp.execSync(`xcopy /E /I /Y electron "${path.join(macDir, 'electron')}"`);
fs.copyFileSync('package.json', path.join(macDir, 'package.json'));

// Clean any accidental zip files copied inside dist
const macDistDir = path.join(macDir, 'dist');
if (fs.existsSync(macDistDir)) {
  const files = fs.readdirSync(macDistDir);
  for (const file of files) {
    if (file.endsWith('.zip')) {
      console.log('Removing nested zip artifact:', file);
      fs.rmSync(path.join(macDistDir, file), { force: true });
    }
  }
}

console.log('Successfully created macOS Desktop Beta package folder at:', macDir);
