import React, { useState } from 'react';
import { X, BookOpen, ShieldCheck, Download, CheckCircle2, Lock, Zap, Sparkles, FileText, Edit3, PenTool, Scissors, Award, Layers, FileType } from 'lucide-react';

interface UserGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCheckout?: () => void;
}

export const UserGuideModal: React.FC<UserGuideModalProps> = ({
  isOpen,
  onClose,
  onOpenCheckout,
}) => {
  const [activeTab, setActiveTab] = useState<'quickstart' | 'security' | 'subscription'>('quickstart');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[85vh]">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl -z-10" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-2xl shadow-lg shadow-cyan-500/20">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-white">User Guide & Security Whitepaper</h3>
              <p className="text-xs text-slate-400">Complete workflow guide, security compliance & subscription setup</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center space-x-2 my-4 bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800 text-xs font-semibold overflow-x-auto">
          <button
            onClick={() => setActiveTab('quickstart')}
            className={`flex-1 min-w-[120px] py-2 px-3 rounded-xl transition flex items-center justify-center space-x-1.5 ${
              activeTab === 'quickstart'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>1-Min Quickstart</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`flex-1 min-w-[140px] py-2 px-3 rounded-xl transition flex items-center justify-center space-x-1.5 ${
              activeTab === 'security'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Security Specs</span>
          </button>

          <button
            onClick={() => setActiveTab('subscription')}
            className={`flex-1 min-w-[140px] py-2 px-3 rounded-xl transition flex items-center justify-center space-x-1.5 ${
              activeTab === 'subscription'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Subscriptions & Apps</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto pr-2 space-y-4 text-xs text-slate-300 leading-relaxed scrollbar-none">
          {activeTab === 'quickstart' && (
            <div className="space-y-4">
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
                <div className="flex items-center space-x-2 text-cyan-400 font-bold text-sm mb-2">
                  <Edit3 className="w-4 h-4" />
                  <span>1. Text Redaction & Straight Line Highlighter</span>
                </div>
                <p className="text-slate-400">
                  Select <strong className="text-white">Text Tool</strong> to click and edit existing text. Use <strong className="text-white">Straight Line Highlight 📏</strong> to draw horizontal line-locked highlights across text without wobbling.
                </p>
              </div>

              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
                <div className="flex items-center space-x-2 text-emerald-400 font-bold text-sm mb-2">
                  <PenTool className="w-4 h-4" />
                  <span>2. Digital Signatures & Dynamic Stamps</span>
                </div>
                <p className="text-slate-400">
                  Draw or type your signature and place it anywhere. Click <strong className="text-white">Stamp Tool</strong> to drop APPROVED, CONFIDENTIAL, or custom image seals with one tap.
                </p>
              </div>

              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
                <div className="flex items-center space-x-2 text-purple-400 font-bold text-sm mb-2">
                  <Scissors className="w-4 h-4" />
                  <span>3. Page Manager, Split & Merge PDFs</span>
                </div>
                <p className="text-slate-400">
                  Open <strong className="text-white">Pages</strong> to reorder, rotate, or delete individual pages. Use <strong className="text-white">Merge PDFs</strong> to combine multiple documents into one.
                </p>
              </div>

              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
                <div className="flex items-center space-x-2 text-amber-400 font-bold text-sm mb-2">
                  <FileType className="w-4 h-4" />
                  <span>4. Multi-Format Converter & Downloads</span>
                </div>
                <p className="text-slate-400">
                  Export your modified PDF or convert it directly into Word (.docx), Excel (.xlsx), Text (.txt), or High-DPI Images (.jpg/.png).
                </p>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-4">
              <div className="bg-slate-950/80 p-4 rounded-2xl border border-emerald-500/30">
                <div className="flex items-center space-x-2 text-emerald-400 font-bold text-sm mb-2">
                  <Lock className="w-4 h-4" />
                  <span>100% Client-Side Air-Gapped Security Architecture</span>
                </div>
                <p className="text-slate-300">
                  Unlike traditional cloud PDF tools that upload sensitive financial, legal, or medical documents to remote servers, PDF Engine Studio executes 100% of PDF parsing, rendering, text editing, and signing <strong className="text-white">inside your browser memory or device RAM</strong>.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 flex items-start space-x-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block text-xs">HIPAA & GDPR Compliant</strong>
                    <span className="text-[11px] text-slate-400">Zero data processing on external cloud servers ensures total compliance.</span>
                  </div>
                </div>

                <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 flex items-start space-x-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block text-xs">Zero Server Transmission</strong>
                    <span className="text-[11px] text-slate-400">Your documents never cross a network wire or leave your physical device.</span>
                  </div>
                </div>

                <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 flex items-start space-x-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block text-xs">Offline Desktop Mode</strong>
                    <span className="text-[11px] text-slate-400">Install the native desktop app to work 100% offline without internet access.</span>
                  </div>
                </div>

                <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 flex items-start space-x-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block text-xs">Cryptographic Vector Seals</strong>
                    <span className="text-[11px] text-slate-400">Flattened signatures and stamps embed directly into PDF vector streams.</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'subscription' && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-purple-950/40 via-slate-950 to-indigo-950/40 p-4 rounded-2xl border border-purple-500/30">
                <div className="flex items-center space-x-2 text-purple-300 font-bold text-sm mb-2">
                  <Zap className="w-4 h-4 text-yellow-400" />
                  <span>Subscription Access & Unlimited Downloads</span>
                </div>
                <p className="text-slate-300">
                  When users subscribe to a monthly ($2.99/mo), annual ($29.99/yr), or lifetime VIP pass ($99.99), an encrypted license key is generated. Subscribed users enjoy unlimited PDF exports, multi-format conversions, and access to native desktop app installers (.exe / .dmg).
                </p>
              </div>

              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 flex flex-col space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-white text-sm">Download Native Desktop Installers (.zip)</h4>
                    <p className="text-xs text-slate-400">Air-gapped desktop edition for Windows & macOS (Requires Pro Recurring Subscription)</p>
                  </div>

                  <button
                    onClick={() => {
                      const isSub = localStorage.getItem('isa_pro_subscribed') === 'true' || localStorage.getItem('isa_pro_recurring') === 'true';
                      if (!isSub) {
                        onClose();
                        if (onOpenCheckout) onOpenCheckout();
                      }
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-lg border border-cyan-400/30 transition transform active:scale-95 flex items-center space-x-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Get Pro Desktop Beta</span>
                  </button>
                </div>

                {/* Direct links for active subscribers */}
                {(localStorage.getItem('isa_pro_subscribed') === 'true' || localStorage.getItem('isa_pro_recurring') === 'true') && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                    <a
                      href="/dist_packages/Isa_Secure_PDF_Suite_v1.0.0_Portable_Windows.zip"
                      download
                      className="px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-cyan-300 text-xs font-bold rounded-xl flex items-center justify-between"
                    >
                      <span>Windows (.zip)</span>
                      <Download className="w-3.5 h-3.5" />
                    </a>

                    <a
                      href="/dist_packages/Isa_Secure_PDF_Suite_v1.0.0_Portable_Mac.zip"
                      download
                      className="px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-indigo-300 text-xs font-bold rounded-xl flex items-center justify-between"
                    >
                      <span>macOS (.zip)</span>
                      <Download className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center space-x-1.5 text-cyan-400 font-medium">
            <ShieldCheck className="w-4 h-4" />
            <span>PDF Engine Studio Security Verified</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl border border-slate-700 transition"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
