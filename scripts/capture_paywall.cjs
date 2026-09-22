const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.wasm': 'application/wasm'
};

const distDir = path.resolve('dist');
const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/' || reqPath === '') reqPath = '/index.html';
  const filePath = path.join(distDir, reqPath);

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  } else {
    const indexPath = path.join(distDir, 'index.html');
    res.writeHead(200, { 'Content-Type': 'text/html' });
    fs.createReadStream(indexPath).pipe(res);
  }
});

server.listen(4189, async () => {
  console.log('Dist server listening on http://localhost:4189');
  try {
    const browser = await chromium.launch();
    const context = await browser.newContext({
      viewport: { width: 1290, height: 2796 },
      deviceScaleFactor: 1,
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148'
    });

    // Emulate native Capacitor iOS environment
    await context.addInitScript(() => {
      window.Capacitor = {
        getPlatform: () => 'ios',
        isNativePlatform: () => true
      };
    });

    const page = await context.newPage();
    await page.goto('http://localhost:4189', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Click Unlock button or Start Monthly Plan
    const unlockBtn = page.locator('text=Start Monthly Plan').first();
    if (await unlockBtn.isVisible()) {
      await unlockBtn.click();
    } else {
      const b2 = page.locator('button:has-text("Unlock")').first();
      if (await b2.isVisible()) await b2.click();
    }

    await page.waitForTimeout(1200);

    const out = 'C:/Users/samee/Desktop/Subscription_Paywall_Review_Screenshot.png';
    await page.screenshot({ path: out });
    console.log('✓ Successfully captured NATIVE iOS paywall screenshot:', out);
    await browser.close();
  } catch (err) {
    console.error('Error during capture:', err);
  } finally {
    server.close();
  }
});
