const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const { execFileSync, execSync } = require('child_process');
const ffmpegPath = require('ffmpeg-static');

const OUTPUT_DIR = path.resolve('chrome-store-assets');
const ARTIFACT_DIR = 'C:/Users/samee/.gemini/antigravity/brain/9ad90e8b-b385-4913-8602-7b0205d5bb53';
const TEMP_DIR = path.resolve('temp_showcase_video_assets');

fs.mkdirSync(OUTPUT_DIR, { recursive: true });
fs.mkdirSync(TEMP_DIR, { recursive: true });

// Read logo
const logoPath = path.resolve('public/app_logo.png');
const logoBase64 = 'data:image/png;base64,' + fs.readFileSync(logoPath).toString('base64');

// Synthesize voiceover audio
const voiceoverFile = path.join(TEMP_DIR, 'showcase_voiceover.mp3');
const voiceoverText = "Tired of uploading confidential PDFs to risky cloud servers? Meet ISA Secured PDF, the 100% private PDF suite that runs entirely on your device. Permanently redact sensitive data, add legal digital signatures, compress large files, and organize pages with zero cloud uploads. Your documents never leave your browser. Install ISA Secured PDF on Google Chrome today.";

console.log('Synthesizing Neural Voiceover for Showcase Video...');
execSync(`edge-tts --rate=+5% --voice en-US-ChristopherNeural --text "${voiceoverText}" --write-media "${voiceoverFile}"`);
console.log('Voiceover saved at:', voiceoverFile);

function getShowcaseHtml() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@700;800&family=Caveat:wght@700&display=swap" rel="stylesheet">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    width: 1920px;
    height: 1080px;
    background: radial-gradient(circle at 75% 25%, #082f49 0%, #020617 55%, #000000 100%);
    font-family: 'Plus Jakarta Sans', sans-serif;
    color: #fff;
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

  /* Radiant glowing background spheres */
  .glow-cyan {
    position: absolute;
    width: 900px;
    height: 900px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(6, 182, 212, 0.3) 0%, transparent 70%);
    top: -250px;
    right: 50px;
    filter: blur(90px);
    pointer-events: none;
  }

  .glow-emerald {
    position: absolute;
    width: 750px;
    height: 750px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(16, 185, 129, 0.22) 0%, transparent 70%);
    bottom: -200px;
    left: 100px;
    filter: blur(100px);
    pointer-events: none;
  }

  /* Master Timeline Animation - 28.0 seconds total */
  .scene-container {
    position: absolute;
    inset: 120px 100px 90px 100px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    opacity: 0;
    pointer-events: none;
    transform: translateY(20px);
    transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
  }

  @keyframes scene1Keyframes {
    0% { opacity: 0; transform: translateY(24px) scale(0.98); }
    4% { opacity: 1; transform: translateY(0) scale(1); }
    18% { opacity: 1; transform: translateY(0) scale(1); }
    21% { opacity: 0; transform: translateY(-24px) scale(0.98); }
    100% { opacity: 0; }
  }
  @keyframes scene2Keyframes {
    0%, 20% { opacity: 0; transform: translateY(24px) scale(0.98); }
    23% { opacity: 1; transform: translateY(0) scale(1); }
    38% { opacity: 1; transform: translateY(0) scale(1); }
    41% { opacity: 0; transform: translateY(-24px) scale(0.98); }
    100% { opacity: 0; }
  }
  @keyframes scene3Keyframes {
    0%, 40% { opacity: 0; transform: translateY(24px) scale(0.98); }
    43% { opacity: 1; transform: translateY(0) scale(1); }
    58% { opacity: 1; transform: translateY(0) scale(1); }
    61% { opacity: 0; transform: translateY(-24px) scale(0.98); }
    100% { opacity: 0; }
  }
  @keyframes scene4Keyframes {
    0%, 60% { opacity: 0; transform: translateY(24px) scale(0.98); }
    63% { opacity: 1; transform: translateY(0) scale(1); }
    77% { opacity: 1; transform: translateY(0) scale(1); }
    80% { opacity: 0; transform: translateY(-24px) scale(0.98); }
    100% { opacity: 0; }
  }
  @keyframes scene5Keyframes {
    0%, 79% { opacity: 0; transform: translateY(24px) scale(0.98); }
    82% { opacity: 1; transform: translateY(0) scale(1); }
    98% { opacity: 1; transform: translateY(0) scale(1); }
    100% { opacity: 1; }
  }

  .scene-1 { animation: scene1Keyframes 28s forwards linear; }
  .scene-2 { animation: scene2Keyframes 28s forwards linear; }
  .scene-3 { animation: scene3Keyframes 28s forwards linear; }
  .scene-4 { animation: scene4Keyframes 28s forwards linear; }
  .scene-5 { animation: scene5Keyframes 28s forwards linear; }

  /* Redact bar animation */
  @keyframes redactWipe {
    0%, 24% { width: 0%; }
    29%, 100% { width: 100%; }
  }
  .redact-bar-1 { animation: redactWipe 28s forwards linear; }
  .redact-bar-2 { animation: redactWipe 28s forwards linear; animation-delay: 0.8s; }

  /* Signature drawing animation */
  @keyframes sigDraw {
    0%, 44% { opacity: 0; transform: scale(0.9); }
    48%, 100% { opacity: 1; transform: scale(1); }
  }
  .signature-draw { animation: sigDraw 28s forwards ease-out; }

  /* Compress counter animation */
  @keyframes compressPulse {
    0%, 63% { transform: scale(1); }
    68% { transform: scale(1.05); }
    72%, 100% { transform: scale(1); }
  }
  .compress-box { animation: compressPulse 28s forwards ease; }

