import React, { useState } from 'react';
import { X, Smartphone, Download, Share, CheckCircle2, Monitor, ExternalLink, Apple, ShieldCheck, KeyRound } from 'lucide-react';

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
              <h3 className="text-base font-extrabold text-white">Get ISASecuredPDF Suite</h3>
              <p className="text-xs text-slate-400">Official Mobile & Desktop Installation</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* OPTION 1: Instant iPhone / iPad Install (No TestFlight Needed) */}
          <div className="p-4 bg-slate-950/80 border border-cyan-500/40 rounded-2xl space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Apple className="w-5 h-5 text-cyan-400" />
                <span className="text-xs font-extrabold text-white">1. Instant iPhone / iPad Install</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                RECOMMENDED • NO TESTFLIGHT
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Open this website on <b>Safari</b> on your iPhone or iPad, tap the <b>Share icon</b> (<Share className="w-3.5 h-3.5 inline text-cyan-400" />), then tap <b>"Add to Home Screen"</b>. The app installs directly onto your iOS home screen!
            </p>

            <button
              onClick={handleCopyLink}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-xs rounded-xl border border-slate-700 transition flex items-center justify-center space-x-2"
            >
              {copiedLink ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400">iPhone Link Copied!</span>
                </>
              ) : (
                <>
                  <Share className="w-4 h-4 text-cyan-400" />
                  <span>Copy Link to Open in iPhone Safari</span>
                </>
              )}
            </button>
          </div>

          {/* OPTION 2: TestFlight Native iOS App Instructions */}
          <div className="p-4 bg-slate-950/80 border border-purple-500/40 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Apple className="w-5 h-5 text-purple-400" />
                <span className="text-xs font-extrabold text-white">2. Apple TestFlight (Build 6)</span>
              </div>
              <span className="text-[10px] font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/30">
                TESTFLIGHT
              </span>
            </div>

            <div className="p-3 bg-purple-950/40 border border-purple-800/60 rounded-xl space-y-2 text-xs text-purple-200">
              <div className="flex items-center space-x-2 font-bold text-white">
                <KeyRound className="w-4 h-4 text-purple-400" />
                <span>How to redeem on "Ready to Test" screen:</span>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-300">
                If TestFlight shows <b>"Ready To Test"</b>:
                <br />
                1. Tap the blue <b>Redeem</b> button.
                <br />
                2. Enter the 8-character code sent to your email by Apple, OR sign in with <b>isasecuredpdf@gmail.com</b> in TestFlight.
              </p>
            </div>

            <a
              href="https://apps.apple.com/app/testflight/id899247664"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 bg-purple-950/60 hover:bg-purple-900/80 text-purple-200 font-bold text-xs rounded-xl border border-purple-800/80 transition flex items-center justify-center space-x-2 text-center block"
            >
              <ExternalLink className="w-4 h-4 text-purple-400" />
              <span>Open Apple TestFlight App</span>
            </a>
          </div>

          {/* OPTION 3: Standalone Desktop Installer (.exe) */}
          <div className="p-4 bg-slate-950/80 border border-blue-500/40 rounded-2xl space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Monitor className="w-5 h-5 text-blue-400" />
                <span className="text-xs font-extrabold text-white">3. Standalone Windows Desktop App</span>
              </div>
              <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/30">
                WINDOWS EXE
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Full offline standalone desktop installer for Windows 10 & 11 (100% client-side execution).
            </p>

            <a
              href="/dist_packages/ISASecuredPDF_Suite_Windows_Setup.exe"
              download="ISASecuredPDF_Suite_Windows_Setup.exe"
              className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-cyan-500/20 transition flex items-center justify-center space-x-2 text-center block"
            >
              <Download className="w-4 h-4 text-white" />
              <span>Download Windows Setup Installer (.exe)</span>
            </a>
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
