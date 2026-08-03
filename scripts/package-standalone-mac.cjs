const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const releaseDir = path.resolve('release');
const distPackagesDir = path.resolve('dist_packages');
const portableMacDir = path.join(releaseDir, 'Isa_Secure_PDF_Suite_v1.0.0_Portable_Mac');
const zipPath = path.resolve('electron-mac.zip');

if (fs.existsSync(portableMacDir)) fs.rmSync(portableMacDir, { recursive: true, force: true });
if (!fs.existsSync(distPackagesDir)) fs.mkdirSync(distPackagesDir, { recursive: true });

console.log('Unpacking standalone macOS Electron runtime binary...');
fs.mkdirSync(portableMacDir, { recursive: true });

// Expand electron-mac.zip into portableMacDir
cp.execSync(`powershell -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${portableMacDir}' -Force"`);

// Target resources/app directory inside Electron.app/Contents/Resources/app
const appDir = path.join(portableMacDir, 'Electron.app', 'Contents', 'Resources', 'app');
fs.mkdirSync(appDir, { recursive: true });

console.log('Copying production assets and Electron main script into macOS app bundle...');
cp.execSync(`xcopy /E /I /Y dist "${path.join(appDir, 'dist')}"`);
cp.execSync(`xcopy /E /I /Y electron "${path.join(appDir, 'electron')}"`);
fs.copyFileSync('package.json', path.join(appDir, 'package.json'));

console.log('Successfully created 1-Click Portable macOS App bundle folder at:', portableMacDir);