</style>
</head>
<body>
  <div class="glow-cyan"></div>
  <div class="glow-emerald"></div>
  <div class="grid-pattern"></div>

  <!-- Top Sticky Navigation Bar -->
  <div class="absolute top-0 left-0 right-0 h-24 px-16 flex items-center justify-between border-b border-white/10 z-50 bg-slate-950/60 backdrop-blur-xl">
    <div class="flex items-center space-x-4">
      <div class="w-14 h-14 rounded-2xl bg-slate-900 border-2 border-cyan-400/50 p-1.5 shadow-xl shadow-cyan-500/30 flex items-center justify-center">
        <img src="${logoBase64}" class="w-11 h-11 object-contain drop-shadow" />
      </div>
      <div>
        <h1 class="text-2xl font-black text-white tracking-tight">ISA Secured PDF</h1>
        <p class="text-xs font-bold text-cyan-300 font-mono tracking-wider">OFFLINE DESKTOP & CHROME SUITE</p>
      </div>
    </div>

    <!-- Live Status Pills -->
    <div class="flex items-center space-x-5">
      <div class="flex items-center space-x-2 px-4 py-2 rounded-full bg-emerald-500/15 border border-emerald-400/50 text-xs font-black text-emerald-300 shadow-lg">
        <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
        <span>100% AIR-GAPPED & PRIVATE</span>
      </div>
      <div class="flex items-center space-x-2 px-4 py-2 rounded-full bg-amber-500/15 border border-amber-400/50 text-xs font-black text-amber-300">
        <span>★★★★★</span>
        <span>ZERO CLOUD UPLOADS</span>
      </div>
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- SCENE 1: THE PROBLEM & THE AIR-GAPPED SOLUTION -->
  <!-- ========================================================================= -->
  <div class="scene-container scene-1">
    <div class="w-[880px]">
      <div class="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-extrabold uppercase tracking-widest mb-6">
        <span>⚠️ Stop Leaking Data</span>
      </div>
      <h2 class="text-6xl font-black text-white leading-tight tracking-tight">
        Never Upload Sensitive PDFs<br>
        <span class="bg-gradient-to-r from-red-400 via-orange-400 to-amber-400 bg-clip-text text-transparent">
          To Remote Cloud Servers.
        </span>
      </h2>
      <p class="text-xl text-slate-300 mt-6 leading-relaxed max-w-2xl font-medium">
        Most PDF tools upload your confidential tax filings, bank records, and legal agreements to remote servers. <strong class="text-cyan-400">ISA Secured PDF runs 100% on your device</strong> in sandboxed browser memory.
      </p>

      <div class="grid grid-cols-2 gap-4 mt-8 max-w-xl">
        <div class="bg-red-950/40 border border-red-500/40 rounded-2xl p-4">
          <div class="text-red-400 font-black text-sm flex items-center space-x-2">
            <span>❌ Other PDF Services</span>
          </div>
          <p class="text-xs text-slate-400 mt-1">Uploads files to unknown cloud servers</p>
        </div>
        <div class="bg-emerald-950/40 border border-emerald-500/40 rounded-2xl p-4">
          <div class="text-emerald-400 font-black text-sm flex items-center space-x-2">
            <span>✅ ISA Secured PDF</span>
          </div>
          <p class="text-xs text-slate-300 mt-1">100% In-Memory On-Device Privacy</p>
        </div>
      </div>
    </div>

    <!-- Visual Shield Stage -->
    <div class="w-[680px] flex items-center justify-center">
      <div class="relative w-[500px] h-[500px] rounded-3xl bg-slate-900/90 border-2 border-cyan-400/60 p-8 shadow-2xl shadow-cyan-500/30 flex flex-col items-center justify-center text-center">
        <div class="w-32 h-32 rounded-3xl bg-slate-950 border-2 border-cyan-400 p-3 shadow-2xl shadow-cyan-500/50 mb-6 flex items-center justify-center">
          <img src="${logoBase64}" class="w-24 h-24 object-contain" />
        </div>
        <h3 class="text-3xl font-black text-white">Military-Grade Privacy</h3>
        <p class="text-sm text-cyan-200 mt-2 max-w-xs">Zero telemetry. Zero uploads. Full HIPAA & GDPR compliance by architecture.</p>
        <div class="mt-6 px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full font-black text-sm text-white shadow-lg">
          🛡️ Verified 100% Air-Gapped
        </div>
      </div>
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- SCENE 2: PERMANENT BLACKOUT & REDACTION -->
  <!-- ========================================================================= -->
  <div class="scene-container scene-2">
    <div class="w-[880px]">
      <div class="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-cyan-500/20 border border-cyan-400/50 text-cyan-300 text-xs font-extrabold uppercase tracking-widest mb-6">
        <span>⬛ Feature 1: Permanent Redaction</span>
      </div>
      <h2 class="text-6xl font-black text-white leading-tight tracking-tight">
        Permanent Blackout.<br>
        <span class="bg-gradient-to-r from-cyan-300 via-teal-200 to-emerald-300 bg-clip-text text-transparent">
          Strips Text Layers Forever.
        </span>
      </h2>
      <p class="text-xl text-slate-300 mt-6 leading-relaxed max-w-2xl font-medium">
        Don't just draw black boxes that anyone can uncover. Our redaction engine destroys the underlying text vectors from the PDF code completely.
      </p>

      <div class="space-y-3 mt-8">
        <div class="flex items-center space-x-3 text-sm text-slate-200 font-bold">
          <span class="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">✓</span>
          <span>Redact SSNs, banking details, and confidential client records</span>
        </div>
        <div class="flex items-center space-x-3 text-sm text-slate-200 font-bold">
          <span class="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">✓</span>
          <span>Zero metadata leakage — completely unrecoverable</span>
        </div>
      </div>
    </div>

    <!-- Redaction Interactive Document Mockup -->
    <div class="w-[680px]">
      <div class="w-[560px] mx-auto bg-white text-slate-900 rounded-2xl p-8 shadow-2xl border-4 border-cyan-400/50 relative">
        <div class="border-b pb-4 mb-4 flex justify-between items-center">
          <span class="font-extrabold text-xs text-slate-400 uppercase tracking-wider">CONFIDENTIAL SETTLEMENT AGREEMENT</span>
          <span class="text-[10px] bg-red-100 text-red-600 font-bold px-2 py-0.5 rounded">RESTRICTED</span>
        </div>
        <div class="space-y-4 text-xs text-slate-600 leading-relaxed">
          <p>This agreement is entered into between party A and party B regarding compensation terms:</p>
          
          <div class="p-3 bg-slate-50 border rounded-lg space-y-2">
            <div class="flex items-center justify-between">
              <span>Primary Tax ID / SSN:</span>
              <div class="relative inline-block overflow-hidden rounded">
                <span class="font-mono text-slate-700">982-45-1049</span>
                <div class="absolute inset-0 bg-slate-950 redact-bar-1"></div>
              </div>
            </div>
            <div class="flex items-center justify-between">
              <span>Settlement Account #:</span>
              <div class="relative inline-block overflow-hidden rounded">
                <span class="font-mono text-slate-700">CHASE-8849-0129</span>
                <div class="absolute inset-0 bg-slate-950 redact-bar-2"></div>
              </div>
            </div>
          </div>

          <p>All proprietary intellectual property and client identities shall remain privileged.</p>
        </div>

        <div class="mt-6 flex items-center justify-between pt-4 border-t border-slate-100">
          <span class="text-[11px] font-bold text-emerald-600 flex items-center space-x-1">
            <span>🛡️</span>
            <span>AIR-GAPPED REDACTION APPLIED</span>
          </span>
          <span class="px-3 py-1 bg-slate-900 text-white rounded text-[10px] font-bold">100% UNRECOVERABLE</span>
        </div>
      </div>
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- SCENE 3: DIGITAL SIGNATURES & FORMS -->
  <!-- ========================================================================= -->
  <div class="scene-container scene-3">
    <div class="w-[880px]">
      <div class="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 text-xs font-extrabold uppercase tracking-widest mb-6">
        <span>✍️ Feature 2: Digital Signatures</span>
      </div>
      <h2 class="text-6xl font-black text-white leading-tight tracking-tight">
        Sign Any Document.<br>
        <span class="bg-gradient-to-r from-amber-300 via-emerald-300 to-cyan-300 bg-clip-text text-transparent">
          Ultra-Smooth & Legally Binding.
        </span>
      </h2>
      <p class="text-xl text-slate-300 mt-6 leading-relaxed max-w-2xl font-medium">
        Draw your signature with pressure-sensitive precision, type with professional calligraphy fonts, or upload your verified stamp.
      </p>

      <div class="space-y-3 mt-8">
        <div class="flex items-center space-x-3 text-sm text-slate-200 font-bold">
          <span class="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">✓</span>
          <span>Anti-aliased vector rendering for crystal-sharp print clarity</span>
        </div>
        <div class="flex items-center space-x-3 text-sm text-slate-200 font-bold">
          <span class="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">✓</span>
          <span>Save multiple signatures for 1-click repeated signing</span>
        </div>
      </div>
    </div>

    <!-- Contract Signature Mockup -->
    <div class="w-[680px]">
      <div class="w-[560px] mx-auto bg-white text-slate-900 rounded-2xl p-8 shadow-2xl border-4 border-emerald-400/50 relative">
        <div class="border-b pb-4 mb-4 flex justify-between items-center">
          <span class="font-extrabold text-xs text-slate-400 uppercase tracking-wider">CONSULTING SERVICES AGREEMENT</span>
          <span class="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded">READY TO SIGN</span>
        </div>
        <div class="space-y-4 text-xs text-slate-600">
          <p>By executing below, the client agrees to the terms and data privacy covenants outlined in Schedule A.</p>
          
          <div class="mt-8 border-t-2 border-slate-300 pt-3 relative">
            <div class="text-[10px] text-slate-400 uppercase font-bold">Authorized Signature</div>
            
            <!-- Animated Signature -->
            <div class="signature-draw absolute -top-10 left-6 text-4xl text-blue-900 font-['Caveat'] tracking-wide">
              Sameer Bindra
            </div>
          </div>
        </div>

        <div class="mt-8 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
          <div class="flex items-center space-x-2 text-xs font-bold text-emerald-900">
            <span>🔏</span>
            <span>Cryptographically Embedded Stamp</span>
          </div>
          <span class="text-[10px] font-mono text-emerald-700 font-extrabold">SHA-256 VERIFIED</span>
        </div>
      </div>
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- SCENE 4: SMART OFFLINE COMPRESSION & TOOLS -->
  <!-- ========================================================================= -->
  <div class="scene-container scene-4">
    <div class="w-[880px]">
      <div class="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-purple-500/20 border border-purple-400/50 text-purple-300 text-xs font-extrabold uppercase tracking-widest mb-6">
        <span>⚡ Feature 3: Smart Compression & Tools</span>
      </div>
      <h2 class="text-6xl font-black text-white leading-tight tracking-tight">
        Shrink Heavy PDFs.<br>
        <span class="bg-gradient-to-r from-purple-300 via-pink-300 to-cyan-300 bg-clip-text text-transparent">
          Save Up to 80% File Size.
        </span>
      </h2>
      <p class="text-xl text-slate-300 mt-6 leading-relaxed max-w-2xl font-medium">
        Compress bloated scans and documents instantly without server queues. Split, merge, rotate, re-order pages, or snap physical paperwork with the built-in camera scanner.
      </p>

      <div class="grid grid-cols-3 gap-3 mt-8 max-w-xl">
        <div class="bg-slate-900/90 border border-slate-700 rounded-xl p-3 text-center">
          <span class="text-xl block">⚡</span>
          <span class="text-xs font-bold text-white block mt-1">Compress</span>
        </div>
        <div class="bg-slate-900/90 border border-slate-700 rounded-xl p-3 text-center">
          <span class="text-xl block">📑</span>
          <span class="text-xs font-bold text-white block mt-1">Split & Merge</span>
        </div>
        <div class="bg-slate-900/90 border border-slate-700 rounded-xl p-3 text-center">
          <span class="text-xl block">📷</span>
          <span class="text-xs font-bold text-white block mt-1">Doc Scanner</span>
        </div>
      </div>
    </div>

    <!-- Compression Widget Mockup -->
    <div class="w-[680px]">
      <div class="w-[560px] mx-auto bg-slate-950 border-2 border-purple-400/60 rounded-3xl p-8 shadow-2xl compress-box">
        <div class="flex items-center justify-between pb-4 border-b border-slate-800">
          <span class="text-sm font-black text-white">Smart PDF Compression</span>
          <span class="px-2.5 py-1 bg-purple-500/20 text-purple-300 text-xs font-bold rounded-full">CLIENT-SIDE</span>
        </div>

        <div class="my-8 flex items-center justify-around">
          <div class="text-center">
            <span class="text-xs text-slate-400 uppercase font-bold block">Original</span>
            <span class="text-4xl font-black text-slate-300 font-mono mt-1 block">18.4 MB</span>
          </div>

          <div class="text-2xl text-cyan-400 font-black">➔</div>

          <div class="text-center">
            <span class="text-xs text-emerald-400 uppercase font-bold block">Optimized</span>
            <span class="text-4xl font-black text-emerald-400 font-mono mt-1 block">3.2 MB</span>
          </div>
        </div>

        <div class="p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-2xl flex items-center justify-between">
          <div>
            <span class="text-xs text-emerald-300 font-extrabold block">Saved 15.2 MB (-82%)</span>
            <span class="text-[10px] text-slate-400 block">Ready for instant email & web upload</span>
          </div>
          <span class="px-4 py-2 bg-emerald-500 text-slate-950 font-black text-xs rounded-xl shadow-lg">READY</span>
        </div>
      </div>
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- SCENE 5: CALL TO ACTION & CHROME EXTENSION HERO -->
  <!-- ========================================================================= -->
  <div class="scene-container scene-5">
    <div class="w-[880px]">
      <div class="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-cyan-500/20 border border-cyan-400/50 text-cyan-300 text-xs font-extrabold uppercase tracking-widest mb-6">
        <span>🚀 Get Started Now</span>
      </div>
      <h2 class="text-6xl font-black text-white leading-tight tracking-tight">
        Add ISA Secured PDF<br>
        <span class="bg-gradient-to-r from-cyan-300 via-teal-200 to-emerald-300 bg-clip-text text-transparent">
          To Google Chrome Today.
        </span>
      </h2>
      <p class="text-xl text-slate-300 mt-6 leading-relaxed max-w-2xl font-medium">
        Zero subscription traps. Zero cloud uploads. Total document privacy on desktop, tablet, and mobile.
      </p>

      <div class="flex items-center space-x-6 mt-8">
        <div class="px-8 py-4 bg-gradient-to-r from-cyan-400 via-cyan-500 to-blue-600 rounded-2xl text-slate-950 font-black text-lg shadow-2xl shadow-cyan-500/40 flex items-center space-x-3">
          <span>⚡</span>
          <span>Add to Chrome for Free</span>
        </div>
        <div class="text-left">
          <div class="text-amber-400 text-lg font-bold">★★★★★</div>
          <div class="text-xs text-slate-300 font-bold">100% Free • No Ads</div>
        </div>
      </div>

      <div class="mt-8 text-sm text-cyan-300 font-mono font-bold">
        🌐 www.isasecuredpdf.com
      </div>
    </div>

    <!-- Right: High-Res Floating Extension Card -->
    <div class="w-[680px] flex items-center justify-center">
      <div class="w-[480px] bg-slate-950 border-2 border-cyan-400/60 rounded-3xl p-6 shadow-2xl shadow-cyan-500/30">
        <div class="flex items-center justify-between pb-3 border-b border-slate-800">
          <div class="flex items-center space-x-2">
            <img src="${logoBase64}" class="w-6 h-6 object-contain" />
            <span class="text-sm font-black text-white">ISA Secured PDF</span>
          </div>
          <span class="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-400/50">
            OFFLINE
          </span>
        </div>

        <div class="mt-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl text-center font-black text-sm text-white shadow-lg">
          Open PDF Workspace
        </div>

        <div class="mt-4 grid grid-cols-2 gap-2 text-center text-xs">
          <div class="bg-slate-900 border border-slate-800 rounded-xl p-3 font-bold text-slate-200">
            <span class="text-base block">⬛</span>
            <span>Blackout & Redact</span>
          </div>
          <div class="bg-slate-900 border border-slate-800 rounded-xl p-3 font-bold text-slate-200">
            <span class="text-base block">✍️</span>
            <span>Sign & Certify</span>
          </div>
          <div class="bg-slate-900 border border-slate-800 rounded-xl p-3 font-bold text-slate-200">
            <span class="text-base block">⚡</span>
            <span>Compress PDF</span>
          </div>
          <div class="bg-slate-900 border border-slate-800 rounded-xl p-3 font-bold text-slate-200">
            <span class="text-base block">📑</span>
            <span>Split & Merge</span>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Bottom Feature Bar -->
  <div class="absolute bottom-0 left-0 right-0 h-16 px-16 border-t border-white/10 flex items-center justify-between text-xs font-bold text-slate-400 bg-slate-950/80 backdrop-blur-md">
    <div class="flex items-center space-x-8">
      <span>⬛ Permanent Redaction</span>
      <span>✍️ Vector Signatures</span>
      <span>⚡ Local Compression</span>
      <span>📑 Split & Arrange</span>
      <span>📷 Camera Scanner</span>
    </div>
    <div class="text-cyan-400 font-mono">100% PRIVATE • ZERO CLOUD UPLOADS</div>
  </div>

