const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const { execFileSync, execSync } = require('child_process');
const ffmpegPath = require('ffmpeg-static');

const OUTPUT_DIR = path.resolve('chrome-store-assets');
const ARTIFACT_DIR = 'C:/Users/samee/.gemini/antigravity/brain/9ad90e8b-b385-4913-8602-7b0205d5bb53';
const TEMP_DIR = path.resolve('temp_showcase_video_frames');
const FRAMES_DIR = path.join(TEMP_DIR, 'frames');

fs.mkdirSync(OUTPUT_DIR, { recursive: true });
fs.mkdirSync(TEMP_DIR, { recursive: true });
fs.mkdirSync(FRAMES_DIR, { recursive: true });

// Read logo
const logoPath = path.resolve('public/app_logo.png');
const logoBase64 = 'data:image/png;base64,' + fs.readFileSync(logoPath).toString('base64');

// Synthesize voiceover audio if not existing
const voiceoverFile = path.join(TEMP_DIR, 'showcase_voiceover.mp3');
const voiceoverText = "Tired of uploading confidential PDFs to risky cloud servers? Meet ISA Secured PDF, the 100% private PDF suite that runs entirely on your device. Permanently redact sensitive data, add legal digital signatures, compress large files, and organize pages with zero cloud uploads. Your documents never leave your browser. Install ISA Secured PDF on Google Chrome today.";

console.log('Ensuring Neural Voiceover is ready...');
execSync(`edge-tts --rate=+5% --voice en-US-ChristopherNeural --text "${voiceoverText}" --write-media "${voiceoverFile}"`);

