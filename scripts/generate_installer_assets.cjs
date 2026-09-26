const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const { execSync } = require('child_process');

async function generateAssets() {
  const iconPath = path.resolve(__dirname, '..', 'electron', 'icon.png');
  const iconBase64 = fs.readFileSync(iconPath).toString('base64');
  const iconSrc = `data:image/png;base64,${iconBase64}`;

  const browser = await chromium.launch();
  const page = await browser.newPage();

  // 1. Generate Sidebar (164 x 314)
  const sidebarHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          width: 164px;
          height: 314px;
          background: #090e17;
          background: radial-gradient(circle at 50% 35%, #182338 0%, #0c1424 50%, #060a12 100%);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          padding: 24px 8px 18px 8px;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
          position: relative;
          overflow: hidden;
        }
        .grid-pattern {
          position: absolute;
          inset: 0;
          opacity: 0.08;
          background-image: linear-gradient(#38bdf8 1px, transparent 1px), linear-gradient(90deg, #38bdf8 1px, transparent 1px);
          background-size: 14px 14px;
          pointer-events: none;
        }
        .top-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          z-index: 2;
          margin-top: 12px;
          width: 100%;
        }
        .logo-wrap {
          position: relative;
          width: 90px;
          height: 90px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .logo-wrap::before {
          content: "";
          position: absolute;
          inset: -6px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(14, 165, 233, 0.4) 0%, rgba(6, 182, 212, 0.1) 60%, transparent 80%);
          pointer-events: none;
        }
        .logo-img {
          width: 90px;
          height: 90px;
          border-radius: 20px;
          -webkit-mask-image: radial-gradient(circle at center, black 65%, transparent 100%);
          mask-image: radial-gradient(circle at center, black 65%, transparent 100%);
        }
        .brand-title {
          margin-top: 14px;
          font-size: 11px;
          font-weight: 800;
          color: #ffffff;
          letter-spacing: 1px;
          text-align: center;
          text-transform: uppercase;
        }
        .brand-badge {
          margin-top: 6px;
          padding: 2px 8px;
          border-radius: 9999px;
          background: rgba(14, 165, 233, 0.2);
          border: 1px solid rgba(56, 189, 248, 0.45);
          font-size: 7.5px;
          font-weight: 700;
          color: #38bdf8;
          letter-spacing: 1px;
          text-transform: uppercase;
        }
        .bottom-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          z-index: 2;
          text-align: center;
        }
        .security-line {
          font-size: 7.5px;
          font-weight: 700;
          color: #38bdf8;
          letter-spacing: 0.8px;
          text-transform: uppercase;
          line-height: 1.35;
        }
        .security-sub {
          font-size: 6.5px;
          font-weight: 600;
          color: #94a3b8;
          letter-spacing: 0.5px;
          margin-top: 2px;
          text-transform: uppercase;
        }
        .accent-dot {
          display: inline-block;
          width: 5px;
          height: 5px;
          background: #10b981;
          border-radius: 50%;
          margin-right: 4px;
          vertical-align: middle;
          box-shadow: 0 0 6px #10b981;
        }
      </style>
    </head>
    <body>
      <div class="grid-pattern"></div>
      
      <div class="top-container">
        <div class="logo-wrap">
          <img class="logo-img" src="${iconSrc}" alt="Logo" />
        </div>
        <div class="brand-title">ISA SECURED PDF</div>
        <div class="brand-badge">DESKTOP SUITE</div>
      </div>

      <div class="bottom-container">
        <div class="security-line"><span class="accent-dot"></span>100% Client-Side</div>
        <div class="security-sub">Zero Cloud Exposure</div>
      </div>
    </body>
    </html>
  `;

  await page.setViewportSize({ width: 164, height: 314 });
  await page.setContent(sidebarHtml);
  const sidebarPngPath = path.resolve(__dirname, '..', 'electron', 'installerSidebar.png');
  await page.screenshot({ path: sidebarPngPath });
  console.log('Generated installerSidebar.png');

  // 2. Generate Header (150 x 57)
  const headerHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          width: 150px;
          height: 57px;
          background: #ffffff;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          padding-right: 12px;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        .logo-wrap {
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          background: #0f172a;
          box-shadow: 0 2px 6px rgba(15, 23, 42, 0.25);
          overflow: hidden;
        }
        .logo-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
      </style>
    </head>
    <body>
      <div class="logo-wrap">
        <img class="logo-img" src="${iconSrc}" alt="Logo" />
      </div>
    </body>
    </html>
  `;

  await page.setViewportSize({ width: 150, height: 57 });
  await page.setContent(headerHtml);
  const headerPngPath = path.resolve(__dirname, '..', 'electron', 'installerHeader.png');
  await page.screenshot({ path: headerPngPath });
  console.log('Generated installerHeader.png');

  await browser.close();

  // Convert to 24bpp BMPs using PowerShell
  const psScript = `
    Add-Type -AssemblyName System.Drawing
    function Convert-To24bppBmp($pngPath, $bmpPath) {
      $png = [System.Drawing.Image]::FromFile($pngPath)
      $bmp = New-Object System.Drawing.Bitmap($png.Width, $png.Height, [System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
      $g = [System.Drawing.Graphics]::FromImage($bmp)
      $g.DrawImage($png, 0, 0, $png.Width, $png.Height)
      $g.Dispose()
      $png.Dispose()
      $bmp.Save($bmpPath, [System.Drawing.Imaging.ImageFormat]::Bmp)
      $bmp.Dispose()
      Write-Host "Converted $pngPath to $bmpPath"
    }
    Convert-To24bppBmp "${sidebarPngPath.replace(/\\/g, '\\\\')}" "${path.resolve(__dirname, '..', 'electron', 'installerSidebar.bmp').replace(/\\/g, '\\\\')}"
    Convert-To24bppBmp "${sidebarPngPath.replace(/\\/g, '\\\\')}" "${path.resolve(__dirname, '..', 'electron', 'uninstallerSidebar.bmp').replace(/\\/g, '\\\\')}"
    Convert-To24bppBmp "${headerPngPath.replace(/\\/g, '\\\\')}" "${path.resolve(__dirname, '..', 'electron', 'installerHeader.bmp').replace(/\\/g, '\\\\')}"
  `;

  fs.writeFileSync(path.resolve(__dirname, 'temp_convert.ps1'), psScript);
  execSync('powershell -ExecutionPolicy Bypass -File scripts/temp_convert.ps1', { stdio: 'inherit' });
  fs.unlinkSync(path.resolve(__dirname, 'temp_convert.ps1'));
  console.log('All installer graphics generated successfully in 24bpp BMP format!');
}

generateAssets().catch(err => {
  console.error(err);
  process.exit(1);
});
