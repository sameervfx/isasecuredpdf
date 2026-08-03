const https = require('https');
const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const zipPath = path.join(process.env.TEMP || '.', 'electron-mac.zip');
const releaseDir = path.resolve('release');
const macDir = path.join(releaseDir, 'Isa_Secure_PDF_Suite_Mac');

if (!fs.existsSync(releaseDir)) fs.mkdirSync(releaseDir, { recursive: true });
if (fs.existsSync(macDir)) fs.rmSync(macDir, { recursive: true, force: true });
fs.mkdirSync(macDir, { recursive: true });

console.log('Downloading macOS Electron runtime v31.3.1...');
const file = fs.createWriteStream(zipPath);

function download(url) {
  https.get(url, (res) => {
    if (res.statusCode === 301 || res.statusCode === 302) {
      download(res.headers.location);
    } else if (res.statusCode === 200) {
      res.pipe(file);
      file.on('finish', () => {
        file.close(() => {
          console.log('Downloaded macOS Electron runtime. Extracting app bundle...');
          cp.execSync(`tar -xf "${zipPath}" -C "${macDir}"`);
          
          const appResourceDir = path.join(macDir, 'Electron.app', 'Contents', 'Resources', 'app');
          fs.mkdirSync(appResourceDir, { recursive: true });
          
          console.log('Copying production assets and Electron main script...');
          cp.execSync(`xcopy /E /I /Y dist "${path.join(appResourceDir, 'dist')}"`);
          cp.execSync(`xcopy /E /I /Y electron "${path.join(appResourceDir, 'electron')}"`);
          fs.copyFileSync('package.json', path.join(appResourceDir, 'package.json'));
          
          const targetAppName = path.join(macDir, 'Isa Secure PDF Suite.app');
          if (fs.existsSync(path.join(macDir, 'Electron.app'))) {
            fs.renameSync(path.join(macDir, 'Electron.app'), targetAppName);
          }
          
          console.log('Successfully assembled native macOS app bundle at:', targetAppName);
        });
      });
    } else {
      console.error('Download failed with status:', res.statusCode);
    }
  }).on('error', (err) => {
    console.error('Download error:', err.message);
  });
}

download('https://github.com/electron/electron/releases/download/v31.3.1/electron-v31.3.1-darwin-x64.zip');
