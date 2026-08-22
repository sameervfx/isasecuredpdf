import React, { useState } from 'react';
import { X, Zap, ArrowRight, ShieldCheck, Download, AlertCircle, Sparkles } from 'lucide-react';
import { securityService, CompressionResult } from '../services/securityService';

interface CompressModalProps {
  isOpen: boolean;
  onClose: () => void;
  pdfBytes: Uint8Array | null;
  fileName: string;
}

export const CompressModal: React.FC<CompressModalProps> = ({
  isOpen,
  onClose,
  pdfBytes,
  fileName,
}) => {
  const [preset, setPreset] = useState<'medium' | 'high' | 'low'>('medium');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [result, setResult] = useState<CompressionResult | null>(null);

  if (!isOpen) return null;

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleCompress = async () => {
    setErrorMessage('');
    setResult(null);

    if (!pdfBytes) {
      setErrorMessage('No PDF document loaded.');
      return;
    }

    try {
      setIsProcessing(true);
      const compResult = await securityService.compressPDF(pdfBytes, preset);
      setResult(compResult);
    } catch (err: any) {
      setErrorMessage(err?.message || 'PDF compression failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const blob = new Blob([new Uint8Array(result.compressedBytes)], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const baseName = fileName ? fileName.replace(/\.pdf$/i, '') : 'document';
    link.download = `${baseName}_compressed.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden text-slate-100 ring-1 ring-cyan-500/20">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center space-x-2.5">
            <Zap className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-white">Compress PDF File Size</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-rose-950/60 border border-rose-700/80 rounded-xl text-xs text-rose-200 flex items-center space-x-2 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Original Size Badge */}
          {pdfBytes && (
            <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs">
              <span className="text-slate-400 font-semibold">Current Document Size:</span>
              <span className="font-mono font-bold text-cyan-400">{formatSize(pdfBytes.length)}</span>
            </div>
          )}

          {/* Preset Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Select Compression Level
            </label>

            <div className="space-y-2">
              {/* 1. Recommended / Medium */}
              <div
                onClick={() => setPreset('medium')}
                className={`p-3 rounded-xl border cursor-pointer transition flex items-start space-x-3 ${
                  preset === 'medium'
                    ? 'bg-cyan-950/50 border-cyan-500 ring-1 ring-cyan-500/30'
                    : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="preset"
                  checked={preset === 'medium'}
                  onChange={() => setPreset('medium')}
                  className="mt-0.5 text-cyan-500 focus:ring-cyan-500"
                />
                <div>
                  <div className="text-xs font-bold text-white flex items-center space-x-1.5">
                    <span>Recommended / Medium</span>
                    <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 bg-cyan-500/20 text-cyan-300 rounded border border-cyan-500/30">
                      Balanced
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Downscales images to 150 DPI with 70% quality JPEG compression. Ideal for emails and standard sharing.
                  </p>
                </div>
              </div>

              {/* 2. High Compression */}
              <div
                onClick={() => setPreset('high')}
                className={`p-3 rounded-xl border cursor-pointer transition flex items-start space-x-3 ${
                  preset === 'high'
                    ? 'bg-amber-950/50 border-amber-500 ring-1 ring-amber-500/30'
                    : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="preset"
                  checked={preset === 'high'}
                  onChange={() => setPreset('high')}
                  className="mt-0.5 text-amber-500 focus:ring-amber-500"
                />
                <div>
                  <div className="text-xs font-bold text-white flex items-center space-x-1.5">
                    <span>High Compression</span>
                    <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 bg-amber-500/20 text-amber-300 rounded border border-amber-500/30">
                      Smallest Size
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Aggressive downscaling to 96 DPI with 50% JPEG quality. Maximum byte reduction for heavy image PDFs.
                  </p>
                </div>
              </div>

              {/* 3. Low / Lossless */}
              <div
                onClick={() => setPreset('low')}
                className={`p-3 rounded-xl border cursor-pointer transition flex items-start space-x-3 ${
                  preset === 'low'
                    ? 'bg-emerald-950/50 border-emerald-500 ring-1 ring-emerald-500/30'
                    : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="preset"
                  checked={preset === 'low'}
                  onChange={() => setPreset('low')}
                  className="mt-0.5 text-emerald-500 focus:ring-emerald-500"
                />
                <div>
                  <div className="text-xs font-bold text-white flex items-center space-x-1.5">
                    <span>Low / Lossless</span>
                    <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded border border-emerald-500/30">
                      Lossless
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Strips unreferenced metadata streams and enables compressed object streams without altering image resolution.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Result Feedback */}
          {result && (
            <div className="p-4 bg-slate-950 border border-emerald-500/40 rounded-xl space-y-2 animate-fadeIn">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-emerald-400 flex items-center space-x-1">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Compression Complete!</span>
                </span>
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-full font-mono text-[10px]">
                  -{result.savedPercentage}% Saved
                </span>
              </div>

              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800">
                <div className="text-slate-400 font-mono">
                  {formatSize(result.originalSize)}
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                <div className="font-bold text-white font-mono text-sm">
                  {formatSize(result.compressedSize)}
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2">
            {!result ? (
              <button
                onClick={handleCompress}
                disabled={isProcessing}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-xl text-xs font-bold shadow-lg transition flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {isProcessing ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Compress PDF</span>
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleDownload}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-lg transition flex items-center justify-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Download Compressed PDF ({formatSize(result.compressedSize)})</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
