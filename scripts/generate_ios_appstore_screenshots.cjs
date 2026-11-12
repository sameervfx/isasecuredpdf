const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const OUT_69 = 'C:/work/ISA_SECURE_PDF/STORE_ASSETS/Apple_AppStore/6.9_inch_1320x2868';
const OUT_67 = 'C:/work/ISA_SECURE_PDF/STORE_ASSETS/Apple_AppStore/6.7_inch_1290x2796';
const ARTIFACTS_DIR = 'C:/Users/samee/.gemini/antigravity/brain/9ad90e8b-b385-4913-8602-7b0205d5bb53';

fs.mkdirSync(OUT_69, { recursive: true });
fs.mkdirSync(OUT_67, { recursive: true });

const screens = [
  {
    id: '01_sign_contracts',
    filename: 'AppStore_01_Sign_Contracts.png',
    tag: 'DIGITAL SIGNATURES',
    tagColor: 'text-cyan-300 bg-cyan-500/20 border-cyan-400/40',
    glowColor: '#06b6d4',
    title: 'Sign Contracts on Glass',
    subtitle: 'Draw, type, or stamp your legal signature directly onto PDFs on iPhone & iPad.',
    renderMockup: () => `
      <div class="relative w-[990px] min-h-[1460px] bg-slate-900/95 border-2 border-slate-700 rounded-[52px] p-10 shadow-2xl shadow-cyan-950/70 flex flex-col justify-between space-y-7">
        <div class="flex items-center justify-between pb-6 border-b-2 border-slate-800">
          <div class="flex items-center space-x-5">
            <div class="w-20 h-20 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-4xl">📄</div>
            <div>
              <div class="text-white font-extrabold text-3xl tracking-tight">Service_Agreement_2026.pdf</div>
              <div class="text-slate-400 text-xl font-medium mt-1">Page 4 of 4 • Confidential Legal Contract</div>
            </div>
          </div>
          <span class="px-6 py-3 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-base font-black tracking-wider uppercase">READY TO SIGN</span>
        </div>

        <div class="bg-white rounded-3xl p-10 text-slate-800 space-y-7 shadow-inner relative flex-1 flex flex-col justify-between">
          <div>
            <div class="text-base font-mono font-bold text-slate-400 border-b pb-3 tracking-wider">SECTION 8.4 — EXECUTION & MUTUAL ACCEPTANCE</div>
            <p class="text-2xl leading-relaxed text-slate-700 font-medium mt-4">
              IN WITNESS WHEREOF, the parties hereto have executed this Agreement on the date set forth below. The undersigned confirms full authority to sign this binding instrument.
            </p>
          </div>

          <div class="pt-2 grid grid-cols-2 gap-8">
            <div class="border-2 border-dashed border-cyan-500 rounded-3xl p-7 bg-cyan-50/80 relative shadow-sm">
              <div class="text-base font-extrabold text-cyan-900 uppercase tracking-wider mb-2">Authorized Client Signature</div>
              <div class="text-6xl text-blue-900 py-4 font-semibold tracking-wide" style="font-family: 'Brush Script MT', cursive, Georgia, serif;">
                Harvey Specter
              </div>
              <div class="text-sm text-slate-600 border-t border-slate-300 pt-3 flex justify-between items-center font-semibold">
                <span>Date: Nov 11, 2026</span>
                <span class="text-emerald-700 font-bold bg-emerald-100 px-3 py-1 rounded-md">✓ Verified Seal</span>
              </div>
            </div>

            <div class="border-2 border-slate-200 rounded-3xl p-7 bg-slate-50 relative flex flex-col justify-between">
              <div class="text-base font-bold text-slate-500 uppercase tracking-wider">Company Representative</div>
              <div class="h-16 border-b-2 border-slate-300"></div>
              <div class="text-sm text-slate-400 font-medium">Awaiting Counter-Signature</div>
            </div>
          </div>
        </div>

        <div class="bg-slate-950 border-2 border-cyan-500/50 rounded-3xl p-8 shadow-2xl flex flex-col space-y-6">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-4 text-cyan-300 font-extrabold text-2xl">
              <span class="text-3xl">✍️</span>
              <span>Smooth Finger & Apple Pencil Signing</span>
            </div>
            <div class="flex items-center space-x-3">
              <span class="w-10 h-10 rounded-full bg-blue-600 border-2 border-white ring-2 ring-blue-500/40"></span>
              <span class="w-10 h-10 rounded-full bg-slate-900 border-2 border-slate-700"></span>
            </div>
          </div>

          <div class="h-40 bg-slate-900 rounded-2xl border border-slate-800 flex items-center justify-center relative overflow-hidden">
            <svg class="w-[450px] h-28 text-cyan-400" viewBox="0 0 200 60" fill="none" stroke="currentColor" stroke-width="4.5" stroke-linecap="round">
              <path d="M 20 40 Q 50 10 70 35 T 120 25 T 160 40 T 190 20" />
            </svg>
            <span class="absolute bottom-3 right-5 text-sm text-slate-400 font-mono font-bold">100% On-Device Vector Smoothing</span>
          </div>

          <div class="flex items-center space-x-5 pt-1">
            <button class="flex-1 py-6 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black rounded-2xl text-2xl shadow-xl shadow-cyan-500/30 flex items-center justify-center space-x-3">
              <span>✓ Apply Signature & Share</span>
            </button>
            <button class="px-10 py-6 bg-slate-800 text-slate-300 font-bold rounded-2xl text-2xl">
              Clear
            </button>
          </div>
        </div>
      </div>
    `
  },
  {
    id: '02_smart_scanner_cleanup',
    filename: 'AppStore_02_Smart_Camera_Scanner.png',
    tag: 'SMART DOCUMENT SCANNER',
    tagColor: 'text-amber-300 bg-amber-500/20 border-amber-400/40',
    glowColor: '#f59e0b',
    title: 'Scan & Remove Shadows',
    subtitle: 'Auto-crop pages, flatten curves, erase shadows & fingers cleanly on-device.',
    renderMockup: () => `
      <div class="relative w-[990px] min-h-[1460px] bg-slate-900/95 border-2 border-slate-700 rounded-[52px] p-10 shadow-2xl shadow-amber-950/70 flex flex-col justify-between space-y-7">
        <div class="relative h-[740px] bg-slate-950 rounded-3xl border-2 border-slate-800 overflow-hidden flex items-center justify-center p-10">
          <div class="relative w-[720px] h-[500px] bg-white rounded-2xl shadow-2xl transform -rotate-1 p-10 -mt-12 flex flex-col justify-between text-slate-800">
            <div class="flex justify-between border-b pb-5">
              <span class="font-black text-3xl text-slate-900">TAX INVOICE & RECEIPT</span>
              <span class="font-mono text-xl text-slate-500 font-bold">INV-2026-9041</span>
            </div>
            <div class="space-y-4 py-4 text-xl text-slate-600">
              <div class="flex justify-between font-semibold"><span>Hardware & Office Supplies</span><span>$1,480.00</span></div>
              <div class="flex justify-between font-semibold"><span>Legal Filing Services</span><span>$650.00</span></div>
              <div class="flex justify-between border-t-2 pt-4 font-black text-slate-900 text-2xl"><span>Total Paid</span><span>$2,130.00</span></div>
            </div>
            <div class="flex items-center justify-between text-sm text-emerald-700 font-bold bg-emerald-50 px-4 py-2 rounded-lg">
              <span>✓ Uneven Lighting & Shadows Removed</span>
              <span>On-Device Cleanup</span>
            </div>
          </div>

          <div class="absolute inset-8 border-2 border-amber-400/80 rounded-3xl pointer-events-none shadow-2xl shadow-amber-500/30 flex flex-col justify-between p-5">
            <div class="flex justify-between">
              <div class="w-14 h-14 border-t-8 border-l-8 border-amber-400 rounded-tl-xl"></div>
              <div class="w-14 h-14 border-t-8 border-r-8 border-amber-400 rounded-tr-xl"></div>
            </div>
            <div class="flex-1"></div>
            <div class="flex justify-between items-end">
              <div class="w-14 h-14 border-b-8 border-l-8 border-amber-400 rounded-bl-xl"></div>
              <div class="bg-slate-900/95 border-2 border-amber-400 px-7 py-3 rounded-full text-base font-black text-amber-300 shadow-2xl flex items-center space-x-3 mb-1">
                <span class="w-3 h-3 rounded-full bg-amber-400"></span>
                <span>SMART PERSPECTIVE & SHADOW CLEANUP</span>
              </div>
              <div class="w-14 h-14 border-b-8 border-r-8 border-amber-400 rounded-br-xl"></div>
            </div>
          </div>
        </div>

        <div class="bg-slate-950 border border-slate-800 rounded-3xl p-6 space-y-4">
          <div class="text-sm font-black tracking-widest uppercase text-amber-400">Smart Document Cleanup</div>
          <div class="grid grid-cols-2 gap-4">
            <button class="py-5 bg-amber-500 text-slate-950 font-black rounded-2xl text-xl shadow-xl flex items-center justify-center space-x-2">
              <span>☀️ Remove Shadow</span>
            </button>
            <button class="py-5 bg-slate-800 border border-cyan-500/40 text-cyan-300 font-black rounded-2xl text-xl flex items-center justify-center space-x-2">
              <span>👆 Finger Removal</span>
            </button>
          </div>
          <div class="grid grid-cols-4 gap-4 pt-1">
            <button class="py-4 bg-slate-800 border border-amber-500/40 text-amber-300 font-black rounded-xl text-base">✨ Auto Magic</button>
            <button class="py-4 bg-slate-800 text-slate-200 font-bold rounded-xl text-base">📄 Crisp B&W</button>
            <button class="py-4 bg-slate-800 text-slate-200 font-bold rounded-xl text-base">🎨 Color Boost</button>
            <button class="py-4 bg-slate-800 text-slate-200 font-bold rounded-xl text-base">📷 Original</button>
          </div>
        </div>

        <div class="flex items-center justify-between pt-1">
          <div class="text-lg text-slate-300 font-mono font-bold">3 Pages Scanned • Zero Cloud Upload</div>
          <button class="px-10 py-6 bg-gradient-to-r from-amber-500 to-rose-500 text-white font-black text-2xl rounded-2xl shadow-2xl shadow-amber-500/30">
            ✓ Export Clean PDF
          </button>
        </div>
      </div>
    `
  },
  {
    id: '03_edit_files',
    filename: 'AppStore_03_Edit_Text_AcroForms.png',
    tag: 'FULL PDF EDITOR',
    tagColor: 'text-blue-300 bg-blue-500/20 border-blue-400/40',
    glowColor: '#3b82f6',
    title: 'Edit Text & Fill Forms',
    subtitle: 'Tap existing text to modify, fill interactive AcroForms, highlight, & redact numbers.',
    renderMockup: () => `
      <div class="relative w-[990px] min-h-[1460px] bg-slate-900/95 border-2 border-slate-700 rounded-[52px] p-10 shadow-2xl shadow-blue-950/70 flex flex-col justify-between space-y-7">
        <div class="bg-slate-950 border-2 border-blue-500/50 rounded-3xl p-5 flex items-center justify-between shadow-xl">
          <div class="flex items-center space-x-3">
            <button class="px-6 py-4 bg-blue-600 text-white rounded-2xl text-lg font-black shadow-lg">✏️ Edit Text</button>
            <button class="px-5 py-4 bg-slate-800 text-slate-200 rounded-2xl text-lg font-bold">🖊️ Draw</button>
            <button class="px-5 py-4 bg-yellow-500/20 border border-yellow-500/50 text-yellow-300 rounded-2xl text-lg font-black">🖍️ Highlight</button>
            <button class="px-5 py-4 bg-slate-800 text-slate-200 rounded-2xl text-lg font-bold">⬛ Redact</button>
            <button class="px-5 py-4 bg-slate-800 text-slate-200 rounded-2xl text-lg font-bold">🖼️ Image</button>
          </div>
          <div class="text-lg text-blue-400 font-extrabold font-mono px-3">100%</div>
        </div>

        <div class="bg-white rounded-3xl p-10 text-slate-800 space-y-7 shadow-inner relative flex-1 flex flex-col justify-between">
          <div>
            <div class="flex justify-between items-start border-b pb-5">
              <div>
                <h2 class="text-3xl font-black text-slate-900 tracking-tight">COMMERCIAL LEASE CONTRACT</h2>
                <div class="text-base text-slate-500 mt-1 font-medium">Agreement Reference #US-8849-B</div>
              </div>
              <span class="px-5 py-2 bg-blue-100 text-blue-800 font-extrabold rounded-xl text-base">LIVE EDITING</span>
            </div>

            <div class="p-5 bg-yellow-100 border-l-4 border-yellow-500 rounded-r-2xl text-xl text-slate-800 font-medium leading-relaxed mt-5">
              <span class="font-bold text-yellow-900">Term Duration:</span> This tenancy shall commence on November 1, 2026 and continue on a month-to-month basis unless terminated with 30-day notice.
            </div>

            <div class="border-2 border-blue-500 rounded-2xl p-6 bg-blue-50/80 relative shadow-md mt-6">
              <div class="absolute -top-4 left-5 bg-blue-600 text-white text-xs font-black px-3 py-1 rounded-md tracking-wider">
                EDITING PDF TEXT INLINE
              </div>
              <div class="text-2xl font-bold text-slate-900 flex items-center">
                <span>Monthly Base Rent: $4,250.00 USD</span>
                <span class="w-1.5 h-7 bg-blue-600 ml-2"></span>
              </div>
              <div class="text-sm text-blue-700 font-medium mt-2">Font: Helvetica Neue • Size: 16pt • TrueType Native Vector</div>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-6 pt-3">
            <div class="p-5 border border-slate-200 rounded-2xl bg-slate-50 flex items-center space-x-4">
              <input type="checkbox" checked class="w-7 h-7 text-blue-600 rounded">
              <span class="text-lg font-bold text-slate-800">Commercial Tenant Insurance Included</span>
            </div>
            <div class="p-5 border border-slate-200 rounded-2xl bg-slate-50 flex items-center space-x-4">
              <input type="checkbox" checked class="w-7 h-7 text-blue-600 rounded">
              <span class="text-lg font-bold text-slate-800">Utilities Paid Separately</span>
            </div>
          </div>
        </div>

        <div class="flex items-center justify-between pt-2">
          <div class="flex items-center space-x-3 text-lg text-slate-300 font-medium">
            <span class="w-3.5 h-3.5 rounded-full bg-emerald-400"></span>
            <span>All edits saved locally</span>
          </div>
          <button class="px-10 py-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-2xl rounded-2xl shadow-xl shadow-blue-500/30">
            Export Edited PDF →
          </button>
        </div>
      </div>
    `
  },
  {
    id: '04_compress_pdf',
    filename: 'AppStore_04_Compress_PDF.png',
    tag: 'SMART COMPRESSION',
    tagColor: 'text-emerald-300 bg-emerald-500/20 border-emerald-400/40',
    glowColor: '#10b981',
    title: 'Shrink PDF Size Up To 90%',
    subtitle: 'Compress large PDFs for instant AirDrop, Mail, & Messages sharing with sharp text.',
    renderMockup: () => `
      <div class="relative w-[990px] min-h-[1460px] bg-slate-900/95 border-2 border-slate-700 rounded-[52px] p-10 shadow-2xl shadow-emerald-950/70 flex flex-col justify-between space-y-7">
        <div class="flex items-center justify-between pb-6 border-b-2 border-slate-800">
          <div class="flex items-center space-x-5">
            <div class="w-20 h-20 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-4xl">⚡</div>
            <div>
              <div class="text-white font-extrabold text-3xl tracking-tight">Annual_Report_2026.pdf</div>
              <div class="text-slate-400 text-xl font-medium mt-1">On-Device Lossless Streamline Engine</div>
            </div>
          </div>
          <span class="px-6 py-3 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-base font-black tracking-wider uppercase">-89% SAVED</span>
        </div>

        <div class="grid grid-cols-2 gap-8 my-auto">
          <div class="bg-slate-950 border border-rose-500/40 rounded-3xl p-9 flex flex-col items-center text-center space-y-4">
            <span class="text-base font-black text-rose-400 uppercase tracking-widest">Original File Size</span>
            <div class="text-7xl font-black text-rose-300 tracking-tight">28.4 MB</div>
            <div class="text-lg text-slate-400 font-semibold pt-2">
              ⚠️ Too large for Mail attachment
            </div>
          </div>

          <div class="bg-gradient-to-b from-emerald-950/60 to-slate-950 border-2 border-emerald-500 rounded-3xl p-9 flex flex-col items-center text-center space-y-4 shadow-xl shadow-emerald-500/20">
            <span class="text-base font-black text-emerald-400 uppercase tracking-widest">Optimized File Size</span>
            <div class="text-7xl font-black text-emerald-300 tracking-tight">2.8 MB</div>
            <div class="text-lg text-emerald-300 font-bold pt-2">
              ✓ Instant AirDrop & Mail Ready
            </div>
          </div>
        </div>

        <div class="bg-slate-950 border border-slate-800 rounded-3xl p-8 space-y-6">
          <div class="flex justify-between items-center">
            <span class="text-slate-200 text-2xl font-bold">Compression Preset:</span>
            <span class="text-emerald-300 text-lg font-extrabold px-5 py-2 bg-emerald-500/20 rounded-xl border border-emerald-500/30">Recommended (Crisp Text)</span>
          </div>
          <div class="w-full bg-slate-800 h-5 rounded-full overflow-hidden flex">
            <div class="bg-gradient-to-r from-emerald-500 to-teal-400 h-full w-[89%] rounded-full shadow-lg"></div>
          </div>
          <div class="flex justify-between text-lg text-slate-400 font-semibold">
            <span>Fast (Low)</span>
            <span class="text-emerald-300 font-black text-xl">Balanced (-89%)</span>
            <span>Maximum Crunch</span>
          </div>
        </div>

        <div class="grid grid-cols-3 gap-5 text-center">
          <div class="bg-slate-950 p-6 rounded-2xl border border-slate-800">
            <div class="text-base text-slate-400 font-medium">Text Quality</div>
            <div class="text-2xl font-black text-white mt-1">100% Vector</div>
          </div>
          <div class="bg-slate-950 p-6 rounded-2xl border border-slate-800">
            <div class="text-base text-slate-400 font-medium">Speed</div>
            <div class="text-2xl font-black text-emerald-400 mt-1">0.8 Seconds</div>
          </div>
          <div class="bg-slate-950 p-6 rounded-2xl border border-slate-800">
            <div class="text-base text-slate-400 font-medium">Server Upload</div>
            <div class="text-2xl font-black text-cyan-400 mt-1">0 KB (Local)</div>
          </div>
        </div>

        <button class="w-full py-7 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white font-black text-3xl rounded-2xl shadow-2xl shadow-emerald-500/30">
          ⚡ Compress & Share PDF Now
        </button>
      </div>
    `
  },
  {
    id: '05_merge_convert',
    filename: 'AppStore_05_Merge_Split_Convert.png',
    tag: 'ORGANIZE & CONVERT',
    tagColor: 'text-indigo-300 bg-indigo-500/20 border-indigo-400/40',
    glowColor: '#6366f1',
    title: 'Merge, Split & Convert',
    subtitle: 'Reorder pages, merge files, or convert PDF to Word (.docx), Excel & PowerPoint locally.',
    renderMockup: () => `
      <div class="relative w-[990px] min-h-[1460px] bg-slate-900/95 border-2 border-slate-700 rounded-[52px] p-10 shadow-2xl shadow-indigo-950/70 flex flex-col justify-between space-y-7">
        <div class="flex items-center justify-between pb-5 border-b-2 border-slate-800">
          <div class="flex items-center space-x-5">
            <span class="text-4xl">📑</span>
            <div>
              <div class="text-white font-extrabold text-3xl">Visual Page Organizer & Export</div>
              <div class="text-slate-400 text-lg font-medium mt-1">Drag thumbnails to rearrange, split, or export</div>
            </div>
          </div>
          <div class="flex space-x-3">
            <button class="px-6 py-3 bg-indigo-600 text-white rounded-xl text-base font-black">+ Merge PDF</button>
            <button class="px-5 py-3 bg-slate-800 text-slate-200 rounded-xl text-base font-bold">Rotate 90°</button>
          </div>
        </div>

        <div class="grid grid-cols-3 gap-6 my-auto">
          <div class="bg-white rounded-2xl p-6 shadow flex flex-col justify-between h-60">
            <span class="text-sm font-black text-slate-400">PAGE 1</span>
            <div class="space-y-3 my-auto">
              <div class="h-3.5 w-3/4 bg-slate-200 rounded"></div>
              <div class="h-3.5 w-full bg-slate-100 rounded"></div>
              <div class="h-3.5 w-1/2 bg-slate-100 rounded"></div>
            </div>
            <div class="text-sm text-slate-400 font-bold text-right">Cover</div>
          </div>

          <div class="bg-indigo-50 rounded-2xl p-6 shadow-2xl border-4 border-indigo-500 flex flex-col justify-between h-60 transform -translate-y-2 ring-4 ring-indigo-500/30">
            <div class="flex justify-between items-center">
              <span class="text-sm font-black text-indigo-700">PAGE 2</span>
              <span class="text-xs bg-indigo-600 text-white px-2.5 py-1 rounded-md font-black">MOVING</span>
            </div>
            <div class="space-y-3 my-auto">
              <div class="h-3.5 w-5/6 bg-indigo-300 rounded"></div>
              <div class="h-3.5 w-full bg-indigo-200 rounded"></div>
              <div class="h-3.5 w-2/3 bg-indigo-200 rounded"></div>
            </div>
            <div class="text-sm text-indigo-700 font-black text-right">Executive Summary</div>
          </div>

          <div class="bg-white rounded-2xl p-6 shadow flex flex-col justify-between h-60">
            <span class="text-sm font-black text-slate-400">PAGE 3</span>
            <div class="space-y-3 my-auto">
              <div class="h-3.5 w-4/5 bg-slate-200 rounded"></div>
              <div class="h-3.5 w-full bg-slate-100 rounded"></div>
            </div>
            <div class="text-sm text-slate-400 font-bold text-right">Financials</div>
          </div>

          <div class="bg-white rounded-2xl p-6 shadow flex flex-col justify-between h-60">
            <span class="text-sm font-black text-slate-400">PAGE 4</span>
            <div class="space-y-3 my-auto">
              <div class="h-3.5 w-full bg-slate-200 rounded"></div>
              <div class="h-3.5 w-3/4 bg-slate-100 rounded"></div>
            </div>
            <div class="text-sm text-slate-400 font-bold text-right">Terms</div>
          </div>

          <div class="bg-white rounded-2xl p-6 shadow flex flex-col justify-between h-60">
            <span class="text-sm font-black text-slate-400">PAGE 5</span>
            <div class="space-y-3 my-auto">
              <div class="h-3.5 w-2/3 bg-slate-200 rounded"></div>
              <div class="h-3.5 w-full bg-slate-100 rounded"></div>
            </div>
            <div class="text-sm text-slate-400 font-bold text-right">Signatures</div>
          </div>

          <div class="bg-white rounded-2xl p-6 shadow flex flex-col justify-between h-60">
            <span class="text-sm font-black text-slate-400">PAGE 6</span>
            <div class="space-y-3 my-auto">
              <div class="h-3.5 w-full bg-slate-200 rounded"></div>
              <div class="h-3.5 w-1/2 bg-slate-100 rounded"></div>
            </div>
            <div class="text-sm text-slate-400 font-bold text-right">Appendix</div>
          </div>
        </div>

        <div class="grid grid-cols-3 gap-4 bg-slate-950 p-6 rounded-3xl border border-slate-800">
          <div class="p-4 rounded-2xl bg-blue-500/15 border border-blue-500/40 text-center">
            <div class="text-2xl font-black text-blue-300">W .DOCX</div>
            <div class="text-sm text-slate-400 mt-1 font-semibold">Word Document</div>
          </div>
          <div class="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-center">
            <div class="text-2xl font-black text-emerald-300">X .XLSX</div>
            <div class="text-sm text-slate-400 mt-1 font-semibold">Excel Sheet</div>
          </div>
          <div class="p-4 rounded-2xl bg-orange-500/15 border border-orange-500/40 text-center">
            <div class="text-2xl font-black text-orange-300">P .PPTX</div>
            <div class="text-sm text-slate-400 mt-1 font-semibold">PowerPoint Slides</div>
          </div>
        </div>

        <button class="w-full py-7 bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 text-white font-black text-3xl rounded-2xl shadow-2xl shadow-indigo-500/30">
          Save & Export Master Document
        </button>
      </div>
    `
  },
  {
    id: '06_airgapped_privacy',
    filename: 'AppStore_06_OnDevice_Privacy.png',
    tag: 'ZERO-CLOUD PRIVACY',
    tagColor: 'text-cyan-300 bg-cyan-500/20 border-cyan-400/40',
    glowColor: '#06b6d4',
    title: '100% On-Device & Offline',
    subtitle: 'Zero server uploads. Your private files, IDs, & passwords never leave your iPhone.',
    renderMockup: () => `
      <div class="relative w-[990px] min-h-[1460px] bg-slate-900/95 border-2 border-slate-700 rounded-[52px] p-10 shadow-2xl shadow-cyan-950/70 flex flex-col justify-between space-y-7">
        <div class="flex items-center space-x-6 pb-6 border-b-2 border-slate-800">
          <div class="w-24 h-24 rounded-3xl bg-gradient-to-tr from-cyan-500 to-blue-600 p-0.5 shadow-2xl">
            <div class="w-full h-full bg-slate-950 rounded-[22px] flex items-center justify-center text-5xl">
              🛡️
            </div>
          </div>
          <div>
            <div class="text-white font-black text-4xl">Air-Gapped Local Engine</div>
            <div class="text-cyan-400 text-xl font-bold mt-1">100% Offline Cryptographic Enclave</div>
          </div>
        </div>

        <div class="space-y-5 my-auto">
          <div class="flex items-center justify-between p-6 rounded-2xl bg-slate-950 border border-slate-800">
            <div class="flex items-center space-x-5">
              <span class="text-emerald-400 text-3xl font-black">✓</span>
              <span class="text-white font-bold text-2xl">Cloud File Uploads</span>
            </div>
            <span class="px-5 py-2.5 bg-emerald-500/10 border border-emerald-500/40 text-emerald-300 font-mono text-lg font-black rounded-xl">0 KB (Never Uploaded)</span>
          </div>

          <div class="flex items-center justify-between p-6 rounded-2xl bg-slate-950 border border-slate-800">
            <div class="flex items-center space-x-5">
              <span class="text-emerald-400 text-3xl font-black">✓</span>
              <span class="text-white font-bold text-2xl">Local Processing Core</span>
            </div>
            <span class="px-5 py-2.5 bg-cyan-500/10 border border-cyan-500/40 text-cyan-300 font-mono text-lg font-black rounded-xl">100% On-Device</span>
          </div>

          <div class="flex items-center justify-between p-6 rounded-2xl bg-slate-950 border border-slate-800">
            <div class="flex items-center space-x-5">
              <span class="text-emerald-400 text-3xl font-black">✓</span>
              <span class="text-white font-bold text-2xl">PDF Password Encryption</span>
            </div>
            <span class="px-5 py-2.5 bg-blue-500/10 border border-blue-500/40 text-blue-300 font-mono text-lg font-black rounded-xl">AES-256 Bit Lock</span>
          </div>

          <div class="flex items-center justify-between p-6 rounded-2xl bg-slate-950 border border-slate-800">
            <div class="flex items-center space-x-5">
              <span class="text-emerald-400 text-3xl font-black">✓</span>
              <span class="text-white font-bold text-2xl">Account or Sign-Up</span>
            </div>
            <span class="px-5 py-2.5 bg-purple-500/10 border border-purple-500/40 text-purple-300 font-mono text-lg font-black rounded-xl">Not Required</span>
          </div>
        </div>

        <div class="p-6 bg-slate-950 rounded-2xl border border-cyan-500/40 flex items-center justify-between">
          <div class="flex items-center space-x-4">
            <span class="w-5 h-5 rounded-full bg-emerald-400"></span>
            <span class="text-xl font-bold text-white">Works Completely Offline Anywhere</span>
          </div>
          <span class="text-base text-cyan-400 font-extrabold uppercase tracking-wider">Airplane Mode Ready</span>
        </div>
      </div>
    `
  }
];

