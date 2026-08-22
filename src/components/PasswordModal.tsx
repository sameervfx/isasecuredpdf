import React, { useState } from 'react';
import { X, Lock, Unlock, ShieldCheck, Printer, Copy, AlertCircle, KeyRound, Download } from 'lucide-react';
import { securityService, EncryptOptions } from '../services/securityService';

interface PasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  pdfBytes: Uint8Array | null;
  fileName: string;
  onApplyDecryptedPDF: (decryptedBytes: Uint8Array) => void;
  initialMode?: 'protect' | 'unlock';
}

export const PasswordModal: React.FC<PasswordModalProps> = ({
  isOpen,
  onClose,
  pdfBytes,
  fileName,
  onApplyDecryptedPDF,
  initialMode = 'protect',
}) => {
  const [activeTab, setActiveTab] = useState<'protect' | 'unlock'>(initialMode);
  
  // Protect tab state
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [preventPrinting, setPreventPrinting] = useState(false);
  const [preventCopying, setPreventCopying] = useState(false);

  // Unlock tab state
  const [unlockPassword, setUnlockPassword] = useState('');

  // Status state
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  if (!isOpen) return null;

  const handleProtect = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!pdfBytes) {
      setErrorMessage('No PDF document loaded.');
      return;
    }

    if (!password) {
      setErrorMessage('Please enter a password.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please check and try again.');
      return;
    }

    try {
      setIsProcessing(true);
      const encryptOpts: EncryptOptions = {
        userPassword: password,
        ownerPassword: password,
        preventPrinting,
        preventCopying,
      };

      const encryptedBytes = await securityService.encryptPDF(pdfBytes, encryptOpts);

      // Download encrypted PDF
      const blob = new Blob([new Uint8Array(encryptedBytes)], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const baseName = fileName ? fileName.replace(/\.pdf$/i, '') : 'document';
      link.download = `${baseName}_protected.pdf`;
      link.click();
      URL.revokeObjectURL(url);

      setSuccessMessage('PDF password protected and downloaded successfully!');
      setTimeout(() => {
        onClose();
        setPassword('');
        setConfirmPassword('');
        setSuccessMessage('');
      }, 1500);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to encrypt PDF.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!pdfBytes) {
      setErrorMessage('No PDF document loaded.');
      return;
    }

    if (!unlockPassword) {
      setErrorMessage('Please enter the current password.');
      return;
    }

    try {
      setIsProcessing(true);
      const decryptedBytes = await securityService.decryptPDF(pdfBytes, unlockPassword);
      onApplyDecryptedPDF(decryptedBytes);

      setSuccessMessage('PDF unlocked and password removed successfully!');
      setTimeout(() => {
        onClose();
        setUnlockPassword('');
        setSuccessMessage('');
      }, 1200);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Incorrect password. Decryption failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden text-slate-100 ring-1 ring-cyan-500/20">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center space-x-2.5">
            {activeTab === 'protect' ? (
              <Lock className="w-5 h-5 text-cyan-400" />
            ) : (
              <Unlock className="w-5 h-5 text-emerald-400" />
            )}
            <h2 className="text-base font-bold text-white">PDF Password Security</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 p-2 bg-slate-950/40 border-b border-slate-800 text-xs font-semibold">
          <button
            onClick={() => {
              setActiveTab('protect');
              setErrorMessage('');
              setSuccessMessage('');
            }}
            className={`py-2 rounded-xl transition flex items-center justify-center space-x-2 ${
              activeTab === 'protect'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Protect PDF (Add Password)</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('unlock');
              setErrorMessage('');
              setSuccessMessage('');
            }}
            className={`py-2 rounded-xl transition flex items-center justify-center space-x-2 ${
              activeTab === 'unlock'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Unlock className="w-3.5 h-3.5" />
            <span>Unlock PDF (Remove Password)</span>
          </button>
        </div>

        {/* Body Form */}
        <div className="p-5">
          {errorMessage && (
            <div className="mb-4 p-3 bg-rose-950/60 border border-rose-700/80 rounded-xl text-xs text-rose-200 flex items-center space-x-2 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 bg-emerald-950/60 border border-emerald-700/80 rounded-xl text-xs text-emerald-200 flex items-center space-x-2 animate-fadeIn">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {activeTab === 'protect' ? (
            <form onSubmit={handleProtect} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Set Document Password</span>
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password..."
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password..."
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
                  required
                />
              </div>

              {/* Permission Checkboxes */}
              <div className="pt-2 border-t border-slate-800 space-y-2">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Document Permissions (Optional)
                </p>
                <label className="flex items-center space-x-2.5 cursor-pointer text-xs text-slate-300 hover:text-white">
                  <input
                    type="checkbox"
                    checked={preventPrinting}
                    onChange={(e) => setPreventPrinting(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-cyan-500 focus:ring-cyan-500"
                  />
                  <Printer className="w-3.5 h-3.5 text-slate-400" />
                  <span>Prevent Printing</span>
                </label>

                <label className="flex items-center space-x-2.5 cursor-pointer text-xs text-slate-300 hover:text-white">
                  <input
                    type="checkbox"
                    checked={preventCopying}
                    onChange={(e) => setPreventCopying(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-cyan-500 focus:ring-cyan-500"
                  />
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Prevent Copying Text & Images</span>
                </label>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full py-2.5 px-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold shadow-lg transition flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Encrypt & Download PDF</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleUnlock} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Enter Current PDF Password</span>
                </label>
                <input
                  type="password"
                  value={unlockPassword}
                  onChange={(e) => setUnlockPassword(e.target.value)}
                  placeholder="Enter current password..."
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                  required
                />
              </div>

              <div className="p-3 bg-emerald-950/30 border border-emerald-800/40 rounded-xl text-[11px] text-emerald-300">
                Unlocking this PDF will remove password protection and allow full editing, viewing, and printing without prompting.
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full py-2.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-lg transition flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Unlock className="w-4 h-4" />
                      <span>Remove Password & Save Unlocked</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
