import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Printer,
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  ExternalLink,
  CheckCircle2,
  FileText,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { PDFRendererService } from '../services/pdfRenderer';
import { printPdfBlob } from '../utils/mobileFileDownload';

function bytesToBase64(bytes: Uint8Array): string {
  const CHUNK_SIZE = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
    binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + CHUNK_SIZE)));
  }
  return btoa(binary);
}

interface PrintPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  pdfBytes: Uint8Array | null;
  fileName?: string;
  totalDocPages?: number;
}

export const PrintPreviewModal: React.FC<PrintPreviewModalProps> = ({
  isOpen,
  onClose,
  pdfBytes,
  fileName = 'document.pdf',
  totalDocPages = 1,
}) => {
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(totalDocPages || 1);
  const [zoom, setZoom] = useState<number>(0.85);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSendingToPrinter, setIsSendingToPrinter] = useState<boolean>(false);
  const [printRange, setPrintRange] = useState<'all' | 'current'>('all');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<PDFRendererService | null>(null);

  // Initialize renderer service
  useEffect(() => {
    if (!rendererRef.current) {
      rendererRef.current = new PDFRendererService();
    }
  }, []);

  // Load document when modal opens
  useEffect(() => {
    if (!isOpen || !pdfBytes) return;

    let isMounted = true;
    setIsLoading(true);

    const loadDoc = async () => {
      try {
        const renderer = rendererRef.current || new PDFRendererService();
        rendererRef.current = renderer;
        const doc = await renderer.loadDocument(pdfBytes);
        if (isMounted) {
          setTotalPages(doc.numPages);
          setCurrentPage(0);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Failed to load PDF in Print Preview:', err);
        if (isMounted) setIsLoading(false);
      }
    };

    loadDoc();

    return () => {
      isMounted = false;
    };
  }, [isOpen, pdfBytes]);

  // Render current page to canvas
  const renderCurrentPage = useCallback(async () => {
    if (!isOpen || !pdfBytes || !rendererRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    try {
      await rendererRef.current.renderPageToCanvas(
        currentPage,
        canvas,
        zoom,
        0,
        pdfBytes
      );
    } catch (err) {
      console.warn('Canvas render error in print preview:', err);
    }
  }, [isOpen, pdfBytes, currentPage, zoom]);

  useEffect(() => {
    if (!isLoading && isOpen) {
      renderCurrentPage();
    }
  }, [isLoading, isOpen, currentPage, zoom, renderCurrentPage]);

  if (!isOpen || !pdfBytes) return null;

  const handlePrint = async () => {
    setIsSendingToPrinter(true);
    try {
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
      await printPdfBlob(blob, fileName);
    } catch (err) {
      console.error('Print trigger error:', err);
      alert('Unable to send document to printer: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsSendingToPrinter(false);
    }
  };

  const handleOpenInSystemViewer = async () => {
    if (typeof window !== 'undefined' && (window as any).electronAPI?.openPdfInSystemViewer) {
      try {
        const base64 = bytesToBase64(pdfBytes);
        await (window as any).electronAPI.openPdfInSystemViewer(base64, fileName);
      } catch (e) {
        console.error('Failed to open in system viewer:', e);
      }
    } else {
      // Fallback for web: open blob URL in new window/tab
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-5xl h-[92vh] max-h-[850px] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-cyan-400">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base sm:text-lg font-bold text-white">Print Preview & Setup</h2>
                <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full">
                  100% On-Device Vector Render
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Inspect every page before sending to physical printer or PDF writer
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
            title="Close Preview"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Content: Left Preview, Right Settings */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          
          {/* Left Canvas Preview Area */}
          <div className="flex-1 flex flex-col bg-slate-950/40 relative overflow-hidden">
            
            {/* Top Toolbar (Page Turner & Zoom) */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800/80 bg-slate-900/60 text-xs">
              {/* Page Navigator */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                  disabled={currentPage <= 0}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 rounded-lg text-slate-200 transition"
                  title="Previous Page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-semibold text-slate-300">
                  Page <span className="text-cyan-400 font-bold">{currentPage + 1}</span> of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={currentPage >= totalPages - 1}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 rounded-lg text-slate-200 transition"
                  title="Next Page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Zoom Controls */}
              <div className="flex items-center space-x-1.5">
                <button
                  onClick={() => setZoom((z) => Math.max(0.4, Math.round((z - 0.15) * 100) / 100))}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="font-mono text-slate-400 w-12 text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  onClick={() => setZoom((z) => Math.min(2.5, Math.round((z + 0.15) * 100) / 100))}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setZoom(0.85)}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-[11px] font-semibold text-slate-300 transition"
                  title="Fit to Screen"
                >
                  <Maximize2 className="w-3 h-3 inline mr-1" /> Fit
                </button>
              </div>
            </div>

            {/* Scrollable Canvas Viewport */}
            <div className="flex-1 overflow-auto flex items-center justify-center p-4">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center space-y-3 text-slate-400">
                  <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
                  <p className="text-sm font-medium">Generating high-fidelity print preview...</p>
                </div>
              ) : (
                <div className="relative shadow-2xl rounded border border-slate-700/60 bg-white">
                  <canvas ref={canvasRef} className="block max-w-full h-auto" />
                </div>
              )}
            </div>

            {/* Bottom thumbnail mini-strip if multi-page */}
            {totalPages > 1 && (
              <div className="py-2 px-3 border-t border-slate-800/80 bg-slate-900/40 flex items-center justify-center space-x-1.5 overflow-x-auto">
                {Array.from({ length: totalPages }).map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentPage(idx)}
                    className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                      currentPage === idx
                        ? 'bg-cyan-500 text-slate-950 font-bold shadow'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    p. {idx + 1}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Controls & Info Panel */}
          <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-slate-800 bg-slate-900/90 p-5 flex flex-col justify-between">
            <div className="space-y-5">
              
              {/* Document Overview */}
              <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center space-x-2 text-xs font-bold text-slate-300">
                  <FileText className="w-4 h-4 text-cyan-400" />
                  <span className="truncate" title={fileName}>{fileName}</span>
                </div>
                <div className="text-[11px] text-slate-400 space-y-1">
                  <div className="flex justify-between">
                    <span>Total Pages:</span>
                    <span className="font-semibold text-white">{totalPages}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Active Page:</span>
                    <span className="font-semibold text-cyan-300">Page {currentPage + 1}</span>
                  </div>
                </div>
              </div>

              {/* Pages to Print Selection */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Pages to Print
                </label>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2.5 p-2.5 bg-slate-950/40 border border-slate-800 rounded-xl cursor-pointer hover:border-slate-700 transition">
                    <input
                      type="radio"
                      name="printRange"
                      checked={printRange === 'all'}
                      onChange={() => setPrintRange('all')}
                      className="text-cyan-500 focus:ring-0 focus:ring-offset-0"
                    />
                    <div className="text-xs">
                      <div className="font-semibold text-white">All Pages</div>
                      <div className="text-slate-400 text-[11px]">Print complete document (1-{totalPages})</div>
                    </div>
                  </label>

                  <label className="flex items-center space-x-2.5 p-2.5 bg-slate-950/40 border border-slate-800 rounded-xl cursor-pointer hover:border-slate-700 transition">
                    <input
                      type="radio"
                      name="printRange"
                      checked={printRange === 'current'}
                      onChange={() => setPrintRange('current')}
                      className="text-cyan-500 focus:ring-0 focus:ring-offset-0"
                    />
                    <div className="text-xs">
                      <div className="font-semibold text-white">Current Page Only</div>
                      <div className="text-slate-400 text-[11px]">Print Page {currentPage + 1} only</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Windows 11 Callout Explanation */}
              <div className="p-3 bg-cyan-950/30 border border-cyan-800/40 rounded-xl text-[11px] text-cyan-200/90 space-y-1">
                <div className="flex items-center space-x-1.5 font-bold text-cyan-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>Preview Verified</span>
                </div>
                <p className="text-[10.5px] leading-relaxed text-slate-300">
                  Your edits, text, and signatures are verified. Clicking <b>Print Document</b> will open your system printer dialog to choose your device.
                </p>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-slate-800 space-y-2.5">
              <button
                onClick={handlePrint}
                disabled={isSendingToPrinter}
                className="w-full flex items-center justify-center space-x-2 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold text-sm rounded-xl shadow-lg shadow-cyan-500/20 transition active:scale-98 disabled:opacity-50"
              >
                {isSendingToPrinter ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                    <span>Opening Printer Dialog...</span>
                  </>
                ) : (
                  <>
                    <Printer className="w-4 h-4 text-slate-950" />
                    <span>Print Document</span>
                  </>
                )}
              </button>

              {/* Alternative: Open in Microsoft Edge / System Viewer */}
              <button
                onClick={handleOpenInSystemViewer}
                type="button"
                className="w-full flex items-center justify-center space-x-1.5 py-2 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300 hover:text-white rounded-xl transition"
                title="Open in Microsoft Edge or default PDF viewer"
              >
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                <span>Open in Windows PDF Viewer</span>
              </button>

              <button
                onClick={onClose}
                type="button"
                className="w-full py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition text-center"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
