import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

async function generateDeviceBanner() {
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      width: 1024px;
      height: 500px;
      background: #020617;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }

    /* Ambient Glowing Neons */
    .neon-bg-1 {
      position: absolute;
      top: -120px;
      left: -100px;
      width: 550px;
      height: 550px;
      background: radial-gradient(circle, rgba(6, 182, 212, 0.45) 0%, rgba(2, 6, 23, 0) 70%);
      filter: blur(65px);
    }
    .neon-bg-2 {
      position: absolute;
      bottom: -120px;
      right: -80px;
      width: 600px;
      height: 600px;
      background: radial-gradient(circle, rgba(16, 185, 129, 0.35) 0%, rgba(2, 6, 23, 0) 70%);
      filter: blur(75px);
    }
    .neon-bg-3 {
      position: absolute;
      top: 50%;
      right: 25%;
      transform: translateY(-50%);
      width: 500px;
      height: 350px;
      background: radial-gradient(ellipse, rgba(168, 85, 247, 0.25) 0%, rgba(2, 6, 23, 0) 70%);
      filter: blur(60px);
    }

    /* Grid Overlay Pattern */
    .grid-pattern {
      position: absolute;
      inset: 0;
      background-image: 
        linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
      background-size: 32px 32px;
      mask-image: radial-gradient(ellipse 90% 90% at 50% 50%, #000 70%, transparent 100%);
    }

    /* Container Layout */
    .banner-container {
      width: 100%;
      height: 100%;
      padding: 32px 44px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      z-index: 10;
      position: relative;
    }

    /* Left Content Column */
    .left-col {
      max-width: 480px;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      z-index: 20;
    }

    .live-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 14px;
      background: rgba(15, 23, 42, 0.85);
      border: 1px solid rgba(6, 182, 212, 0.4);
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.05em;
      color: #38bdf8;
      text-transform: uppercase;
      box-shadow: 0 0 20px rgba(6, 182, 212, 0.25);
      margin-bottom: 16px;
    }

    .pulse-dot {
      width: 8px;
      height: 8px;
      background-color: #10b981;
      border-radius: 50%;
      box-shadow: 0 0 10px #10b981, 0 0 20px #10b981;
    }

    .title-main {
      font-size: 38px;
      font-weight: 900;
      line-height: 1.1;
      letter-spacing: -0.02em;
      color: #ffffff;
      margin-bottom: 12px;
    }

    .title-gradient {
      background: linear-gradient(135deg, #38bdf8 0%, #34d399 50%, #a855f7 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .subtitle {
      font-size: 13.5px;
      color: #94a3b8;
      line-height: 1.5;
      font-weight: 400;
      margin-bottom: 20px;
    }

    /* Feature Pills Row Grid */
    .pills-row {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      max-width: 460px;
    }

    .pill {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 5px 11px;
      background: rgba(30, 41, 59, 0.8);
      border: 1px solid rgba(51, 65, 85, 0.9);
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 600;
      color: #e2e8f0;
      backdrop-filter: blur(10px);
    }

    /* Right Visual Device Stage Column */
    .right-col {
      position: relative;
      width: 480px;
      height: 420px;
      display: flex;
      align-items: center;
      justify-content: center;
      perspective: 1200px;
    }

    /* LAPTOP MOCKUP */
    .laptop-container {
      position: absolute;
      width: 380px;
      height: 250px;
      top: 55px;
      right: 20px;
      transform: rotateY(-14deg) rotateX(6deg);
      transform-style: preserve-3d;
      z-index: 5;
    }

    .laptop-screen {
      width: 380px;
      height: 230px;
      background: #090d16;
      border: 3px solid #1e293b;
      border-radius: 16px 16px 4px 4px;
      box-shadow: 
        0 25px 50px rgba(0, 0, 0, 0.8),
        0 0 30px rgba(6, 182, 212, 0.25);
      position: relative;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    /* Laptop Header Bar */
    .laptop-nav {
      height: 24px;
      background: #0f172a;
      border-b: 1px solid #1e293b;
      padding: 0 10px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .window-dots {
      display: flex;
      gap: 5px;
    }
    .dot { width: 7px; height: 7px; border-radius: 50%; }
    .dot-red { background: #ef4444; }
    .dot-yellow { background: #f59e0b; }
    .dot-green { background: #10b981; }

    .laptop-url {
      font-size: 8px;
      font-weight: 600;
      color: #38bdf8;
      background: #020617;
      padding: 2px 10px;
      border-radius: 9999px;
      border: 1px solid rgba(56, 189, 248, 0.3);
    }

    /* Laptop Screen Workspace Content */
    .laptop-workspace {
      flex: 1;
      padding: 12px;
      background: radial-gradient(circle at center, #0f172a 0%, #020617 100%);
      display: flex;
      gap: 10px;
      align-items: center;
    }

    .editor-sidebar {
      width: 60px;
      height: 100%;
      background: #090d16;
      border: 1px solid #1e293b;
      border-radius: 8px;
      padding: 6px;
      display: flex;
      flex-direction: column;
      gap: 5px;
    }

    .sb-item {
      height: 14px;
      background: rgba(30, 41, 59, 0.8);
      border-radius: 4px;
      border: 1px solid rgba(56, 189, 248, 0.2);
    }

    .doc-canvas {
      flex: 1;
      height: 100%;
      background: #ffffff;
      border-radius: 6px;
      box-shadow: 0 5px 15px rgba(0,0,0,0.5);
      padding: 10px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      position: relative;
    }

    .doc-line {
      height: 6px;
      background: #e2e8f0;
      border-radius: 3px;
    }
    .doc-line-short { width: 60%; }
    .doc-line-accent { background: #38bdf8; width: 85%; }
    
    .doc-stamp {
      position: absolute;
      bottom: 12px;
      right: 12px;
      padding: 3px 8px;
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid #10b981;
      color: #059669;
      font-size: 7px;
      font-weight: 800;
      border-radius: 4px;
      transform: rotate(-8deg);
    }

    /* Laptop Base */
    .laptop-base {
      width: 440px;
      height: 12px;
      background: linear-gradient(to bottom, #334155, #0f172a);
      border-radius: 0 0 16px 16px;
      position: absolute;
      bottom: 8px;
      left: -30px;
      box-shadow: 0 10px 20px rgba(0, 0, 0, 0.9);
      border-top: 1px solid #475569;
    }

    .laptop-notch {
      width: 60px;
      height: 4px;
      background: #1e293b;
      margin: 0 auto;
      border-radius: 0 0 4px 4px;
    }

    /* SMARTPHONE MOCKUP */
    .phone-container {
      position: absolute;
      width: 135px;
      height: 270px;
      bottom: 25px;
      left: 15px;
      transform: rotateY(16deg) rotateX(4deg) translateZ(30px);
      z-index: 10;
    }

    .phone-body {
      width: 135px;
      height: 270px;
      background: #090d16;
      border: 3.5px solid #334155;
      border-radius: 28px;
      box-shadow: 
        0 20px 40px rgba(0, 0, 0, 0.9),
        0 0 25px rgba(16, 185, 129, 0.3);
      position: relative;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    /* Dynamic Island Camera Notch */
    .phone-notch {
      width: 40px;
      height: 10px;
      background: #020617;
      border-radius: 10px;
      margin: 6px auto 0;
      z-index: 20;
    }

    /* Phone Screen Content: 4K Scanner Viewfinder */
    .phone-screen {
      flex: 1;
      background: #020617;
      padding: 8px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
      position: relative;
    }

    .scanner-viewfinder {
      width: 100%;
      height: 160px;
      border: 2px dashed #10b981;
      border-radius: 12px;
      background: rgba(16, 185, 129, 0.05);
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: inset 0 0 15px rgba(16, 185, 129, 0.2);
    }

    .corner {
      position: absolute;
      width: 12px;
      height: 12px;
      border-color: #34d399;
      border-style: solid;
    }
    .tl { top: -2px; left: -2px; border-width: 3px 0 0 3px; }
    .tr { top: -2px; right: -2px; border-width: 3px 3px 0 0; }
    .bl { bottom: -2px; left: -2px; border-width: 0 0 3px 3px; }
    .br { bottom: -2px; right: -2px; border-width: 0 3px 3px 0; }

    .scan-line {
      width: 90%;
      height: 2px;
      background: linear-gradient(to right, transparent, #34d399, transparent);
      box-shadow: 0 0 8px #34d399;
    }

    .phone-btn-wrap {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 4px 10px;
      background: #10b981;
      color: #020617;
      font-size: 9px;
      font-weight: 800;
      border-radius: 9999px;
      margin-bottom: 6px;
    }

    /* Floating Sync Tag */
    .sync-badge {
      position: absolute;
      top: 10px;
      right: -10px;
      padding: 6px 12px;
      background: rgba(15, 23, 42, 0.95);
      border: 1px solid rgba(56, 189, 248, 0.5);
      border-radius: 12px;
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      font-weight: 800;
      color: #38bdf8;
      box-shadow: 0 10px 25px rgba(0,0,0,0.6);
      z-index: 30;
      backdrop-filter: blur(10px);
    }

  </style>
</head>
<body>
  <div class="neon-bg-1"></div>
  <div class="neon-bg-2"></div>
  <div class="neon-bg-3"></div>
  <div class="grid-pattern"></div>

  <div class="banner-container">
    <!-- Left Column -->
    <div class="left-col">
      <div class="live-badge">
        <span class="pulse-dot"></span>
        100% On-Device • Cross-Platform Suite
      </div>

      <h1 class="title-main">
        ISA Secured PDF <br/>
        <span class="title-gradient">Laptop & Mobile Suite</span>
      </h1>

      <p class="subtitle">
        Work seamlessly across your Laptop, Tablet & Mobile Phone. Edit text, fill AcroForms, scan 4K documents & sign PDFs with zero cloud uploads.
      </p>

      <div class="pills-row">
        <div class="pill">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
          Desktop Web Editor
        </div>
        <div class="pill">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#34d399" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
          iOS & Android Apps
        </div>
        <div class="pill">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c084fc" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
          4K Camera Scanner
        </div>
        <div class="pill">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fb923c" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          Zero Server Uploads
        </div>
      </div>
    </div>

    <!-- Right Column (3D Cross-Device Scene: Laptop + Phone) -->
    <div class="right-col">

      <!-- Floating Sync Badge -->
      <div class="sync-badge">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#34d399" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        Laptop & Phone Ready
      </div>

      <!-- LAPTOP MOCKUP -->
      <div class="laptop-container">
        <div class="laptop-screen">
          <div class="laptop-nav">
            <div class="window-dots">
              <div class="dot dot-red"></div>
              <div class="dot dot-yellow"></div>
              <div class="dot dot-green"></div>
            </div>
            <div class="laptop-url">isasecuredpdf.com</div>
          </div>

          <div class="laptop-workspace">
            <div class="editor-sidebar">
              <div class="sb-item" style="background:#38bdf8;"></div>
              <div class="sb-item"></div>
              <div class="sb-item"></div>
              <div class="sb-item"></div>
            </div>

            <div class="doc-canvas">
              <div class="doc-line doc-line-accent"></div>
              <div class="doc-line"></div>
              <div class="doc-line doc-line-short"></div>
              <div class="doc-line"></div>
              <div class="doc-line doc-line-short"></div>
              <div class="doc-stamp">✓ SIGNED</div>
            </div>
          </div>
        </div>

        <div class="laptop-base">
          <div class="laptop-notch"></div>
        </div>
      </div>

      <!-- SMARTPHONE MOCKUP -->
      <div class="phone-container">
        <div class="phone-body">
          <div class="phone-notch"></div>

          <div class="phone-screen">
            <div class="scanner-viewfinder">
              <div class="corner tl"></div>
              <div class="corner tr"></div>
              <div class="corner bl"></div>
              <div class="corner br"></div>
              <div class="scan-line"></div>
            </div>

            <div class="phone-btn-wrap">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
              4K SCANNER
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</body>
</html>
  `;

  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1024, height: 500 },
    deviceScaleFactor: 2
  });

  await page.setContent(htmlContent);
  await page.waitForTimeout(600);

  const outputPathPublic = path.resolve('public/google_play_feature_graphic_1024x500.png');
  const outputPathBrain = path.resolve('C:\\Users\\samee\\.gemini\\antigravity\\brain\\3e407dab-5038-42b5-8e5e-91e7710b8279\\google_play_feature_graphic_v2_cross_device_1024x500.png');

  try { fs.unlinkSync(outputPathPublic); } catch(e) {}
  try { fs.unlinkSync(outputPathBrain); } catch(e) {}

  await page.screenshot({ path: outputPathPublic, type: 'png' });
  await page.screenshot({ path: outputPathBrain, type: 'png' });

  await browser.close();
  console.log('Successfully generated Version 2 Cross-Device (Laptop & Mobile) Banner!');
}

generateDeviceBanner().catch(console.error);
