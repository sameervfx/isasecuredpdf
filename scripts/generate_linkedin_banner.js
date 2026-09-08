import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

async function generateLinkedInBanner() {
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      width: 1584px;
      height: 396px;
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
      left: -80px;
      width: 600px;
      height: 500px;
      background: radial-gradient(circle, rgba(6, 182, 212, 0.4) 0%, rgba(2, 6, 23, 0) 70%);
      filter: blur(70px);
    }
    .neon-bg-2 {
      position: absolute;
      bottom: -100px;
      right: -80px;
      width: 650px;
      height: 500px;
      background: radial-gradient(circle, rgba(16, 185, 129, 0.35) 0%, rgba(2, 6, 23, 0) 70%);
      filter: blur(75px);
    }
    .neon-bg-3 {
      position: absolute;
      top: 50%;
      left: 55%;
      transform: translate(-50%, -50%);
      width: 800px;
      height: 300px;
      background: radial-gradient(ellipse, rgba(168, 85, 247, 0.2) 0%, rgba(2, 6, 23, 0) 70%);
      filter: blur(65px);
    }

    /* Grid Overlay Pattern */
    .grid-pattern {
      position: absolute;
      inset: 0;
      background-image: 
        linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
      background-size: 36px 36px;
      mask-image: radial-gradient(ellipse 85% 85% at 50% 50%, #000 70%, transparent 100%);
    }

    /* Container Layout */
    .banner-container {
      width: 100%;
      height: 100%;
      padding: 24px 60px 24px 200px; /* Left padding 200px leaves safe space for LinkedIn Profile Avatar */
      display: flex;
      justify-content: space-between;
      align-items: center;
      z-index: 10;
      position: relative;
    }

    /* Left Content Column */
    .left-col {
      max-width: 720px;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
    }

    .live-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 5px 14px;
      background: rgba(15, 23, 42, 0.85);
      border: 1px solid rgba(6, 182, 212, 0.4);
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.05em;
      color: #38bdf8;
      text-transform: uppercase;
      box-shadow: 0 0 20px rgba(6, 182, 212, 0.25);
      margin-bottom: 12px;
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
      margin-bottom: 10px;
    }

    .title-gradient {
      background: linear-gradient(135deg, #38bdf8 0%, #34d399 50%, #a855f7 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .subtitle {
      font-size: 13.5px;
      color: #94a3b8;
      line-height: 1.45;
      font-weight: 400;
      margin-bottom: 16px;
      max-width: 650px;
    }

    /* Feature Pills Row Grid */
    .pills-row {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      max-width: 680px;
    }

    .pill {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 5px 12px;
      background: rgba(30, 41, 59, 0.75);
      border: 1px solid rgba(51, 65, 85, 0.85);
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 600;
      color: #e2e8f0;
      backdrop-filter: blur(10px);
    }

    /* Right Visual Orbit Graphic Column */
    .right-col {
      position: relative;
      width: 480px;
      height: 340px;
      display: flex;
      align-items: center;
      justify-content: center;
      perspective: 1000px;
    }

    /* Orbital Motion Rings */
    .orbit-ring-svg {
      position: absolute;
      width: 360px;
      height: 360px;
    }

    /* 3D Padlock Logo Container */
    .thick-3d-lock {
      width: 155px;
      height: 150px;
      position: relative;
      transform-style: preserve-3d;
      transform: rotateY(-16deg) rotateX(10deg);
      z-index: 5;
      margin-top: 36px;
    }

    /* SVG 3D Metallic Lock Shackle (Arch) */
    .lock-shackle-svg {
      position: absolute;
      top: -66px;
      left: 50%;
      transform: translateX(-50%) translateZ(0px);
      width: 125px;
      height: 110px;
      z-index: 1;
      filter: drop-shadow(0 0 20px rgba(6, 182, 212, 0.75));
    }

    /* 3D Lock Body Extrusion Walls */
    .wall {
      position: absolute;
      background: linear-gradient(135deg, #0284c7, #0f172a 60%, #10b981);
      border: 1px solid rgba(56, 189, 248, 0.6);
      box-shadow: inset 0 0 12px rgba(6, 182, 212, 0.5);
    }

    .wall-top {
      width: 155px;
      height: 32px;
      top: -16px;
      left: 0;
      transform: rotateX(90deg);
      border-radius: 14px 14px 0 0;
    }

    .wall-bottom {
      width: 155px;
      height: 32px;
      bottom: -16px;
      left: 0;
      transform: rotateX(-90deg);
      border-radius: 0 0 14px 14px;
    }

    .wall-left {
      width: 32px;
      height: 150px;
      left: -16px;
      top: 0;
      transform: rotateY(-90deg);
      border-radius: 14px 0 0 14px;
    }

    .wall-right {
      width: 32px;
      height: 150px;
      right: -16px;
      top: 0;
      transform: rotateY(90deg);
      border-radius: 0 14px 14px 0;
    }

    .face-front {
      position: absolute;
      inset: 0;
      transform: translateZ(16px);
      background: linear-gradient(145deg, rgba(15, 23, 42, 0.98), rgba(6, 182, 212, 0.35));
      border: 2.5px solid #38bdf8;
      border-radius: 22px;
      box-shadow: 
        0 20px 45px rgba(0, 0, 0, 0.8),
        0 0 35px rgba(6, 182, 212, 0.45),
        inset 0 2px 4px rgba(255, 255, 255, 0.5);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 12px 10px;
      z-index: 2;
    }

    .lock-icon-wrap {
      width: 52px;
      height: 52px;
      background: radial-gradient(circle, rgba(6, 182, 212, 0.4) 0%, rgba(15, 23, 42, 0.85) 100%);
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 6px;
      border: 1.5px solid rgba(56, 189, 248, 0.7);
      box-shadow: 0 0 20px rgba(6, 182, 212, 0.5);
    }

    .lock-svg {
      width: 28px;
      height: 28px;
      fill: none;
      stroke: #38bdf8;
      stroke-width: 2;
      filter: drop-shadow(0 0 8px rgba(56, 189, 248, 0.9));
    }

    .shield-title {
      font-size: 13px;
      font-weight: 900;
      color: #f8fafc;
      letter-spacing: 0.04em;
    }
    .shield-sub {
      font-size: 8.5px;
      font-weight: 800;
      color: #34d399;
      margin-top: 3px;
      background: rgba(6, 78, 59, 0.85);
      padding: 2px 8px;
      border-radius: 9999px;
      border: 1px solid rgba(16, 185, 129, 0.5);
      box-shadow: 0 0 10px rgba(16, 185, 129, 0.3);
    }

    /* Floating Orbit Feature Cards */
    .float-card {
      position: absolute;
      padding: 7px 11px;
      background: rgba(15, 23, 42, 0.92);
      border: 1px solid rgba(51, 65, 85, 0.9);
      border-radius: 11px;
      display: flex;
      align-items: center;
      gap: 7px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(12px);
      z-index: 6;
    }

    .fc-password {
      top: 5px;
      left: 15px;
      border-color: rgba(16, 185, 129, 0.5);
      box-shadow: 0 8px 20px rgba(16, 185, 129, 0.2);
    }
    .fc-signature {
      top: 5px;
      right: 15px;
      border-color: rgba(168, 85, 247, 0.5);
      box-shadow: 0 8px 20px rgba(168, 85, 247, 0.2);
    }
    .fc-compress {
      bottom: 5px;
      right: 20px;
      border-color: rgba(56, 189, 248, 0.5);
      box-shadow: 0 8px 20px rgba(56, 189, 248, 0.2);
    }
    .fc-acroforms {
      bottom: 5px;
      left: 15px;
      border-color: rgba(251, 146, 60, 0.5);
      box-shadow: 0 8px 20px rgba(251, 146, 60, 0.2);
    }

    .icon-box {
      width: 26px;
      height: 26px;
      border-radius: 7px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .ib-cyan { background: rgba(6, 182, 212, 0.2); color: #38bdf8; }
    .ib-emerald { background: rgba(16, 185, 129, 0.2); color: #34d399; }
    .ib-purple { background: rgba(168, 85, 247, 0.2); color: #c084fc; }
    .ib-orange { background: rgba(251, 146, 60, 0.2); color: #fb923c; }

    .fc-text {
      font-size: 10.5px;
      font-weight: 700;
      color: #f1f5f9;
      white-space: nowrap;
    }
    .fc-sub {
      font-size: 8.5px;
      color: #64748b;
      white-space: nowrap;
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
        Edit text, fill AcroForms, draw signatures, scan 4K documents, compress, split & encrypt PDFs locally with zero cloud uploads.
      </p>

      <div class="pills-row">
        <div class="pill">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          Zero Server Uploads
        </div>
        <div class="pill">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
          4K Native Camera Scanner
        </div>
        <div class="pill">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fb923c" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="m4.93 4.93 14.14 14.14"/></svg>
          Watermark Tool
        </div>
        <div class="pill">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#34d399" stroke-width="2"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/></svg>
          Split & Merge Pages
        </div>
      </div>
    </div>

    <!-- Right Column (Orbital Features with 3D Padlock Logo) -->
    <div class="right-col">
      <!-- Orbital Arc Graphic Rings -->
      <svg class="orbit-ring-svg" viewBox="0 0 360 360">
        <circle cx="180" cy="180" r="150" fill="none" stroke="url(#orbitGrad)" stroke-width="1.5" stroke-dasharray="8 6" opacity="0.6"/>
        <defs>
          <linearGradient id="orbitGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#38bdf8"/>
            <stop offset="50%" stop-color="#34d399"/>
            <stop offset="100%" stop-color="#a855f7"/>
          </linearGradient>
        </defs>
      </svg>

      <!-- 3D Padlock Logo with Extruded Metallic Shackle Arch -->
      <div class="thick-3d-lock">
        <!-- SVG 3D Metallic Lock Shackle (Arch) -->
        <svg class="lock-shackle-svg" viewBox="0 -20 140 130">
          <defs>
            <linearGradient id="shackleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#7dd3fc"/>
              <stop offset="35%" stop-color="#38bdf8"/>
              <stop offset="70%" stop-color="#0284c7"/>
              <stop offset="100%" stop-color="#0369a1"/>
            </linearGradient>
            <filter id="shackleGlow" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="5" result="blur"/>
              <feComposite in="SourceGraphic" in2="blur" operator="over"/>
            </filter>
          </defs>
          <!-- Back Shackle Shadow -->
          <path d="M 34 95 V 50 A 36 36 0 0 1 106 50 V 95" fill="none" stroke="#090d16" stroke-width="18" stroke-linecap="round"/>
          <!-- Main Metallic Glowing Shackle Arch -->
          <path d="M 34 95 V 50 A 36 36 0 0 1 106 50 V 95" fill="none" stroke="url(#shackleGrad)" stroke-width="14" stroke-linecap="round" filter="url(#shackleGlow)"/>
          <!-- Inner Highlight Rim -->
          <path d="M 36 95 V 50 A 34 34 0 0 1 104 50 V 95" fill="none" stroke="rgba(255,255,255,0.85)" stroke-width="2.5" stroke-linecap="round"/>
        </svg>

        <!-- 3D Body Extrusion Walls -->
        <div class="wall wall-top"></div>
        <div class="wall wall-bottom"></div>
        <div class="wall wall-left"></div>
        <div class="wall wall-right"></div>

        <!-- Front Face -->
        <div class="face-front">
          <div class="lock-icon-wrap">
            <svg class="lock-svg" viewBox="0 0 24 24">
              <path d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" fill="#38bdf8"/>
              <path d="M12 14v3.5" stroke="#38bdf8" stroke-width="2.5" stroke-linecap="round"/>
            </svg>
          </div>
          <div class="shield-title">ISA SECURED</div>
          <div class="shield-sub">100% Client Protection</div>
        </div>
      </div>

      <!-- Orbital Feature 1: Password Protection (AES Encryption) -->
      <div class="float-card fc-password">
        <div class="icon-box ib-emerald">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        </div>
        <div>
          <div class="fc-text">Password Protection</div>
          <div class="fc-sub">AES-256 Encryption Lock</div>
        </div>
      </div>

      <!-- Orbital Feature 2: Digital Signature -->
      <div class="float-card fc-signature">
        <div class="icon-box ib-purple">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 14.66V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h5.34"/><polygon points="18 2 22 6 12 16 8 16 8 12 18 2"/></svg>
        </div>
        <div>
          <div class="fc-text">Digital Signature</div>
          <div class="fc-sub">Sign Contracts Privately</div>
        </div>
      </div>

      <!-- Orbital Feature 3: Smart Compression -->
      <div class="float-card fc-compress">
        <div class="icon-box ib-cyan">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/><polyline points="16 16 12 12 8 16"/></svg>
        </div>
        <div>
          <div class="fc-text">Smart Compression</div>
          <div class="fc-sub">Up to 80% Smaller File</div>
        </div>
      </div>

      <!-- Orbital Feature 4: Fill & Edit AcroForms -->
      <div class="float-card fc-acroforms">
        <div class="icon-box ib-orange">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </div>
        <div>
          <div class="fc-text">Fill & Edit AcroForms</div>
          <div class="fc-sub">Interactive Form Fields</div>
        </div>
      </div>

    </div>
  </div>
</body>
</html>
  `;

  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1584, height: 396 },
    deviceScaleFactor: 2
  });

  await page.setContent(htmlContent);
  await page.waitForTimeout(600);

  const outputPathPublic = path.resolve('public/linkedin_banner_1584x396.png');
  const outputPathBrain = path.resolve('C:\\Users\\samee\\.gemini\\antigravity\\brain\\3e407dab-5038-42b5-8e5e-91e7710b8279\\linkedin_banner_1584x396.png');

  try { fs.unlinkSync(outputPathPublic); } catch(e) {}
  try { fs.unlinkSync(outputPathBrain); } catch(e) {}

  await page.screenshot({ path: outputPathPublic, type: 'png' });
  await page.screenshot({ path: outputPathBrain, type: 'png' });

  await browser.close();
  console.log('Successfully generated LinkedIn Cover Banner (1584 x 396 px)!');
}

generateLinkedInBanner().catch(console.error);
