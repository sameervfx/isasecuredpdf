const fs = require('fs');
const path = require('path');

// Read an exe file and extract icon resources
// Or check icon resource table
const exePath = 'C:/Program Files/ISASecuredPDF Suite/ISASecuredPDF Suite.exe';
const buf = fs.readFileSync(exePath);

// Look for 'electron' or icon metadata
console.log('Exe size:', buf.length);

// Let's copy electron/icon.ico directly to C:/Program Files/ISASecuredPDF Suite/app.ico
const destIco = 'C:/Program Files/ISASecuredPDF Suite/app.ico';
try {
  fs.copyFileSync(path.resolve('electron/icon.ico'), destIco);
  console.log('Successfully copied electron/icon.ico to:', destIco);
} catch (e) {
  console.error('Failed to copy to Program Files:', e.message);
}