function buildHtml() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body {
    width: 1920px;
    height: 1080px;
    background: #020617;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color: #ffffff;
    overflow: hidden;
    position: relative;
    user-select: none;
  }

  .grid-pattern {
    position: absolute;
    inset: 0;
    background-image: 
      linear-gradient(to right, rgba(56, 189, 248, 0.05) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(56, 189, 248, 0.05) 1px, transparent 1px);
    background-size: 60px 60px;
    pointer-events: none;
  }

  .glow-cyan {
    position: absolute;
    width: 900px;
    height: 900px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(6, 182, 212, 0.35) 0%, transparent 70%);
    top: -250px;
    right: 50px;
    filter: blur(80px);
    pointer-events: none;
  }

  .glow-emerald {
    position: absolute;
    width: 750px;
    height: 750px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(16, 185, 129, 0.25) 0%, transparent 70%);
    bottom: -200px;
    left: 100px;
    filter: blur(90px);
    pointer-events: none;
  }

  /* Sticky Top Bar */
  .top-bar {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 110px;
    padding: 0 80px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(2, 6, 23, 0.85);
    z-index: 50;
  }
  .logo-box {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  .logo-img {
    width: 58px;
    height: 58px;
    border-radius: 16px;
    background: #090d16;
    border: 2px solid rgba(34, 211, 238, 0.5);
    padding: 6px;
    box-shadow: 0 10px 25px rgba(6, 182, 212, 0.35);
  }
  .brand-title {
    font-size: 26px;
    font-weight: 900;
    letter-spacing: -0.5px;
  }
  .brand-sub {
    font-size: 11px;
    font-weight: 800;
    color: #38bdf8;
    letter-spacing: 2px;
    font-family: monospace;
  }
  .pills {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  .pill-green {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 18px;
    border-radius: 999px;
    background: rgba(16, 185, 129, 0.15);
    border: 1px solid rgba(52, 211, 153, 0.5);
    color: #6ee7b7;
    font-size: 13px;
    font-weight: 800;
    letter-spacing: 0.5px;
  }
  .dot-pulse {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: #10b981;
    box-shadow: 0 0 10px #10b981;
  }
  .pill-gold {
    padding: 8px 18px;
    border-radius: 999px;
    background: rgba(234, 179, 8, 0.15);
    border: 1px solid rgba(250, 204, 21, 0.4);
    color: #fde047;
    font-size: 13px;
    font-weight: 800;
  }

  /* Scenes Container */
  .scene {
    position: absolute;
    inset: 120px 80px 80px 80px;
    display: none;
    align-items: center;
    justify-content: space-between;
    opacity: 0;
    transform: translateY(16px);
    transition: opacity 0.4s ease, transform 0.4s ease;
  }
  .scene.active {
    display: flex;
    opacity: 1;
    transform: translateY(0);
  }

  .left-col {
    width: 960px;
  }
  .right-col {
    width: 700px;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .tag-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 6px 16px;
    border-radius: 999px;
    font-size: 13px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    margin-bottom: 24px;
  }
  .headline {
    font-size: 64px;
    font-weight: 900;
    line-height: 1.1;
    letter-spacing: -1.5px;
    margin-bottom: 24px;
  }
  .subtext {
    font-size: 22px;
    color: #94a3b8;
    line-height: 1.5;
    font-weight: 500;
    max-width: 860px;
  }

  /* Bottom Bar */
  .bottom-bar {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 70px;
    padding: 0 80px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(2, 6, 23, 0.9);
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 14px;
    font-weight: 800;
    color: #64748b;
    z-index: 50;
  }
  .bottom-links {
    display: flex;
    gap: 32px;
  }
  .bottom-right {
    color: #38bdf8;
    font-family: monospace;
    letter-spacing: 1px;
  }

  /* Visual Cards */
  .doc-card {
    background: #ffffff;
    color: #0f172a;
    border-radius: 24px;
    padding: 36px;
    box-shadow: 0 25px 60px rgba(0, 0, 0, 0.6), 0 0 30px rgba(6, 182, 212, 0.25);
    border: 3px solid rgba(56, 189, 248, 0.5);
    width: 620px;
    position: relative;
  }

  .redact-bar {
    position: absolute;
    inset: 0;
    background: #020617;
    border-radius: 4px;
    transform-origin: left;
    width: 0%;
  }

  /* Signature Font */
  .sig-handwritten {
    font-family: 'Brush Script MT', 'Segoe Script', cursive;
    font-size: 48px;
    color: #0c4a6e;
    transform: rotate(-2deg);
  }

  /* Compress Box */
  .compress-card {
    background: #020617;
    border: 3px solid rgba(168, 85, 247, 0.6);
    border-radius: 28px;
    padding: 40px;
    width: 620px;
    box-shadow: 0 25px 60px rgba(0, 0, 0, 0.7), 0 0 40px rgba(168, 85, 247, 0.3);
  }

  /* Extension Popup Card */
  .popup-card {
    background: #020617;
    border: 3px solid rgba(56, 189, 248, 0.6);
    border-radius: 28px;
    padding: 36px;
    width: 580px;
    box-shadow: 0 25px 60px rgba(0, 0, 0, 0.7), 0 0 40px rgba(6, 182, 212, 0.35);
  }
</style>
</head>
<body>
  <div class="glow-cyan"></div>
  <div class="glow-emerald"></div>
  <div class="grid-pattern"></div>

  <!-- Top Sticky Navigation -->
  <div class="top-bar">
    <div class="logo-box">
      <img src="${logoBase64}" class="logo-img" />
      <div>
        <div class="brand-title">ISA Secured PDF</div>
        <div class="brand-sub">OFFLINE CHROME & DESKTOP SUITE</div>
      </div>
    </div>
    <div class="pills">
      <div class="pill-green">
        <div class="dot-pulse"></div>
        <span>100% AIR-GAPPED PRIVACY</span>
      </div>
      <div class="pill-gold">
        <span>★★★★★ ZERO CLOUD UPLOADS</span>
      </div>
    </div>
  </div>

  <!-- SCENE 1: THE CLOUD PRIVACY RISK (0.0s - 5.5s) -->
  <div id="scene1" class="scene active">
    <div class="left-col">
      <div class="tag-badge" style="background:rgba(239,68,68,0.2);border:1px solid #ef4444;color:#fca5a5;">
        <span>⚠️ Stop Leaking Confidential Documents</span>
      </div>
      <div class="headline">
        Never Upload Sensitive PDFs<br>
        <span style="color:#f87171;">To Remote Cloud Servers.</span>
      </div>
      <div class="subtext">
        Free online PDF converters upload your confidential bank statements, tax records, and client agreements to remote servers. <strong style="color:#38bdf8;">ISA Secured PDF runs 100% locally on your machine.</strong>
      </div>
      <div style="display:flex;gap:20px;margin-top:36px;">
        <div style="background:rgba(127,29,29,0.35);border:1px solid #ef4444;border-radius:18px;padding:20px;width:380px;">
          <div style="color:#f87171;font-weight:900;font-size:17px;margin-bottom:6px;">❌ Cloud PDF Services</div>
          <div style="color:#cbd5e1;font-size:14px;">Uploads your files to 3rd-party cloud servers</div>
        </div>
        <div style="background:rgba(6,78,59,0.35);border:1px solid #10b981;border-radius:18px;padding:20px;width:380px;">
          <div style="color:#34d399;font-weight:900;font-size:17px;margin-bottom:6px;">✅ ISA Secured PDF</div>
          <div style="color:#cbd5e1;font-size:14px;">100% Client-Side In-Memory Execution</div>
        </div>
      </div>
    </div>
    <div class="right-col">
      <div style="background:#090d16;border:3px solid #38bdf8;border-radius:28px;padding:48px;text-align:center;width:540px;box-shadow:0 25px 60px rgba(0,0,0,0.8), 0 0 30px rgba(6,182,212,0.3);">
        <img src="${logoBase64}" style="width:120px;height:120px;border-radius:24px;border:2px solid #38bdf8;padding:8px;background:#020617;margin-bottom:24px;" />
        <div style="font-size:32px;font-weight:900;margin-bottom:12px;">Air-Gapped Architecture</div>
        <div style="font-size:16px;color:#94a3b8;line-height:1.5;margin-bottom:28px;">Your PDF data NEVER leaves your device. Works completely offline.</div>
        <div style="background:linear-gradient(to right, #06b6d4, #2563eb);color:#fff;font-weight:900;padding:14px 28px;border-radius:999px;font-size:16px;display:inline-block;box-shadow:0 10px 25px rgba(6,182,212,0.4);">
          🛡️ Zero Data Transmission Guarantee
        </div>
      </div>
    </div>
  </div>

  <!-- SCENE 2: PERMANENT BLACKOUT & REDACTION (5.5s - 11.0s) -->
  <div id="scene2" class="scene">
    <div class="left-col">
      <div class="tag-badge" style="background:rgba(6,182,212,0.2);border:1px solid #06b6d4;color:#67e8f9;">
        <span>⬛ Feature 1: Permanent Redaction</span>
      </div>
      <div class="headline">
        Permanent Blackout.<br>
        <span style="color:#38bdf8;">Strips Underlying Text Forever.</span>
      </div>
      <div class="subtext">
        Do not risk drawing superficial black shapes that anyone can copy or uncover. ISA Secured PDF completely sanitizes and destroys raw text vector layers directly from the document code.
      </div>
      <div style="margin-top:36px;display:flex;flex-direction:column;gap:14px;">
        <div style="display:flex;align-items:center;gap:12px;font-size:18px;font-weight:800;color:#e2e8f0;">
          <span style="color:#10b981;">✓</span>
          <span>Redacts Social Security Numbers, banking details, and proprietary trade secrets</span>
        </div>
        <div style="display:flex;align-items:center;gap:12px;font-size:18px;font-weight:800;color:#e2e8f0;">
          <span style="color:#10b981;">✓</span>
          <span>Zero metadata residue — 100% unrecoverable compliance</span>
        </div>
      </div>
    </div>
    <div class="right-col">
      <div class="doc-card">
        <div style="display:flex;justify-content:space-between;border-bottom:2px solid #e2e8f0;padding-bottom:14px;margin-bottom:20px;">
          <span style="font-weight:900;font-size:14px;color:#64748b;letter-spacing:1px;">CONFIDENTIAL SETTLEMENT AGREEMENT</span>
          <span style="background:#fee2e2;color:#b91c1c;font-size:12px;font-weight:800;padding:4px 10px;border-radius:6px;">RESTRICTED</span>
        </div>
        <div style="font-size:15px;color:#475569;line-height:1.7;">
          <p style="margin-bottom:16px;">This agreement confirms settlement terms and protected indemnification:</p>
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px;display:flex;flex-direction:column;gap:12px;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <span style="font-weight:700;">Taxpayer SSN:</span>
              <div style="position:relative;display:inline-block;border-radius:4px;overflow:hidden;">
                <span style="font-family:monospace;font-size:16px;color:#334155;">841-02-9481</span>
                <div id="redactBar1" class="redact-bar"></div>
              </div>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <span style="font-weight:700;">Wire Routing Number:</span>
              <div style="position:relative;display:inline-block;border-radius:4px;overflow:hidden;">
                <span style="font-family:monospace;font-size:16px;color:#334155;">CHASE-9921-0491</span>
                <div id="redactBar2" class="redact-bar"></div>
              </div>
            </div>
          </div>
        </div>
        <div style="margin-top:24px;padding-top:16px;border-top:2px solid #f1f5f9;display:flex;justify-content:space-between;align-items:center;">
          <span style="color:#059669;font-weight:800;font-size:14px;">🛡️ AIR-GAPPED REDACTION APPLIED</span>
          <span style="background:#0f172a;color:#fff;font-size:12px;font-weight:900;padding:6px 14px;border-radius:8px;">UNRECOVERABLE</span>
        </div>
      </div>
    </div>
  </div>

  <!-- SCENE 3: DIGITAL SIGNATURES & FORMS (11.0s - 16.5s) -->
  <div id="scene3" class="scene">
    <div class="left-col">
      <div class="tag-badge" style="background:rgba(16,185,129,0.2);border:1px solid #10b981;color:#6ee7b7;">
        <span>✍️ Feature 2: Digital Signatures</span>
      </div>
      <div class="headline">
        Sign Any Document.<br>
        <span style="color:#34d399;">Ultra-Smooth & Legally Binding.</span>
      </div>
      <div class="subtext">
        Draw with pressure-sensitive precision, create stylized legal cursive signatures, or stamp your certified company seal in seconds.
      </div>
      <div style="margin-top:36px;display:flex;flex-direction:column;gap:14px;">
        <div style="display:flex;align-items:center;gap:12px;font-size:18px;font-weight:800;color:#e2e8f0;">
          <span style="color:#10b981;">✓</span>
          <span>Crystal-sharp anti-aliased vector rendering at any zoom level</span>
        </div>
        <div style="display:flex;align-items:center;gap:12px;font-size:18px;font-weight:800;color:#e2e8f0;">
          <span style="color:#10b981;">✓</span>
          <span>Save multiple profiles for 1-click repetitive signing</span>
        </div>
      </div>
    </div>
    <div class="right-col">
      <div class="doc-card" style="border-color:rgba(16,185,129,0.6);">
        <div style="display:flex;justify-content:space-between;border-bottom:2px solid #e2e8f0;padding-bottom:14px;margin-bottom:20px;">
          <span style="font-weight:900;font-size:14px;color:#64748b;letter-spacing:1px;">EXECUTIVE CONSULTING CONTRACT</span>
          <span style="background:#dcfce7;color:#15803d;font-size:12px;font-weight:800;padding:4px 10px;border-radius:6px;">VALIDATED</span>
        </div>
        <div style="font-size:15px;color:#475569;line-height:1.7;">
          <p>By executing below, both parties confirm strict non-disclosure obligations:</p>
          <div style="margin-top:32px;border-top:2px solid #cbd5e1;padding-top:12px;position:relative;">
            <div style="font-size:12px;color:#94a3b8;font-weight:800;text-transform:uppercase;">Authorized Signatory</div>
            <div id="sigText" class="sig-handwritten" style="position:absolute;top:-46px;left:24px;clip-path:inset(0 100% 0 0);">
              Sameer Bindra
            </div>
          </div>
        </div>
        <div style="margin-top:32px;background:#ecfdf5;border:1px solid #a7f3d0;border-radius:14px;padding:14px 20px;display:flex;justify-content:space-between;align-items:center;">
          <div style="display:flex;align-items:center;gap:10px;color:#065f46;font-weight:900;font-size:14px;">
            <span>🔏</span>
            <span>Cryptographic Digital Signature</span>
          </div>
          <span style="font-family:monospace;color:#047857;font-weight:900;font-size:13px;">SHA-256 EMBEDDED</span>
        </div>
      </div>
    </div>
  </div>

  <!-- SCENE 4: SMART COMPRESSION & TOOLS (16.5s - 21.8s) -->
  <div id="scene4" class="scene">
    <div class="left-col">
      <div class="tag-badge" style="background:rgba(168,85,247,0.2);border:1px solid #a855f7;color:#d8b4fe;">
        <span>⚡ Feature 3: Smart Compression & Tools</span>
      </div>
      <div class="headline">
        Shrink Heavy PDFs.<br>
        <span style="color:#c084fc;">Reduce Size by Up to 80%.</span>
      </div>
      <div class="subtext">
        Compress bloated scans and heavy presentations locally. Split, merge, rotate, re-order pages, or snap paperwork using the built-in document camera scanner.
      </div>
      <div style="display:flex;gap:16px;margin-top:36px;">
        <div style="background:#090d16;border:2px solid #334155;border-radius:18px;padding:20px 24px;text-align:center;width:240px;">
          <div style="font-size:26px;margin-bottom:6px;">⚡</div>
          <div style="font-weight:800;font-size:16px;">Compress</div>
        </div>
        <div style="background:#090d16;border:2px solid #334155;border-radius:18px;padding:20px 24px;text-align:center;width:240px;">
          <div style="font-size:26px;margin-bottom:6px;">📑</div>
          <div style="font-weight:800;font-size:16px;">Split & Merge</div>
        </div>
        <div style="background:#090d16;border:2px solid #334155;border-radius:18px;padding:20px 24px;text-align:center;width:240px;">
          <div style="font-size:26px;margin-bottom:6px;">📷</div>
          <div style="font-weight:800;font-size:16px;">Doc Scanner</div>
        </div>
      </div>
    </div>
    <div class="right-col">
      <div class="compress-card">
        <div style="display:flex;justify-content:space-between;border-bottom:1px solid #1e293b;padding-bottom:16px;margin-bottom:28px;">
          <span style="font-weight:900;font-size:18px;">Client-Side Compression</span>
          <span style="background:rgba(168,85,247,0.2);color:#d8b4fe;font-size:13px;font-weight:800;padding:4px 12px;border-radius:999px;">LOCAL ENGINE</span>
        </div>
        <div style="display:flex;justify-content:space-around;align-items:center;margin-bottom:32px;">
          <div style="text-align:center;">
            <div style="font-size:13px;color:#94a3b8;font-weight:800;text-transform:uppercase;margin-bottom:6px;">Original File</div>
            <div style="font-family:monospace;font-size:44px;font-weight:900;color:#cbd5e1;">18.4 MB</div>
          </div>
          <div style="font-size:32px;color:#38bdf8;font-weight:900;">➔</div>
          <div style="text-align:center;">
            <div style="font-size:13px;color:#34d399;font-weight:800;text-transform:uppercase;margin-bottom:6px;">Compressed</div>
            <div id="compSizeText" style="font-family:monospace;font-size:44px;font-weight:900;color:#34d399;">3.2 MB</div>
          </div>
        </div>
        <div style="background:rgba(6,78,59,0.3);border:1px solid #10b981;border-radius:18px;padding:20px;display:flex;justify-content:space-between;align-items:center;">
          <div>
            <div style="color:#6ee7b7;font-weight:900;font-size:16px;">Saved 15.2 MB (-82% Smaller)</div>
            <div style="color:#94a3b8;font-size:13px;margin-top:2px;">Fast local processing • Zero cloud upload</div>
          </div>
          <span style="background:#10b981;color:#020617;font-weight:900;font-size:14px;padding:8px 18px;border-radius:12px;">READY</span>
        </div>
      </div>
    </div>
  </div>

  <!-- SCENE 5: CALL TO ACTION (21.8s - 28.0s) -->
  <!-- Note: User requested NO "100% Free" because it is a freemium/Pro model -->
  <div id="scene5" class="scene">
    <div class="left-col">
      <div class="tag-badge" style="background:rgba(56,189,248,0.2);border:1px solid #38bdf8;color:#38bdf8;">
        <span>🚀 Get Started in Seconds</span>
      </div>
      <div class="headline">
        Add ISA Secured PDF<br>
        <span style="color:#38bdf8;">To Google Chrome Today.</span>
      </div>
      <div class="subtext">
        Zero cloud uploads. Zero subscription traps. Fast, private, and air-gapped PDF productivity for your browser and desktop.
      </div>

      <div style="display:flex;align-items:center;gap:32px;margin-top:40px;">
        <div style="background:linear-gradient(to right, #06b6d4, #2563eb);color:#020617;font-weight:900;font-size:22px;padding:20px 38px;border-radius:20px;box-shadow:0 15px 35px rgba(6,182,212,0.4);display:flex;align-items:center;gap:12px;">
          <span>⚡</span>
          <span>Add to Chrome • Try Free</span>
        </div>
        <div>
          <div style="color:#facc15;font-size:24px;font-weight:900;margin-bottom:4px;">★★★★★</div>
          <div style="color:#e2e8f0;font-size:16px;font-weight:800;">Zero Ads • Air-Gapped Privacy</div>
        </div>
      </div>

      <div style="margin-top:36px;font-size:20px;color:#38bdf8;font-weight:800;font-family:monospace;">
        🌐 www.isasecuredpdf.com
      </div>
    </div>
    <div class="right-col">
      <div class="popup-card">
        <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #1e293b;padding-bottom:16px;margin-bottom:20px;">
          <div style="display:flex;align-items:center;gap:12px;">
            <img src="${logoBase64}" style="width:36px;height:36px;border-radius:10px;" />
            <span style="font-weight:900;font-size:18px;">ISA Secured PDF</span>
          </div>
          <span style="background:rgba(16,185,129,0.2);border:1px solid #10b981;color:#6ee7b7;font-size:12px;font-weight:900;padding:4px 12px;border-radius:999px;">
            OFFLINE
          </span>
        </div>

        <div style="background:linear-gradient(to right, #06b6d4, #2563eb);color:#fff;font-weight:900;font-size:17px;padding:16px;border-radius:16px;text-align:center;box-shadow:0 10px 25px rgba(6,182,212,0.3);margin-bottom:20px;">
          Open PDF Workspace
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div style="background:#090d16;border:1px solid #1e293b;border-radius:14px;padding:16px;text-align:center;">
            <div style="font-size:20px;margin-bottom:4px;">⬛</div>
            <div style="font-weight:800;font-size:14px;">Redact Sensitive Data</div>
          </div>
          <div style="background:#090d16;border:1px solid #1e293b;border-radius:14px;padding:16px;text-align:center;">
            <div style="font-size:20px;margin-bottom:4px;">✍️</div>
            <div style="font-weight:800;font-size:14px;">Sign & Certify</div>
          </div>
          <div style="background:#090d16;border:1px solid #1e293b;border-radius:14px;padding:16px;text-align:center;">
            <div style="font-size:20px;margin-bottom:4px;">⚡</div>
            <div style="font-weight:800;font-size:14px;">Smart Compress</div>
          </div>
          <div style="background:#090d16;border:1px solid #1e293b;border-radius:14px;padding:16px;text-align:center;">
            <div style="font-size:20px;margin-bottom:4px;">📑</div>
            <div style="font-weight:800;font-size:14px;">Split & Merge</div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Bottom Feature Ribbon -->
  <div class="bottom-bar">
    <div class="bottom-links">
      <span>⬛ Permanent Redaction</span>
      <span>✍️ Vector Signatures</span>
      <span>⚡ Local Compression</span>
      <span>📑 Split & Arrange</span>
      <span>📷 Camera Scanner</span>
    </div>
    <div class="bottom-right">100% PRIVATE • ZERO CLOUD UPLOADS</div>
  </div>

  <script>
    window.setTimeState = function(t) {
      const s1 = document.getElementById('scene1');
      const s2 = document.getElementById('scene2');
      const s3 = document.getElementById('scene3');
      const s4 = document.getElementById('scene4');
      const s5 = document.getElementById('scene5');

      const rb1 = document.getElementById('redactBar1');
      const rb2 = document.getElementById('redactBar2');
      const sig = document.getElementById('sigText');
      const compText = document.getElementById('compSizeText');

      s1.className = 'scene';
      s2.className = 'scene';
      s3.className = 'scene';
      s4.className = 'scene';
      s5.className = 'scene';

      if (t < 5.5) {
        s1.className = 'scene active';
      } else if (t < 11.0) {
        s2.className = 'scene active';
        // Redaction bar animation between 6.5s and 9.5s
        const p = Math.min(1, Math.max(0, (t - 6.5) / 1.5));
        rb1.style.width = (p * 100).toFixed(1) + '%';
        const p2 = Math.min(1, Math.max(0, (t - 7.5) / 1.5));
        rb2.style.width = (p2 * 100).toFixed(1) + '%';
      } else if (t < 16.5) {
        s3.className = 'scene active';
        // Signature drawing animation between 12.0s and 14.5s
        const p = Math.min(1, Math.max(0, (t - 12.0) / 2.0));
        sig.style.clipPath = 'inset(0 ' + ((1 - p) * 100).toFixed(1) + '% 0 0)';
      } else if (t < 21.8) {
        s4.className = 'scene active';
        // Compression counter dropping
        const p = Math.min(1, Math.max(0, (t - 17.5) / 2.0));
        const currentMB = (18.4 - p * (18.4 - 3.2)).toFixed(1);
        compText.textContent = currentMB + ' MB';
      } else {
        // Final scene until 28.0s with NO white flash!
        s5.className = 'scene active';
      }
    };
  </script>
</body>
</html>`;
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1
  });

  console.log('Loading clean HTML layout without external network dependencies...');
  await page.setContent(buildHtml(), { waitUntil: 'load' });

  // Clean out any old frames
  fs.readdirSync(FRAMES_DIR).forEach(f => fs.unlinkSync(path.join(FRAMES_DIR, f)));

  const fps = 24;
  const durationSec = 28.0;
  const totalFrames = Math.round(fps * durationSec);

  console.log(`Rendering ${totalFrames} frames frame-by-frame at ${fps}fps (${durationSec}s)...`);
  for (let i = 0; i < totalFrames; i++) {
    const t = i / fps;
    await page.evaluate((timeSec) => window.setTimeState(timeSec), t);
    const framePath = path.join(FRAMES_DIR, `frame_${String(i).padStart(4, '0')}.jpg`);
    await page.screenshot({ path: framePath, type: 'jpeg', quality: 92 });
  }

  await browser.close();
  console.log('All frames captured with zero white screens!');

  const outputMp4 = path.join(OUTPUT_DIR, 'ISA_Secured_PDF_Showcase_1080p.mp4');
  const artifactMp4 = path.join(ARTIFACT_DIR, 'ISA_Secured_PDF_Showcase_1080p.mp4');

  console.log('Encoding MP4 with FFmpeg & merging neural voiceover...');
  execFileSync(ffmpegPath, [
    '-y',
    '-framerate', String(fps),
    '-i', path.join(FRAMES_DIR, 'frame_%04d.jpg'),
    '-i', voiceoverFile,
    '-c:v', 'libx264',
    '-pix_fmt', 'yuv420p',
    '-r', '30',
    '-crf', '17',
    '-preset', 'fast',
    '-c:a', 'aac',
    '-b:a', '192k',
    '-t', '28.0',
    outputMp4
  ]);

  fs.copyFileSync(outputMp4, artifactMp4);
  console.log(`\n======================================================`);
  console.log(`SUCCESS! Saved Fixed Showcase Video:`);
  console.log(`File: ${outputMp4}`);
  console.log(`Artifact: ${artifactMp4}`);
  console.log(`======================================================\n`);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
