import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';

async function generateAttractiveShieldLogo() {
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      width: 512px;
      height: 512px;
      background: radial-gradient(circle at 50% 45%, #0f172a 0%, #020617 85%);
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      position: relative;
      -webkit-font-smoothing: antialiased;
    }

    /* Radiant Background Light Rays */
    .light-rays {
      position: absolute;
      width: 480px;
      height: 480px;
      top: 45%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: radial-gradient(circle, rgba(6, 182, 212, 0.4) 0%, rgba(16, 185, 129, 0.15) 45%, rgba(2, 6, 23, 0) 75%);
      filter: blur(30px);
      z-index: 1;
    }

    .sunburst {
      position: absolute;
      width: 420px;
      height: 420px;
      top: 40%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: repeating-conic-gradient(
        from 0deg,
        rgba(56, 189, 248, 0.08) 0deg 15deg,
        transparent 15deg 30deg
      );
      mask-image: radial-gradient(circle, rgba(0,0,0,1) 10%, transparent 65%);
      z-index: 1;
    }

    /* Main 3D Shield Stage */
    .shield-stage {
      position: relative;
      z-index: 10;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      margin-top: -10px;
    }

    .shield-svg-wrap {
      width: 270px;
      height: 310px;
      position: relative;
      filter: drop-shadow(0 25px 35px rgba(0, 0, 0, 0.85)) drop-shadow(0 0 40px rgba(6, 182, 212, 0.55));
    }

    /* Ground Shadow */
    .ground-shadow {
      width: 200px;
      height: 24px;
      background: radial-gradient(ellipse at center, rgba(0, 0, 0, 0.85) 0%, rgba(2, 6, 23, 0) 75%);
      margin-top: -12px;
      margin-bottom: 16px;
      z-index: 5;
    }

    /* Typography Branding */
    .brand-wrap {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-center;
      z-index: 10;
    }

    .brand-main {
      font-size: 26px;
      font-weight: 900;
      letter-spacing: 0.1em;
      color: #ffffff;
      text-transform: uppercase;
      text-shadow: 0 0 20px rgba(56, 189, 248, 0.6);
      line-height: 1.1;
    }

    .brand-sub {
      font-size: 16px;
      font-weight: 700;
      letter-spacing: 0.22em;
      background: linear-gradient(135deg, #38bdf8 0%, #34d399 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      text-transform: uppercase;
      margin-top: 2px;
    }

  </style>
</head>
<body>
  <div class="light-rays"></div>
  <div class="sunburst"></div>

  <div class="shield-stage">
    <!-- SVG 3D Shield Icon -->
    <div class="shield-svg-wrap">
      <svg width="270" height="310" viewBox="0 0 270 310" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <!-- Outer Metallic Frame Gradient -->
          <linearGradient id="frameGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#38bdf8"/>
            <stop offset="30%" stop-color="#0284c7"/>
            <stop offset="70%" stop-color="#0f172a"/>
            <stop offset="100%" stop-color="#10b981"/>
          </linearGradient>

          <!-- Inner Bevel Gradient Left -->
          <linearGradient id="innerGradLeft" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#06b6d4"/>
            <stop offset="50%" stop-color="#0284c7"/>
            <stop offset="100%" stop-color="#0f172a"/>
          </linearGradient>

          <!-- Inner Bevel Gradient Right -->
          <linearGradient id="innerGradRight" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#0284c7"/>
            <stop offset="50%" stop-color="#0f172a"/>
            <stop offset="100%" stop-color="#064e3b"/>
          </linearGradient>

          <!-- PDF Icon Glow -->
          <filter id="iconGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="6" result="blur"/>
            <feComposite in="SourceGraphic" in2="blur" operator="over"/>
          </filter>
        </defs>

        <!-- Outer 3D Shield Frame (Layer 1 - Deep Shadow) -->
        <path d="M 135 15 C 195 15 245 40 245 95 C 245 175 175 240 135 275 C 95 240 25 175 25 95 C 25 40 75 15 135 15 Z" fill="#020617" stroke="url(#frameGrad)" stroke-width="12" stroke-linejoin="round"/>

        <!-- Middle Metallic Rim Bevel (Layer 2) -->
        <path d="M 135 27 C 185 27 230 48 230 95 C 230 165 168 223 135 255 C 102 223 40 165 40 95 C 40 48 85 27 135 27 Z" fill="none" stroke="#38bdf8" stroke-width="4" opacity="0.9"/>

        <!-- Inner Shield Body Left Half (Light Split) -->
        <path d="M 135 34 C 180 34 220 54 220 95 C 220 158 162 212 135 242 L 135 34 Z" fill="url(#innerGradLeft)"/>

        <!-- Inner Shield Body Right Half (Shadow Split) -->
        <path d="M 135 34 C 90 34 50 54 50 95 C 50 158 108 212 135 242 L 135 34 Z" fill="url(#innerGradRight)"/>

        <!-- Center Shield Divider Line -->
        <line x1="135" y1="34" x2="135" y2="242" stroke="rgba(255,255,255,0.25)" stroke-width="1.5"/>

        <!-- PDF Document Symbol in Center (Glowing White/Cyan) -->
        <g filter="url(#iconGlow)" transform="translate(90, 75)">
          <!-- Document Background Squircle -->
          <rect x="0" y="0" width="90" height="110" rx="16" fill="rgba(15, 23, 42, 0.6)" stroke="#38bdf8" stroke-width="3"/>
          
          <!-- Folded Corner Sheet SVG -->
          <path d="M 22 20 H 56 L 68 32 V 90 H 22 Z" fill="none" stroke="#ffffff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M 56 20 V 32 H 68" fill="none" stroke="#ffffff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>

          <!-- Document Content Lines -->
          <line x1="32" y1="44" x2="58" y2="44" stroke="#38bdf8" stroke-width="3.5" stroke-linecap="round"/>
          <line x1="32" y1="54" x2="58" y2="54" stroke="#38bdf8" stroke-width="3.5" stroke-linecap="round"/>
          <line x1="32" y1="64" x2="50" y2="64" stroke="#38bdf8" stroke-width="3.5" stroke-linecap="round"/>

          <!-- Bold PDF Label -->
          <text x="45" y="82" font-size="14" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="1">PDF</text>
        </g>
      </svg>
    </div>

    <!-- Ground Drop Shadow -->
    <div class="ground-shadow"></div>

    <!-- Branding Text -->
    <div class="brand-wrap">
      <div class="brand-main">ISA SECURE</div>
      <div class="brand-sub">PDF SUITE</div>
    </div>
  </div>
</body>
</html>
  `;

  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 512, height: 512 },
    deviceScaleFactor: 2
  });

  await page.setContent(htmlContent);
  await page.waitForTimeout(600);

  const targets = [
    path.resolve('public/google_play_app_icon_512x512.png'),
    path.resolve('electron/icon.png'),
    path.resolve('dist/google_play_app_icon_512x512.png'),
    path.resolve('ios/App/App/public/google_play_app_icon_512x512.png'),
    path.resolve('C:\\Users\\samee\\.gemini\\antigravity\\brain\\3e407dab-5038-42b5-8e5e-91e7710b8279\\attractive_shield_logo.png')
  ];

  for (const target of targets) {
    if (fs.existsSync(path.dirname(target))) {
      await page.screenshot({ path: target, type: 'png' });
      console.log(`Saved Ultra-Attractive Shield Logo: ${target}`);
    }
  }

  await browser.close();
  console.log('Successfully generated Ultra-Attractive 3D Security Shield Logo!');
}

generateAttractiveShieldLogo().catch(console.error);