</body>
</html>`;
}

async function renderShowcaseVideo() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    recordVideo: {
      dir: TEMP_DIR,
      size: { width: 1920, height: 1080 }
    },
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1
  });

  const page = await context.newPage();
  const html = getShowcaseHtml();
  await page.setContent(html, { waitUntil: 'networkidle' });

  console.log('Recording 28.0 seconds of product showcase animation at 1080p...');
  await page.waitForTimeout(28200);

  await page.close();
  await context.close();
  await browser.close();

  // Find recorded raw WebM
  const files = fs.readdirSync(TEMP_DIR).filter(f => f.endsWith('.webm'));
  files.sort((a, b) => fs.statSync(path.join(TEMP_DIR, b)).mtimeMs - fs.statSync(path.join(TEMP_DIR, a)).mtimeMs);
  const rawWebm = path.join(TEMP_DIR, files[0]);

  const outputMp4 = path.join(OUTPUT_DIR, 'ISA_Secured_PDF_Showcase_1080p.mp4');
  const artifactMp4 = path.join(ARTIFACT_DIR, 'ISA_Secured_PDF_Showcase_1080p.mp4');

  console.log(`Merging Video with Neural Voiceover via FFmpeg: ${outputMp4}...`);
  execFileSync(ffmpegPath, [
    '-y',
    '-i', rawWebm,
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
  console.log(`SUCCESS! Saved Showcase Video with Voiceover:`);
  console.log(`File: ${outputMp4}`);
  console.log(`Artifact: ${artifactMp4}`);
  console.log(`======================================================\n`);
}

renderShowcaseVideo().catch(err => {
  console.error('Video generation failed:', err);
  process.exit(1);
});
