import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

async function generate3DAppIcon() {
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
      background: #020617;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }

    /* Ambient Neon Glow */
    .glow-1 {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 460px;
      height: 460px;
      background: radial-gradient(circle, rgba(6, 182, 212, 0.45) 0%, rgba(16, 185, 129, 0.2) 50%, rgba(2, 6, 23, 0) 75%);
      filter: blur(40px);
    }

    .perspective-container {
      perspective: 1000px;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      z-index: 10;
    }

    /* 3D Padlock Logo Container */
    .thick-3d-lock {
      width: 220px;
      height: 215px;
      position: relative;
      transform-style: preserve-3d;
      transform: rotateY(-14deg) rotateX(10deg);
      margin-top: 55px;
    }

    /* SVG 3D Metallic Lock Shackle (Arch) */
    .lock-shackle-svg {
      position: absolute;
      top: -95px;
      left: 50%;
      transform: translateX(-50%) translateZ(-4px);
      width: 175px;
      height: 155px;
      z-index: 1;
      filter: drop-shadow(0 0 25px rgba(6, 182, 212, 0.85));
    }

    /* 3D Lock Body Extrusion Walls */
    .wall {
      position: absolute;
      background: linear-gradient(135deg, #0284c7, #0f172a 60%, #10b981);
      border: 1.5px solid rgba(56, 189, 248, 0.7);
      box-shadow: inset 0 0 15px rgba(6, 182, 212, 0.6);
    }

    .wall-top {
      width: 220px;
      height: 44px;
      top: -22px;
      left: 0;
      transform: rotateX(90deg);
      border-radius: 20px 20px 0 0;
    }

    .wall-bottom {
      width: 220px;
      height: 44px;
      bottom: -22px;
      left: 0;
      transform: rotateX(-90deg);
      border-radius: 0 0 20px 20px;
    }

    .wall-left {
      width: 44px;
      height: 215px;
      left: -22px;
      top: 0;
      transform: rotateY(-90deg);
      border-radius: 20px 0 0 20px;
    }

    .wall-right {
      width: 44px;
      height: 215px;
      right: -22px;
      top: 0;
      transform: rotateY(90deg);
      border-radius: 0 20px 20px 0;
    }

    /* Front Face */
    .face-front {
      position: absolute;
      inset: 0;
      transform: translateZ(22px);
      background: linear-gradient(145deg, rgba(15, 23, 42, 0.98), rgba(6, 182, 212, 0.35));
      border: 4px solid #38bdf8;
      border-radius: 32px;
      box-shadow: 
        0 25px 60px rgba(0, 0, 0, 0.85),
        0 0 45px rgba(6, 182, 212, 0.5),
        inset 0 2px 4px rgba(255, 255, 255, 0.6);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 18px 16px;
      z-index: 2;
    }

    .lock-icon-wrap {
      width: 76px;
      height: 76px;
      background: radial-gradient(circle, rgba(6, 182, 212, 0.45) 0%, rgba(15, 23, 42, 0.9) 100%);
      border-radius: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 10px;
      border: 2px solid rgba(56, 189, 248, 0.8);
      box-shadow: 0 0 28px rgba(6, 182, 212, 0.6);
    }

    .lock-svg {
      width: 42px;
      height: 42px;
      fill: none;
      stroke: #38bdf8;
      stroke-width: 2.2;
      filter: drop-shadow(0 0 10px rgba(56, 189, 248, 0.9));
    }

    .shield-title {
      font-size: 18px;
      font-weight: 900;
      color: #ffffff;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }

    .shield-sub {
      font-size: 11px;
      font-weight: 800;
      color: #34d399;
      margin-top: 6px;
      background: rgba(6, 78, 59, 0.9);
      padding: 4px 12px;
      border-radius: 9999px;
      border: 1px solid rgba(16, 185, 129, 0.6);
      box-shadow: 0 0 12px rgba(16, 185, 129, 0.4);
      letter-spacing: 0.03em;
    }

  </style>
</head>
<body>
  <div class="glow-1"></div>

  <div class="perspective-container">
    <div class="thick-3d-lock">
      <!-- SVG 3D Metallic Lock Shackle (Arch) with expanded viewBox to prevent clipping -->
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
    path.resolve('ios/App/App/public/google_play_app_icon_512x512.png')
  ];

  for (const target of targets) {
    if (fs.existsSync(path.dirname(target))) {
      await page.screenshot({ path: target, type: 'png' });
      console.log(`Saved Uncut 3D App Icon: ${target}`);
    }
  }

  await browser.close();
  console.log('Successfully generated 512x512 Uncut 3D Metallic Padlock App Icon!');
}

generate3DAppIcon().catch(console.error);