function buildFullHtml(screen, width, height) {
  const baseWidth = 1080;
  const scale = width / baseWidth;
  const baseHeight = Math.round(height / scale);
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
    html, body {
      margin: 0;
      padding: 0;
      width: ${width}px;
      height: ${height}px;
      overflow: hidden;
      background: #020617;
    }
    .canvas-root {
      font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', sans-serif;
      color: #f8fafc;
      width: ${baseWidth}px;
      height: ${baseHeight}px;
      transform: scale(${scale});
      transform-origin: top left;
      overflow: hidden;
      box-sizing: border-box;
    }
  </style>
</head>
<body>
<div class="canvas-root relative flex flex-col justify-between px-10 pt-10 pb-12 bg-gradient-to-b from-[#020617] via-[#081226] to-[#020617]">
  <div class="absolute -top-40 -left-40 w-[750px] h-[750px] rounded-full blur-[160px] opacity-30" style="background: ${screen.glowColor};"></div>
  <div class="absolute top-1/2 -right-40 w-[700px] h-[700px] rounded-full blur-[170px] opacity-25" style="background: ${screen.glowColor};"></div>

  <!-- iOS Dynamic Island Status Bar -->
  <div class="w-full flex items-center justify-between text-white px-5 pt-2 font-semibold text-2xl z-20">
    <div class="tracking-tight font-bold text-3xl w-28">9:41</div>
    <div class="w-48 h-12 bg-black rounded-full border border-slate-800/80 shadow-inner"></div>
    <div class="flex items-center justify-end space-x-3 w-36">
      <svg class="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 4C7.31 4 3.07 5.9 0 8.98L12 21 24 8.98C20.93 5.9 16.69 4 12 4zm0 3.25c3.8 0 7.23 1.54 9.72 4.03L12 19.3 2.28 11.28C4.77 8.79 8.2 7.25 12 7.25z"/>
      </svg>
      <div class="flex items-center">
        <div class="w-9 h-4.5 border-2 border-white/80 rounded-[6px] p-0.5 flex items-center">
          <div class="w-full h-full bg-white rounded-[2px]"></div>
        </div>
        <div class="w-1 h-2 bg-white/80 rounded-r-[1.5px] ml-[1px]"></div>
      </div>
    </div>
  </div>

  <!-- Headline & Subtitle Hero Block -->
  <div class="z-10 mt-10 px-2 max-w-4xl">
    <div class="inline-flex items-center space-x-3 px-5 py-2.5 rounded-full border text-base font-black tracking-widest uppercase mb-5 ${screen.tagColor}">
      <span class="w-3.5 h-3.5 rounded-full" style="background: ${screen.glowColor};"></span>
      <span>${screen.tag}</span>
    </div>
    <h1 class="text-6xl font-black text-white tracking-tight leading-none mb-4">
      ${screen.title}
    </h1>
    <p class="text-2xl text-slate-300 leading-snug font-medium">
      ${screen.subtitle}
    </p>
  </div>

  <!-- Center Feature Mockup Container -->
  <div class="z-10 my-3 mx-auto w-full flex-1 flex flex-col justify-center items-center">
    ${screen.renderMockup()}
  </div>

  <!-- Bottom App Store Branding Footer -->
  <div class="z-10 pb-2 flex items-center justify-between border-t-2 border-slate-800/80 pt-5 px-3">
    <div class="flex items-center space-x-4">
      <span class="text-3xl font-black tracking-tight text-white">ISA Secured PDF</span>
      <span class="text-sm font-black text-cyan-400 bg-cyan-500/15 px-3 py-1.5 rounded-lg border border-cyan-500/30">EDITOR & SCANNER</span>
    </div>
    <span class="text-base font-bold text-slate-400">100% On-Device Privacy • iPhone & iPad Ready</span>
  </div>
</div>
</body>
</html>
  `;
}

(async () => {
  console.log('Generating Apple App Store screenshots (6.9" 1320x2868 & 6.7" 1290x2796)...');
  const browser = await chromium.launch();

  for (const spec of [
    { label: '6.9-inch', width: 1320, height: 2868, dir: OUT_69, copyArtifacts: true },
    { label: '6.7-inch', width: 1290, height: 2796, dir: OUT_67, copyArtifacts: false }
  ]) {
    const page = await browser.newPage({ viewport: { width: spec.width, height: spec.height } });
    for (let i = 0; i < screens.length; i++) {
      const screen = screens[i];
      const html = buildFullHtml(screen, spec.width, spec.height);
      await page.setContent(html, { waitUntil: 'networkidle' });
      await page.waitForTimeout(400);

      const outPath = path.join(spec.dir, screen.filename);
      await page.screenshot({ path: outPath, type: 'png' });
      if (spec.copyArtifacts) {
        fs.copyFileSync(outPath, path.join(ARTIFACTS_DIR, screen.filename));
      }
      console.log(`[${spec.label}] Saved: ${outPath}`);
    }
    await page.close();
  }

  await browser.close();
  console.log('DONE: All 6 Apple App Store screenshots generated in 6.9" and 6.7" formats!');
})();
