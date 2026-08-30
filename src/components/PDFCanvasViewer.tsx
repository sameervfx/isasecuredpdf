import React, { useEffect, useRef, useState } from 'react';
import { pdfRenderer } from '../services/pdfRenderer';
import { PDFDocumentState, ToolMode, TextAnnotation, SignatureAnnotation, StampAnnotation, StrikeoutAnnotation, FreehandDrawing } from '../types/pdf';
import { AcroFormOverlay } from './AcroFormOverlay';
import { TextAnnotationEditor } from './TextAnnotationEditor';
import { SignatureOverlay } from './SignatureOverlay';
import { DrawingCanvasOverlay } from './DrawingCanvasOverlay';
import { ShapeOverlay } from './ShapeOverlay';
import { ImageStampOverlay } from './ImageStampOverlay';
import { ShapeAnnotation, ImageStampAnnotation } from '../types/pdf';
import { Upload, FileCheck2, ShieldCheck, Sparkles, FilePlus, Combine, Download, ZoomIn, ZoomOut, Maximize2, RotateCcw, XCircle, X, Camera } from 'lucide-react';
import appLogo from '../assets/app_logo.jpg';

interface PDFCanvasViewerProps {
  state: PDFDocumentState;
  currentPage: number;
  onPageVisibleChange: (pageNumber: number) => void;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  toolMode: ToolMode;
  pendingSignatureDataUrl?: string | null;
  onCloseDocument?: () => void;
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
  onOpenScanModal?: () => void;
  isLoading?: boolean;
  textColor?: string;
  textFontSize?: number;
  textFontFamily?: string;
  textIsRedact?: boolean;
  textIsUnderline?: boolean;
  shapeStrokeColor?: string;
  shapeFillColor?: string;
  shapeStrokeWidth?: number;
  onAddShape?: (shape: Omit<ShapeAnnotation, 'id'>) => void;
  onUpdateShape?: (id: string, updated: Partial<ShapeAnnotation>) => void;
  onDeleteShape?: (id: string) => void;
  onAddImageStamp?: (img: Omit<ImageStampAnnotation, 'id'>) => void;
  onUpdateImageStamp?: (id: string, updated: Partial<ImageStampAnnotation>) => void;
  onDeleteImageStamp?: (id: string) => void;
  onFocusFormField?: (fieldName: string) => void;
  onFitToWidth?: () => void;
  onOpenSignatureModal?: (tab?: 'draw' | 'type' | 'upload') => void;
  activeTheme?: any;
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
  onFitToWidth,
  toolMode,
  pendingSignatureDataUrl,
  onCloseDocument,
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
  onAddShape,
  onUpdateShape,
  onDeleteShape,
  onAddImageStamp,
  onUpdateImageStamp,
  onDeleteImageStamp,
  onOpenFile,
  onLoadSample,
  onOpenCreateModal,
  onOpenMergeModal,
  onOpenScanModal,
  isLoading = false,
  textColor,
  textFontSize,
  textFontFamily,
  textIsRedact,
  textIsUnderline,
  shapeStrokeColor,
  shapeFillColor,
  shapeStrokeWidth,
  onFocusFormField,
  onOpenSignatureModal,
  activeTheme,
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

  const pageOrder = state?.pageOrder || [];
  const deletedPages = state?.deletedPages || new Set<number>();
  const activePages = pageOrder.filter((idx) => !deletedPages.has(idx));

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

  // Keep ref for smooth zoom scaling without stale closure issues
  const zoomRef = useRef(zoom);
  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  // Touch Pinch-to-Zoom & 1-Finger Drag Panning for Touchscreens
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let initialTouchDist = 0;
    let initialZoom = zoomRef.current;
    let isPanning = false;
    let startX = 0;
    let startY = 0;
    let startScrollLeft = 0;
    let startScrollTop = 0;

