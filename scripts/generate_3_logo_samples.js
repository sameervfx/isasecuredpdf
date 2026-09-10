import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

async function generate3LogoSamples() {
  const browser = await chromium.launch();

  // Concept 1: 3D Metallic Crest Shield with PDF Document
  const htmlConcept1 = `
<!DOCTYPE html>
<html>
<head>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      width: 512px; height: 512px;
      background: radial-gradient(circle at 50% 45%, #0f172a 0%, #020617 85%);
      font-family: 'Inter', -apple-system, sans-serif;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      position: relative; overflow: hidden; -webkit-font-smoothing: antialiased;
    }
    .rays {
      position: absolute; width: 440px; height: 440px; top: 45%; left: 50%;
      transform: translate(-50%, -50%);
      background: radial-gradient(circle, rgba(6, 182, 212, 0.4) 0%, rgba(16, 185, 129, 0.15) 45%, rgba(2, 6, 23, 0) 75%);
      filter: blur(30px); z-index: 1;
    }
    .sunburst {
      position: absolute; width: 400px; height: 400px; top: 40%; left: 50%;
      transform: translate(-50%, -50%);
      background: repeating-conic-gradient(from 0deg, rgba(56, 189, 248, 0.08) 0deg 15deg, transparent 15deg 30deg);
      mask-image: radial-gradient(circle, rgba(0,0,0,1) 10%, transparent 65%); z-index: 1;
    }
    .stage { position: relative; z-index: 10; display: flex; flex-direction: column; align-items: center; }
    .shield-svg { filter: drop-shadow(0 20px 30px rgba(0,0,0,0.85)) drop-shadow(0 0 35px rgba(6,182,212,0.5)); }
    .shadow { width: 180px; height: 20px; background: radial-gradient(ellipse, rgba(0,0,0,0.85) 0%, transparent 75%); margin-top: -10px; margin-bottom: 14px; }
    .title { font-size: 24px; font-weight: 900; letter-spacing: 0.08em; color: #fff; text-transform: uppercase; text-shadow: 0 0 15px rgba(56,189,248,0.6); }
    .sub { font-size: 14px; font-weight: 700; letter-spacing: 0.2em; background: linear-gradient(135deg, #38bdf8, #34d399); -webkit-background-clip: text; -webkit-text-fill-color: transparent; text-transform: uppercase; margin-top: 2px; }
  </style>
</head>
<body>
  <div class="rays"></div><div class="sunburst"></div>
  <div class="stage">
    <div class="shield-svg">
      <svg width="240" height="270" viewBox="0 0 270 310" fill="none">
        <defs>
          <linearGradient id="gFrame" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#38bdf8"/><stop offset="50%" stop-color="#0284c7"/><stop offset="100%" stop-color="#10b981"/>
          </linearGradient>
          <linearGradient id="gLeft" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#06b6d4"/><stop offset="100%" stop-color="#0f172a"/>
          </linearGradient>
          <linearGradient id="gRight" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#0284c7"/><stop offset="100%" stop-color="#064e3b"/>
          </linearGradient>
          <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="5" result="blur"/><feComposite in="SourceGraphic" in2="blur" operator="over"/>
          </filter>
        </defs>
        <path d="M 135 15 C 195 15 245 40 245 95 C 245 175 175 240 135 275 C 95 240 25 175 25 95 C 25 40 75 15 135 15 Z" fill="#020617" stroke="url(#gFrame)" stroke-width="12"/>
        <path d="M 135 27 C 185 27 230 48 230 95 C 230 165 168 223 135 255 C 102 223 40 165 40 95 C 40 48 85 27 135 27 Z" fill="none" stroke="#38bdf8" stroke-width="4" opacity="0.9"/>
        <path d="M 135 34 C 180 34 220 54 220 95 C 220 158 162 212 135 242 L 135 34 Z" fill="url(#gLeft)"/>
        <path d="M 135 34 C 90 34 50 54 50 95 C 50 158 108 212 135 242 L 135 34 Z" fill="url(#gRight)"/>
        <g filter="url(#glow)" transform="translate(90, 75)">
          <rect x="0" y="0" width="90" height="110" rx="16" fill="rgba(15,23,42,0.6)" stroke="#38bdf8" stroke-width="3"/>
          <path d="M 22 20 H 56 L 68 32 V 90 H 22 Z" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/>
          <path d="M 56 20 V 32 H 68" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/>
          <line x1="32" y1="44" x2="58" y2="44" stroke="#38bdf8" stroke-width="3.5" stroke-linecap="round"/>
          <line x1="32" y1="54" x2="58" y2="54" stroke="#38bdf8" stroke-width="3.5" stroke-linecap="round"/>
          <text x="45" y="82" font-size="14" font-weight="900" fill="#fff" text-anchor="middle">PDF</text>
        </g>
      </svg>
    </div>
    <div class="shadow"></div>
    <div class="title">ISA SECURE</div>
    <div class="sub">PDF SUITE</div>
  </div>
</body>
</html>
  `;

  // Concept 2: 3D Cyberpunk Padlock
  const htmlConcept2 = `
<!DOCTYPE html>
<html>
<head>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      width: 512px; height: 512px;
      background: radial-gradient(circle at 50% 45%, #0f172a 0%, #020617 85%);
      font-family: 'Inter', -apple-system, sans-serif;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      position: relative; overflow: hidden; -webkit-font-smoothing: antialiased;
    }
    .rays {
      position: absolute; width: 440px; height: 440px; top: 45%; left: 50%; transform: translate(-50%, -50%);
      background: radial-gradient(circle, rgba(6, 182, 212, 0.45) 0%, rgba(16, 185, 129, 0.2) 50%, rgba(2, 6, 23, 0) 75%);
      filter: blur(35px); z-index: 1;
    }
    .stage { position: relative; z-index: 10; display: flex; flex-direction: column; align-items: center; perspective: 1000px; }
    .thick-lock {
      width: 200px; height: 195px; position: relative; transform-style: preserve-3d; transform: rotateY(-14deg) rotateX(10deg); margin-top: 50px;
    }
    .shackle {
      position: absolute; top: -88px; left: 50%; transform: translateX(-50%) translateZ(-4px); width: 150px; height: 130px; filter: drop-shadow(0 0 25px rgba(6,182,212,0.85));
    }
    .wall { position: absolute; background: linear-gradient(135deg, #0284c7, #0f172a 60%, #10b981); border: 1.5px solid rgba(56, 189, 248, 0.7); }
    .wall-top { width: 200px; height: 40px; top: -20px; left: 0; transform: rotateX(90deg); border-radius: 18px 18px 0 0; }
    .wall-bottom { width: 200px; height: 40px; bottom: -20px; left: 0; transform: rotateX(-90deg); border-radius: 0 0 18px 18px; }
    .wall-left { width: 40px; height: 195px; left: -20px; top: 0; transform: rotateY(-90deg); border-radius: 18px 0 0 18px; }
    .wall-right { width: 40px; height: 195px; right: -20px; top: 0; transform: rotateY(90deg); border-radius: 0 18px 18px 0; }
    .face-front {
      position: absolute; inset: 0; transform: translateZ(20px);
      background: linear-gradient(145deg, rgba(15, 23, 42, 0.98), rgba(6, 182, 212, 0.35));
      border: 3.5px solid #38bdf8; border-radius: 28px;
      box-shadow: 0 25px 50px rgba(0, 0, 0, 0.85), 0 0 40px rgba(6, 182, 212, 0.5);
      display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 16px;
    }
    .lock-wrap { width: 68px; height: 68px; background: radial-gradient(circle, rgba(6,182,212,0.45) 0%, rgba(15,23,42,0.9) 100%); border-radius: 20px; display: flex; align-items: center; justify-content: center; margin-bottom: 8px; border: 2px solid rgba(56,189,248,0.8); box-shadow: 0 0 25px rgba(6,182,212,0.6); }
    .title { font-size: 16px; font-weight: 900; color: #fff; letter-spacing: 0.05em; text-transform: uppercase; }
    .sub { font-size: 10px; font-weight: 800; color: #34d399; margin-top: 5px; background: rgba(6, 78, 59, 0.9); padding: 3px 10px; border-radius: 9999px; border: 1px solid rgba(16, 185, 129, 0.6); }
    .shadow { width: 180px; height: 18px; background: radial-gradient(ellipse, rgba(0,0,0,0.85) 0%, transparent 75%); margin-top: 24px; }
  </style>
</head>
<body>
  <div class="rays"></div>
  <div class="stage">
    <div class="thick-lock">
      <svg class="shackle" viewBox="0 -20 140 130">
        <defs>
          <linearGradient id="sG" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#7dd3fc"/><stop offset="50%" stop-color="#38bdf8"/><stop offset="100%" stop-color="#0369a1"/></linearGradient>
          <filter id="sGlow"><feGaussianBlur stdDeviation="5" result="b"/><feComposite in="SourceGraphic" in2="b" operator="over"/></filter>
        </defs>
        <path d="M 34 95 V 50 A 36 36 0 0 1 106 50 V 95" fill="none" stroke="url(#sG)" stroke-width="14" stroke-linecap="round" filter="url(#sGlow)"/>
        <path d="M 36 95 V 50 A 34 34 0 0 1 104 50 V 95" fill="none" stroke="rgba(255,255,255,0.85)" stroke-width="2.5" stroke-linecap="round"/>
      </svg>
      <div class="wall wall-top"></div><div class="wall wall-bottom"></div><div class="wall wall-left"></div><div class="wall wall-right"></div>
      <div class="face-front">
        <div class="lock-wrap">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2">
            <path d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" fill="#38bdf8"/>
            <path d="M12 14v3.5" stroke="#38bdf8" stroke-width="2.5" stroke-linecap="round"/>
          </svg>
        </div>
        <div class="title">ISA SECURED</div>
        <div class="sub">100% Client Protection</div>
      </div>
    </div>
    <div class="shadow"></div>
  </div>
</body>
</html>
  `;

  // Concept 3: 3D Hexagonal Vault Shield with Checkmark Seal
  const htmlConcept3 = `
<!DOCTYPE html>
<html>
<head>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      width: 512px; height: 512px;
      background: radial-gradient(circle at 50% 45%, #0f172a 0%, #020617 85%);
      font-family: 'Inter', -apple-system, sans-serif;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      position: relative; overflow: hidden; -webkit-font-smoothing: antialiased;
    }
    .rays {
      position: absolute; width: 440px; height: 440px; top: 45%; left: 50%; transform: translate(-50%, -50%);
      background: radial-gradient(circle, rgba(16, 185, 129, 0.4) 0%, rgba(6, 182, 212, 0.2) 50%, rgba(2, 6, 23, 0) 75%);
      filter: blur(35px); z-index: 1;
    }
    .stage { position: relative; z-index: 10; display: flex; flex-direction: column; align-items: center; }
    .hex-svg { filter: drop-shadow(0 20px 30px rgba(0,0,0,0.85)) drop-shadow(0 0 35px rgba(16,185,129,0.55)); }
    .shadow { width: 180px; height: 20px; background: radial-gradient(ellipse, rgba(0,0,0,0.85) 0%, transparent 75%); margin-top: -10px; margin-bottom: 14px; }
    .title { font-size: 24px; font-weight: 900; letter-spacing: 0.08em; color: #fff; text-transform: uppercase; text-shadow: 0 0 15px rgba(52,211,153,0.6); }
    .sub { font-size: 14px; font-weight: 700; letter-spacing: 0.2em; background: linear-gradient(135deg, #34d399, #38bdf8); -webkit-background-clip: text; -webkit-text-fill-color: transparent; text-transform: uppercase; margin-top: 2px; }
  </style>
</head>
<body>
  <div class="rays"></div>
  <div class="stage">
    <div class="hex-svg">
      <svg width="250" height="270" viewBox="0 0 250 270" fill="none">
        <defs>
          <linearGradient id="hGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#34d399"/><stop offset="50%" stop-color="#0284c7"/><stop offset="100%" stop-color="#a855f7"/>
          </linearGradient>
          <linearGradient id="hFace" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#064e3b"/><stop offset="50%" stop-color="#0f172a"/><stop offset="100%" stop-color="#0284c7"/>
          </linearGradient>
          <filter id="hGlow"><feGaussianBlur stdDeviation="5" result="b"/><feComposite in="SourceGraphic" in2="b" operator="over"/></filter>
        </defs>
        <!-- 3D Hexagon Outer Frame -->
        <polygon points="125,15 225,65 225,185 125,235 25,185 25,65" fill="#020617" stroke="url(#hGrad)" stroke-width="12" stroke-linejoin="round"/>
        <!-- Inner Bevel -->
        <polygon points="125,27 213,71 213,179 125,223 37,179 37,71" fill="url(#hFace)" stroke="#34d399" stroke-width="3.5"/>
        
        <!-- Glowing Checkmark Document Seal -->
        <g filter="url(#hGlow)" transform="translate(80, 65)">
          <rect x="0" y="0" width="90" height="110" rx="18" fill="rgba(15,23,42,0.7)" stroke="#34d399" stroke-width="3"/>
          <circle cx="45" cy="45" r="22" fill="rgba(16,185,129,0.2)" stroke="#34d399" stroke-width="2.5"/>
          <path d="M 36 45 L 42 51 L 54 39" fill="none" stroke="#34d399" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
          <line x1="25" y1="78" x2="65" y2="78" stroke="#38bdf8" stroke-width="3" stroke-linecap="round"/>
          <line x1="30" y1="88" x2="60" y2="88" stroke="#38bdf8" stroke-width="3" stroke-linecap="round"/>
        </g>
      </svg>
    </div>
    <div class="shadow"></div>
    <div class="title">ISA SECURE</div>
    <div class="sub">AIR-GAPPED VAULT</div>
  </div>
</body>
</html>
  `;

  // Render Concept 1
  const page1 = await browser.newPage({ viewport: { width: 512, height: 512 }, deviceScaleFactor: 2 });
  await page1.setContent(htmlConcept1);
  await page1.waitForTimeout(500);
  const pathC1Brain = path.resolve('C:\\Users\\samee\\.gemini\\antigravity\\brain\\3e407dab-5038-42b5-8e5e-91e7710b8279\\logo_concept_1_shield.png');
  await page1.screenshot({ path: pathC1Brain, type: 'png' });
  await page1.close();

  // Render Concept 2
  const page2 = await browser.newPage({ viewport: { width: 512, height: 512 }, deviceScaleFactor: 2 });
  await page2.setContent(htmlConcept2);
  await page2.waitForTimeout(500);
  const pathC2Brain = path.resolve('C:\\Users\\samee\\.gemini\\antigravity\\brain\\3e407dab-5038-42b5-8e5e-91e7710b8279\\logo_concept_2_padlock.png');
  await page2.screenshot({ path: pathC2Brain, type: 'png' });
  await page2.close();

  // Render Concept 3
  const page3 = await browser.newPage({ viewport: { width: 512, height: 512 }, deviceScaleFactor: 2 });
  await page3.setContent(htmlConcept3);
  await page3.waitForTimeout(500);
  const pathC3Brain = path.resolve('C:\\Users\\samee\\.gemini\\antigravity\\brain\\3e407dab-5038-42b5-8e5e-91e7710b8279\\logo_concept_3_hexvault.png');
  await page3.screenshot({ path: pathC3Brain, type: 'png' });
  await page3.close();

  // Render Showcase Screenshot
  const pageShowcase = await browser.newPage({ viewport: { width: 1200, height: 750 }, deviceScaleFactor: 2 });
  const htmlPath = path.resolve('C:\\Users\\samee\\.gemini\\antigravity\\brain\\3e407dab-5038-42b5-8e5e-91e7710b8279\\logo_samples_showcase.html');
  await pageShowcase.goto(`file://${htmlPath}`);
  await pageShowcase.waitForTimeout(600);
  const outputPathBrain = path.resolve('C:\\Users\\samee\\.gemini\\antigravity\\brain\\3e407dab-5038-42b5-8e5e-91e7710b8279\\logo_samples_showcase.png');
  await pageShowcase.screenshot({ path: outputPathBrain, type: 'png' });
  await pageShowcase.close();

  await browser.close();
  console.log('Successfully rendered all 3 Logo Concept Images & Showcase!');
}

generate3LogoSamples().catch(console.error);
