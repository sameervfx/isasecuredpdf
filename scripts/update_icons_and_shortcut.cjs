const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const rcedit = require('rcedit');

async function main() {
  const rootDir = path.resolve(__dirname, '..');
  const iconIco = path.join(rootDir, 'electron', 'icon.ico');
  const iconPng = path.join(rootDir, 'electron', 'icon.png');
  const installDir = 'C:\\Users\\samee\\AppData\\Local\\Programs\\ISASecuredPDF Suite';
  const installedExe = path.join(installDir, 'ISASecuredPDF Suite.exe');
  const unpackedExe = path.join(rootDir, 'release', 'win-unpacked', 'ISASecuredPDF Suite.exe');

  console.log('1. Copying icon files to installation folder...');
  if (fs.existsSync(installDir)) {
    fs.copyFileSync(iconIco, path.join(installDir, 'app.ico'));
    fs.copyFileSync(iconPng, path.join(installDir, 'app.png'));
    console.log('   Copied app.ico and app.png to', installDir);
  }

  console.log('2. Stamping icon & version info via rcedit...');
  const versionInfo = {
    icon: iconIco,
    'version-string': {
      ProductName: 'ISASecuredPDF Suite',
      FileDescription: 'ISASecuredPDF Suite - Best Free PDF Editor & Converter (100% Client-Side)',
      CompanyName: '9476-7449 Québec Inc.',
      LegalCopyright: 'Copyright © 2026 9476-7449 Québec Inc.',
    }
  };

  if (fs.existsSync(installedExe)) {
    await rcedit(installedExe, versionInfo);
    console.log('   Stamped installed exe at:', installedExe);
  }

  if (fs.existsSync(unpackedExe)) {
    await rcedit(unpackedExe, versionInfo);
    console.log('   Stamped unpacked exe at:', unpackedExe);
  }

  console.log('3. Updating Desktop & Start Menu Shortcuts...');
  const desktopLnk = 'C:\\Users\\samee\\Desktop\\ISA Secure PDF.lnk';
  const startMenuLnk = path.join(process.env.APPDATA || '', 'Microsoft\\Windows\\Start Menu\\Programs\\ISASecuredPDF Suite\\Isa Secure PDF.lnk');

  const updateLnk = (lnkPath) => {
    if (fs.existsSync(lnkPath)) {
      try {
        const cmd = `powershell -NoProfile -Command "$w=New-Object -ComObject WScript.Shell;$s=$w.CreateShortcut('${lnkPath.replace(/'/g, "''")}');$s.IconLocation='${path.join(installDir, 'app.ico').replace(/'/g, "''")},0';$s.Save()"`;
        execSync(cmd);
        console.log('   Updated shortcut:', lnkPath);
      } catch (err) {
        console.error('   Failed to update shortcut:', lnkPath, err.message);
      }
    }
  };

  updateLnk(desktopLnk);
  updateLnk(startMenuLnk);

  console.log('4. Refreshing Windows Icon Cache...');
  try {
    execSync('ie4uinit.exe -show', { stdio: 'ignore' });
  } catch (e) {}

  console.log('Icon & shortcut update completed successfully!');
}

main().catch(console.error);
