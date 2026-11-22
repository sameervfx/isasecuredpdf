const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const OUTPUT_DIR = path.resolve('chrome-store-assets');
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const screens = [
  {
    id: '01_private_workspace',
    filename: 'screenshot1_workspace_1280x800.png',
    tag: '100% CLIENT-SIDE AIR-GAPPED PRIVACY',
    tagColor: 'text-cyan-400 bg-cyan-950/80 border-cyan-500/40',
    title: 'Private, On-Device PDF Suite in Chrome',
    subtitle: 'Zero Cloud Uploads • 100% Local WebAssembly Processing • Works Offline',
    renderContent: () => `
      <!-- Desktop Chrome Window Frame -->
      <div class="w-full bg-slate-900/90 rounded-2xl border border-slate-700/80 shadow-2xl overflow-hidden flex flex-col">
        <!-- Chrome Top Window Header -->
        <div class="h-10 bg-slate-950 px-4 flex items-center justify-between border-b border-slate-800">
          <div class="flex items-center space-x-2">
            <span class="w-3 h-3 rounded-full bg-rose-500/80"></span>
            <span class="w-3 h-3 rounded-full bg-amber-500/80"></span>
            <span class="w-3 h-3 rounded-full bg-emerald-500/80"></span>
          </div>
          <!-- Chrome Tab -->
          <div class="flex items-center space-x-2 bg-slate-900 border-t border-x border-slate-700/80 px-4 py-1.5 rounded-t-lg text-xs font-semibold text-white -mb-px">
            <div class="w-3.5 h-3.5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-[9px]">🛡️</div>
            <span>ISA Secured PDF Suite</span>
            <span class="text-slate-400 text-[10px] ml-1">✕</span>
          </div>
          <div class="flex items-center space-x-2">
            <span class="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-bold">100% OFFLINE AIR-GAPPED</span>
          </div>
        </div>

        <!-- App Main Toolbar -->
        <div class="h-14 bg-slate-900 px-6 flex items-center justify-between border-b border-slate-800">
          <div class="flex items-center space-x-3">
            <div class="flex items-center space-x-2">
              <div class="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-bold text-sm">🛡️</div>
              <span class="font-extrabold text-white text-sm tracking-tight">ISA Secured PDF</span>
            </div>
          </div>
          <!-- Action Buttons -->
          <div class="flex items-center space-x-2">
            <span class="px-3 py-1.5 rounded-lg bg-cyan-600 text-white text-xs font-bold shadow-md shadow-cyan-600/30 flex items-center space-x-1">
              <span>✏️ Text</span>
            </span>
            <span class="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-700 flex items-center space-x-1">
              <span>✍️ Sign</span>
            </span>
            <span class="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-700 flex items-center space-x-1">
              <span>⬛ Redact</span>
            </span>
            <span class="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-700 flex items-center space-x-1">
              <span>⚡ Compress</span>
            </span>
            <span class="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-700 flex items-center space-x-1">
              <span>🔒 Password</span>
            </span>
            <span class="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-700 flex items-center space-x-1">
              <span>📑 Split & Arrange</span>
            </span>
          </div>
          <div class="flex items-center space-x-2">
            <span class="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-bold shadow-lg shadow-cyan-500/20">
              Download PDF
            </span>
          </div>
        </div>

        <!-- Document Viewer Workspace -->
        <div class="h-[430px] bg-slate-950 flex p-6 gap-6 relative overflow-hidden">
          <!-- Sidebar Thumbnails -->
          <div class="w-48 bg-slate-900/60 rounded-xl border border-slate-800 p-3 flex flex-col space-y-3">
            <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pages (3)</div>
            <div class="p-2 rounded-lg bg-cyan-950/40 border-2 border-cyan-500/60 shadow-lg shadow-cyan-950/30">
              <div class="h-28 bg-white rounded shadow-sm p-2 flex flex-col justify-between">
                <div class="space-y-1">
                  <div class="h-1.5 bg-slate-800 rounded w-3/4"></div>
                  <div class="h-1 bg-slate-400 rounded w-full"></div>
                  <div class="h-1 bg-slate-400 rounded w-5/6"></div>
                </div>
                <div class="flex justify-between items-center text-[8px] text-slate-500">
                  <span>Page 1</span>
                  <span class="text-cyan-600 font-bold">Active</span>
                </div>
              </div>
            </div>
            <div class="p-2 rounded-lg bg-slate-900 border border-slate-800 opacity-60">
              <div class="h-28 bg-white rounded shadow-sm p-2">
                <div class="h-1 bg-slate-300 rounded w-full mb-1"></div>
                <div class="h-1 bg-slate-300 rounded w-4/5 mb-1"></div>
                <div class="h-1 bg-slate-300 rounded w-2/3"></div>
              </div>
            </div>
          </div>

          <!-- Active PDF Canvas -->
          <div class="flex-1 bg-slate-900/30 rounded-xl flex items-center justify-center relative overflow-hidden">
            <div class="w-[520px] h-[390px] bg-white rounded-lg shadow-2xl p-7 flex flex-col justify-between text-slate-800 relative">
              <!-- Security Watermark Stamp in Corner -->
              <div class="absolute top-5 right-6 px-3 py-1 rounded border-2 border-emerald-600 text-emerald-700 text-[10px] font-black uppercase tracking-wider transform rotate-3">
                ✓ 100% On-Device Verified
              </div>

              <div>
                <div class="flex items-center space-x-3 mb-3 border-b border-slate-200 pb-3">
                  <div class="w-8 h-8 rounded bg-cyan-900 text-white font-bold flex items-center justify-center text-xs">ISA</div>
                  <div>
                    <h4 class="font-extrabold text-sm text-slate-900">CONFIDENTIAL CONSULTING AGREEMENT</h4>
                    <p class="text-[10px] text-slate-500 font-mono">Document ID: ISA-2026-X99 • Air-Gapped Session</p>
                  </div>
                </div>
                <p class="text-[11px] text-slate-700 leading-relaxed">
                  This Agreement is entered into by and between the Client and the undersigned Contractor. All personal identifiers, statements, and proprietary data within this document are processed client-side.
                </p>
                <div class="mt-3 p-2.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                  <div class="text-[10px] font-bold text-slate-700">Scope of Work & Compensation:</div>
                  <div class="text-[10px] text-slate-600 font-mono">$12,500.00 USD payable upon completion of technical milestones.</div>
                </div>
              </div>

              <!-- Signature Line -->
              <div class="pt-2 border-t border-slate-200 flex items-end justify-between">
                <div>
                  <div class="text-[9px] font-bold text-slate-500 uppercase">Authorized Signature</div>
                  <div class="text-2xl text-blue-900 font-bold" style="font-family: 'Brush Script MT', cursive, serif;">Sameer Bindra</div>
                  <div class="text-[9px] text-slate-500">Date: November 21, 2026</div>
                </div>
                <div class="px-3 py-1.5 bg-emerald-50 border border-emerald-300 rounded text-emerald-800 text-[10px] font-bold flex items-center space-x-1">
                  <span>🔒</span>
                  <span>AES-256 Protected</span>
                </div>
              </div>
            </div>

            <!-- Floating Privacy Badge Pill -->
            <div class="absolute bottom-4 right-4 bg-slate-950/90 border border-cyan-500/50 backdrop-blur-md px-4 py-2 rounded-xl shadow-2xl flex items-center space-x-3">
              <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span class="text-xs font-bold text-white">Zero Bytes Transmitted to Cloud</span>
              <span class="text-[10px] font-mono text-cyan-400">0 KB Network I/O</span>
            </div>
          </div>
        </div>
      </div>
    `
  },
  {
    id: '02_extension_popup',
    filename: 'screenshot2_redact_1280x800.png',
    tag: 'CHROME EXTENSION POPUP TOOLBAR',
    tagColor: 'text-cyan-400 bg-cyan-950/80 border-cyan-500/40',
    title: '1-Click Quick Access PDF Toolbar in Chrome',
    subtitle: 'Drop any PDF, access 6 power tools, or open the full private editor directly from your browser',
    renderContent: () => `
      <!-- Desktop Chrome Window Frame -->
      <div class="w-full bg-[#0a0f1d] rounded-2xl border border-slate-700/80 shadow-2xl overflow-hidden flex flex-col relative">
        <!-- Chrome Top Window Header with Tab -->
        <div class="h-9 bg-[#060a12] px-4 flex items-center justify-between border-b border-slate-800">
          <div class="flex items-center space-x-2">
            <span class="w-2.5 h-2.5 rounded-full bg-slate-600"></span>
            <span class="w-2.5 h-2.5 rounded-full bg-slate-600"></span>
            <span class="w-2.5 h-2.5 rounded-full bg-slate-600"></span>
          </div>
          <div class="flex items-center space-x-2 bg-[#0a0f1d] border-t border-x border-slate-700/80 px-4 py-1.5 rounded-t-lg text-xs font-semibold text-white -mb-px">
            <div class="w-3.5 h-3.5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-[9px]">🛡️</div>
            <span>ISA Secured PDF</span>
            <span class="text-slate-400 text-[10px] ml-1">✕</span>
          </div>
          <div class="w-16"></div>
        </div>

        <!-- Chrome Address Bar & Extension Toolbar -->
        <div class="h-11 bg-[#0b1120] px-4 flex items-center justify-between border-b border-slate-800 gap-3">
          <div class="flex items-center space-x-2 text-slate-400 text-xs">
            <span class="p-1 hover:text-white">‹</span>
            <span class="p-1 hover:text-white">›</span>
            <span class="p-1 hover:text-white">↻</span>
          </div>
          <!-- Address Input -->
          <div class="flex-1 max-w-xl h-7 bg-[#060a12] border border-slate-800 rounded-lg px-3 flex items-center text-xs text-slate-300 space-x-2">
            <span class="text-emerald-400 text-[11px]">🔒</span>
            <span class="font-mono text-[11px] text-slate-200">https://www.isasecuredpdf.com</span>
          </div>
          <!-- Extension Toolbar Icons -->
          <div class="flex items-center space-x-2.5">
            <span class="text-slate-400 text-xs">🧩</span>
            <!-- Active ISA Secured PDF Extension Icon with Glow -->
            <div class="p-1 px-1.5 rounded-lg bg-cyan-500/20 border border-cyan-400/80 shadow-lg shadow-cyan-500/30 flex items-center space-x-1">
              <span class="text-xs">🛡️</span>
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            </div>
            <span class="w-6 h-6 rounded-full bg-slate-700 text-white text-[10px] flex items-center justify-center font-bold">S</span>
          </div>
        </div>

        <!-- Web Page Canvas with Floating Extension Popup -->
        <div class="h-[480px] bg-[#070b14] flex p-8 relative overflow-hidden">
          <!-- Background Landing Page Mockup (Dimmed slightly to spotlight popup) -->
          <div class="w-[660px] flex flex-col justify-center space-y-4 pr-6 opacity-90">
            <div class="flex items-center space-x-2">
              <div class="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-bold text-xs">🛡️</div>
              <span class="font-extrabold text-white text-base tracking-tight">ISASecuredPDF</span>
            </div>
            <div class="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-[10px] font-semibold w-max">
              <span>🔒 100% Client-Side • Zero Data Transmission • Phone, Tablet & Desktop Ready</span>
            </div>
            <h2 class="text-3xl font-black text-white leading-tight">
              The 100% On-Device, <span class="text-emerald-400">Privacy-First</span><br>PDF Suite for Modern Teams.
            </h2>
            <p class="text-xs text-slate-300 leading-relaxed max-w-lg">
              Fill AcroForms, edit text, add vector shapes, encrypt, and compress PDFs locally in your browser. Zero data uploaded to cloud servers. Save up to 80% compared to traditional Acrobat subscriptions.
            </p>
            <div class="flex items-center space-x-3 pt-1">
              <div class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-xs shadow-lg flex items-center space-x-1.5">
                <span>✨ Open Free Web Editor ➜</span>
              </div>
              <div class="px-5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 font-semibold text-xs flex items-center space-x-1.5">
                <span>📷 Scan Document (Camera)</span>
              </div>
            </div>
            <div class="flex items-center space-x-2 pt-2 text-[11px] text-amber-400 font-bold">
              <span>★★★★★ 5.0 / 5.0</span>
              <span class="text-slate-400 font-medium">• Verified 5-Star Reviews • 100% Consensus on Google Play</span>
            </div>
          </div>

          <!-- Spotlight Floating Chrome Extension Card (Exact Match to User's Screenshot) -->
          <div class="absolute right-8 top-3 w-[370px] bg-[#090e17] border border-cyan-500/40 rounded-2xl shadow-2xl shadow-cyan-950/90 p-4 space-y-3 z-20 backdrop-blur-md ring-1 ring-cyan-500/20">
            <!-- Extension Header -->
            <div class="flex items-center justify-between pb-2.5 border-b border-slate-800">
              <div class="flex items-center space-x-2.5">
                <div class="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 text-base shadow-sm">🛡️</div>
                <div>
                  <h3 class="text-xs font-black text-white tracking-tight">ISA Secured PDF</h3>
                  <p class="text-[9.5px] text-slate-400">100% Client-Side Privacy</p>
                </div>
              </div>
              <div class="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[9px] font-extrabold text-emerald-400">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>OFFLINE</span>
              </div>
            </div>

            <!-- Primary Action Button -->
            <button class="w-full py-2 px-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-cyan-600/25 flex items-center justify-center space-x-1.5">
              <span>⬆</span>
              <span>Open PDF Workspace</span>
            </button>

            <!-- Dropzone -->
            <div class="border-2 border-dashed border-cyan-500/40 bg-slate-900/60 rounded-xl p-3 flex flex-col items-center justify-center text-center space-y-1 hover:border-cyan-400 transition cursor-pointer">
              <div class="w-7 h-7 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400 text-xs">☁️</div>
              <div class="text-[11px] font-bold text-white">Click or Drop PDF here</div>
              <div class="text-[9px] text-slate-400">Opens instantly in local private memory</div>
            </div>

            <!-- 6 Quick Action Grid -->
            <div class="grid grid-cols-2 gap-2 pt-0.5">
              <!-- 1: Redact -->
              <div class="p-2 bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 rounded-xl flex items-center space-x-2 transition">
                <div class="w-6 h-6 rounded-lg bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 flex items-center justify-center text-xs">⬛</div>
                <div class="overflow-hidden">
                  <div class="text-[10px] font-bold text-white truncate">Blackout & Redact</div>
                  <div class="text-[8px] text-slate-400 truncate">Hide sensitive data</div>
                </div>
              </div>

              <!-- 2: Sign -->
              <div class="p-2 bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 rounded-xl flex items-center space-x-2 transition">
                <div class="w-6 h-6 rounded-lg bg-blue-500/20 border border-blue-500/30 text-blue-400 flex items-center justify-center text-xs">✍️</div>
                <div class="overflow-hidden">
                  <div class="text-[10px] font-bold text-white truncate">Sign & Certify</div>
                  <div class="text-[8px] text-slate-400 truncate">Digital signature</div>
                </div>
              </div>

              <!-- 3: Compress -->
              <div class="p-2 bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 rounded-xl flex items-center space-x-2 transition">
                <div class="w-6 h-6 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center text-xs">⚡</div>
                <div class="overflow-hidden">
                  <div class="text-[10px] font-bold text-white truncate">Compress PDF</div>
                  <div class="text-[8px] text-slate-400 truncate">Reduce file size</div>
                </div>
              </div>

              <!-- 4: Add Password -->
              <div class="p-2 bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 rounded-xl flex items-center space-x-2 transition">
                <div class="w-6 h-6 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center text-xs">🔒</div>
                <div class="overflow-hidden">
                  <div class="text-[10px] font-bold text-white truncate">Add Password</div>
                  <div class="text-[8px] text-slate-400 truncate">AES-256 protect</div>
                </div>
              </div>

              <!-- 5: Split & Arrange -->
              <div class="p-2 bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 rounded-xl flex items-center space-x-2 transition">
                <div class="w-6 h-6 rounded-lg bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center text-xs">📑</div>
                <div class="overflow-hidden">
                  <div class="text-[10px] font-bold text-white truncate">Split & Arrange</div>
                  <div class="text-[8px] text-slate-400 truncate">Combine & arrange</div>
                </div>
              </div>

              <!-- 6: Image to PDF -->
              <div class="p-2 bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 rounded-xl flex items-center space-x-2 transition">
                <div class="w-6 h-6 rounded-lg bg-purple-500/20 border border-purple-500/30 text-purple-400 flex items-center justify-center text-xs">🖼️</div>
                <div class="overflow-hidden">
                  <div class="text-[10px] font-bold text-white truncate">Image to PDF</div>
                  <div class="text-[8px] text-slate-400 truncate">Convert pictures</div>
                </div>
              </div>
            </div>

            <!-- Footer -->
            <div class="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[8.5px] text-slate-400">
              <span>Tip: Right-click any PDF link to open</span>
              <span class="text-cyan-400 font-semibold flex items-center space-x-0.5">
                <span>isasecuredpdf.com</span>
                <span>↗</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    `
  },
  {
    id: '03_digital_signatures',
    filename: 'screenshot3_tools_1280x800.png',
    tag: 'LEGAL DIGITAL SIGNATURES & STAMPS',
    tagColor: 'text-blue-400 bg-blue-950/80 border-blue-500/40',
    title: 'Draw, Type, or Upload Signatures & Stamps',
    subtitle: 'Sign Contracts in Seconds • Apply Verified Approval Seals with Zero Subscription Fees',
    renderContent: () => `
      <div class="w-full bg-slate-900/90 rounded-2xl border border-slate-700/80 shadow-2xl overflow-hidden flex flex-col">
        <!-- Window Bar -->
        <div class="h-10 bg-slate-950 px-4 flex items-center justify-between border-b border-slate-800">
          <div class="flex items-center space-x-2">
            <span class="w-3 h-3 rounded-full bg-rose-500/80"></span>
            <span class="w-3 h-3 rounded-full bg-amber-500/80"></span>
            <span class="w-3 h-3 rounded-full bg-emerald-500/80"></span>
          </div>
          <div class="text-xs font-bold text-blue-400 flex items-center space-x-1.5">
            <span>✍️</span>
            <span>Digital Signature & Stamp Creator</span>
          </div>
          <span class="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40 text-[10px] font-bold">LEGALLY BINDING</span>
        </div>

        <!-- Main Body -->
        <div class="h-[484px] bg-slate-950 flex p-8 gap-8 items-center justify-center">
          <!-- Signature Modal Mockup -->
          <div class="w-[520px] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div class="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
              <div class="flex items-center space-x-2">
                <span class="text-cyan-400 font-bold">✍️</span>
                <span class="text-sm font-bold text-white">Create Digital Signature</span>
              </div>
              <div class="flex items-center space-x-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-[11px]">
                <span class="px-2.5 py-0.5 rounded bg-cyan-600 text-white font-bold">Draw</span>
                <span class="px-2.5 py-0.5 text-slate-400">Type</span>
                <span class="px-2.5 py-0.5 text-slate-400">Upload</span>
              </div>
            </div>

            <!-- Signature Canvas -->
            <div class="p-5 space-y-4">
              <div class="h-44 bg-white rounded-xl shadow-inner border-2 border-dashed border-cyan-500/60 p-4 flex flex-col justify-between relative overflow-hidden">
                <div class="text-[10px] text-slate-400 font-mono uppercase">Signing Line — Use Mouse or Stylus</div>
                <!-- Ink Signature SVG -->
                <div class="flex items-center justify-center py-2">
                  <svg class="w-72 h-24 text-blue-900" viewBox="0 0 240 80" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M 15 50 Q 40 10 70 45 T 120 30 T 170 50 T 210 20" />
                    <path d="M 30 65 Q 110 60 215 55" stroke-width="2.5" />
                  </svg>
                </div>
                <div class="flex justify-between items-center text-[10px] text-slate-400 font-mono">
                  <span>Smoothing: Active</span>
                  <span class="text-cyan-700 font-bold">Vector Quality</span>
                </div>
              </div>

              <!-- Action Bar -->
              <div class="flex items-center justify-between pt-1">
                <div class="flex items-center space-x-2">
                  <span class="w-5 h-5 rounded-full bg-blue-900 border border-white cursor-pointer ring-2 ring-blue-500"></span>
                  <span class="w-5 h-5 rounded-full bg-slate-950 border border-slate-700 cursor-pointer"></span>
                  <span class="w-5 h-5 rounded-full bg-emerald-800 border border-slate-700 cursor-pointer"></span>
                </div>
                <button class="px-5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-cyan-500/20">
                  Insert Signature into Document
                </button>
              </div>
            </div>
          </div>

          <!-- Official Stamps Panel -->
          <div class="w-[420px] space-y-4">
            <div class="p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl space-y-3">
              <div class="text-sm font-bold text-white flex items-center space-x-2">
                <span>📑</span>
                <span>Pre-Made Legal Stamps & Seals</span>
              </div>
              <p class="text-xs text-slate-400">
                Instantly place corporate approval seals, confidential watermarks, and verification badges.
              </p>
              <div class="grid grid-cols-2 gap-3 pt-1">
                <div class="p-3 bg-emerald-950/40 border-2 border-emerald-500/60 rounded-xl text-center shadow-lg">
                  <div class="text-xs font-black text-emerald-400 uppercase tracking-wider">✓ APPROVED</div>
                  <div class="text-[9px] text-emerald-500 font-mono mt-0.5">Date: 2026-11-21</div>
                </div>
                <div class="p-3 bg-indigo-950/40 border-2 border-indigo-500/60 rounded-xl text-center shadow-lg">
                  <div class="text-xs font-black text-indigo-300 uppercase tracking-wider">CONFIDENTIAL</div>
                  <div class="text-[9px] text-indigo-400 font-mono mt-0.5">Do Not Distribute</div>
                </div>
                <div class="p-3 bg-cyan-950/40 border-2 border-cyan-500/60 rounded-xl text-center shadow-lg">
                  <div class="text-xs font-black text-cyan-400 uppercase tracking-wider">VERIFIED SEAL</div>
                  <div class="text-[9px] text-cyan-500 font-mono mt-0.5">Air-Gapped Audit</div>
                </div>
                <div class="p-3 bg-amber-950/40 border-2 border-amber-500/60 rounded-xl text-center shadow-lg">
                  <div class="text-xs font-black text-amber-400 uppercase tracking-wider">FINAL COPY</div>
                  <div class="text-[9px] text-amber-500 font-mono mt-0.5">Ready for Filing</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `
  },
  {
    id: '04_compress_and_encrypt',
    filename: 'screenshot4_compress_1280x800.png',
    tag: 'ON-DEVICE COMPRESSION & AES-256 ENCRYPTION',
    tagColor: 'text-amber-400 bg-amber-950/80 border-amber-500/40',
    title: 'Compress File Size & Protect with Password',
    subtitle: 'Shrink Large PDFs Up to 80% • Military-Grade AES-256 Encryption Without Cloud Transmission',
    renderContent: () => `
      <div class="w-full bg-slate-900/90 rounded-2xl border border-slate-700/80 shadow-2xl overflow-hidden flex flex-col">
        <!-- Window Bar -->
        <div class="h-10 bg-slate-950 px-4 flex items-center justify-between border-b border-slate-800">
          <div class="flex items-center space-x-2">
            <span class="w-3 h-3 rounded-full bg-rose-500/80"></span>
            <span class="w-3 h-3 rounded-full bg-amber-500/80"></span>
            <span class="w-3 h-3 rounded-full bg-emerald-500/80"></span>
          </div>
          <div class="text-xs font-bold text-amber-400 flex items-center space-x-1.5">
            <span>⚡</span>
            <span>Speed Optimizer & Vault Security</span>
          </div>
          <span class="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold">LOCAL WEB-ASSEMBLY</span>
        </div>

        <!-- Main Body -->
        <div class="h-[484px] bg-slate-950 flex p-8 gap-8 items-center justify-center">
          <!-- Compress Modal View -->
          <div class="w-[500px] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 space-y-4">
            <div class="flex items-center justify-between border-b border-slate-800 pb-3">
              <div class="flex items-center space-x-2 text-white font-bold text-sm">
                <span class="text-amber-400">⚡</span>
                <span>Compress PDF File Size</span>
              </div>
              <span class="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold text-[10px]">Instant Local</span>
            </div>

            <!-- Result Card -->
            <div class="p-4 bg-slate-950 border border-emerald-500/40 rounded-xl space-y-2">
              <div class="flex items-center justify-between text-xs font-bold">
                <span class="text-emerald-400 flex items-center space-x-1">
                  <span>✓</span>
                  <span>Compression Complete!</span>
                </span>
                <span class="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-full font-mono text-[10px]">
                  -78% Size Saved
                </span>
              </div>
              <div class="flex items-center justify-between text-xs pt-1 border-t border-slate-800">
                <div class="text-slate-400 font-mono">Original: 5.2 MB</div>
                <div class="text-slate-500">➜</div>
                <div class="font-bold text-white font-mono text-sm text-emerald-400">1.1 MB (Ready)</div>
              </div>
            </div>

            <!-- Presets -->
            <div class="space-y-2">
              <div class="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/60 flex items-center justify-between">
                <div>
                  <div class="text-xs font-bold text-white">Recommended (Balanced)</div>
                  <div class="text-[10px] text-slate-400">Preserves crisp text and 150 DPI photos</div>
                </div>
                <span class="text-cyan-400 text-xs font-bold">Selected</span>
              </div>
              <div class="p-3 rounded-xl bg-slate-950/50 border border-slate-800 flex items-center justify-between opacity-70">
                <div>
                  <div class="text-xs font-bold text-slate-300">Maximum Savings (Email Ready)</div>
                  <div class="text-[10px] text-slate-500">Aggressive compression for attachments</div>
                </div>
              </div>
            </div>

            <button class="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-xs rounded-xl shadow-lg">
              Download Compressed Document
            </button>
          </div>

          <!-- Password Protection Card -->
          <div class="w-[460px] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 space-y-4">
            <div class="flex items-center justify-between border-b border-slate-800 pb-3">
              <div class="flex items-center space-x-2 text-white font-bold text-sm">
                <span class="text-cyan-400">🔒</span>
                <span>Military-Grade AES-256 Password</span>
              </div>
              <span class="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold text-[10px]">Air-Gapped</span>
            </div>

            <p class="text-xs text-slate-300">
              Lock your sensitive tax returns, confidential legal briefs, and health records with unbreakable encryption.
            </p>

            <div class="space-y-3">
              <div>
                <label class="text-[10px] font-bold text-slate-400 uppercase">Set Password</label>
                <div class="h-9 bg-slate-950 border border-slate-800 rounded-lg px-3 flex items-center text-xs text-slate-300 mt-1 font-mono">
                  ••••••••••••••••••••
                </div>
              </div>

              <div class="space-y-1.5 pt-1">
                <div class="flex items-center space-x-2 text-xs text-slate-300">
                  <span class="text-cyan-400 font-bold">✓</span>
                  <span>Prevent Unauthorized Printing</span>
                </div>
                <div class="flex items-center space-x-2 text-xs text-slate-300">
                  <span class="text-cyan-400 font-bold">✓</span>
                  <span>Prevent Text & Image Copying</span>
                </div>
                <div class="flex items-center space-x-2 text-xs text-slate-300">
                  <span class="text-cyan-400 font-bold">✓</span>
                  <span>AES-256 Bit Native Encryption</span>
                </div>
              </div>

              <button class="w-full py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold text-xs rounded-xl shadow-lg mt-2">
                Apply Password Protection
              </button>
            </div>
          </div>
        </div>
      </div>
    `
  },
  {
    id: '05_split_arrange_merge',
    filename: 'screenshot5_split_arrange_1280x800.png',
    tag: 'MULTI-FILE COMBINER & PAGE ORGANIZER',
    tagColor: 'text-purple-400 bg-purple-950/80 border-purple-500/40',
    title: 'Combine Multiple PDFs & Arrange Pages',
    subtitle: 'Drag & Drop Multiple Files • Reorder & Rotate Pages • Instant Merge in Seconds',
    renderContent: () => `
      <div class="w-full bg-slate-900/90 rounded-2xl border border-slate-700/80 shadow-2xl overflow-hidden flex flex-col">
        <!-- Window Bar -->
        <div class="h-10 bg-slate-950 px-4 flex items-center justify-between border-b border-slate-800">
          <div class="flex items-center space-x-2">
            <span class="w-3 h-3 rounded-full bg-rose-500/80"></span>
            <span class="w-3 h-3 rounded-full bg-amber-500/80"></span>
            <span class="w-3 h-3 rounded-full bg-emerald-500/80"></span>
          </div>
          <div class="text-xs font-bold text-purple-400 flex items-center space-x-1.5">
            <span>📑</span>
            <span>Combine / Merge PDF Files</span>
          </div>
          <span class="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[10px] font-bold">3 FILES SELECTED</span>
        </div>

        <!-- Main Body -->
        <div class="h-[484px] bg-slate-950 flex p-8 gap-8 items-center justify-center">
          <!-- Combine / Merge List -->
          <div class="w-[580px] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 space-y-4">
            <div class="flex items-center justify-between border-b border-slate-800 pb-3">
              <div class="flex items-center space-x-2">
                <span class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-bold rounded-xl border border-slate-700 flex items-center space-x-1">
                  <span>+</span>
                  <span>Add PDF Files</span>
                </span>
              </div>
              <span class="text-xs font-mono text-slate-400">3 Files (14 Total Pages)</span>
            </div>

            <!-- File Item 1 -->
            <div class="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
              <div class="flex items-center space-x-3">
                <span class="w-6 h-6 rounded-full bg-cyan-950 text-cyan-400 font-bold text-xs flex items-center justify-center border border-cyan-800">1</span>
                <div>
                  <div class="text-xs font-bold text-white">Cover_Letter_Signed.pdf</div>
                  <div class="text-[10px] text-slate-400 font-mono">1 page • 142 KB</div>
                </div>
              </div>
              <div class="flex items-center space-x-1 text-slate-400 text-xs font-mono">
                <span class="p-1 hover:text-white cursor-pointer">▲</span>
                <span class="p-1 hover:text-white cursor-pointer">▼</span>
                <span class="p-1 text-rose-400 hover:text-rose-300 cursor-pointer">✕</span>
              </div>
            </div>

            <!-- File Item 2 -->
            <div class="p-3 bg-slate-950 border border-cyan-500/40 rounded-xl flex items-center justify-between shadow-lg">
              <div class="flex items-center space-x-3">
                <span class="w-6 h-6 rounded-full bg-cyan-600 text-white font-bold text-xs flex items-center justify-center">2</span>
                <div>
                  <div class="text-xs font-bold text-white">Executive_Report_2026.pdf</div>
                  <div class="text-[10px] text-cyan-400 font-mono">10 pages • 3.2 MB</div>
                </div>
              </div>
              <div class="flex items-center space-x-1 text-slate-400 text-xs font-mono">
                <span class="p-1 hover:text-white cursor-pointer">▲</span>
                <span class="p-1 hover:text-white cursor-pointer">▼</span>
                <span class="p-1 text-rose-400 hover:text-rose-300 cursor-pointer">✕</span>
              </div>
            </div>

            <!-- File Item 3 -->
            <div class="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
              <div class="flex items-center space-x-3">
                <span class="w-6 h-6 rounded-full bg-cyan-950 text-cyan-400 font-bold text-xs flex items-center justify-center border border-cyan-800">3</span>
                <div>
                  <div class="text-xs font-bold text-white">Financial_Appendix.pdf</div>
                  <div class="text-[10px] text-slate-400 font-mono">3 pages • 820 KB</div>
                </div>
              </div>
              <div class="flex items-center space-x-1 text-slate-400 text-xs font-mono">
                <span class="p-1 hover:text-white cursor-pointer">▲</span>
                <span class="p-1 hover:text-white cursor-pointer">▼</span>
                <span class="p-1 text-rose-400 hover:text-rose-300 cursor-pointer">✕</span>
              </div>
            </div>

            <button class="w-full py-2.5 bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-bold text-xs rounded-xl shadow-lg flex items-center justify-center space-x-2">
              <span>📑</span>
              <span>Combine & Open Unified Document</span>
            </button>
          </div>

          <!-- Feature Highlight Box -->
          <div class="w-[380px] space-y-4">
            <div class="p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl space-y-3">
              <div class="text-sm font-bold text-white flex items-center space-x-2">
                <span>🔄</span>
                <span>Full Page Organizer</span>
              </div>
              <p class="text-xs text-slate-300 leading-relaxed">
                Rearrange page sequences, rotate landscape scans 90°, delete unwanted pages, or extract specific pages into brand new PDF files.
              </p>
              <div class="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <div class="flex items-center space-x-2 text-xs font-bold text-cyan-400">
                  <span>✓</span>
                  <span>Instant drag-and-drop reordering</span>
                </div>
                <div class="flex items-center space-x-2 text-xs font-bold text-cyan-400">
                  <span>✓</span>
                  <span>Rotate single or all pages 90° / 180°</span>
                </div>
                <div class="flex items-center space-x-2 text-xs font-bold text-cyan-400">
                  <span>✓</span>
                  <span>Extract custom page ranges (e.g. 1-3, 5)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `
  }
];

