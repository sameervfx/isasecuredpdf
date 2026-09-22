const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const OUTPUT_DIR_IPHONE = 'C:/Users/samee/Desktop/ISASecured_Apple_AppStore_Assets/iPhone_6.7_Screenshots';
const OUTPUT_DIR_IPAD = 'C:/Users/samee/Desktop/ISASecured_Apple_AppStore_Assets/iPad_13_Screenshots';

fs.mkdirSync(OUTPUT_DIR_IPHONE, { recursive: true });
fs.mkdirSync(OUTPUT_DIR_IPAD, { recursive: true });

const screens = [
  {
    tag: 'AIR-GAPPED SECURITY',
    title: '100% Private, On-Device PDF Suite',
    subtitle: 'Zero cloud uploads. Zero data transmission. All editing and scanning stay strictly on your device.',
    badge: 'AIR-GAPPED ENCLAVE',
    color: '#06b6d4',
    accentGrad: 'from-cyan-500 to-blue-600',
    cardTitle: 'Security Verification Report',
    cardItems: [
      { label: 'Cloud Data Transmission', val: '0 KB (Blocked)', green: true },
      { label: 'Local WebAssembly Engine', val: 'Active (Offline)', green: true },
      { label: 'Military-Grade Encryption', val: 'AES-256 GCM', green: true },
      { label: 'Client-Side Processing', val: '100% Isolated', green: true }
    ],
    mockupType: 'security'
  },
  {
    tag: 'FULL-FEATURED EDITOR',
    title: 'Professional PDF Annotation & Forms',
    subtitle: 'Edit text, fill smart AcroForms, highlight, redact, and markup documents seamlessly.',
    badge: 'DESKTOP-GRADE TOOLS',
    color: '#3b82f6',
    accentGrad: 'from-blue-500 to-indigo-600',
    cardTitle: 'Interactive Form & Markup Engine',
    cardItems: [
      { label: 'Smart AcroForm Filling', val: 'Instant Field Detection', green: true },
      { label: 'Precision Highlighting', val: 'Multi-Color Annotations', green: true },
      { label: 'Freehand Drawing & Text', val: 'Vector Quality', green: true },
      { label: 'Redaction & Blackout', val: 'Permanent Erasure', green: true }
    ],
    mockupType: 'editor'
  },
  {
    tag: 'VERIFIED SIGNATURES',
    title: 'Digital Signatures & Custom Seals',
    subtitle: 'Sign contracts on glass with precision stylus support or place official corporate stamp seals.',
    badge: 'LEGAL & COMPLIANT',
    color: '#8b5cf6',
    accentGrad: 'from-purple-500 to-cyan-500',
    cardTitle: 'Signature & Certificate Vault',
    cardItems: [
      { label: 'Stylus & Finger Signing', val: 'Pressure Sensitive', green: true },
      { label: 'Official Stamp Seals', val: 'Custom Date & Verified', green: true },
      { label: 'Saved Signatures Vault', val: 'Encrypted Locally', green: true },
      { label: 'Compliance Audit Trail', val: 'Timestamp Hash Attached', green: true }
    ],
    mockupType: 'signature'
  },
  {
    tag: 'PRIVACY & UTILITIES',
    title: 'Smart Compression & AES-256 Lock',
    subtitle: 'Shrink massive PDFs up to 90% and password-protect sensitive records with military-grade crypto.',
    badge: 'OPTIMIZATION ENGINE',
    color: '#10b981',
    accentGrad: 'from-emerald-500 to-teal-500',
    cardTitle: 'Compression & Encryption Status',
    cardItems: [
      { label: 'File Size Optimization', val: '45.2 MB → 4.8 MB (89%)', green: true },
      { label: 'Password Encryption', val: 'AES-256 Bit Protection', green: true },
      { label: 'Owner & User Permissions', val: 'Configurable', green: true },
      { label: 'Offline Vector Cruncher', val: 'Zero Image Quality Loss', green: true }
    ],
    mockupType: 'crypto'
  },
  {
    tag: 'DOCUMENT SCANNER',
    title: 'Mobile Camera Scanner to PDF',
    subtitle: 'Digitize physical paperwork into crystal-clear, searchable PDFs with automated edge detection.',
    badge: '4K CAMERA SCANNER',
    color: '#f59e0b',
    accentGrad: 'from-amber-500 to-rose-500',
    cardTitle: 'Hardware Camera Scan Processor',
    cardItems: [
      { label: 'Real-Time Edge Detection', val: 'Auto-Quad Perspective', green: true },
      { label: 'High-Contrast B&W Filter', val: 'Instant Legibility Boost', green: true },
      { label: 'Multi-Page Batch Scanner', val: 'Auto-Combine to Single PDF', green: true },
      { label: 'Zero Server Relay', val: 'Processed Directly on Device', green: true }
    ],
    mockupType: 'scanner'
  },
  {
    tag: 'DOCUMENT WORKFLOW',
    title: 'Organize, Merge, Split & Rotate',
    subtitle: 'Reorder pages visually, extract sections, and merge multiple documents into one polished master PDF.',
    badge: 'PAGE MANAGER',
    color: '#0ea5e9',
    accentGrad: 'from-cyan-500 to-indigo-600',
    cardTitle: 'Multi-Document Page Manager',
    cardItems: [
      { label: 'Drag & Drop Page Reorder', val: 'Visual Grid Preview', green: true },
      { label: 'Merge Multiple PDFs', val: 'Zero Data Leakage', green: true },
      { label: 'Page Extraction & Split', val: 'Instant Target Export', green: true },
      { label: 'Arbitrary Rotation (90/180°)', val: 'Lossless Geometry', green: true }
    ],
    mockupType: 'organizer'
  }
];

