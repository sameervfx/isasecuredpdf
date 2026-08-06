import React, { useEffect, useRef, useState } from 'react';
import { pdfRenderer } from '../services/pdfRenderer';
import { PDFDocumentState, ToolMode, TextAnnotation, SignatureAnnotation, StampAnnotation, StrikeoutAnnotation, FreehandDrawing } from '../types/pdf';
import { AcroFormOverlay } from './AcroFormOverlay';
import { TextAnnotationEditor } from './TextAnnotationEditor';
import { SignatureOverlay } from './SignatureOverlay';
import { DrawingCanvasOverlay } from './DrawingCanvasOverlay';
import { Upload, FileCheck2, ShieldCheck, Sparkles, FilePlus, Combine, Download, ZoomIn, ZoomOut, Maximize2, RotateCcw } from 'lucide-react';
import appLogo from '../assets/app_logo.jpg';

interface PDFCanvasViewerProps {
  state: PDFDocumentState;
  currentPage: number;
  onPageVisibleChange: (pageNumber: number) => void;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  toolMode: ToolMode;
  pendingSignatureDataUrl?: string | null;
  onUpdateFieldValue: (fieldName: string, value: string | boolean) => void;
  onAddAnnotation: (ann: Omit<TextAnnotation, 'id'>) => void;
  onUpdateAnnotation: (id: string, updated: Partial<TextAnnotation>) => void;
  onDeleteAnnotation: (id: string) => void;
  onAddSignatureAtCoords?: (sig: Omit<SignatureAnnotation, 'id'>) => void;
  onUpdateSignature: (id: string, updated: Partial<SignatureAnnotation>) => void;
  onDeleteSignature: (id: string) => void;
  onAddDrawing: (drawing: Omit<FreehandDrawing, 'id'>) => void;
  onDeleteDrawing: (id: string) => void;
  onAddStamp: (stamp: Omit<StampAnnotation, 'id'>) => void;
  onDeleteStamp: (id: string) => void;
  onAddStrikeout: (strike: Omit<StrikeoutAnnotation, 'id'>) => void;
  onDeleteStrikeout: (id: string) => void;
  onOpenFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onLoadSample: () => void;
  onOpenCreateModal?: () => void;
  onOpenMergeModal?: () => void;
  isLoading?: boolean;
}

interface PageDims {
  width: number;
  height: number;
  originalWidth: number;
  originalHeight: number;
}

