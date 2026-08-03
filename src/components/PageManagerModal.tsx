import React from 'react';
import { X, RotateCw, Trash2, ArrowLeft, ArrowRight, Grid } from 'lucide-react';
import { PDFDocumentState } from '../types/pdf';

interface PageManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: PDFDocumentState;
  thumbnails: string[];
  onRotatePage: (pageIndex: number) => void;
  onDeletePage: (pageIndex: number) => void;
  onMovePage: (fromIndex: number, toIndex: number) => void;
}

export const PageManagerModal: React.FC<PageManagerModalProps> = ({
  isOpen,
  onClose,
  state,
  thumbnails,
  onRotatePage,
  onDeletePage,
  onMovePage,
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
            <h3 className="text-sm font-bold text-white tracking-tight">Page Management & Grid Reorder</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Page Grid Container */}
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
