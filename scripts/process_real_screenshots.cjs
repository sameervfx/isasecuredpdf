const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const REAL_DIR = 'C:/work/ISA_SECURE_PDF/STORE_ASSETS/Apple_AppStore/Real phone assets';
const OUT_IPHONE = 'C:/work/ISA_SECURE_PDF/STORE_ASSETS/Apple_AppStore/iPhone_6.7_Screenshots_RealPhone';
const OUT_IPAD = 'C:/work/ISA_SECURE_PDF/STORE_ASSETS/Apple_AppStore/iPad_13_Screenshots_RealPhone';

fs.mkdirSync(OUT_IPHONE, { recursive: true });
fs.mkdirSync(OUT_IPAD, { recursive: true });

// Order the 7 screenshots logically for the App Store storefront
const files = [
  { name: 'WhatsApp Image 2026-09-22 at 15.42.01 (2).jpeg', title: '100% On-Device, Privacy-First PDF Suite' },
  { name: 'WhatsApp Image 2026-09-22 at 15.42.01 (7).jpeg', title: 'Instant Document Tools & Camera Scanner' },
  { name: 'WhatsApp Image 2026-09-22 at 15.42.01 (9).jpeg', title: 'Comprehensive PDF Suite Feature Modules' },
  { name: 'WhatsApp Image 2026-09-22 at 15.42.01 (8).jpeg', title: 'Professional Legal & Business Template Library' },
  { name: 'WhatsApp Image 2026-09-22 at 15.42.01 (4).jpeg', title: 'Air-Gapped Client-Side Security Architecture' },
  { name: 'WhatsApp Image 2026-09-22 at 15.42.01 (3).jpeg', title: 'Fillable AcroForms & Zero Server Uploads' },
  { name: 'WhatsApp Image 2026-09-22 at 15.42.01 (5).jpeg', title: 'Enterprise Security FAQ & Air-Gapped Operation' }
];

(async () => {
  const browser = await chromium.launch();

  // 1. Generate iPhone 6.7" (1290 x 2796)
  console.log('Generating iPhone 6.7" (1290x2796) screenshots from real phone captures...');
  const pageIphone = await browser.newPage({ viewport: { width: 1290, height: 2796 } });

  for (let i = 0; i < files.length; i++) {
    const item = files[i];
    const imgData = fs.readFileSync(path.join(REAL_DIR, item.name)).toString('base64');
    const dataUri = `data:image/jpeg;base64,${imgData}`;

    // Full screen 1290 x 2796 view of the authentic phone screenshot
    await pageIphone.setContent(`
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            width: 1290px;
            height: 2796px;
            background: #020617;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          img {
            width: 1290px;
            height: 2796px;
            object-fit: cover;
            display: block;
          }
        </style>
      </head>
      <body>
        <img src="${dataUri}" />
      </body>
      </html>
    `);

    await pageIphone.waitForTimeout(300);
    const dest = path.join(OUT_IPHONE, `iPhone_6.7_Screenshot_${i + 1}.png`);
    await pageIphone.screenshot({ path: dest });
    console.log(`✓ Generated iPhone 6.7" Screenshot ${i + 1}: ${dest}`);
  }
  await pageIphone.close();

  // 2. Generate iPad 13" (2048 x 2732)
  console.log('Generating iPad 13" (2048x2732) screenshots with elegant presentation...');
  const pageIpad = await browser.newPage({ viewport: { width: 2048, height: 2732 } });

  for (let i = 0; i < files.length; i++) {
    const item = files[i];
    const imgData = fs.readFileSync(path.join(REAL_DIR, item.name)).toString('base64');
    const dataUri = `data:image/jpeg;base64,${imgData}`;

    // Elegant iPad Pro display: Phone interface framed beautifully on the 2048 x 2732 canvas with matching dark background
    await pageIpad.setContent(`
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@600;700;800;900&display=swap');
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            width: 2048px;
            height: 2732px;
            background: radial-gradient(circle at 50% 30%, #0d172e 0%, #050914 60%, #02040a 100%);
            overflow: hidden;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: space-between;
            padding: 100px 80px 80px 80px;
            font-family: 'Inter', -apple-system, sans-serif;
            color: #ffffff;
          }
          .header {
            text-align: center;
            max-width: 1700px;
          }
          .tag {
            display: inline-block;
            padding: 12px 32px;
            border-radius: 999px;
            background: rgba(6, 182, 212, 0.15);
            border: 2px solid rgba(6, 182, 212, 0.4);
            color: #22d3ee;
            font-size: 26px;
            font-weight: 800;
            letter-spacing: 3px;
            text-transform: uppercase;
            margin-bottom: 24px;
          }
          .title {
            font-size: 64px;
            font-weight: 900;
            letter-spacing: -1.5px;
            line-height: 1.15;
            background: linear-gradient(to right, #ffffff, #cbd5e1);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }
          .device-wrapper {
            position: relative;
            width: 960px;
            height: 2090px;
            border-radius: 64px;
            overflow: hidden;
            box-shadow: 0 40px 100px -20px rgba(0, 0, 0, 0.9), 0 0 0 12px #1e293b, 0 0 0 14px rgba(255, 255, 255, 0.15);
            background: #000;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .phone-screen {
            width: 100%;
            height: 100%;
            object-fit: contain;
            display: block;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="tag">ISASecuredPDF Mobile & Tablet</div>
          <h1 class="title">${item.title}</h1>
        </div>
        <div class="device-wrapper">
          <img class="phone-screen" src="${dataUri}" />
        </div>
      </body>
      </html>
    `);

    await pageIpad.waitForTimeout(300);
    const dest = path.join(OUT_IPAD, `iPad_13_Screenshot_${i + 1}.png`);
    await pageIpad.screenshot({ path: dest });
    console.log(`✓ Generated iPad 13" Screenshot ${i + 1}: ${dest}`);
  }
  await pageIpad.close();

  await browser.close();
  console.log('All real phone screenshots successfully generated for iPhone and iPad!');
})();
