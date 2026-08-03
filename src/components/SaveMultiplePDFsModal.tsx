import React, { useState } from 'react';
import { X, FolderArchive, Layers, FileText, Check, AlertCircle } from 'lucide-react';
import { PDFDocumentState } from '../types/pdf';

interface SaveMultiplePDFsModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: PDFDocumentState;
  onExportMultiple: (mode: 'split_all' | 'custom_range', customRanges?: string) => Promise<void>;
  isProcessing?: boolean;
}

export const SaveMultiplePDFsModal: React.FC<SaveMultiplePDFsModalProps> = ({
  isOpen,
  onClose,
  state,
  onExportMultiple,
  isProcessing = false,
}) => {
  const [mode, setMode] = useState<'split_all' | 'custom_range'>('split_all');
  const [customRanges, setCustomRanges] = useState<string>('1-2, 3-5');

  if (!isOpen) return null;

  const activePages = state.pageOrder.filter((idx) => !state.deletedPages.has(idx));
  const totalPages = activePages.length;
  const baseName = (state.fileName || 'document.pdf').replace(/\.pdf$/i, '');

  const handleExport = async () => {
    await onExportMultiple(mode, mode === 'custom_range' ? customRanges : undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
              <FolderArchive className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-100">Save Multiple PDFs</h2>
              <p className="text-xs text-slate-400">Export split pages into multiple PDF files</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
          {/* Document Summary */}
          <div className="flex items-center justify-between p-3.5 bg-slate-950/40 border border-slate-800/80 rounded-xl text-xs">
            <div className="flex items-center space-x-2 text-slate-300">
              <FileText className="w-4 h-4 text-cyan-400" />
              <span className="font-medium truncate max-w-[220px]">{state.fileName || 'Document'}</span>
            </div>
            <span className="px-2 py-0.5 bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 font-mono rounded-md">
              {totalPages} {totalPages === 1 ? 'Page' : 'Pages'} Total
            </span>
          </div>

          {/* Mode Selection */}
          <div className="space-y-3">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Export Mode
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option 1: Split Every Page */}
              <button
                type="button"
                onClick={() => setMode('split_all')}
                className={`flex flex-col items-start p-4 rounded-xl border text-left transition ${
                  mode === 'split_all'
                    ? 'bg-emerald-500/10 border-emerald-500/50 text-white ring-1 ring-emerald-500/30'
                    : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <Layers className="w-4 h-4 text-emerald-400" />
                  {mode === 'split_all' && <Check className="w-4 h-4 text-emerald-400" />}
                </div>
                <span className="text-xs font-semibold text-slate-200">Split Every Page</span>
                <span className="text-[11px] text-slate-400 mt-1 leading-tight">
                  Save all {totalPages} pages as separate 1-page PDFs.
                </span>
              </button>

              {/* Option 2: Custom Ranges */}
              <button
                type="button"
                onClick={() => setMode('custom_range')}
                className={`flex flex-col items-start p-4 rounded-xl border text-left transition ${
                  mode === 'custom_range'
                    ? 'bg-emerald-500/10 border-emerald-500/50 text-white ring-1 ring-emerald-500/30'
                    : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <FolderArchive className="w-4 h-4 text-cyan-400" />
                  {mode === 'custom_range' && <Check className="w-4 h-4 text-emerald-400" />}
                </div>
                <span className="text-xs font-semibold text-slate-200">Custom Ranges</span>
                <span className="text-[11px] text-slate-400 mt-1 leading-tight">
                  Group specific page ranges into multi-page PDFs.
                </span>
              </button>
            </div>
          </div>

          {/* Custom Ranges Input */}
          {mode === 'custom_range' && (
            <div className="space-y-2 bg-slate-950/50 p-4 border border-slate-800 rounded-xl animate-fade-in">
              <label className="text-xs font-medium text-slate-300">
                Page Ranges (comma-separated):
              </label>
              <input
                type="text"
                value={customRanges}
                onChange={(e) => setCustomRanges(e.target.value)}
                placeholder="e.g. 1-2, 3-5, 6"
                className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 font-mono"
              />
              <div className="flex items-center space-x-1.5 text-[11px] text-slate-400 pt-1">
                <AlertCircle className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                <span>Example: <b>1-2, 3-5</b> creates 2 separate PDF files from pages 1-2 & 3-5.</span>
              </div>
            </div>
          )}

          {/* Target Archive Bundle Info */}
          <div className="p-3.5 bg-emerald-500/5 border border-emerald-500/20 rounded-xl flex items-center justify-between text-xs">
            <span className="text-slate-300 font-medium">Output Bundle Archive:</span>
            <span className="font-mono text-emerald-400 font-semibold">{baseName}_Multiple_PDFs.zip</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 px-6 py-4 border-t border-slate-800 bg-slate-950/50">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={isProcessing}
            className="flex items-center space-x-2 px-5 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-xs font-semibold rounded-lg shadow-lg shadow-emerald-500/25 border border-emerald-400/30 transition active:scale-95 disabled:opacity-50"
          >
            <FolderArchive className="w-4 h-4" />
            <span>{isProcessing ? 'Creating Multiple PDFs...' : 'Export Multiple PDFs (.zip)'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