    const getTouchDist = (e: TouchEvent) => {
      if (e.touches.length < 2) return 0;
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      return Math.hypot(dx, dy);
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        initialTouchDist = getTouchDist(e);
        initialZoom = zoomRef.current;
        isPanning = false;
      } else if (e.touches.length === 1 && toolMode === 'select') {
        isPanning = true;
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        startScrollLeft = container.scrollLeft;
        startScrollTop = container.scrollTop;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && initialTouchDist > 0) {
        e.preventDefault();
        const currentDist = getTouchDist(e);
        if (currentDist > 0) {
          const scaleRatio = currentDist / initialTouchDist;
          const newZoom = Math.max(0.35, Math.min(2.5, Math.round(initialZoom * scaleRatio * 100) / 100));
          onZoomChange(newZoom);
        }
      } else if (isPanning && e.touches.length === 1 && toolMode === 'select') {
        const dx = e.touches[0].clientX - startX;
        const dy = e.touches[0].clientY - startY;
        container.scrollLeft = startScrollLeft - dx;
        container.scrollTop = startScrollTop - dy;
      }
    };

    const handleTouchEnd = () => {
      initialTouchDist = 0;
      isPanning = false;
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [toolMode, onZoomChange]);

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
        await new Promise((r) => setTimeout(r, 40));
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
            ? 'border-cyan-400 bg-cyan-950/50 scale-105 shadow-2xl shadow-cyan-500/30 ring-2 ring-cyan-400/50'
            : 'border-slate-700/80 bg-slate-900/70 hover:border-cyan-500/60 shadow-xl'
        }`}>
          <div className="w-20 h-20 rounded-2xl overflow-hidden mb-6 shadow-2xl shadow-cyan-500/30 ring-2 ring-cyan-500/40">
            <img src={appLogo} alt="PDF Engine Studio Logo" className="w-full h-full object-cover" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">ISASecuredPDF Suite</h2>
          <p className="text-xs sm:text-sm text-slate-400 mb-8 max-w-md leading-relaxed">
            100% client-side air-gapped PDF engine. <span className="text-cyan-300 font-semibold">Drag & drop PDF anywhere or choose an option below</span>. No data ever leaves your device.
          </p>

          <input type="file" ref={fileInputRef} onChange={onOpenFile} accept="application/pdf" className="hidden" />

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center space-x-1.5 px-3 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-cyan-500/25 transition active:scale-95"
            >
              <Upload className="w-4 h-4" />
              <span>Open PDF</span>
            </button>

            {onOpenScanModal && (
              <button
                onClick={onOpenScanModal}
                className="flex items-center justify-center space-x-1.5 px-3 py-3 bg-slate-800 hover:bg-slate-700 text-cyan-300 font-semibold text-xs rounded-xl border border-cyan-500/40 transition"
              >
                <Camera className="w-4 h-4 text-cyan-400" />
                <span>Scan Camera</span>
              </button>
            )}

            {onOpenCreateModal && (
              <button
                onClick={onOpenCreateModal}
                className="flex items-center justify-center space-x-1.5 px-3 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 transition"
              >
                <FilePlus className="w-4 h-4 text-cyan-400" />
                <span>New Blank</span>
              </button>
            )}

            {onOpenMergeModal && (
              <button
                onClick={onOpenMergeModal}
                className="flex items-center justify-center space-x-1.5 px-3 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 transition"
              >
                <Combine className="w-4 h-4 text-cyan-400" />
                <span>Combine</span>
              </button>
            )}
          </div>

          {/* Drag & Drop Any PDF Dropzone Feature Box */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`mt-6 p-6 w-full rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all group ${
              isDragOver
                ? 'border-cyan-400 bg-cyan-950/60 scale-102 shadow-lg shadow-cyan-500/20'
                : 'border-cyan-500/30 bg-slate-950/60 hover:border-cyan-400 hover:bg-slate-900/90'
            }`}
          >
            <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-xl mb-2.5 group-hover:scale-110 transition border border-cyan-500/20">
              <Upload className="w-6 h-6 text-cyan-400" />
            </div>
            <span className="text-xs font-bold text-slate-200 group-hover:text-cyan-300 transition">
              Drag & Drop Any PDF File Here
            </span>
            <span className="text-[11px] text-slate-400 mt-1">
              or click to browse local files from your device
            </span>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-800/80 flex items-center justify-center space-x-2 text-xs text-emerald-400 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>100% On-Device & Air-Gapped Processing — Zero Server Upload</span>
          </div>
        </div>
      </main>
    );
  }

  // Show skeleton while loading
  if (isLoading && !state.fileBytes) {
    return (
      <main className={`flex-1 flex items-center justify-center ${activeTheme?.bgClass || 'bg-slate-950'}`}>
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
      className={`flex-1 h-[calc(100vh-4rem)] overflow-y-auto overflow-x-auto max-w-[100vw] ${activeTheme?.bgClass || 'bg-slate-950'} p-2 sm:p-8 flex flex-col items-start sm:items-center space-y-4 sm:space-y-8 relative scroll-smooth focus:outline-none touch-auto min-w-0 transition-colors duration-500`}
    >
      {onCloseDocument && (
        <div className="sticky top-2 sm:top-4 self-end z-30 mr-2 sm:mr-6 -mb-10 sm:-mb-12">
          <button
            onClick={onCloseDocument}
            className="p-2 sm:p-2.5 bg-slate-900/90 hover:bg-rose-950/90 text-slate-300 hover:text-rose-200 border border-slate-700 hover:border-rose-700/80 rounded-xl shadow-2xl backdrop-blur-md transition active:scale-95 group"
            title="Close document"
          >
            <X className="w-4 h-4 text-rose-400 group-hover:scale-110 transition duration-200" />
          </button>
        </div>
      )}

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
            className="pdf-document-page relative bg-white shadow-2xl transition-all duration-150 my-4"
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
                  shapeStrokeColor={shapeStrokeColor}
                  shapeFillColor={shapeFillColor}
                  shapeStrokeWidth={shapeStrokeWidth}
                  onAddDrawing={onAddDrawing}
                  onDeleteDrawing={onDeleteDrawing}
                  onAddStamp={onAddStamp}
                  onDeleteStamp={onDeleteStamp}
                  onAddStrikeout={onAddStrikeout}
                  onDeleteStrikeout={onDeleteStrikeout}
                  onAddShape={onAddShape}
                  onAddSignatureAtCoords={onAddSignatureAtCoords}
                  onOpenSignatureModal={onOpenSignatureModal}
                />
                <AcroFormOverlay
                  fields={state.formFields}
                  pageIndex={origIdx}
                  canvasWidth={w}
                  canvasHeight={h}
                  originalWidth={origW}
                  originalHeight={origH}
                  rotation={rot}
                  unrotatedWidth={baseW}
                  unrotatedHeight={baseH}
                  textFontSize={textFontSize}
                  textFontFamily={textFontFamily}
                  textColor={textColor}
                  textIsRedact={textIsRedact}
                  pendingSignatureDataUrl={pendingSignatureDataUrl}
                  onUpdateFieldValue={onUpdateFieldValue}
                  onAddSignatureAtCoords={onAddSignatureAtCoords}
                  onFocusFormField={onFocusFormField}
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
                  textColor={textColor}
                  textFontSize={textFontSize}
                  textFontFamily={textFontFamily}
                  textIsRedact={textIsRedact}
                  textIsUnderline={textIsUnderline}
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
                <ShapeOverlay
                  shapes={state.shapes}
                  pageIndex={origIdx}
                  canvasWidth={w}
                  canvasHeight={h}
                  originalWidth={origW}
                  originalHeight={origH}
                  onUpdateShape={onUpdateShape || (() => {})}
                  onDeleteShape={onDeleteShape || (() => {})}
                />
                <ImageStampOverlay
                  imageStamps={state.imageStamps}
                  pageIndex={origIdx}
                  canvasWidth={w}
                  canvasHeight={h}
                  originalWidth={origW}
                  originalHeight={origH}
                  onUpdateImageStamp={onUpdateImageStamp || (() => {})}
                  onDeleteImageStamp={onDeleteImageStamp || (() => {})}
                />
              </>
            )}

            {/* Page number badge */}
            <div className="absolute left-2 sm:-left-14 top-2 bg-slate-900/90 backdrop-blur border border-slate-800 text-cyan-300 sm:text-slate-400 text-[10px] sm:text-[11px] font-mono font-bold px-2 py-0.5 sm:py-1 rounded-full sm:rounded shadow z-30">
              P.{pageNum}
            </div>
          </div>
        );
      })}

      {/* Floating Canvas Zoom Controls */}
      <div className="sticky bottom-6 z-20 flex items-center space-x-1.5 px-3 py-2 bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-full shadow-2xl text-slate-300">
        <button
          onClick={() => onZoomChange(Math.max(0.35, Math.round((zoom - 0.15) * 100) / 100))}
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
          onClick={() => {
            if (onFitToWidth) {
              onFitToWidth();
            } else {
              onZoomChange(0.65);
            }
          }}
          className="px-2.5 py-1 text-[11px] font-bold bg-cyan-950/70 hover:bg-cyan-900 text-cyan-300 border border-cyan-700/50 rounded-full transition shadow-sm"
          title="Auto Fit Page to Screen Width"
        >
          Fit Screen
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
