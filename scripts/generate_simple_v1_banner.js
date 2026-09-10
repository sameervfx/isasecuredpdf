import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

async function generateSmoothV1Banner() {
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
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    /* Ambient Glowing Neons */
    .neon-bg-1 {
      position: absolute;
      top: -120px;
      left: -100px;
      width: 500px;
      height: 500px;
      background: radial-gradient(circle, rgba(6, 182, 212, 0.4) 0%, rgba(2, 6, 23, 0) 70%);
      filter: blur(60px);
    }
    .neon-bg-2 {
      position: absolute;
      bottom: -120px;
      right: -100px;
      width: 550px;
      height: 550px;
      background: radial-gradient(circle, rgba(16, 185, 129, 0.35) 0%, rgba(2, 6, 23, 0) 70%);
      filter: blur(70px);
    }
    .neon-bg-3 {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 700px;
      height: 350px;
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
      background-size: 32px 32px;
      mask-image: radial-gradient(ellipse 85% 85% at 50% 50%, #000 70%, transparent 100%);
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
      max-width: 520px;
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
      font-size: 40px;
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
      font-size: 14px;
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
      max-width: 480px;
    }

    .pill {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 5px 11px;
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
      width: 420px;
      height: 420px;
      display: flex;
      align-items: center;
      justify-content: center;
      perspective: 1200px;
    }

    /* Orbital Motion Rings */
    .orbit-ring-svg {
      position: absolute;
      width: 340px;
      height: 340px;
    }

    /* Ultra-Attractive 3D Security Shield Emblem */
    .attractive-shield-wrap {
      width: 210px;
      height: 250px;
      position: relative;
      z-index: 5;
      filter: drop-shadow(0 20px 35px rgba(0,0,0,0.8)) drop-shadow(0 0 35px rgba(6,182,212,0.55));
    }

    /* Floating Orbit Feature Cards */
    .float-card {
      position: absolute;
      padding: 8px 12px;
      background: rgba(15, 23, 42, 0.92);
      border: 1px solid rgba(51, 65, 85, 0.9);
      border-radius: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(12px);
      z-index: 6;
    }

    .fc-password {
      top: 15px;
      left: 10px;
      border-color: rgba(16, 185, 129, 0.5);
      box-shadow: 0 8px 20px rgba(16, 185, 129, 0.2);
    }
    .fc-signature {
      top: 15px;
      right: 5px;
      border-color: rgba(168, 85, 247, 0.5);
      box-shadow: 0 8px 20px rgba(168, 85, 247, 0.2);
    }
    .fc-compress {
      bottom: 20px;
      right: 10px;
      border-color: rgba(56, 189, 248, 0.5);
      box-shadow: 0 8px 20px rgba(56, 189, 248, 0.2);
    }
    .fc-acroforms {
      bottom: 20px;
      left: 5px;
      border-color: rgba(251, 146, 60, 0.5);
      box-shadow: 0 8px 20px rgba(251, 146, 60, 0.2);
    }

    .icon-box {
      width: 28px;
      height: 28px;
      border-radius: 8px;
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
      font-size: 11px;
      font-weight: 700;
      color: #f1f5f9;
      white-space: nowrap;
    }
    .fc-sub {
      font-size: 9px;
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
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          Zero Server Uploads
        </div>
        <div class="pill">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
          4K Native Camera Scanner
        </div>
        <div class="pill">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fb923c" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="m4.93 4.93 14.14 14.14"/></svg>
          Watermark Tool
        </div>
        <div class="pill">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#34d399" stroke-width="2"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/></svg>
          Split & Merge Pages
        </div>
      </div>
    </div>

    <!-- Right Column (Orbital Features with Ultra-Attractive 3D Shield) -->
    <div class="right-col">
      <!-- Orbital Arc Graphic Rings -->
      <svg class="orbit-ring-svg" viewBox="0 0 340 340">
        <circle cx="170" cy="170" r="150" fill="none" stroke="url(#orbitGrad)" stroke-width="1.5" stroke-dasharray="8 6" opacity="0.6"/>
        <defs>
          <linearGradient id="orbitGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#38bdf8"/>
            <stop offset="50%" stop-color="#34d399"/>
            <stop offset="100%" stop-color="#a855f7"/>
          </linearGradient>
        </defs>
      </svg>

      <!-- Ultra-Attractive 3D Security Shield Emblem -->
      <div class="attractive-shield-wrap">
        <svg width="210" height="250" viewBox="0 0 270 310" fill="none">
          <defs>
            <linearGradient id="frameGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#38bdf8"/>
              <stop offset="30%" stop-color="#0284c7"/>
              <stop offset="70%" stop-color="#0f172a"/>
              <stop offset="100%" stop-color="#10b981"/>
            </linearGradient>
            <linearGradient id="innerGradLeft" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#06b6d4"/>
              <stop offset="50%" stop-color="#0284c7"/>
              <stop offset="100%" stop-color="#0f172a"/>
            </linearGradient>
            <linearGradient id="innerGradRight" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#0284c7"/>
              <stop offset="50%" stop-color="#0f172a"/>
              <stop offset="100%" stop-color="#064e3b"/>
            </linearGradient>
            <filter id="iconGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="5" result="blur"/>
              <feComposite in="SourceGraphic" in2="blur" operator="over"/>
            </filter>
          </defs>

          <!-- Outer 3D Shield Frame -->
          <path d="M 135 15 C 195 15 245 40 245 95 C 245 175 175 240 135 275 C 95 240 25 175 25 95 C 25 40 75 15 135 15 Z" fill="#020617" stroke="url(#frameGrad)" stroke-width="12" stroke-linejoin="round"/>
          <path d="M 135 27 C 185 27 230 48 230 95 C 230 165 168 223 135 255 C 102 223 40 165 40 95 C 40 48 85 27 135 27 Z" fill="none" stroke="#38bdf8" stroke-width="4" opacity="0.9"/>

          <!-- Inner Shield Body Split -->
          <path d="M 135 34 C 180 34 220 54 220 95 C 220 158 162 212 135 242 L 135 34 Z" fill="url(#innerGradLeft)"/>
          <path d="M 135 34 C 90 34 50 54 50 95 C 50 158 108 212 135 242 L 135 34 Z" fill="url(#innerGradRight)"/>
          <line x1="135" y1="34" x2="135" y2="242" stroke="rgba(255,255,255,0.25)" stroke-width="1.5"/>

          <!-- Center PDF Document Emblem -->
          <g filter="url(#iconGlow)" transform="translate(90, 75)">
            <rect x="0" y="0" width="90" height="110" rx="16" fill="rgba(15, 23, 42, 0.6)" stroke="#38bdf8" stroke-width="3"/>
            <path d="M 22 20 H 56 L 68 32 V 90 H 22 Z" fill="none" stroke="#ffffff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M 56 20 V 32 H 68" fill="none" stroke="#ffffff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
            <line x1="32" y1="44" x2="58" y2="44" stroke="#38bdf8" stroke-width="3.5" stroke-linecap="round"/>
            <line x1="32" y1="54" x2="58" y2="54" stroke="#38bdf8" stroke-width="3.5" stroke-linecap="round"/>
            <line x1="32" y1="64" x2="50" y2="64" stroke="#38bdf8" stroke-width="3.5" stroke-linecap="round"/>
            <text x="45" y="82" font-size="14" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="1">PDF</text>
          </g>
        </svg>
      </div>

      <!-- Orbital Feature 1: Password Protection (AES Encryption) -->
      <div class="float-card fc-password">
        <div class="icon-box ib-emerald">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        </div>
        <div>
          <div class="fc-text">Password Protection</div>
          <div class="fc-sub">AES-256 Encryption Lock</div>
        </div>
      </div>

      <!-- Orbital Feature 2: Digital Signature -->
      <div class="float-card fc-signature">
        <div class="icon-box ib-purple">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 14.66V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h5.34"/><polygon points="18 2 22 6 12 16 8 16 8 12 18 2"/></svg>
        </div>
        <div>
          <div class="fc-text">Digital Signature</div>
          <div class="fc-sub">Sign Contracts Privately</div>
        </div>
      </div>

      <!-- Orbital Feature 3: Smart Compression -->
      <div class="float-card fc-compress">
        <div class="icon-box ib-cyan">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/><polyline points="16 16 12 12 8 16"/></svg>
        </div>
        <div>
          <div class="fc-text">Smart Compression</div>
          <div class="fc-sub">Up to 80% Smaller File</div>
        </div>
      </div>

      <!-- Orbital Feature 4: Fill & Edit AcroForms -->
      <div class="float-card fc-acroforms">
        <div class="icon-box ib-orange">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
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
    viewport: { width: 1024, height: 500 },
    deviceScaleFactor: 2
  });

  await page.setContent(htmlContent);
  await page.waitForTimeout(600);

  const tempPath = path.resolve('public/temp_banner_2048.png');
  const outputPathPublic = path.resolve('public/google_play_feature_graphic_1024x500.png');
  const outputPathBrain = path.resolve('C:\\Users\\samee\\.gemini\\antigravity\\brain\\3e407dab-5038-42b5-8e5e-91e7710b8279\\google_play_feature_graphic_1024x500.png');

  await page.screenshot({ path: tempPath, type: 'png' });
  await browser.close();

  // Downsample 2048x1000 -> 1024x500 with smooth bicubic anti-aliasing via canvas
  const downsamplePage = await (await chromium.launch()).newPage({ viewport: { width: 1024, height: 500 }, deviceScaleFactor: 1 });
  const base64Img = fs.readFileSync(tempPath).toString('base64');
  
  await downsamplePage.setContent(`
    <html><body style="margin:0;padding:0;overflow:hidden;background:#020617;">
      <canvas id="c" width="1024" height="500"></canvas>
      <script>
        const img = new Image();
        img.onload = () => {
          const c = document.getElementById('c');
          const ctx = c.getContext('2d');
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, 1024, 500);
        };
        img.src = "data:image/png;base64,${base64Img}";
      </script>
    </body></html>
  `);
  await downsamplePage.waitForTimeout(600);

  try { fs.unlinkSync(outputPathPublic); } catch(e) {}
  try { fs.unlinkSync(outputPathBrain); } catch(e) {}

  await downsamplePage.screenshot({ path: outputPathPublic, type: 'png' });
  await downsamplePage.screenshot({ path: outputPathBrain, type: 'png' });

  try { fs.unlinkSync(tempPath); } catch(e) {}

  console.log('Successfully generated Ultra-Attractive 3D Security Shield Feature Graphic (1024 x 500 px)!');
}

generateSmoothV1Banner().catch(console.error);
