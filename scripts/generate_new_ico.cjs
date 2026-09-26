const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function createIco() {
  const pngToIcoModule = require('png-to-ico');
  const pngToIco = pngToIcoModule.default || pngToIcoModule;

  const rootDir = path.resolve(__dirname, '..');
  const srcPng = path.join(rootDir, 'electron', 'icon.png');
  const tempDir = path.join(rootDir, 'scripts', 'temp_ico_sizes');
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

  const sizes = [256, 128, 64, 48, 32, 24, 16];
  const sizePngs = [];

  // Generate resized PNGs using PowerShell GDI+ HighQualityBicubic
  const psScript = `
    Add-Type -AssemblyName System.Drawing
    $src = [System.Drawing.Image]::FromFile("${srcPng.replace(/\\/g, '\\\\')}")
    $sizes = @(256, 128, 64, 48, 32, 24, 16)
    foreach ($s in $sizes) {
      $bmp = New-Object System.Drawing.Bitmap($s, $s, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
      $g = [System.Drawing.Graphics]::FromImage($bmp)
      $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
      $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
      $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
      $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
      $g.DrawImage($src, 0, 0, $s, $s)
      $g.Dispose()
      $outPath = "${tempDir.replace(/\\/g, '\\\\')}\\icon_" + $s + ".png"
      $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
      $bmp.Dispose()
      Write-Host "Generated $outPath"
    }
    $src.Dispose()
  `;

  fs.writeFileSync(path.join(rootDir, 'scripts', 'temp_resize.ps1'), psScript);
  execSync('powershell -ExecutionPolicy Bypass -File scripts/temp_resize.ps1', { stdio: 'inherit' });
  fs.unlinkSync(path.join(rootDir, 'scripts', 'temp_resize.ps1'));

  for (const s of sizes) {
    sizePngs.push(path.join(tempDir, `icon_${s}.png`));
  }

  console.log('Converting sizes to multi-resolution icon.ico...');
  const icoBuffer = await pngToIco(sizePngs);
  const outIco = path.join(rootDir, 'electron', 'icon.ico');
  fs.writeFileSync(outIco, icoBuffer);
  console.log('Successfully written multi-resolution icon.ico:', outIco, 'Size:', icoBuffer.length);

  // Clean up temp
  fs.rmSync(tempDir, { recursive: true, force: true });
}

createIco().catch(err => {
  console.error(err);
  process.exit(1);
});