function buildHtml(screen, isIpad = false) {
  const width = isIpad ? 2048 : 1290;
  const height = isIpad ? 2732 : 2796;
  const scale = isIpad ? 1.4 : 1.0;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      margin: 0;
      padding: 0;
      background: #020617;
      color: #f8fafc;
      width: ${width}px;
      height: ${height}px;
      overflow: hidden;
      box-sizing: border-box;
    }
  </style>
</head>
<body class="relative flex flex-col justify-between p-16 bg-gradient-to-b from-slate-950 via-slate-900 to-[#030a1c]">
  <!-- Glow Accents -->
  <div class="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full blur-[140px] opacity-30" style="background: ${screen.color};"></div>
  <div class="absolute top-1/2 -right-40 w-[700px] h-[700px] rounded-full blur-[160px] opacity-25" style="background: ${screen.color};"></div>

  <!-- iOS Top Bar (Clean 9:41 AM Status Bar with zero Android elements) -->
  <div class="w-full flex items-center justify-between text-slate-300 px-6 pt-4 font-semibold text-2xl z-20">
    <div class="tracking-tight text-white font-bold">9:41</div>
    <!-- Clean Dynamic Island / Speaker cutout simulation -->
    <div class="w-36 h-9 bg-black/80 rounded-full border border-slate-800/80 flex items-center justify-end px-3">
      <div class="w-3 h-3 rounded-full bg-cyan-400/80 mr-1"></div>
    </div>
    <div class="flex items-center space-x-3 text-white">
      <svg class="w-7 h-7 fill-current" viewBox="0 0 24 24"><path d="M12 3c-4.97 0-9 4.03-9 9 0 2.12.74 4.07 1.97 5.61L4.35 19.4c-.39.39-.39 1.02 0 1.41.39.39 1.02.39 1.41 0l1.9-1.9C9.35 19.58 10.63 20 12 20c4.97 0 9-4.03 9-9s-4.03-9-9-9zm0 15c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z"/></svg>
      <svg class="w-7 h-7 fill-current" viewBox="0 0 24 24"><path d="M2 17h20v2H2zm1.15-4.05L4 11.85c3.8-3.08 8.2-4.85 13-4.85 2.14 0 4.22.35 6.17 1l-.7 1.88C20.73 9.28 18.89 9 17 9c-4.32 0-8.28 1.58-11.7 4.35l-2.15-2.4z"/></svg>
      <div class="w-8 h-4 border-2 border-white rounded-md p-0.5 flex items-center">
        <div class="w-full h-full bg-emerald-400 rounded-sm"></div>
      </div>
    </div>
  </div>

  <!-- Header Text Section -->
  <div class="z-10 mt-10 px-6 max-w-4xl">
    <div class="inline-flex items-center space-x-3 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 font-extrabold text-lg tracking-widest uppercase mb-6">
      <span class="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
      <span>${screen.tag}</span>
    </div>
    <h1 class="text-6xl sm:text-7xl font-black text-white tracking-tight leading-tight mb-4">
      ${screen.title}
    </h1>
    <p class="text-2xl text-slate-300 leading-relaxed font-medium">
      ${screen.subtitle}
    </p>
  </div>

  <!-- Central Visual Showcase Mockup (Clean iOS Glass Enclave) -->
  <div class="z-10 my-8 mx-auto w-full max-w-4xl flex-1 flex flex-col justify-center">
    <div class="bg-slate-900/80 backdrop-blur-2xl rounded-3xl border border-slate-700/80 shadow-2xl shadow-cyan-950/40 p-8 flex flex-col justify-between">
      
      <!-- Top Card Header -->
      <div class="flex items-center justify-between pb-6 border-b border-slate-800">
        <div class="flex items-center space-x-4">
          <div class="w-14 h-14 rounded-2xl bg-gradient-to-tr ${screen.accentGrad} p-0.5 shadow-lg">
            <div class="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <span class="text-2xl">🛡️</span>
            </div>
          </div>
          <div>
            <h3 class="text-2xl font-bold text-white tracking-tight">${screen.cardTitle}</h3>
            <p class="text-sm font-semibold text-cyan-400">ISASecuredPDF Client-Side Engine v1.6.8</p>
          </div>
        </div>
        <span class="px-4 py-1.5 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-black tracking-wider uppercase">
          ${screen.badge}
        </span>
      </div>

      <!-- Feature Visual Grid -->
      <div class="py-8 grid grid-cols-1 gap-4">
        ${screen.cardItems.map(item => `
          <div class="flex items-center justify-between p-5 rounded-2xl bg-slate-950/60 border border-slate-800/80">
            <div class="flex items-center space-x-3">
              <span class="text-emerald-400 text-xl font-bold">✓</span>
              <span class="text-slate-200 text-xl font-semibold">${item.label}</span>
            </div>
            <span class="font-mono text-lg font-bold text-cyan-300 px-3 py-1 rounded-lg bg-cyan-950/40 border border-cyan-500/20">
              ${item.val}
            </span>
          </div>
        `).join('')}
      </div>

      <!-- Live Action Banner -->
      <div class="p-6 rounded-2xl bg-gradient-to-r from-slate-950 to-slate-900 border border-cyan-500/30 flex items-center justify-between">
        <div class="flex items-center space-x-4">
          <div class="w-4 h-4 rounded-full bg-emerald-400 animate-ping"></div>
          <div>
            <p class="text-sm font-bold text-white uppercase tracking-wider">Device Architecture Protected</p>
            <p class="text-xs text-slate-400">Strictly 0 bytes transmitted over cellular or Wi-Fi</p>
          </div>
        </div>
        <div class="text-cyan-400 font-bold text-sm flex items-center space-x-1">
          <span>Active</span>
          <span>→</span>
        </div>
      </div>
    </div>
  </div>

  <!-- Bottom Brand Footer -->
  <div class="z-10 pb-8 flex items-center justify-between border-t border-slate-800/80 pt-6 px-6">
    <div class="flex items-center space-x-3">
      <span class="text-2xl font-black tracking-tight text-white">ISASecuredPDF</span>
      <span class="text-xs font-extrabold text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-md border border-cyan-500/20">iOS PRO SUITE</span>
    </div>
    <span class="text-sm font-semibold text-slate-400">Designed for iPhone & iPad • Complete Privacy</span>
  </div>
