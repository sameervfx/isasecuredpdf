import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

async function generateLinkedInBannerExact() {
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
      padding: 24px 60px 24px 220px; /* Generous 220px left padding protects text from LinkedIn Avatar */
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

    /* Thick 3D Extruded Shield Badge */
    .thick-3d-shield {
      width: 155px;
      height: 175px;
      position: relative;
      transform-style: preserve-3d;
      transform: rotateY(-18deg) rotateX(8deg);
      z-index: 5;
    }

    .wall {
      position: absolute;
      background: linear-gradient(to right, #0284c7, #0f172a, #10b981);
      border: 1px solid rgba(56, 189, 248, 0.6);
      box-shadow: inset 0 0 10px rgba(6, 182, 212, 0.5);
    }

    .wall-top {
      width: 155px;
      height: 30px;
      top: -15px;
      left: 0;
      transform: rotateX(90deg);
      border-radius: 18px 18px 0 0;
    }

    .wall-bottom {
      width: 155px;
      height: 30px;
      bottom: -15px;
      left: 0;
      transform: rotateX(-90deg);
      border-radius: 0 0 18px 18px;
    }

    .wall-left {
      width: 30px;
      height: 175px;
      left: -15px;
      top: 0;
      transform: rotateY(-90deg);
      border-radius: 18px 0 0 18px;
    }

    .wall-right {
      width: 30px;
      height: 175px;
      right: -15px;
      top: 0;
      transform: rotateY(90deg);
      border-radius: 0 18px 18px 0;
    }

    .face-front {
      position: absolute;
      inset: 0;
      transform: translateZ(15px);
      background: linear-gradient(145deg, rgba(15, 23, 42, 0.95), rgba(6, 182, 212, 0.25));
      border: 2.5px solid #38bdf8;
      border-radius: 24px;
      box-shadow: 
        0 20px 40px rgba(0, 0, 0, 0.7),
        0 0 35px rgba(6, 182, 212, 0.4),
        inset 0 1px 2px rgba(255, 255, 255, 0.4);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 14px;
    }

    .shield-icon-wrap {
      width: 58px;
      height: 58px;
      background: radial-gradient(circle, rgba(6, 182, 212, 0.35) 0%, rgba(15, 23, 42, 0) 70%);
      border-radius: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 8px;
      border: 1.5px solid rgba(56, 189, 248, 0.6);
      box-shadow: 0 0 20px rgba(6, 182, 212, 0.4);
    }

    .shield-svg {
      width: 30px;
      height: 30px;
      filter: drop-shadow(0 0 8px rgba(56, 189, 248, 0.8));
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
      padding: 2.5px 8px;
      border-radius: 9999px;
      border: 1px solid rgba(16, 185, 129, 0.5);
      display: flex;
      align-items: center;
      gap: 3px;
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

    .fc-watermark {
      top: 5px;
      left: 15px;
      border-color: rgba(6, 182, 212, 0.5);
      box-shadow: 0 8px 20px rgba(6, 182, 212, 0.2);
    }
    .fc-split {
      top: 5px;
      right: 15px;
      border-color: rgba(251, 146, 60, 0.5);
      box-shadow: 0 8px 20px rgba(251, 146, 60, 0.2);
    }
    .fc-scanner {
      bottom: 5px;
      right: 20px;
      border-color: rgba(16, 185, 129, 0.5);
      box-shadow: 0 8px 20px rgba(16, 185, 129, 0.2);
    }
    .fc-edit {
      bottom: 5px;
      left: 15px;
      border-color: rgba(168, 85, 247, 0.5);
      box-shadow: 0 8px 20px rgba(168, 85, 247, 0.2);
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
        Edit text, add watermarks, split & merge, scan 4K documents, fill AcroForms, compress & sign PDFs locally with zero cloud uploads.
      </p>

      <div class="pills-row">
        <div class="pill">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          Zero Server Uploads
        </div>
        <div class="pill">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#c084fc" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          Edit & Sign Text
        </div>
        <div class="pill">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fb923c" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="m4.93 4.93 14.14 14.14"/></svg>
          Watermark Remover
        </div>
        <div class="pill">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#34d399" stroke-width="2"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/></svg>
          Split & Merge Pages
        </div>
        <div class="pill">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
          4K Native Camera Scanner
        </div>
      </div>
    </div>

    <!-- Right Column (Orbital Features with 3D Shield Badge) -->
    <div class="right-col">
      <!-- Orbital Arc Graphic Rings -->
      <svg class="orbit-ring-svg" viewBox="0 0 360 360">
        <circle cx="180" cy="180" r="160" fill="none" stroke="url(#orbitGrad)" stroke-width="1.5" stroke-dasharray="8 6" opacity="0.6"/>
        <defs>
          <linearGradient id="orbitGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#38bdf8"/>
            <stop offset="50%" stop-color="#34d399"/>
            <stop offset="100%" stop-color="#a855f7"/>
          </linearGradient>
        </defs>
      </svg>

      <!-- 3D Extruded Shield Badge -->
      <div class="thick-3d-shield">
        <div class="wall wall-top"></div>
        <div class="wall wall-bottom"></div>
        <div class="wall wall-left"></div>
        <div class="wall wall-right"></div>

        <div class="face-front">
          <div class="shield-icon-wrap">
            <svg class="shield-svg" viewBox="0 0 24 24" fill="none">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="rgba(6,182,212,0.2)" stroke="#38bdf8" stroke-width="2"/>
              <path d="m9 12 2 2 4-4" stroke="#34d399" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <div class="shield-title">ISA SECURED</div>
          <div class="shield-sub">⚡ 100% Client-Side</div>
        </div>
      </div>

      <!-- Orbital Feature 1: Watermark Tool -->
      <div class="float-card fc-watermark">
        <div class="icon-box ib-cyan">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="m4.93 4.93 14.14 14.14"/></svg>
        </div>
        <div>
          <div class="fc-text">Watermark Tool</div>
          <div class="fc-sub">Add & Remove Watermarks</div>
        </div>
      </div>

      <!-- Orbital Feature 2: Split & Merge -->
      <div class="float-card fc-split">
        <div class="icon-box ib-orange">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/></svg>
        </div>
        <div>
          <div class="fc-text">Split & Merge</div>
          <div class="fc-sub">Reorder & Combine PDF Pages</div>
        </div>
      </div>

      <!-- Orbital Feature 3: PDF Text & Shape Edit -->
      <div class="float-card fc-edit">
        <div class="icon-box ib-purple">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </div>
        <div>
          <div class="fc-text">PDF Text & Shape Edit</div>
          <div class="fc-sub">Fill Forms & Digital Signatures</div>
        </div>
      </div>

      <!-- Orbital Feature 4: 4K Native Scanner -->
      <div class="float-card fc-scanner">
        <div class="icon-box ib-emerald">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
        </div>
        <div>
          <div class="fc-text">4K Native Scanner</div>
          <div class="fc-sub">Ultra-HD Document Scan</div>
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
    deviceScaleFactor: 1 // Fixed 1:1 scale for exact 1584 x 396 px
  });

  await page.setContent(htmlContent);
  await page.waitForTimeout(500);

  const outputPathPublic = path.resolve('public/linkedin_banner_1584x396.png');
  const outputPathBrain = path.resolve('C:\\Users\\samee\\.gemini\\antigravity\\brain\\3e407dab-5038-42b5-8e5e-91e7710b8279\\linkedin_banner_1584x396.png');

  try { fs.unlinkSync(outputPathPublic); } catch(e) {}
  try { fs.unlinkSync(outputPathBrain); } catch(e) {}

  await page.screenshot({ path: outputPathPublic, type: 'png' });
  await page.screenshot({ path: outputPathBrain, type: 'png' });

  await browser.close();
  console.log('Successfully generated Exact LinkedIn Cover Banner (1584 x 396 px)!');
}

generateLinkedInBannerExact().catch(console.error);
