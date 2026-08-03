const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const rcedit = require('rcedit');

async function packageWin() {
  const releaseDir = path.resolve('release');
  const distPackagesDir = path.resolve('dist_packages');
  const portableWinDir = path.join(releaseDir, 'Isa_Secure_PDF_Suite_v1.0.0_Portable_Windows');

  if (fs.existsSync(portableWinDir)) fs.rmSync(portableWinDir, { recursive: true, force: true });
  if (!fs.existsSync(distPackagesDir)) fs.mkdirSync(distPackagesDir, { recursive: true });

  console.log('Building 1-Click Standalone Desktop Executable for Windows...');

  // 1. Copy Electron binary dist directory
  const electronDistDir = path.resolve('node_modules/electron/dist');
  cp.execSync(`xcopy /E /I /Y "${electronDistDir}" "${portableWinDir}"`);

  // 2. Rename electron.exe to Isa Secure PDF Suite.exe
  const defaultExe = path.join(portableWinDir, 'electron.exe');
  const targetExe = path.join(portableWinDir, 'Isa Secure PDF Suite.exe');
  if (fs.existsSync(defaultExe)) {
    fs.renameSync(defaultExe, targetExe);
  }

  // 3. Ensure valid multi-resolution 256x256 ICO file and inject into .exe binary using rcedit
  const pngPath = path.resolve('electron/icon.png');
  const iconPath = path.resolve('electron/icon.ico');
  if (fs.existsSync(pngPath)) {
    try {
      const pngToIco = (await import('png-to-ico')).default;
      const icoBuffer = await pngToIco([pngPath]);
      fs.writeFileSync(iconPath, icoBuffer);
    } catch (err) {
      console.warn('png-to-ico warning:', err.message);
    }
  }

  if (fs.existsSync(iconPath)) {
    try {
      await rcedit(targetExe, {
        icon: iconPath,
        'version-string': {
          ProductName: 'Isa Secure PDF Suite',
          FileDescription: 'Isa Secure PDF Suite Worksuite',
          CompanyName: 'PDF Engine Studio'
        }
      });
      console.log('Successfully injected multi-resolution custom icon into Isa Secure PDF Suite.exe');
    } catch (err) {
      console.warn('rcedit icon injection note:', err.message);
    }
  }

  // 4. Create resources/app directory
  const appDir = path.join(portableWinDir, 'resources', 'app');
  fs.mkdirSync(appDir, { recursive: true });

  // 5. Copy dist, electron, and package.json into resources/app
  cp.execSync(`xcopy /E /I /Y dist "${path.join(appDir, 'dist')}"`);
  cp.execSync(`xcopy /E /I /Y electron "${path.join(appDir, 'electron')}"`);
  fs.copyFileSync('package.json', path.join(appDir, 'package.json'));

  console.log('Successfully created 1-Click Portable Windows App folder at:', portableWinDir);
}

packageWin();
