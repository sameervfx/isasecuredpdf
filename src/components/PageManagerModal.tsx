import React from 'react';
import { X, RotateCw, Trash2, ArrowLeft, ArrowRight, Grid, Upload, Plus, Layers } from 'lucide-react';
import { PDFDocumentState } from '../types/pdf';

interface PageManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: PDFDocumentState;
  thumbnails: string[];
  onRotatePage: (pageIndex: number) => void;
  onDeletePage: (pageIndex: number) => void;
  onMovePage: (fromIndex: number, toIndex: number) => void;
  onOpenFile?: () => void;
  onOpenMergeModal?: () => void;
}

export const PageManagerModal: React.FC<PageManagerModalProps> = ({
  isOpen,
  onClose,
  state,
  thumbnails,
  onRotatePage,
  onDeletePage,
  onMovePage,
  onOpenFile,
  onOpenMergeModal,
}) => {
  if (!isOpen) return null;

  const activePages = state.pageOrder.filter(idx => !state.deletedPages.has(idx));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-w-4xl w-full h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Grid className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-bold text-white tracking-tight">Split & Arrange Pages</h3>
            {activePages.length > 0 && (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                {activePages.length} Pages
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {onOpenMergeModal && (
              <button
                onClick={() => {
                  onClose();
                  onOpenMergeModal();
                }}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-semibold rounded-lg border border-slate-700 transition"
                title="Combine multiple PDF files"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Combine Files</span>
              </button>
            )}
            {onOpenFile && (
              <button
                onClick={() => {
                  onOpenFile();
                }}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition"
                title="Open a different PDF"
              >
                <Upload className="w-3.5 h-3.5 text-cyan-400" />
                <span>Open PDF</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Page Grid Container */}
        {activePages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-950">
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mb-4 text-cyan-400 shadow-xl shadow-cyan-500/10">
              <Upload className="w-8 h-8" />
            </div>
            <h4 className="text-base font-bold text-white mb-2">No Document Loaded</h4>
            <p className="text-xs text-slate-400 max-w-sm mb-6 leading-relaxed">
              Select a PDF document to rearrange, rotate, delete, or split pages — or combine multiple files into one.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {onOpenFile && (
                <button
                  onClick={() => {
                    onOpenFile();
                  }}
                  className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-cyan-600/30 transition transform hover:-translate-y-0.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Select PDF from Computer</span>
                </button>
              )}
              {onOpenMergeModal && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenMergeModal();
                  }}
                  className="flex items-center space-x-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-bold rounded-xl border border-slate-700 transition transform hover:-translate-y-0.5"
                >
                  <Layers className="w-4 h-4" />
                  <span>Combine & Merge Files</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 bg-slate-950">
            {activePages.map((origIdx, seqIndex) => {
              const displayNum = seqIndex + 1;
              const rotation = state.pageRotations[origIdx] || 0;
              const thumbUrl = thumbnails[origIdx] || '';

              return (
                <div
                  key={origIdx}
                  className="group relative bg-slate-900 border border-slate-800 hover:border-cyan-500/50 rounded-xl p-3 flex flex-col items-center shadow-lg transition"
                >
                  {/* Thumbnail View */}
                  <div className="w-full h-44 bg-slate-950 rounded-lg flex items-center justify-center overflow-hidden relative">
                    {thumbUrl ? (
                      <img
                        src={thumbUrl}
                        alt={`Page ${displayNum}`}
                        className="max-h-full max-w-full object-contain transition-transform duration-300"
                        style={{ transform: `rotate(${rotation}deg)` }}
                      />
                    ) : (
                      <span className="text-xs text-slate-600">Page {displayNum}</span>
                    )}
                  </div>

                  {/* Page Label & Actions */}
                  <div className="mt-3 w-full flex items-center justify-between text-xs text-slate-300">
                    <span className="font-semibold">Page {displayNum}</span>

                    <div className="flex items-center space-x-1">
                      {/* Move Left */}
                      <button
                        disabled={seqIndex === 0}
                        onClick={() => onMovePage(seqIndex, seqIndex - 1)}
                        className="p-1 hover:bg-slate-800 rounded disabled:opacity-30 text-slate-400 hover:text-white"
                        title="Move Left"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                      </button>

                      {/* Move Right */}
                      <button
                        disabled={seqIndex === activePages.length - 1}
                        onClick={() => onMovePage(seqIndex, seqIndex + 1)}
                        className="p-1 hover:bg-slate-800 rounded disabled:opacity-30 text-slate-400 hover:text-white"
                        title="Move Right"
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>

                      {/* Rotate */}
                      <button
                        onClick={() => onRotatePage(origIdx)}
                        className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-cyan-400"
                        title="Rotate 90°"
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete */}
                      {activePages.length > 1 && (
                        <button
                          onClick={() => onDeletePage(origIdx)}
                          className="p-1 hover:bg-rose-950 rounded text-slate-400 hover:text-rose-400"
                          title="Delete Page"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 rounded-lg shadow transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