export const PDFCanvasViewer: React.FC<PDFCanvasViewerProps> = ({
  state,
  currentPage,
  zoom,
  onZoomChange,
  toolMode,
  pendingSignatureDataUrl,
  onUpdateFieldValue,
  onAddAnnotation,
  onUpdateAnnotation,
  onDeleteAnnotation,
  onAddSignatureAtCoords,
  onUpdateSignature,
  onDeleteSignature,
  onAddDrawing,
  onDeleteDrawing,
  onAddStamp,
  onDeleteStamp,
  onAddStrikeout,
  onDeleteStrikeout,
  onOpenFile,
  onLoadSample,
  onOpenCreateModal,
  onOpenMergeModal,
  isLoading = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRefs = useRef<Map<number, HTMLCanvasElement>>(new Map());
  const [pageDims, setPageDims] = useState<Record<number, PageDims>>({});
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const renderingRef = useRef(false);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  // Mouse tracking when in signature placement mode
  useEffect(() => {
    if (toolMode === 'sign' && pendingSignatureDataUrl) {
      const handleMouseMove = (e: MouseEvent) => {
        setMousePos({ x: e.clientX, y: e.clientY });
      };
      window.addEventListener('mousemove', handleMouseMove);
      return () => window.removeEventListener('mousemove', handleMouseMove);
    } else {
      setMousePos(null);
    }
  }, [toolMode, pendingSignatureDataUrl]);

  const activePages = state.pageOrder.filter((idx) => !state.deletedPages.has(idx));

  // Ctrl/Cmd + Mouse Wheel Zooming directly on document canvas
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY < 0 ? 0.15 : -0.15;
        const newZoom = Math.max(0.4, Math.min(2.5, zoom + delta));
        onZoomChange(Math.round(newZoom * 100) / 100);
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [zoom, onZoomChange]);

  // Render pages when doc/zoom/rotation changes
  useEffect(() => {
    if (!state.fileBytes || activePages.length === 0) {
      setPageDims({});
      return;
    }

    let cancelled = false;
    renderingRef.current = true;

    const renderAll = async () => {
      // Retry for up to 10 frames until DOM canvas elements are attached to refs
      let retries = 0;
      while (retries < 10 && !cancelled) {
        const hasAllCanvases = activePages.every((idx) => Boolean(canvasRefs.current.get(idx)));
        if (hasAllCanvases) break;
        await new Promise((r) => requestAnimationFrame(r));
        retries++;
      }
      if (cancelled) return;

      const newDims: Record<number, PageDims> = {};
      for (const origIdx of activePages) {
        if (cancelled) break;
        const canvas = canvasRefs.current.get(origIdx);
        if (!canvas) continue;
        try {
          const rot = state.pageRotations[origIdx] || 0;
          const dims = await pdfRenderer.renderPageToCanvas(origIdx, canvas, zoom, rot, state.fileBytes);
          if (!cancelled) newDims[origIdx] = dims;
        } catch (err) {
          console.error(`Error rendering page ${origIdx}:`, err);
        }
      }
      if (!cancelled) setPageDims(newDims);
    };

    renderAll().finally(() => { renderingRef.current = false; });
    return () => { cancelled = true; };
  }, [state.fileBytes, state.pageOrder, state.deletedPages, state.pageRotations, zoom]);

  // Scroll to page when currentPage changes
  useEffect(() => {
    if (activePages.length === 0) return;
    const targetIdx = activePages[currentPage - 1];
    if (targetIdx !== undefined) {
      const el = canvasRefs.current.get(targetIdx);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentPage]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file?.type === 'application/pdf') {
      const fakeEvt = { target: { files: [file] } } as unknown as React.ChangeEvent<HTMLInputElement>;
      onOpenFile(fakeEvt);
    }
  };

  // Show landing page when no document loaded (and not loading)
  if (!state.fileBytes && !isLoading) {
    return (
      <main
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-950 relative overflow-hidden"
      >
        {/* Background glows */}
        <div className="absolute w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-3xl pointer-events-none -top-40 -left-40" />
        <div className="absolute w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-3xl pointer-events-none -bottom-40 -right-40" />

        <div className={`relative max-w-xl w-full p-10 rounded-3xl border-2 border-dashed flex flex-col items-center text-center backdrop-blur-xl transition-all ${
          isDragOver
            ? 'border-cyan-400 bg-cyan-950/40 scale-105 shadow-2xl shadow-cyan-500/20'
            : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
        }`}>
          <div className="w-20 h-20 rounded-2xl overflow-hidden mb-6 shadow-2xl shadow-cyan-500/30 ring-2 ring-cyan-500/40">
            <img src={appLogo} alt="PDF Engine Studio Logo" className="w-full h-full object-cover" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">Isa Secure PDF Suite</h2>
          <p className="text-sm text-slate-400 mb-8 max-w-md">
            100% client-side. Drag & drop a PDF, or use one of the options below. No data ever leaves your device.
          </p>

          <input type="file" ref={fileInputRef} onChange={onOpenFile} accept="application/pdf" className="hidden" />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-cyan-500/25 transition active:scale-95"
            >
              <Upload className="w-4 h-4" />
              <span>Upload PDF</span>
            </button>

            {onOpenCreateModal && (
              <button
                onClick={onOpenCreateModal}
                className="flex items-center justify-center space-x-2 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 transition"
              >
                <FilePlus className="w-4 h-4 text-cyan-400" />
                <span>New Blank PDF</span>
              </button>
            )}

            {onOpenMergeModal && (
              <button
                onClick={onOpenMergeModal}
                className="flex items-center justify-center space-x-2 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 transition"
              >
                <Combine className="w-4 h-4 text-cyan-400" />
                <span>Combine PDFs</span>
              </button>
            )}
          </div>

          {/* Desktop App Download Cards */}
          <div className="mt-6 pt-6 border-t border-slate-800/80 w-full flex flex-col items-center">
            <p className="text-xs font-bold text-slate-300 mb-3 tracking-wide uppercase flex items-center space-x-1.5">
              <Download className="w-4 h-4 text-cyan-400" />
              <span>Download Standalone Desktop Beta</span>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
              <a
                href="/Isa_Secure_PDF_Suite_v1.0.0_Beta_Windows.zip"
                download="Isa_Secure_PDF_Suite_v1.0.0_Beta_Windows.zip"
                className="flex items-center justify-center space-x-2 px-3 py-2.5 bg-slate-800 hover:bg-cyan-950/80 text-slate-200 hover:text-cyan-300 text-xs font-semibold rounded-xl border border-slate-700 hover:border-cyan-500/60 shadow transition group"
              >
                <Download className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition" />
                <span>🪟 Windows (.zip)</span>
              </a>
              <a
                href="/Isa_Secure_PDF_Suite_v1.0.0_Beta_Mac.zip"
                download="Isa_Secure_PDF_Suite_v1.0.0_Beta_Mac.zip"
                className="flex items-center justify-center space-x-2 px-3 py-2.5 bg-slate-800 hover:bg-cyan-950/80 text-slate-200 hover:text-cyan-300 text-xs font-semibold rounded-xl border border-slate-700 hover:border-cyan-500/60 shadow transition group"
              >
                <Download className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition" />
                <span>🍎 macOS (.zip)</span>
              </a>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-800/80 flex items-center justify-center space-x-2 text-xs text-emerald-400 font-medium">
            <ShieldCheck className="w-4 h-4" />
            <span>100% In-Browser & Desktop Processing — Zero Server Upload</span>
          </div>
        </div>
      </main>
    );
  }

  // Show skeleton while loading
  if (isLoading && !state.fileBytes) {
    return (
      <main className="flex-1 flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-400">Rendering PDF…</p>
        </div>
      </main>
    );
  }

  return (
    <main
      ref={containerRef}
      tabIndex={0}
      className="flex-1 h-[calc(100vh-4rem)] overflow-y-auto overflow-x-auto max-w-[100vw] bg-slate-950 p-2 sm:p-8 flex flex-col items-center space-y-4 sm:space-y-8 relative scroll-smooth focus:outline-none touch-pan-x touch-pan-y"
    >
      {activePages.map((origIdx, seqIdx) => {
        const pageNum = seqIdx + 1;
        const dims = pageDims[origIdx];
        const rot = state.pageRotations[origIdx] || 0;
        const isSwapped = rot % 180 !== 0;
        const pageObj = state.pages[origIdx];
        const baseW = pageObj?.width || 612;
        const baseH = pageObj?.height || 792;
        const origW = dims?.originalWidth ?? (isSwapped ? baseH : baseW);
        const origH = dims?.originalHeight ?? (isSwapped ? baseW : baseH);
        const w = dims?.width ?? (origW * zoom);
        const h = dims?.height ?? (origH * zoom);

        return (
          <div
            key={origIdx}
            className="relative bg-white shadow-2xl rounded-sm border border-slate-700/40 transition-all duration-150"
            style={{ width: `${w}px`, height: `${h}px` }}
          >
            <canvas
              ref={(el) => {
                if (el) canvasRefs.current.set(origIdx, el);
                else canvasRefs.current.delete(origIdx);
              }}
              className="block"
            />

            {dims && (
              <>
                <AcroFormOverlay
                  fields={state.formFields}
                  pageIndex={origIdx}
                  canvasWidth={w}
                  canvasHeight={h}
                  originalWidth={origW}
                  originalHeight={origH}
                  pendingSignatureDataUrl={pendingSignatureDataUrl}
                  onUpdateFieldValue={onUpdateFieldValue}
                  onAddSignatureAtCoords={onAddSignatureAtCoords}
                />
                <TextAnnotationEditor
                  annotations={state.textAnnotations}
                  pageIndex={origIdx}
                  canvasWidth={w}
                  canvasHeight={h}
                  originalWidth={origW}
                  originalHeight={origH}
                  onUpdateAnnotation={onUpdateAnnotation}
                  onDeleteAnnotation={onDeleteAnnotation}
                  onAddAnnotation={onAddAnnotation}
                  isTextMode={toolMode === 'text'}
                />
                <DrawingCanvasOverlay
                  pageIndex={origIdx}
                  canvasWidth={w}
                  canvasHeight={h}
                  originalWidth={origW}
                  originalHeight={origH}
                  toolMode={toolMode}
                  pendingSignatureDataUrl={pendingSignatureDataUrl}
                  drawings={state.drawings}
                  stamps={state.stamps}
                  strikeouts={state.strikeouts}
                  onAddDrawing={onAddDrawing}
                  onDeleteDrawing={onDeleteDrawing}
                  onAddStamp={onAddStamp}
                  onDeleteStamp={onDeleteStamp}
                  onAddStrikeout={onAddStrikeout}
                  onDeleteStrikeout={onDeleteStrikeout}
                  onAddSignatureAtCoords={onAddSignatureAtCoords}
                />
                <SignatureOverlay
                  signatures={state.signatures}
                  pageIndex={origIdx}
                  canvasWidth={w}
                  canvasHeight={h}
                  originalWidth={origW}
                  originalHeight={origH}
                  onUpdateSignature={onUpdateSignature}
                  onDeleteSignature={onDeleteSignature}
                />
              </>
            )}

            {/* Page number badge */}
            <div className="absolute -left-14 top-2 bg-slate-900/80 backdrop-blur border border-slate-800 text-slate-400 text-[11px] font-mono font-semibold px-2 py-1 rounded shadow">
              P.{pageNum}
            </div>
          </div>
        );
      })}

      {/* Floating Canvas Zoom Controls */}
      <div className="sticky bottom-6 z-20 flex items-center space-x-1.5 px-3 py-2 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-full shadow-2xl text-slate-300">
        <button
          onClick={() => onZoomChange(Math.max(0.4, Math.round((zoom - 0.15) * 100) / 100))}
          className="p-1.5 hover:text-white rounded-full hover:bg-slate-800 transition"
          title="Zoom Out (Ctrl + Scroll Down)"
        >
          <ZoomOut className="w-4 h-4 text-slate-400" />
        </button>

        <span className="text-xs font-mono font-bold w-12 text-center text-cyan-400">
          {Math.round(zoom * 100)}%
        </span>

        <button
          onClick={() => onZoomChange(Math.min(2.5, Math.round((zoom + 0.15) * 100) / 100))}
          className="p-1.5 hover:text-white rounded-full hover:bg-slate-800 transition"
          title="Zoom In (Ctrl + Scroll Up)"
        >
          <ZoomIn className="w-4 h-4 text-slate-400" />
        </button>

        <div className="h-4 w-px bg-slate-800 my-auto mx-1" />

        <button
          onClick={() => onZoomChange(1.0)}
          className="px-2.5 py-1 text-[11px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-full transition"
          title="Reset Zoom to 100%"
        >
          100%
        </button>

        <button
          onClick={() => onZoomChange(1.25)}
          className="px-2.5 py-1 text-[11px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-full transition"
          title="Fit Page Width"
        >
          Fit Width
        </button>
      </div>
      {/* Real-Time Signature Mouse Follower */}
      {toolMode === 'sign' && pendingSignatureDataUrl && mousePos && (
        <div
          className="fixed pointer-events-none z-50 transform -translate-x-1/2 -translate-y-1/2 p-2 bg-white/95 rounded-xl shadow-2xl border-2 border-cyan-500 backdrop-blur-md flex flex-col items-center animate-pulse"
          style={{ left: `${mousePos.x}px`, top: `${mousePos.y}px` }}
        >
          <img src={pendingSignatureDataUrl} alt="Drop Signature" className="h-12 max-w-[160px] object-contain" />
          <span className="text-[10px] bg-slate-900 text-cyan-300 font-bold px-2 py-0.5 rounded shadow mt-1 whitespace-nowrap">
            Click target page to drop signature
          </span>
        </div>
      )}
    </main>
  );
};
