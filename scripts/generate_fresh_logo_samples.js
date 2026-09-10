import { chromium } from 'playwright';
import path from 'path';

async function generateFreshLogoSamples() {
  const browser = await chromium.launch();

  // Concept 1: Frosted Glass Vault & Gold/Cyan Chrome
  const htmlConcept1 = `
<!DOCTYPE html>
<html>
<head>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      width: 512px; height: 512px;
      background: radial-gradient(circle at 50% 35%, #1e293b 0%, #090d16 100%);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      display: flex; align-items: center; justify-content: center;
      position: relative; overflow: hidden; -webkit-font-smoothing: antialiased;
    }
    .glow-bg {
      position: absolute; width: 380px; height: 380px;
      background: radial-gradient(circle, rgba(56, 189, 248, 0.25) 0%, rgba(99, 102, 241, 0.15) 45%, transparent 70%);
      filter: blur(40px);
    }
    .container { position: relative; z-index: 10; display: flex; flex-direction: column; align-items: center; }
  </style>
</head>
<body>
  <div class="glow-bg"></div>
  <div class="container">
    <svg width="340" height="340" viewBox="0 0 340 340" fill="none">
      <defs>
        <!-- Gradients -->
        <linearGradient id="c1_bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#1e293b"/>
          <stop offset="100%" stop-color="#0f172a"/>
        </linearGradient>
        <linearGradient id="c1_rimGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#38bdf8"/>
          <stop offset="50%" stop-color="#818cf8"/>
          <stop offset="100%" stop-color="#34d399"/>
        </linearGradient>
        <linearGradient id="c1_gold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#fbbf24"/>
          <stop offset="50%" stop-color="#f59e0b"/>
          <stop offset="100%" stop-color="#b45309"/>
        </linearGradient>
        <linearGradient id="c1_glass" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="rgba(255,255,255,0.25)"/>
          <stop offset="100%" stop-color="rgba(255,255,255,0.03)"/>
        </linearGradient>
        <linearGradient id="c1_docGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0284c7"/>
          <stop offset="100%" stop-color="#0369a1"/>
        </linearGradient>

        <!-- Filters -->
        <filter id="c1_shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="16" stdDeviation="20" flood-color="#000000" flood-opacity="0.65"/>
          <feDropShadow dx="0" dy="0" stdDeviation="15" flood-color="#38bdf8" flood-opacity="0.35"/>
        </filter>
        <filter id="c1_glow">
          <feGaussianBlur stdDeviation="6" result="blur"/>
          <feComposite in="SourceGraphic" in2="blur" operator="over"/>
        </filter>
      </defs>

      <!-- Base App Icon Card (Squircle) -->
      <rect x="30" y="30" width="280" height="280" rx="64" fill="url(#c1_bgGrad)" stroke="url(#c1_rimGrad)" stroke-width="3.5" filter="url(#c1_shadow)"/>
      <rect x="33" y="33" width="274" height="274" rx="61" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="1.5"/>

      <!-- Inner Glass Shield -->
      <g transform="translate(170, 160)">
        <!-- Outer Glass Layer -->
        <path d="M 0 -85 C 55 -85 95 -65 95 -15 C 95 55 35 100 0 120 C -35 100 -95 55 -95 -15 C -95 -65 -55 -85 0 -85 Z" fill="url(#c1_glass)" stroke="rgba(255,255,255,0.4)" stroke-width="2.5" backdrop-filter="blur(10px)"/>
        
        <!-- 3D Gold Lock Shackle Arc -->
        <path d="M -32 -25 V -52 A 32 32 0 0 1 32 -52 V -25" fill="none" stroke="url(#c1_gold)" stroke-width="14" stroke-linecap="round" filter="url(#c1_shadow)"/>
        <path d="M -32 -25 V -52 A 32 32 0 0 1 32 -52 V -25" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity="0.6"/>

        <!-- Central 3D PDF Document Body -->
        <rect x="-44" y="-20" width="88" height="110" rx="16" fill="url(#c1_docGrad)" stroke="#38bdf8" stroke-width="3" filter="url(#c1_shadow)"/>
        
        <!-- Document Corner Fold -->
        <path d="M 18 -20 L 44 6 H 26 A 8 8 0 0 1 18 -2 V -20 Z" fill="#38bdf8"/>

        <!-- Glowing PDF Emblem & Lines -->
        <path d="M -22 15 H 22 M -22 35 H 12 M -22 55 H 22" stroke="#fff" stroke-width="4.5" stroke-linecap="round" filter="url(#c1_glow)"/>
        
        <!-- Gold Security Badge Center -->
        <circle cx="22" cy="55" r="16" fill="url(#c1_gold)" stroke="#fff" stroke-width="2"/>
        <path d="M 17 55 L 20 58 L 27 51" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
      </g>
    </svg>
  </div>
</body>
</html>
  `;

  // Concept 2: 3D Origami Ribbon Shield (Sleek Continuous Gradient)
  const htmlConcept2 = `
<!DOCTYPE html>
<html>
<head>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      width: 512px; height: 512px;
      background: radial-gradient(circle at 50% 35%, #181825 0%, #090910 100%);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex; align-items: center; justify-content: center;
      position: relative; overflow: hidden; -webkit-font-smoothing: antialiased;
    }
    .glow-bg {
      position: absolute; width: 400px; height: 400px;
      background: radial-gradient(circle, rgba(168, 85, 247, 0.3) 0%, rgba(56, 189, 248, 0.15) 50%, transparent 75%);
      filter: blur(45px);
    }
  </style>
</head>
<body>
  <div class="glow-bg"></div>
  <svg width="340" height="340" viewBox="0 0 340 340" fill="none">
    <defs>
      <linearGradient id="c2_bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#1e1b4b"/>
        <stop offset="100%" stop-color="#0f172a"/>
      </linearGradient>
      <linearGradient id="c2_ribbon1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#c084fc"/>
        <stop offset="50%" stop-color="#9333ea"/>
        <stop offset="100%" stop-color="#4f46e5"/>
      </linearGradient>
      <linearGradient id="c2_ribbon2" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#38bdf8"/>
        <stop offset="50%" stop-color="#0284c7"/>
        <stop offset="100%" stop-color="#1e40af"/>
      </linearGradient>
      <linearGradient id="c2_ribbon3" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#34d399"/>
        <stop offset="100%" stop-color="#059669"/>
      </linearGradient>
      <filter id="c2_shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="18" stdDeviation="22" flood-color="#000" flood-opacity="0.75"/>
        <feDropShadow dx="0" dy="0" stdDeviation="15" flood-color="#a855f7" flood-opacity="0.4"/>
      </filter>
    </defs>

    <!-- Squircle Card -->
    <rect x="30" y="30" width="280" height="280" rx="64" fill="url(#c2_bg)" stroke="#a855f7" stroke-width="3" stroke-opacity="0.6" filter="url(#c2_shadow)"/>
    <rect x="33" y="33" width="274" height="274" rx="61" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="1.5"/>

    <!-- Dynamic 3D Ribbon Shield Center -->
    <g transform="translate(170, 165)">
      <!-- Outer Ribbon Wing Left -->
      <path d="M 0 -85 C -55 -85 -90 -55 -90 -10 C -90 50 -35 90 0 115 L 0 50 C -25 35 -50 15 -50 -10 C -50 -35 -25 -50 0 -50 Z" fill="url(#c2_ribbon2)" filter="url(#c2_shadow)"/>
      
      <!-- Outer Ribbon Wing Right -->
      <path d="M 0 -85 C 55 -85 90 -55 90 -10 C 90 50 35 90 0 115 L 0 50 C 25 35 50 15 50 -10 C 50 -35 25 -50 0 -50 Z" fill="url(#c2_ribbon1)" filter="url(#c2_shadow)"/>

      <!-- Inner Folded PDF Key Core -->
      <path d="M -30 -30 L 15 -30 L 30 -15 L 30 45 C 30 55 20 65 10 65 L -30 65 C -40 65 -50 55 -50 45 L -50 -10 C -50 -20 -40 -30 -30 -30 Z" fill="#0f172a" stroke="url(#c2_ribbon3)" stroke-width="3.5"/>
      <path d="M 15 -30 L 30 -15 H 15 Z" fill="#34d399"/>

      <!-- Glowing PDF Lock Icon inside Core -->
      <rect x="-25" y="-5" width="35" height="42" rx="8" fill="rgba(56, 189, 248, 0.15)" stroke="#38bdf8" stroke-width="2"/>
      <circle cx="-7" cy="11" r="5" fill="#38bdf8"/>
      <path d="M -7 16 V 23" stroke="#38bdf8" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M 5 28 L 16 28 M 5 22 L 20 22" stroke="#34d399" stroke-width="2.5" stroke-linecap="round"/>
    </g>
  </svg>
</body>
</html>
  `;

  // Concept 3: Biometric Cyber Vault Ring (High-Tech Minimalist 3D)
  const htmlConcept3 = `
<!DOCTYPE html>
<html>
<head>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      width: 512px; height: 512px;
      background: radial-gradient(circle at 50% 35%, #0d1b2a 0%, #030712 100%);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex; align-items: center; justify-content: center;
      position: relative; overflow: hidden; -webkit-font-smoothing: antialiased;
    }
    .glow-bg {
      position: absolute; width: 400px; height: 400px;
      background: radial-gradient(circle, rgba(16, 185, 129, 0.3) 0%, rgba(6, 182, 212, 0.2) 50%, transparent 75%);
      filter: blur(45px);
    }
  </style>
</head>
<body>
  <div class="glow-bg"></div>
  <svg width="340" height="340" viewBox="0 0 340 340" fill="none">
    <defs>
      <linearGradient id="c3_bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0f172a"/>
        <stop offset="100%" stop-color="#020617"/>
      </linearGradient>
      <linearGradient id="c3_cyanemerald" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#34d399"/>
        <stop offset="50%" stop-color="#06b6d4"/>
        <stop offset="100%" stop-color="#3b82f6"/>
      </linearGradient>
      <filter id="c3_shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="18" stdDeviation="22" flood-color="#000" flood-opacity="0.8"/>
        <feDropShadow dx="0" dy="0" stdDeviation="16" flood-color="#10b981" flood-opacity="0.45"/>
      </filter>
      <filter id="c3_glow">
        <feGaussianBlur stdDeviation="5" result="b"/>
        <feComposite in="SourceGraphic" in2="b" operator="over"/>
      </filter>
    </defs>

    <!-- Squircle Card -->
    <rect x="30" y="30" width="280" height="280" rx="64" fill="url(#c3_bg)" stroke="url(#c3_cyanemerald)" stroke-width="3.5" filter="url(#c3_shadow)"/>
    <rect x="33" y="33" width="274" height="274" rx="61" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="1.5"/>

    <!-- Cyber Vault Ring Center -->
    <g transform="translate(170, 170)">
      <!-- 3D Outer Ring with Segments -->
      <circle cx="0" cy="0" r="92" fill="none" stroke="url(#c3_cyanemerald)" stroke-width="12" stroke-dasharray="480 30" filter="url(#c3_shadow)"/>
      <circle cx="0" cy="0" r="92" fill="none" stroke="#fff" stroke-width="2" opacity="0.5"/>
      
      <!-- Inner Glowing Security Ring -->
      <circle cx="0" cy="0" r="74" fill="rgba(15,23,42,0.85)" stroke="#34d399" stroke-width="2.5" stroke-dasharray="12 6"/>

      <!-- Biometric Lock + PDF Symbol Center -->
      <g filter="url(#c3_glow)">
        <!-- PDF Document Outline -->
        <rect x="-35" y="-45" width="70" height="90" rx="14" fill="rgba(6, 182, 212, 0.15)" stroke="#38bdf8" stroke-width="3"/>
        <path d="M 10 -45 L 35 -20 H 18 A 8 8 0 0 1 10 -28 V -45 Z" fill="#38bdf8"/>
        
        <!-- Center Checkmark Vault Seal -->
        <circle cx="0" cy="8" r="22" fill="#064e3b" stroke="#34d399" stroke-width="2.5"/>
        <path d="M -9 8 L -2 15 L 11 1" fill="none" stroke="#34d399" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
        
        <!-- Text Indicator -->
        <line x1="-20" y1="-25" x2="2" y2="-25" stroke="#fff" stroke-width="3" stroke-linecap="round"/>
        <line x1="-20" y1="-16" x2="-5" y2="-16" stroke="#fff" stroke-width="3" stroke-linecap="round"/>
      </g>
    </g>
  </svg>
</body>
</html>
  `;

  // Concept 4: Executive Sapphire & Gold Crest (Ultra Luxury 3D)
  const htmlConcept4 = `
<!DOCTYPE html>
<html>
<head>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      width: 512px; height: 512px;
      background: radial-gradient(circle at 50% 35%, #1e1b4b 0%, #030712 100%);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex; align-items: center; justify-content: center;
      position: relative; overflow: hidden; -webkit-font-smoothing: antialiased;
    }
    .glow-bg {
      position: absolute; width: 400px; height: 400px;
      background: radial-gradient(circle, rgba(245, 158, 11, 0.25) 0%, rgba(99, 102, 241, 0.2) 50%, transparent 75%);
      filter: blur(45px);
    }
  </style>
</head>
<body>
  <div class="glow-bg"></div>
  <svg width="340" height="340" viewBox="0 0 340 340" fill="none">
    <defs>
      <linearGradient id="c4_bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0f172a"/>
        <stop offset="100%" stop-color="#020617"/>
      </linearGradient>
      <linearGradient id="c4_gold" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#fef08a"/>
        <stop offset="35%" stop-color="#f59e0b"/>
        <stop offset="70%" stop-color="#b45309"/>
        <stop offset="100%" stop-color="#78350f"/>
      </linearGradient>
      <linearGradient id="c4_sapphire" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#38bdf8"/>
        <stop offset="50%" stop-color="#1d4ed8"/>
        <stop offset="100%" stop-color="#0f172a"/>
      </linearGradient>
      <filter id="c4_shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="18" stdDeviation="22" flood-color="#000" flood-opacity="0.85"/>
        <feDropShadow dx="0" dy="0" stdDeviation="15" flood-color="#f59e0b" flood-opacity="0.4"/>
      </filter>
    </defs>

    <!-- Squircle Card -->
    <rect x="30" y="30" width="280" height="280" rx="64" fill="url(#c4_bg)" stroke="url(#c4_gold)" stroke-width="3.5" filter="url(#c4_shadow)"/>
    <rect x="33" y="33" width="274" height="274" rx="61" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="1.5"/>

    <!-- Sapphire & Gold Crest Center -->
    <g transform="translate(170, 165)">
      <!-- 3D Diamond / Shield Frame -->
      <path d="M 0 -85 L 75 -35 V 35 L 0 95 L -75 35 V -35 Z" fill="url(#c4_sapphire)" stroke="url(#c4_gold)" stroke-width="6" stroke-linejoin="round" filter="url(#c4_shadow)"/>
      <path d="M 0 -75 L 65 -30 V 30 L 0 85 L -65 30 V -30 Z" fill="none" stroke="#fff" stroke-width="1.5" opacity="0.6"/>

      <!-- Center Gold Security Keyhole Badge -->
      <circle cx="0" cy="0" r="34" fill="url(#c4_bg)" stroke="url(#c4_gold)" stroke-width="4"/>
      
      <path d="M 0 -12 A 10 10 0 0 0 -8 2 C -8 6 -5 9 -2 11 V 20 H 4 V 11 C 7 9 8 6 8 2 A 10 10 0 0 0 0 -12 Z" fill="url(#c4_gold)"/>
      
      <!-- Top Crown / PDF Ribbon Arc -->
      <path d="M -35 -48 L 0 -68 L 35 -48" fill="none" stroke="url(#c4_gold)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
    </g>
  </svg>
</body>
</html>
  `;

  // Write HTML Showcase File
  const showcaseHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Fresh 3D Logo Icon Concepts</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #060913;
      color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      padding: 30px 20px;
      display: flex; flex-direction: column; align-items: center;
    }
    h1 { font-size: 28px; font-weight: 800; letter-spacing: -0.02em; margin-bottom: 6px; text-align: center; }
    p.subtitle { color: #94a3b8; font-size: 14px; margin-bottom: 28px; text-align: center; max-width: 650px; }
    
    .grid {
      display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px; max-width: 1000px; width: 100%;
    }
    .card {
      background: #0f172a; border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; padding: 20px;
      display: flex; flex-direction: column; align-items: center; position: relative;
    }
    .badge {
      position: absolute; top: 16px; left: 16px; background: rgba(56, 189, 248, 0.15); border: 1px solid rgba(56, 189, 248, 0.4);
      color: #38bdf8; font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 9999px; text-transform: uppercase;
    }
    .badge.rec { background: rgba(16, 185, 129, 0.15); border-color: rgba(16, 185, 129, 0.5); color: #34d399; }
    
    .img-wrap {
      width: 250px; height: 250px; margin: 20px 0 16px 0; border-radius: 36px; overflow: hidden;
      display: flex; align-items: center; justify-content: center; background: #020617; box-shadow: 0 15px 35px rgba(0,0,0,0.5);
    }
    .img-wrap img { width: 100%; height: 100%; object-fit: contain; }
    
    .card-title { font-size: 18px; font-weight: 700; margin-bottom: 6px; color: #fff; text-align: center; }
    .card-desc { font-size: 13px; color: #94a3b8; text-align: center; line-height: 1.4; max-width: 380px; }
  </style>
</head>
<body>
  <h1>4 Fresh 3D App Icon Logo Concepts</h1>
  <p class="subtitle">Standalone high-resolution 512x512 app icon samples (for Android, iOS, Desktop & Web). Select your favorite option to preview.</p>

  <div class="grid">
    <div class="card">
      <span class="badge rec">Option A (Recommended)</span>
      <div class="img-wrap"><img src="fresh_logo_concept_1.png"/></div>
      <div class="card-title">Option A: Frosted Glass & Gold Chrome</div>
      <div class="card-desc">Layered translucent glass shield with vibrant cyan backdrop glow, 3D gold lock shackle arc, and central floating PDF document emblem.</div>
    </div>

    <div class="card">
      <span class="badge">Option B</span>
      <div class="img-wrap"><img src="fresh_logo_concept_2.png"/></div>
      <div class="card-title">Option B: 3D Origami Ribbon Shield</div>
      <div class="card-desc">Continuous 3D purple/cyan gradient ribbon shield framing a dark folded PDF core with an embedded glowing biometric keyhole.</div>
    </div>

    <div class="card">
      <span class="badge">Option C</span>
      <div class="img-wrap"><img src="fresh_logo_concept_3.png"/></div>
      <div class="card-title">Option C: Biometric Cyber Vault Ring</div>
      <div class="card-desc">Precision 3D segmented emerald/cyan vault ring with glowing laser grid, checkmark trust seal, and cyber security badge.</div>
    </div>

    <div class="card">
      <span class="badge">Option D</span>
      <div class="img-wrap"><img src="fresh_logo_concept_4.png"/></div>
      <div class="card-title">Option D: Executive Sapphire & Gold Crest</div>
      <div class="card-desc">Deep sapphire crystal shield encased in a heavy 3D gold bezel with an executive keyhole badge for enterprise security.</div>
    </div>
  </div>
</body>
</html>
  `;

  // Render individual PNGs in brain directory
  const brainDir = 'C:\\Users\\samee\\.gemini\\antigravity\\brain\\3e407dab-5038-42b5-8e5e-91e7710b8279';

  const page1 = await browser.newPage({ viewport: { width: 512, height: 512 }, deviceScaleFactor: 2 });
  await page1.setContent(htmlConcept1);
  await page1.waitForTimeout(400);
  await page1.screenshot({ path: path.join(brainDir, 'fresh_logo_concept_1.png'), type: 'png' });
  await page1.close();

  const page2 = await browser.newPage({ viewport: { width: 512, height: 512 }, deviceScaleFactor: 2 });
  await page2.setContent(htmlConcept2);
  await page2.waitForTimeout(400);
  await page2.screenshot({ path: path.join(brainDir, 'fresh_logo_concept_2.png'), type: 'png' });
  await page2.close();

  const page3 = await browser.newPage({ viewport: { width: 512, height: 512 }, deviceScaleFactor: 2 });
  await page3.setContent(htmlConcept3);
  await page3.waitForTimeout(400);
  await page3.screenshot({ path: path.join(brainDir, 'fresh_logo_concept_3.png'), type: 'png' });
  await page3.close();

  const page4 = await browser.newPage({ viewport: { width: 512, height: 512 }, deviceScaleFactor: 2 });
  await page4.setContent(htmlConcept4);
  await page4.waitForTimeout(400);
  await page4.screenshot({ path: path.join(brainDir, 'fresh_logo_concept_4.png'), type: 'png' });
  await page4.close();

  // Save showcase HTML & render screenshot
  const fs = await import('fs');
  fs.writeFileSync(path.join(brainDir, 'fresh_logo_samples_showcase.html'), showcaseHtml);

  const pageShowcase = await browser.newPage({ viewport: { width: 1100, height: 920 }, deviceScaleFactor: 2 });
  await pageShowcase.goto(`file://${path.join(brainDir, 'fresh_logo_samples_showcase.html')}`);
  await pageShowcase.waitForTimeout(600);
  await pageShowcase.screenshot({ path: path.join(brainDir, 'fresh_logo_samples_showcase.png'), type: 'png' });
  await pageShowcase.close();

  await browser.close();
  console.log('Successfully generated all 4 fresh logo concepts & showcase!');
}

generateFreshLogoSamples().catch(console.error);