async function generateScreenshots() {
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 1
  });

  for (let i = 0; i < screens.length; i++) {
    const s = screens[i];
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
        <style>
          body {
            font-family: 'Plus Jakarta Sans', sans-serif;
            margin: 0;
            padding: 0;
            width: 1280px;
            height: 800px;
            background: radial-gradient(circle at 50% 0%, #0f172a 0%, #020617 100%);
            overflow: hidden;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            color: #f8fafc;
            box-sizing: border-box;
          }
        </style>
      </head>
      <body class="p-10 select-none">
        <!-- Top Marketing Headline Banner -->
        <div class="flex items-center justify-between mb-4">
          <div class="space-y-1">
            <div class="flex items-center space-x-3">
              <span class="px-3 py-1 rounded-full border text-[11px] font-extrabold uppercase tracking-widest ${s.tagColor}">
                ${s.tag}
              </span>
              <span class="text-xs text-slate-400 font-mono">Chrome Web Store Official Verified</span>
            </div>
            <h1 class="text-2xl font-black text-white tracking-tight">
              ${s.title}
            </h1>
            <p class="text-xs text-slate-300 font-medium">
              ${s.subtitle}
            </p>
          </div>
          <!-- ISA Secured PDF Shield Branding -->
          <div class="flex items-center space-x-3 bg-slate-900/80 border border-slate-700/80 px-4 py-2 rounded-2xl shadow-xl">
            <div class="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 text-lg">🛡️</div>
            <div>
              <div class="text-xs font-black text-white tracking-tight">ISA Secured PDF</div>
              <div class="text-[9px] text-cyan-400 font-mono">100% Client-Side</div>
            </div>
          </div>
        </div>

        <!-- Rendered Workspace & Feature Card -->
        <div class="flex-1 flex items-center justify-center">
          ${s.renderContent()}
        </div>
      </body>
      </html>
    `;

    await page.setContent(html, { waitUntil: 'networkidle' });
    const targetPath = path.join(OUTPUT_DIR, s.filename);
    await page.screenshot({ path: targetPath, type: 'png' });
    console.log(`[Generated] ${s.filename} -> ${targetPath}`);
  }

  await browser.close();
  console.log('All 5 Chrome Web Store screenshots generated successfully!');
}

generateScreenshots().catch(err => {
  console.error('Error generating screenshots:', err);
  process.exit(1);
});
