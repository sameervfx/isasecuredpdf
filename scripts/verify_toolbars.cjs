const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function testScreenshots() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('Navigating to http://127.0.0.1:4173 ...');
  await page.goto('http://127.0.0.1:4173', { waitUntil: 'networkidle' });

  // 1. Enter Web Editor
  const openEditorBtn = page.getByRole('button', { name: /Open Free Web Editor/i }).first();
  if (await openEditorBtn.isVisible()) {
    console.log('Clicking Open Free Web Editor...');
    await openEditorBtn.click();
    await page.waitForTimeout(1000);
  }

  // 2. Open File menu -> New Blank PDF
  console.log('Opening File menu...');
  const fileMenuBtn = page.locator('header button').filter({ hasText: /^File/ }).first();
  await fileMenuBtn.click();
  await page.waitForTimeout(500);

  console.log('Clicking New Blank PDF...');
  const newBlankBtn = page.getByRole('button', { name: /New Blank PDF/i }).first();
  await newBlankBtn.click();
  await page.waitForTimeout(500);

  // 3. Confirm create blank PDF
  console.log('Confirming Create Blank PDF in modal...');
  const submitCreate = page.locator('button[type="submit"]').filter({ hasText: /Create Blank PDF/i }).first();
  await submitCreate.click();
  await page.waitForTimeout(2000);

  const viewports = [
    { width: 1920, height: 1080, name: '1920x1080' },
    { width: 1440, height: 900, name: '1440x900' },
    { width: 1366, height: 768, name: '1366x768' },
    { width: 1024, height: 768, name: '1024x768' },
  ];

  const artifactDir = 'C:/Users/samee/.gemini/antigravity/brain/3e407dab-5038-42b5-8e5e-91e7710b8279';

  for (const vp of viewports) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.waitForTimeout(600);

    const collisionReport = await page.evaluate(() => {
      const allButtons = Array.from(document.querySelectorAll('header button'));
      const toolsBtn = allButtons.find(b => b.textContent && b.textContent.includes('Tools'));
      const securityBtn = allButtons.find(b => b.textContent && b.textContent.includes('Security'));
      const rotateBtn = allButtons.find(b => b.title && b.title.includes('Rotate') || (b.textContent && b.textContent.includes('Rotate')));
      const pagesBtn = allButtons.find(b => b.title && b.title.includes('Pages') || (b.textContent && b.textContent.includes('Pages')));

      if (!toolsBtn || !rotateBtn) {
        return {
          hasDocument: false,
          buttons: allButtons.map(b => b.textContent?.trim()),
        };
      }

      const rTools = toolsBtn.getBoundingClientRect();
      const rRotate = rotateBtn.getBoundingClientRect();
      const rSec = securityBtn ? securityBtn.getBoundingClientRect() : null;

      // Overlap calculation
      const xOverlap = Math.max(0, Math.min(rTools.right, rRotate.right) - Math.max(rTools.left, rRotate.left));
      const yOverlap = Math.max(0, Math.min(rTools.bottom, rRotate.bottom) - Math.max(rTools.top, rRotate.top));
      const isColliding = xOverlap > 0 && yOverlap > 0;

      return {
        hasDocument: true,
        toolsRight: Math.round(rTools.right),
        rotateLeft: Math.round(rRotate.left),
        horizontalClearance: Math.round(rRotate.left - rTools.right),
        isColliding,
        toolsBox: { left: Math.round(rTools.left), right: Math.round(rTools.right), width: Math.round(rTools.width) },
        rotateBox: { left: Math.round(rRotate.left), right: Math.round(rRotate.right), width: Math.round(rRotate.width) },
      };
    });

    console.log(`\n=== Viewport ${vp.name} ===`);
    console.log(JSON.stringify(collisionReport, null, 2));

    const shotPath = path.join(artifactDir, `editor_toolbar_${vp.name}.png`);
    await page.screenshot({ path: shotPath });
    console.log(`Saved screenshot: ${shotPath}`);
  }

  await browser.close();
}

testScreenshots().catch(console.error);