</body>
</html>
`;
}

async function run() {
  console.log('Launching browser to capture Apple App Store compliant screenshots...');
  const browser = await chromium.launch();

  // 1. Generate iPhone 6.7" (1290 x 2796)
  const pageIphone = await browser.newPage({
    viewport: { width: 1290, height: 2796 },
    deviceScaleFactor: 1
  });

  for (let i = 0; i < screens.length; i++) {
    const s = screens[i];
    const html = buildHtml(s, false);
    await pageIphone.setContent(html);
    await pageIphone.waitForTimeout(200);
    const outPath = path.join(OUTPUT_DIR_IPHONE, `iPhone_6.7_Screenshot_${i + 1}.png`);
    await pageIphone.screenshot({ path: outPath });
    console.log(`✓ Generated iPhone 6.7" screenshot ${i + 1}/${screens.length}: ${outPath}`);
  }
  await pageIphone.close();

  // 2. Generate iPad 13" (2048 x 2732)
  const pageIpad = await browser.newPage({
    viewport: { width: 2048, height: 2732 },
    deviceScaleFactor: 1
  });

  for (let i = 0; i < screens.length; i++) {
    const s = screens[i];
    const html = buildHtml(s, true);
    await pageIpad.setContent(html);
    await pageIpad.waitForTimeout(200);
    const outPath = path.join(OUTPUT_DIR_IPAD, `iPad_13_Screenshot_${i + 1}.png`);
    await pageIpad.screenshot({ path: outPath });
    console.log(`✓ Generated iPad 13" screenshot ${i + 1}/${screens.length}: ${outPath}`);
  }
  await pageIpad.close();

  await browser.close();
  console.log('All Apple App Store compliant screenshots generated successfully!');
}

run().catch(err => {
  console.error('Screenshot generation error:', err);
  process.exit(1);
});
