const path = require('path');
const rcedit = require('rcedit');
const fs = require('fs');

exports.default = async function(context) {
  if (context.electronPlatformName !== 'win32') return;
  const appOutDir = context.appOutDir;
  const exePath = path.join(appOutDir, `${context.packager.appInfo.productFilename}.exe`);
  const iconPath = path.resolve(__dirname, '..', 'electron', 'icon.ico');

  console.log('[afterPack] Stamping Windows executable with custom icon:', exePath);
  if (fs.existsSync(exePath) && fs.existsSync(iconPath)) {
    await rcedit(exePath, {
      icon: iconPath,
      'version-string': {
        ProductName: 'ISASecuredPDF Suite',
        FileDescription: 'ISASecuredPDF Suite - Best Free PDF Editor & Converter (100% Client-Side)',
        CompanyName: '9476-7449 Québec Inc.',
        LegalCopyright: 'Copyright © 2026 9476-7449 Québec Inc.',
      }
    });
    console.log('[afterPack] Successfully stamped executable with official icon!');
  }
};
