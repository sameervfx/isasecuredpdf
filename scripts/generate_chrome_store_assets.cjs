const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function captureStoreAssets() {
  const outDir = path.join(__dirname, '..', 'chrome-store-assets');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  console.log('Launching browser to capture Chrome Web Store assets...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 1
  });
  const page = await context.newPage();

  console.log('Navigating to live workspace...');
  await page.goto('https://isasecuredpdf.com/?editor=true', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);

  // Screenshot 1: Main Editor Workspace
  console.log('Capturing Screenshot 1 (Workspace)...');
  await page.screenshot({ path: path.join(outDir, 'screenshot1_workspace_1280x800.png') });

  // Open Sample or trigger document if available
  const sampleBtn = await page.$('button:has-text("Sample"), button:has-text("Open Sample")');
  if (sampleBtn) {
    await sampleBtn.click();
    await page.waitForTimeout(2000);
    console.log('Capturing Screenshot with Sample Document...');
    await page.screenshot({ path: path.join(outDir, 'screenshot1_document_view_1280x800.png') });
  }

  // Screenshot 2: Signature Modal / DocuSign Alternative
  console.log('Opening Signature Modal...');
  const signBtn = await page.$('button:has-text("Sign"), button:has-text("Signature")');
  if (signBtn) {
    await signBtn.click();
    await page.waitForTimeout(1500);
    console.log('Capturing Screenshot 2 (Digital Signature)...');
    await page.screenshot({ path: path.join(outDir, 'screenshot2_signature_modal_1280x800.png') });

    // Close modal
    const closeBtn = await page.$('button:has-text("Cancel"), button:has-text("✕"), [aria-label="Close"]');
    if (closeBtn) await closeBtn.click();
    await page.waitForTimeout(1000);
  }

  // Screenshot 3: Security & Redaction or Theme View
  console.log('Capturing Screenshot 3...');
  await page.screenshot({ path: path.join(outDir, 'screenshot3_tools_1280x800.png') });

  await browser.close();
  console.log('Screenshots captured successfully in chrome-store-assets!');
}

captureStoreAssets().catch((err) => {
  console.error('Failed to capture assets:', err);
  process.exit(1);
});
