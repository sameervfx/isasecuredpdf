import { chromium } from 'playwright';
import path from 'path';

async function renderShowcase() {
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1200, height: 750 },
    deviceScaleFactor: 2
  });

  const htmlPath = path.resolve('C:/Users/samee/.gemini/antigravity/brain/3e407dab-5038-42b5-8e5e-91e7710b8279/3d_logo_showcase.html');
  await page.goto(`file://${htmlPath}`);
  await page.waitForTimeout(800);

  const outputPathBrain = path.resolve('C:/Users/samee/.gemini/antigravity/brain/3e407dab-5038-42b5-8e5e-91e7710b8279/3d_logo_showcase.png');
  const outputPathPublic = path.resolve('public/3d_logo_showcase.png');

  await page.screenshot({ path: outputPathBrain, type: 'png' });
  await page.screenshot({ path: outputPathPublic, type: 'png' });

  await browser.close();
  console.log('Successfully rendered 3D showcase screenshot!');
}

renderShowcase().catch(console.error);
