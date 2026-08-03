import React from 'react';
import { 
  FileText, 
  RotateCw, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  Layers, 
  FormInput, 
  PenTool, 
  Type,
  FileCheck
} from 'lucide-react';
import { PDFDocumentState } from '../types/pdf';

interface SidebarProps {
  state: PDFDocumentState;
  thumbnails: string[];
  currentPage: number; // 1-indexed
  onSelectPage: (pageNumber: number) => void;
  onRotatePage: (pageIndex: number) => void;
  onDeletePage: (pageIndex: number) => void;
  isOpen: boolean;
  onToggleSidebar: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  state,
  thumbnails,
  currentPage,
  onSelectPage,
  onRotatePage,
  onDeletePage,
  isOpen,
  onToggleSidebar,
}) => {
  const activePageIndices = state.pageOrder.filter(idx => !state.deletedPages.has(idx));

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div 
          onClick={onToggleSidebar} 
          className="md:hidden fixed inset-0 top-16 bg-slate-950/70 backdrop-blur-sm z-30 transition-opacity" 
        />
      )}

      <aside
        className={`fixed md:relative top-16 md:top-0 bottom-0 left-0 h-[calc(100vh-4rem)] bg-slate-900/95 backdrop-blur-md border-r border-slate-800 transition-all duration-300 flex flex-col z-40 select-none ${
          isOpen ? 'w-64' : 'w-10 md:w-12'
        }`}
      >
        {/* Sidebar Toggle Button */}
        <button
          onClick={onToggleSidebar}
          className="absolute -right-3 top-4 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-full p-1 shadow-lg z-50 transition"
        >
          {isOpen ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </button>

      {isOpen ? (
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <h2 className="text-xs font-bold tracking-wider uppercase text-slate-300">
                Thumbnails ({activePageIndices.length})
              </h2>
            </div>
            <span className="text-[10px] text-slate-400 truncate max-w-[100px]" title={state.fileName}>
              {state.fileName}
            </span>
          </div>

          {/* Thumbnails List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-4">
            {activePageIndices.map((origIdx, seqIndex) => {
              const displayPageNum = seqIndex + 1;
              const isSelected = displayPageNum === currentPage;
              const rotation = state.pageRotations[origIdx] || 0;
              const thumbUrl = thumbnails[origIdx] || '';

              return (
                <div
                  key={origIdx}
                  onClick={() => onSelectPage(displayPageNum)}
                  className={`group relative border rounded-xl p-2 transition cursor-pointer flex flex-col items-center ${
                    isSelected
                      ? 'border-cyan-500 bg-cyan-950/30 ring-2 ring-cyan-500/20 shadow-lg'
                      : 'border-slate-800 hover:border-slate-700 bg-slate-950/40'
                  }`}
                >
                  {/* Thumbnail Image Container */}
                  <div className="w-full h-36 bg-slate-900 rounded flex items-center justify-center overflow-hidden relative">
                    {thumbUrl ? (
                      <img
                        src={thumbUrl}
                        alt={`Page ${displayPageNum}`}
                        className="max-h-full max-w-full object-contain transition-transform duration-300"
                        style={{ transform: `rotate(${rotation}deg)` }}
                      />
                    ) : (
                      <div className="flex flex-col items-center text-slate-600">
                        <FileText className="w-8 h-8 mb-1" />
                        <span className="text-[10px]">Loading...</span>
                      </div>
                    )}

                    {/* Hover Actions Bar */}
                    <div className="absolute top-1 right-1 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/90 backdrop-blur rounded p-1 shadow">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRotatePage(origIdx);
                        }}
                        title="Rotate 90° Clockwise"
                        className="p-1 hover:bg-slate-700 rounded text-slate-300 hover:text-cyan-400 transition"
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                      </button>

                      {activePageIndices.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeletePage(origIdx);
                          }}
                          title="Delete Page"
                          className="p-1 hover:bg-rose-950 rounded text-slate-300 hover:text-rose-400 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Page Footer Label */}
                  <div className="mt-2 text-center flex items-center justify-between w-full text-[11px] font-medium text-slate-400 px-1">
                    <span>Page {displayPageNum}</span>
                    {rotation !== 0 && (
                      <span className="text-[10px] text-cyan-400 font-mono">{rotation}°</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Stats Footer */}
          <div className="p-3 border-t border-slate-800 bg-slate-950/60 text-[11px] text-slate-400 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="flex items-center space-x-1">
                <Type className="w-3.5 h-3.5 text-cyan-400" />
                <span>Text Edits:</span>
              </span>
              <span className="font-semibold text-slate-200">{state.textAnnotations.length}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center space-x-1">
                <PenTool className="w-3.5 h-3.5 text-purple-400" />
                <span>Signatures:</span>
              </span>
              <span className="font-semibold text-slate-200">{state.signatures.length}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center space-x-1">
                <FormInput className="w-3.5 h-3.5 text-emerald-400" />
                <span>Form Fields:</span>
              </span>
              <span className="font-semibold text-slate-200">{state.formFields.length}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center py-4 space-y-6">
          <Layers className="w-5 h-5 text-slate-500" />
          <div className="flex-1 flex flex-col items-center space-y-4">
            {activePageIndices.slice(0, 5).map((_, i) => (
              <span
                key={i}
                onClick={() => onSelectPage(i + 1)}
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] cursor-pointer font-bold ${
                  i + 1 === currentPage
                    ? 'bg-cyan-600 text-white shadow-md shadow-cyan-500/30'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {i + 1}
              </span>
            ))}
          </div>
        </div>
      )}
    </aside>
    </>
  );
};
