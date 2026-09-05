import React, { useState } from 'react';
import { X, Smartphone, Download, Share, CheckCircle2, Monitor, ExternalLink, Sparkles, Apple } from 'lucide-react';

interface AppDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AppDownloadModal: React.FC<AppDownloadModalProps> = ({ isOpen, onClose }) => {
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  const currentWebUrl = window.location.origin;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentWebUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden text-slate-100 max-h-[90vh] overflow-y-auto">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl -z-10" />
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-2xl shadow-lg shadow-cyan-500/20">
              <Smartphone className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">Get ISASecuredPDF App</h3>
              <p className="text-xs text-slate-400">Install on iPhone, iPad, Android, or Desktop</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* OPTION 1: Install Direct Web App on iPhone (No TestFlight Needed) */}
          <div className="p-4 bg-slate-950/80 border border-cyan-500/40 rounded-2xl space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Apple className="w-5 h-5 text-cyan-400" />
                <span className="text-xs font-extrabold text-white">1. Instant iPhone / iPad Install</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                NO TESTFLIGHT NEEDED
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Open this web page on <b>Safari</b> on your iPhone, tap the <b>Share button</b> (<Share className="w-3.5 h-3.5 inline text-cyan-400" />), then tap <b>"Add to Home Screen"</b>. The app icon installs directly to your home screen!
            </p>

            <button
              onClick={handleCopyLink}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-xs rounded-xl border border-slate-700 transition flex items-center justify-center space-x-2"
            >
              {copiedLink ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400">Web App Link Copied!</span>
                </>
              ) : (
                <>
                  <Share className="w-4 h-4 text-cyan-400" />
                  <span>Copy Web App Link for iPhone</span>
                </>
              )}
            </button>
          </div>

          {/* OPTION 2: TestFlight Native iOS App Link */}
          <div className="p-4 bg-slate-950/80 border border-slate-800 hover:border-purple-500/40 rounded-2xl space-y-2.5 transition">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Apple className="w-5 h-5 text-purple-400" />
                <span className="text-xs font-extrabold text-white">2. TestFlight Native iOS App</span>
              </div>
              <span className="text-[10px] font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/30">
                TESTFLIGHT BETA
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              If you prefer the native Apple TestFlight build, open TestFlight on your iPhone and enter your redeem code or tap the beta link.
            </p>

            <a
              href="https://testflight.apple.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 bg-purple-950/60 hover:bg-purple-900/80 text-purple-200 font-bold text-xs rounded-xl border border-purple-800/80 transition flex items-center justify-center space-x-2 text-center block"
            >
              <ExternalLink className="w-4 h-4 text-purple-400" />
              <span>Open Apple TestFlight Link</span>
            </a>
          </div>

          {/* OPTION 3: Desktop Standalone Apps (.zip) */}
          <div className="p-4 bg-slate-950/80 border border-slate-800 hover:border-blue-500/40 rounded-2xl space-y-2.5 transition">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Monitor className="w-5 h-5 text-blue-400" />
                <span className="text-xs font-extrabold text-white">3. Desktop Standalone Apps</span>
              </div>
              <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/30">
                WINDOWS & MAC
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Run offline native desktop apps for Windows (.exe) and macOS (.dmg) without web browser dependencies.
            </p>

            <div className="grid grid-cols-2 gap-2">
              <a
                href="/dist_packages/Isa_Secure_PDF_Suite_v1.0.0_Portable_Windows.zip"
                download="Isa_Secure_PDF_Suite_v1.0.0_Portable_Windows.zip"
                className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition flex items-center justify-center space-x-1.5"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                <span>Windows .zip</span>
              </a>

              <a
                href="/dist_packages/Isa_Secure_PDF_Suite_v1.0.0_Portable_Mac.zip"
                download="Isa_Secure_PDF_Suite_v1.0.0_Portable_Mac.zip"
                className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition flex items-center justify-center space-x-1.5"
              >
                <Download className="w-3.5 h-3.5 text-indigo-400" />
                <span>macOS .zip</span>
              </a>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-800 text-center">
          <button
            onClick={onClose}
            className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
