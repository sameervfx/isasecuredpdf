import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

async function generateLivelyBanner() {
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
      top: -100px;
      left: -100px;
      width: 450px;
      height: 450px;
      background: radial-gradient(circle, rgba(6, 182, 212, 0.35) 0%, rgba(2, 6, 23, 0) 70%);
      filter: blur(60px);
    }
    .neon-bg-2 {
      position: absolute;
      bottom: -100px;
      right: -100px;
      width: 500px;
      height: 500px;
      background: radial-gradient(circle, rgba(16, 185, 129, 0.3) 0%, rgba(2, 6, 23, 0) 70%);
      filter: blur(70px);
    }
    .neon-bg-3 {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 600px;
      height: 300px;
      background: radial-gradient(ellipse, rgba(56, 189, 248, 0.15) 0%, rgba(2, 6, 23, 0) 70%);
      filter: blur(50px);
    }

    /* Grid Overlay Pattern */
    .grid-pattern {
      position: absolute;
      inset: 0;
      background-image: 
        linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
      background-size: 32px 32px;
      mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, #000 70%, transparent 100%);
    }

    /* Container Layout */
    .banner-container {
      width: 100%;
      height: 100%;
      padding: 36px 48px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      z-index: 10;
      position: relative;
    }

    /* Left Content Column */
    .left-col {
      max-width: 540px;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
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
      box-shadow: 0 0 20px rgba(6, 182, 212, 0.2);
      margin-bottom: 20px;
    }

    .pulse-dot {
      width: 8px;
      height: 8px;
      background-color: #10b981;
      border-radius: 50%;
      box-shadow: 0 0 10px #10b981, 0 0 20px #10b981;
    }

    .title-main {
      font-size: 42px;
      font-weight: 900;
      line-height: 1.1;
      letter-spacing: -0.02em;
      color: #ffffff;
      margin-bottom: 14px;
    }

    .title-gradient {
      background: linear-gradient(135deg, #38bdf8 0%, #34d399 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .subtitle {
      font-size: 15px;
      color: #94a3b8;
      line-height: 1.5;
      font-weight: 400;
      margin-bottom: 24px;
    }

    /* Feature Pills Row */
    .pills-row {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }

    .pill {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      background: rgba(30, 41, 59, 0.7);
      border: 1px solid rgba(51, 65, 85, 0.8);
      border-radius: 10px;
      font-size: 12px;
      font-weight: 600;
      color: #e2e8f0;
      backdrop-filter: blur(10px);
    }
    .pill svg {
      width: 14px;
      height: 14px;
    }

    /* Right Visual Graphic Column */
    .right-col {
      position: relative;
      width: 380px;
      height: 380px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    /* Glowing Glassmorphic Shield Card */
    .shield-card {
      width: 220px;
      height: 240px;
      background: linear-gradient(145deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.9));
      border: 2px solid rgba(56, 189, 248, 0.5);
      border-radius: 32px;
      box-shadow: 
        0 20px 50px rgba(0, 0, 0, 0.6),
        inset 0 1px 1px rgba(255, 255, 255, 0.2),
        0 0 30px rgba(6, 182, 212, 0.3);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      position: relative;
      z-index: 5;
    }

    .shield-icon-wrap {
      width: 90px;
      height: 90px;
      background: radial-gradient(circle, rgba(6, 182, 212, 0.25) 0%, rgba(15, 23, 42, 0) 70%);
      border-radius: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 12px;
      border: 1px solid rgba(56, 189, 248, 0.3);
    }

    .shield-svg {
      width: 52px;
      height: 52px;
      fill: none;
      stroke: #38bdf8;
      stroke-width: 2;
      filter: drop-shadow(0 0 10px rgba(56, 189, 248, 0.8));
    }

    .shield-title {
      font-size: 16px;
      font-weight: 800;
      color: #f8fafc;
      letter-spacing: -0.01em;
    }
    .shield-sub {
      font-size: 11px;
      font-weight: 700;
      color: #34d399;
      margin-top: 2px;
    }

    /* Floating Feature Badge Cards */
    .float-card {
      position: absolute;
      padding: 10px 14px;
      background: rgba(15, 23, 42, 0.9);
      border: 1px solid rgba(51, 65, 85, 0.9);
      border-radius: 14px;
      display: flex;
      align-items: center;
      gap: 10px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(12px);
      z-index: 6;
    }

    .float-card-1 {
      top: 20px;
      left: -10px;
      border-color: rgba(16, 185, 129, 0.5);
      box-shadow: 0 10px 25px rgba(16, 185, 129, 0.15);
    }
    .float-card-2 {
      bottom: 25px;
      right: -10px;
      border-color: rgba(56, 189, 248, 0.5);
      box-shadow: 0 10px 25px rgba(56, 189, 248, 0.15);
    }
    .float-card-3 {
      top: 140px;
      right: -25px;
      border-color: rgba(168, 85, 247, 0.5);
      box-shadow: 0 10px 25px rgba(168, 85, 247, 0.15);
    }

    .icon-box {
      width: 32px;
      height: 32px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .ib-emerald { background: rgba(16, 185, 129, 0.2); color: #34d399; }
    .ib-cyan { background: rgba(6, 182, 212, 0.2); color: #38bdf8; }
    .ib-purple { background: rgba(168, 85, 247, 0.2); color: #c084fc; }

    .fc-text {
      font-size: 12px;
      font-weight: 700;
      color: #f1f5f9;
    }
    .fc-sub {
      font-size: 10px;
      color: #64748b;
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
        100% On-Device • Air-Gapped Privacy
      </div>

      <h1 class="title-main">
        ISA Secured PDF <br/>
        <span class="title-gradient">100% Private PDF Suite</span>
      </h1>

      <p class="subtitle">
        Edit text, fill AcroForms, draw signatures, compress & convert PDFs with zero cloud uploads. Complete local privacy on your device.
      </p>

      <div class="pills-row">
        <div class="pill">
          <svg viewBox="0 0 24 24" fill="none" stroke="#34d399" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          Zero Server Uploads
        </div>
        <div class="pill">
          <svg viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          Fill & Edit AcroForms
        </div>
        <div class="pill">
          <svg viewBox="0 0 24 24" fill="none" stroke="#c084fc" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
          HD Camera Scanner
        </div>
      </div>
    </div>

    <!-- Right Column -->
    <div class="right-col">
      <div class="shield-card">
        <div class="shield-icon-wrap">
          <svg class="shield-svg" viewBox="0 0 24 24">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="m9 12 2 2 4-4" stroke="#34d399" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </div>
        <div class="shield-title">ISA SECURED</div>
        <div class="shield-sub">⚡ 100% Client-Side</div>
      </div>

      <!-- Floating Feature Card 1 -->
      <div class="float-card float-card-1">
        <div class="icon-box ib-emerald">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        </div>
        <div>
          <div class="fc-text">AES Encryption</div>
          <div class="fc-sub">Offline Password Lock</div>
        </div>
      </div>

      <!-- Floating Feature Card 2 -->
      <div class="float-card float-card-2">
        <div class="icon-box ib-cyan">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/><polyline points="16 16 12 12 8 16"/></svg>
        </div>
        <div>
          <div class="fc-text">Smart Compression</div>
          <div class="fc-sub">Up to 80% Smaller</div>
        </div>
      </div>

      <!-- Floating Feature Card 3 -->
      <div class="float-card float-card-3">
        <div class="icon-box ib-purple">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 14.66V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h5.34"/><polygon points="18 2 22 6 12 16 8 16 8 12 18 2"/></svg>
        </div>
        <div>
          <div class="fc-text">Digital Signature</div>
          <div class="fc-sub">Sign Contracts Privately</div>
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
  await page.waitForTimeout(500);

  const outputPathPublic = path.resolve('public/google_play_feature_graphic_1024x500.png');
  const outputPathBrain = path.resolve('C:\\Users\\samee\\.gemini\\antigravity\\brain\\3e407dab-5038-42b5-8e5e-91e7710b8279\\google_play_feature_graphic_1024x500.png');

  await page.screenshot({ path: outputPathPublic, type: 'png' });
  await page.screenshot({ path: outputPathBrain, type: 'png' });

  await browser.close();
  console.log('Successfully generated vibrant 1024x500 Feature Graphic banner!');
}

generateLivelyBanner().catch(console.error);
