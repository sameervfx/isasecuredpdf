import React, { useEffect, useLayoutEffect, useRef, useState, useCallback } from 'react';
import { pdfRenderer } from '../services/pdfRenderer';
import { PDFDocumentState, ToolMode, TextAnnotation, SignatureAnnotation, StampAnnotation, StrikeoutAnnotation, FreehandDrawing } from '../types/pdf';
import { AcroFormOverlay } from './AcroFormOverlay';
import { TextAnnotationEditor } from './TextAnnotationEditor';
import { SignatureOverlay } from './SignatureOverlay';
import { DrawingCanvasOverlay } from './DrawingCanvasOverlay';
import { ShapeOverlay } from './ShapeOverlay';
import { ImageStampOverlay } from './ImageStampOverlay';
import { ShapeAnnotation, ImageStampAnnotation } from '../types/pdf';
import { Upload, FileCheck2, ShieldCheck, Sparkles, FilePlus, Combine, Download, ZoomIn, ZoomOut, Maximize2, Minimize2, RotateCcw, XCircle, X, Camera, Minus, Plus, Bold, Underline, Type, Palette, Eye, EyeOff, Trash2 } from 'lucide-react';
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
  setTextColor?: (color: string) => void;
  textFontSize?: number;
  setTextFontSize?: (size: number) => void;
  textFontFamily?: string;
  setTextFontFamily?: (family: string) => void;
  textIsRedact?: boolean;
  setTextIsRedact?: (redact: boolean) => void;
  textIsUnderline?: boolean;
  setTextIsUnderline?: (underline: boolean) => void;
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
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
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
  setTextColor,
  textFontSize,
  setTextFontSize,
  textFontFamily,
  setTextFontFamily,
  textIsRedact,
  setTextIsRedact,
  textIsUnderline,
  setTextIsUnderline,
  shapeStrokeColor,
  shapeFillColor,
  shapeStrokeWidth,
  onFocusFormField,
  onOpenSignatureModal,
  activeTheme,
  isFullscreen = false,
  onToggleFullscreen,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const pagesWrapperRef = useRef<HTMLDivElement>(null);
  const canvasRefs = useRef<Map<number, HTMLCanvasElement>>(new Map());
  const [pageDims, setPageDims] = useState<Record<number, PageDims>>({});
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const renderingRef = useRef(false);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const inViewRef = useRef<Set<number>>(new Set());
  const [visibleTrigger, setVisibleTrigger] = useState<number>(0);

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

  const isDrawingToolActive =
    toolMode === 'draw' ||
    toolMode === 'highlight' ||
    toolMode === 'eraser' ||
    toolMode === 'line' ||
    toolMode === 'rectangle' ||
    toolMode === 'oval';

  // Lifted Drawing, Highlighter & Eraser Tool Options States
  const [drawColor, setDrawColor] = useState<string>('#ef4444');
  const [drawThickness, setDrawThickness] = useState<number>(3);
  const [highlightColor, setHighlightColor] = useState<string>('#facc15');
  const [highlightMode, setHighlightMode] = useState<'line' | 'box' | 'freehand'>('line');
  const [highlightThickness, setHighlightThickness] = useState<number>(18);
  const [eraserThickness, setEraserThickness] = useState<number>(12);
  const [eraserColor, setEraserColor] = useState<string>('#ffffff');

  // Text Tool Formatting States
  const [selectedTextAnnId, setSelectedTextAnnId] = useState<string | null>(null);
  const activeTextAnn = selectedTextAnnId ? state.textAnnotations.find((a) => a.id === selectedTextAnnId) : null;
  const currentTextFontSize = activeTextAnn ? activeTextAnn.fontSize : (textFontSize || 14);
  const currentTextTextColor = activeTextAnn ? (activeTextAnn.color || '#000000') : (textColor || '#000000');
  const currentTextIsBold = activeTextAnn ? (activeTextAnn.fontWeight === 'bold' || activeTextAnn.fontWeight === '700' || activeTextAnn.fontWeight === 700 || activeTextAnn.fontWeight === '600') : false;
  const currentTextIsUnderline = activeTextAnn ? !!activeTextAnn.isUnderline : !!textIsUnderline;
  const currentTextIsRedact = activeTextAnn ? !!activeTextAnn.isRedact : !!textIsRedact;

  const [textSizeInput, setTextSizeInput] = useState<string>(String(currentTextFontSize));
  useEffect(() => {
    setTextSizeInput(String(currentTextFontSize));
  }, [currentTextFontSize]);

  const handleApplyTextFontSize = (val: number) => {
    const clamped = Math.max(4, Math.min(150, val));
    if (selectedTextAnnId) {
      onUpdateAnnotation(selectedTextAnnId, { fontSize: clamped });
    }
    if (setTextFontSize) {
      setTextFontSize(clamped);
    }
  };

  const handleApplyTextTextColor = (color: string) => {
    if (selectedTextAnnId) {
      onUpdateAnnotation(selectedTextAnnId, { color });
    }
    if (setTextColor) {
      setTextColor(color);
    }
  };

  const handleToggleTextBold = () => {
    const next = currentTextIsBold ? 'normal' : 'bold';
    if (selectedTextAnnId) {
      onUpdateAnnotation(selectedTextAnnId, { fontWeight: next });
    }
  };

  const handleToggleTextUnderline = () => {
    const next = !currentTextIsUnderline;
    if (selectedTextAnnId) {
      onUpdateAnnotation(selectedTextAnnId, { isUnderline: next });
    }
    if (setTextIsUnderline) {
      setTextIsUnderline(next);
    }
  };

  const handleToggleTextRedact = () => {
    const next = !currentTextIsRedact;
    if (selectedTextAnnId) {
      onUpdateAnnotation(selectedTextAnnId, { isRedact: next });
    }
    if (setTextIsRedact) {
      setTextIsRedact(next);
    }
  };

  // True Fit to Screen: calculates actual viewport bounds subtracting headers/paddings
  const handleFitToScreen = useCallback(() => {
    const container = containerRef.current;
    if (!container || activePages.length === 0) return;

    const currentIdx = activePages[currentPage - 1] ?? activePages[0];
    const pageObj = state.pages[currentIdx];
    const baseW = pageObj?.width || 612;
    const baseH = pageObj?.height || 792;
    const rot = state.pageRotations[currentIdx] || 0;
    const isSwapped = rot % 180 !== 0;
    const origW = isSwapped ? baseH : baseW;
    const origH = isSwapped ? baseW : baseH;

    const padX = window.innerWidth < 640 ? 16 : 48;
    const padY = window.innerWidth < 640 ? 80 : 120;
    const availW = Math.max(100, container.clientWidth - padX);
    const availH = Math.max(100, container.clientHeight - padY);

    const fitScale = Math.min(availW / origW, availH / origH);
    const targetZoom = Math.max(0.15, Math.min(5.0, Math.floor(fitScale * 100) / 100));
    onZoomChange(targetZoom);
  }, [state.pages, state.pageRotations, activePages, currentPage, onZoomChange]);

  // Track multi-touch pinch & touch drag state so lifting fingers after a pinch or drag never triggers double-tap zoom reset
  const lastTapRef = useRef<number>(0);
  const lastTapPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const lastMultiTouchTimeRef = useRef<number>(0);
  const didTouchMoveRef = useRef<boolean>(false);
  const isPinchingRef = useRef<boolean>(false);

  // Double-tap and double-click zoom reset / toggle (strictly single-finger tap, never after pinch/drag)
  const handlePageTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    const now = Date.now();
    // Ignore if any finger is still down, or if this touch was part of a 2-finger pinch or drag pan
    if (
      e.touches.length > 0 ||
      e.changedTouches.length !== 1 ||
      isPinchingRef.current ||
      didTouchMoveRef.current ||
      now - lastMultiTouchTimeRef.current < 550
    ) {
      lastTapRef.current = 0;
      return;
    }

    // Ignore taps on interactive overlay items (images, signatures, shapes, text boxes, buttons)
    const target = e.target as HTMLElement | null;
    if (
      target &&
      target.closest(
        '.image-stamp-element, .signature-element, .shape-element, .text-annotation-element, button, input, textarea, select'
      )
    ) {
      lastTapRef.current = 0;
      return;
    }

    const touch = e.changedTouches[0];
    const tapDist = Math.hypot(touch.clientX - lastTapPosRef.current.x, touch.clientY - lastTapPosRef.current.y);

    if (now - lastTapRef.current < 300 && tapDist < 36) {
      if (Math.abs(zoom - 1.0) < 0.05) {
        handleFitToScreen();
      } else {
        onZoomChange(1.0);
      }
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
      lastTapPosRef.current = { x: touch.clientX, y: touch.clientY };
    }
  };

  const handlePageDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement | null;
    if (
      target &&
      target.closest(
        '.image-stamp-element, .signature-element, .shape-element, .text-annotation-element, button, input, textarea, select'
      )
    ) {
      return;
    }
    if (Math.abs(zoom - 1.0) < 0.05) {
      handleFitToScreen();
    } else {
      onZoomChange(1.0);
    }
  };

  // Fullscreen Escape key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen && onToggleFullscreen) {
        onToggleFullscreen();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, onToggleFullscreen]);

  // Ctrl/Cmd + Mouse Wheel Zooming directly on document canvas (clamped to 15% - 500%)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY < 0 ? 0.15 : -0.15;
        const newZoom = Math.max(0.15, Math.min(5.0, zoom + delta));
        onZoomChange(Math.round(newZoom * 100) / 100);
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [zoom, onZoomChange, Boolean(state.fileBytes)]);

  // Keep ref for smooth zoom scaling without stale closure issues
  const zoomRef = useRef(zoom);
  const prevZoomRef = useRef(zoom);
  const pinchFocalRef = useRef<{ x: number; y: number; active: boolean }>({ x: 0, y: 0, active: false });
  const [pinchRenderTrigger, setPinchRenderTrigger] = useState(0);

  // Synchronously anchor scroll position to the pinch midpoint right after React updates page width/height in DOM
  useLayoutEffect(() => {
    const container = containerRef.current;
    const prevZoom = prevZoomRef.current;
    prevZoomRef.current = zoom;
    if (!container) return;

    if (Math.abs(zoom - prevZoom) < 0.001) return;

    if (pinchFocalRef.current.active && prevZoom > 0) {
      const ratio = zoom / prevZoom;
      const focalX = pinchFocalRef.current.x;
      const focalY = pinchFocalRef.current.y;
      container.scrollLeft = Math.max(0, (container.scrollLeft + focalX) * ratio - focalX);
      container.scrollTop = Math.max(0, (container.scrollTop + focalY) * ratio - focalY);
    }
  }, [zoom]);

  // Touch Pinch-to-Zoom & 1-Finger Drag Panning with clamped 15% floor & focal-point stability
  useEffect(() => {
    let initialTouchDist = 0;
    let initialZoom = zoomRef.current;
    let isPanning = false;
    let startX = 0;
    let startY = 0;
    let lastPanX = 0;
    let lastPanY = 0;
    let lastPanTime = 0;
    let velX = 0;
    let velY = 0;
    let inertiaRafId: number | null = null;
    let pinchRafId: number | null = null;
    let pendingZoom: number | null = null;
    let startScrollLeft = 0;
    let startScrollTop = 0;

    const stopInertia = () => {
      if (inertiaRafId !== null) {
        cancelAnimationFrame(inertiaRafId);
        inertiaRafId = null;
      }
      velX = 0;
      velY = 0;
    };

    const getTouchDist = (e: TouchEvent) => {
      if (e.touches.length < 2) return 0;
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      return Math.hypot(dx, dy);
    };

    const getTouchMidpoint = (e: TouchEvent, container: HTMLElement) => {
      const rect = container.getBoundingClientRect();
      const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left;
      const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top;
      return { midX, midY };
    };

    const isInteractiveOverlayTarget = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) return false;
      return Boolean(
        target.closest(
          '.image-stamp-element, .signature-element, .shape-element, .text-annotation-element, button, input, textarea, select'
        )
      );
    };

    const isDrawingToolActive =
      toolMode === 'draw' ||
      toolMode === 'highlight' ||
      toolMode === 'eraser' ||
      toolMode === 'line' ||
      toolMode === 'rectangle' ||
      toolMode === 'oval';

    const beginPinch = (e: TouchEvent, container: HTMLElement) => {
      stopInertia();
      initialTouchDist = getTouchDist(e);
      initialZoom = zoomRef.current;
      const { midX, midY } = getTouchMidpoint(e, container);
      pinchFocalRef.current = { x: midX, y: midY, active: true };
      isPanning = false;
      isPinchingRef.current = true;
      didTouchMoveRef.current = true;
      lastMultiTouchTimeRef.current = Date.now();
      lastTapRef.current = 0;
    };

    const handleTouchStart = (e: TouchEvent) => {
      const container = containerRef.current;
      const target = e.target as HTMLElement | null;
      if (!container || !target || !container.contains(target)) return;

      stopInertia();

      if (e.touches.length >= 2) {
        // If user is 2-finger pinching directly on a selected image stamp, let ImageStampOverlay handle image resize
        if (target.closest('.image-stamp-element')) {
          lastMultiTouchTimeRef.current = Date.now();
          isPanning = false;
          return;
        }
        if (e.cancelable) e.preventDefault();
        beginPinch(e, container);
      } else if (e.touches.length === 1) {
        didTouchMoveRef.current = false;
        pinchFocalRef.current.active = false;
        if (!isDrawingToolActive && !isInteractiveOverlayTarget(target)) {
          isPanning = true;
          startX = e.touches[0].clientX;
          startY = e.touches[0].clientY;
          lastPanX = startX;
          lastPanY = startY;
          lastPanTime = performance.now();
          startScrollLeft = container.scrollLeft;
          startScrollTop = container.scrollTop;
        } else {
          isPanning = false;
        }
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      const container = containerRef.current;
      const target = e.target as HTMLElement | null;
      if (!container || !target || !container.contains(target)) return;

      if (e.touches.length >= 2) {
        lastMultiTouchTimeRef.current = Date.now();
        didTouchMoveRef.current = true;
        if (target.closest('.image-stamp-element')) {
          isPanning = false;
          return;
        }
        if (e.cancelable) e.preventDefault();

        // If 2nd finger joined mid-gesture, initialize pinch baseline smoothly from current zoom
        if (initialTouchDist <= 0 || !isPinchingRef.current) {
          beginPinch(e, container);
          return;
        }

        const currentDist = getTouchDist(e);
        if (currentDist > 8 && initialTouchDist > 8) {
          const scaleRatio = currentDist / initialTouchDist;
          const rawZoom = initialZoom * scaleRatio;
          const newZoom = Math.max(0.2, Math.min(4.0, Math.round(rawZoom * 100) / 100));
          const { midX, midY } = getTouchMidpoint(e, container);
          pinchFocalRef.current = { x: midX, y: midY, active: true };

          if (Math.abs(newZoom - zoomRef.current) >= 0.01) {
            zoomRef.current = newZoom;
            pendingZoom = newZoom;
            if (pinchRafId === null) {
              pinchRafId = requestAnimationFrame(() => {
                pinchRafId = null;
                if (pendingZoom !== null) {
                  onZoomChange(pendingZoom);
                }
              });
            }
          }
        }
      } else if (isPanning && e.touches.length === 1 && !isDrawingToolActive) {
        if (Date.now() - lastMultiTouchTimeRef.current < 220) return;
        const curX = e.touches[0].clientX;
        const curY = e.touches[0].clientY;
        const dx = curX - startX;
        const dy = curY - startY;

        if (Math.hypot(dx, dy) > 6) {
          didTouchMoveRef.current = true;
          if (e.cancelable) e.preventDefault();
        }

        const now = performance.now();
        const dt = Math.max(1, now - lastPanTime);
        velX = (lastPanX - curX) / dt;
        velY = (lastPanY - curY) / dt;
        lastPanX = curX;
        lastPanY = curY;
        lastPanTime = now;

        container.scrollLeft = startScrollLeft - dx;
        container.scrollTop = startScrollTop - dy;
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const container = containerRef.current;
      const wasPinching = isPinchingRef.current;

      if (wasPinching || e.touches.length >= 1) {
        lastMultiTouchTimeRef.current = Date.now();
      }

      if (e.touches.length < 2) {
        initialTouchDist = 0;
        isPinchingRef.current = false;
        if (wasPinching) {
          // Prevent the remaining 1 finger from jerking the scroll position
          isPanning = false;
          pinchFocalRef.current.active = false;
          setPinchRenderTrigger((prev) => prev + 1);

        }
      }

      if (e.touches.length === 0) {
        if (isPanning && didTouchMoveRef.current && container && !wasPinching) {
          const timeSinceLastMove = performance.now() - lastPanTime;
          if (timeSinceLastMove < 80 && Math.hypot(velX, velY) > 0.15) {
            let stepVx = velX * 16;
            let stepVy = velY * 16;
            const runInertia = () => {
              if (!containerRef.current) return;
              containerRef.current.scrollLeft += stepVx;
              containerRef.current.scrollTop += stepVy;
              stepVx *= 0.92;
              stepVy *= 0.92;
              if (Math.hypot(stepVx, stepVy) > 0.5) {
                inertiaRafId = requestAnimationFrame(runInertia);
              } else {
                inertiaRafId = null;
              }
            };
            inertiaRafId = requestAnimationFrame(runInertia);
          }
        }
        isPanning = false;
        pinchFocalRef.current.active = false;
      }
    };

    const preventSafariGesture = (e: Event) => {
      e.preventDefault();
    };

    window.addEventListener('gesturestart', preventSafariGesture, { passive: false });
    window.addEventListener('gesturechange', preventSafariGesture, { passive: false });
    window.addEventListener('gestureend', preventSafariGesture, { passive: false });

    window.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    return () => {
      stopInertia();
      if (pinchRafId !== null) cancelAnimationFrame(pinchRafId);
      window.removeEventListener('gesturestart', preventSafariGesture);
      window.removeEventListener('gesturechange', preventSafariGesture);
      window.removeEventListener('gestureend', preventSafariGesture);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [toolMode, onZoomChange, Boolean(state.fileBytes)]);

  // Track pages currently visible in viewport via IntersectionObserver without React state thrashing
  useEffect(() => {
    const container = containerRef.current;
    if (!container || activePages.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        let hasNewlyVisible = false;
        for (const entry of entries) {
          const pageIndexStr = entry.target.getAttribute('data-orig-idx');
          if (pageIndexStr !== null) {
            const idx = parseInt(pageIndexStr, 10);
            if (entry.isIntersecting) {
              if (!inViewRef.current.has(idx)) {
                inViewRef.current.add(idx);
                hasNewlyVisible = true;
              }
            } else {
              inViewRef.current.delete(idx);
            }
          }
        }
        if (hasNewlyVisible) {
          setVisibleTrigger((prev) => prev + 1);
        }
      },
      {
        root: container,
        rootMargin: '400px 0px 400px 0px',
        threshold: 0.01,
      }
    );

    const pageElements = container.querySelectorAll('.pdf-document-page');
    pageElements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [activePages, Boolean(state.fileBytes)]);

  // LAZY PAGE RENDERING:
  // Renders the currently visible page and adjacent pages, prioritizing current page (< 200ms)
  useEffect(() => {
    if (!state.fileBytes || activePages.length === 0) {
      setPageDims({});
      return;
    }

    // While user is actively pinching with 2 fingers, let CSS scale the existing canvas at 60fps
    // and wait until fingers pause or lift to run the heavy high-DPI PDF.js render
    const isActivelyPinching = isPinchingRef.current;

    let cancelled = false;
    renderingRef.current = true;

    if (!isActivelyPinching) {
      pdfRenderer.cancelAllRenders();
    }

    const renderVisiblePages = async () => {
      // 1. Determine active window of pages to render: current page + immediate adjacent pages
      const currentSeq = Math.max(0, Math.min(activePages.length - 1, currentPage - 1));
      const targetSeqIndices: number[] = [currentSeq];
      if (currentSeq + 1 < activePages.length) targetSeqIndices.push(currentSeq + 1);
      if (currentSeq - 1 >= 0) targetSeqIndices.push(currentSeq - 1);

      const targetOrigIndices = new Set<number>(targetSeqIndices.map((s) => activePages[s]));
      // Include any page elements detected in-view by IntersectionObserver
      inViewRef.current.forEach((idx) => targetOrigIndices.add(idx));

      // Cancel tasks for canvases that are NOT in target pages
      for (const [origIdx, canvas] of canvasRefs.current.entries()) {
        if (!targetOrigIndices.has(origIdx)) {
          pdfRenderer.cancelRender(canvas);
        }
      }

      // Prioritize current page first for instant visual feedback (< 200ms)
      const currentIdx = activePages[currentSeq];
      const orderedPages = currentIdx !== undefined
        ? [currentIdx, ...Array.from(targetOrigIndices).filter((idx) => idx !== currentIdx)]
        : Array.from(targetOrigIndices);

      for (const origIdx of orderedPages) {
        if (cancelled) break;
        const canvas = canvasRefs.current.get(origIdx);
        if (!canvas) continue;
        try {
          const rot = state.pageRotations[origIdx] || 0;
          const dims = await pdfRenderer.renderPageToCanvas(origIdx, canvas, zoom, rot, state.fileBytes);
          if (!cancelled) {
            setPageDims((prev) => {
              const cur = prev[origIdx];
              if (
                cur &&
                cur.width === dims.width &&
                cur.height === dims.height &&
                cur.originalWidth === dims.originalWidth &&
                cur.originalHeight === dims.originalHeight
              ) {
                return prev;
              }
              return { ...prev, [origIdx]: dims };
            });
          }
        } catch (err: any) {
          if (err?.name !== 'RenderingCancelledException') {
            console.error(`Error rendering page ${origIdx}:`, err);
          }
        }
      }
    };

    const debounceMs = isActivelyPinching ? 160 : 20;
    const debounceTimer = setTimeout(() => {
      renderVisiblePages().finally(() => { renderingRef.current = false; });
    }, debounceMs);

    return () => {
      clearTimeout(debounceTimer);
      cancelled = true;
      if (!isPinchingRef.current) {
        pdfRenderer.cancelAllRenders();
      }
    };
  }, [state.fileBytes, state.pageOrder, state.deletedPages, state.pageRotations, zoom, currentPage, visibleTrigger, pinchRenderTrigger]);

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

  const isLight = activeTheme?.id === 'light_pearl' || activeTheme?.id === 'gold_sunlight';

  // Show landing page when no document loaded (and not loading)
  if (!state.fileBytes && !isLoading) {
    return (
      <main
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className={`flex-1 overflow-y-auto flex flex-col items-center justify-start sm:justify-center p-4 sm:p-6 min-h-0 ${activeTheme?.bgClass || 'bg-slate-950'} ${isLight ? 'text-slate-900' : 'text-slate-100'} relative transition-colors duration-500`}
      >
        {/* Background glows */}
        <div className="absolute w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-3xl pointer-events-none -top-40 -left-40" />
        <div className="absolute w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-3xl pointer-events-none -bottom-40 -right-40" />

        <div className={`relative max-w-xl w-full p-10 rounded-3xl border-2 border-dashed flex flex-col items-center text-center backdrop-blur-xl transition-all ${
          isDragOver
            ? 'border-cyan-400 bg-cyan-950/50 scale-105 shadow-2xl shadow-cyan-500/30 ring-2 ring-cyan-400/50'
            : isLight
            ? 'border-slate-300 bg-white/95 text-slate-900 shadow-2xl'
            : 'border-slate-700/80 bg-slate-900/70 hover:border-cyan-500/60 shadow-xl'
        }`}>
          <div className="w-20 h-20 rounded-2xl overflow-hidden mb-6 shadow-2xl shadow-cyan-500/30 ring-2 ring-cyan-500/40">
            <img src={appLogo} alt="PDF Engine Studio Logo" className="w-full h-full object-cover" />
          </div>
          <h2 className={`text-2xl font-extrabold ${isLight ? 'text-slate-900' : 'text-white'} mb-2 tracking-tight`}>ISASecuredPDF Suite</h2>
          <p className={`text-xs sm:text-sm ${isLight ? 'text-slate-700' : 'text-slate-400'} mb-8 max-w-md leading-relaxed`}>
            100% client-side air-gapped PDF engine. <span className="text-cyan-600 font-semibold">Drag & drop PDF anywhere or choose an option below</span>. No data ever leaves your device.
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
    <div className="relative flex-1 h-full w-full overflow-hidden flex flex-col select-none">
      {/* Floating Close Button: Anchored to page viewer, in line with viewer, strictly below HeaderToolbar */}
      {onCloseDocument && (
        <div className="absolute top-3 sm:top-4 right-3 sm:right-6 z-40 pointer-events-auto">
          <button
            onClick={onCloseDocument}
            className="p-2 sm:p-2.5 bg-slate-950/20 hover:bg-rose-950/40 text-rose-400/50 hover:text-rose-300 border border-white/10 hover:border-rose-500/30 rounded-xl shadow-2xl backdrop-blur-md transition active:scale-95 group"
            title="Close document"
          >
            <X className="w-4 h-4 text-rose-400/50 group-hover:text-rose-300 group-hover:scale-110 transition duration-200" />
          </button>
        </div>
      )}

      {/* Floating Exit Fullscreen pill when reading mode active: 80% transparent backdrop, 50% transparent text & symbols */}
      {isFullscreen && onToggleFullscreen && (
        <div className="absolute top-3 sm:top-4 left-1/2 transform -translate-x-1/2 z-40 pointer-events-auto">
          <button
            onClick={onToggleFullscreen}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-950/20 hover:bg-slate-900/60 text-white/50 hover:text-white border border-white/10 hover:border-cyan-500/40 rounded-full shadow-2xl backdrop-blur-md transition active:scale-95 text-xs font-bold group"
            title="Exit Fullscreen (Esc)"
          >
            <Minimize2 className="w-3.5 h-3.5 text-white/50 group-hover:text-cyan-300 transition" />
            <span className="text-white/50 group-hover:text-white transition">Exit Fullscreen</span>
          </button>
        </div>
      )}

      {/* Floating Canvas Zoom Controls: 70% transparent backdrop */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-30 pointer-events-auto flex items-center space-x-1.5 px-3 py-2 bg-slate-950/70 backdrop-blur-md border border-white/10 rounded-full shadow-2xl text-white/50">
        <button
          onClick={() => onZoomChange(Math.max(0.15, Math.round((zoom - 0.15) * 100) / 100))}
          className="p-1.5 text-white/50 hover:text-white rounded-full hover:bg-white/10 transition"
          title="Zoom Out (Ctrl + Scroll Down)"
        >
          <ZoomOut className="w-4 h-4 text-white/50 hover:text-white transition" />
        </button>

        <span className="text-xs font-mono font-bold w-12 text-center text-white/50 hover:text-white transition">
          {Math.round(zoom * 100)}%
        </span>

        <button
          onClick={() => onZoomChange(Math.min(5.0, Math.round((zoom + 0.15) * 100) / 100))}
          className="p-1.5 text-white/50 hover:text-white rounded-full hover:bg-white/10 transition"
          title="Zoom In (Ctrl + Scroll Up)"
        >
          <ZoomIn className="w-4 h-4 text-white/50 hover:text-white transition" />
        </button>

        <div className="h-4 w-px bg-white/10 my-auto mx-1" />

        <button
          onClick={() => onZoomChange(1.0)}
          className="px-2.5 py-1 text-[11px] font-semibold bg-white/5 hover:bg-white/15 text-white/50 hover:text-white border border-white/10 rounded-full transition"
          title="Reset Zoom to 100%"
        >
          100%
        </button>

        <button
          onClick={handleFitToScreen}
          className="px-2.5 py-1 text-[11px] font-bold bg-white/5 hover:bg-cyan-500/20 text-white/50 hover:text-cyan-300 border border-white/10 hover:border-cyan-500/30 rounded-full transition shadow-sm"
          title="Auto Fit Page to Screen"
        >
          Fit Screen
        </button>

        {onToggleFullscreen && (
          <>
            <div className="h-4 w-px bg-white/10 my-auto mx-1" />
            <button
              onClick={onToggleFullscreen}
              className={`p-1.5 rounded-full transition ${
                isFullscreen
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow'
                  : 'text-white/50 hover:text-white hover:bg-white/10'
              }`}
              title={isFullscreen ? 'Exit Fullscreen (Esc)' : 'Fullscreen Reading Mode'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4 text-white/50 hover:text-white" />}
            </button>
          </>
        )}
      </div>

      {/* Floating Secondary Tool Options Bar - Pinned Directly Under HeaderToolbar in Viewport */}
      {(toolMode === 'draw' || toolMode === 'highlight' || toolMode === 'eraser' || toolMode === 'text') && (
        <div
          className="absolute top-2 sm:top-3 left-1/2 -translate-x-1/2 z-30 pointer-events-auto max-w-[calc(100vw-16px)] sm:max-w-2xl bg-slate-900/95 border border-slate-700/80 backdrop-blur-md rounded-2xl px-2.5 py-1.5 flex items-center gap-1.5 sm:gap-2 shadow-2xl text-xs select-none animate-fadeIn overflow-x-auto scrollbar-none"
          onClick={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
        >
          {toolMode === 'eraser' && (
            <>
              <div className="flex items-center gap-1 text-[10px] font-bold text-amber-400 shrink-0">
                <span>🧹</span>
                <span>Eraser</span>
              </div>

              {/* Adopted PDF Background Color */}
              <div className="flex items-center gap-1 pl-1 border-l border-slate-700 shrink-0" title={`Erasing with PDF color: ${eraserColor}`}>
                <span className="text-[9px] text-slate-400">Color:</span>
                <span
                  className="w-4 h-4 rounded-full border border-white/70 shadow-sm shrink-0"
                  style={{ backgroundColor: eraserColor }}
                />
                <button
                  type="button"
                  onClick={() => setEraserColor('#ffffff')}
                  className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition ${
                    eraserColor.toLowerCase() === '#ffffff'
                      ? 'bg-amber-500 text-slate-950 shadow'
                      : 'bg-slate-800 text-slate-300 hover:text-white'
                  }`}
                  title="Force White Erase"
                >
                  White
                </button>
              </div>

              <div className="w-px h-3.5 bg-slate-700 mx-0.5 shrink-0" />

              {/* Eraser Stroke Thickness Presets */}
              <div className="flex items-center gap-1 shrink-0">
                {[
                  { label: '4px', size: 4 },
                  { label: '8px', size: 8 },
                  { label: '16px', size: 16 },
                  { label: '32px', size: 32 },
                ].map((s) => (
                  <button
                    key={s.size}
                    type="button"
                    onClick={() => setEraserThickness(s.size)}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition flex items-center gap-1 ${
                      eraserThickness === s.size
                        ? 'bg-amber-500 text-slate-950 shadow'
                        : 'bg-slate-800 text-slate-300 hover:text-white'
                    }`}
                  >
                    <span>{s.label}</span>
                  </button>
                ))}
              </div>
            </>
          )}

          {toolMode === 'draw' && (
            <>
              <div className="flex items-center gap-1 text-[10px] font-bold text-cyan-400 shrink-0">
                <span>✏️</span>
                <span>Pen</span>
              </div>

              <div className="w-px h-3.5 bg-slate-700 mx-0.5 shrink-0" />

              {/* Pencil Palette Colors */}
              <div className="flex items-center gap-1 shrink-0">
                {['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#000000'].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setDrawColor(c)}
                    className={`w-4 h-4 rounded-full border transition shrink-0 ${
                      drawColor === c
                        ? 'scale-125 border-white ring-2 ring-cyan-400 shadow'
                        : 'border-white/30 opacity-80 hover:opacity-100 hover:scale-110'
                    }`}
                    style={{ backgroundColor: c }}
                    title={`Color ${c}`}
                  />
                ))}
              </div>

              <div className="w-px h-3.5 bg-slate-700 mx-0.5 shrink-0" />

              {/* Stroke Thickness Presets */}
              <div className="flex items-center gap-1 shrink-0">
                {[
                  { label: '2px', size: 2 },
                  { label: '5px', size: 5 },
                  { label: '10px', size: 10 },
                  { label: '16px', size: 16 },
                ].map((s) => (
                  <button
                    key={s.size}
                    type="button"
                    onClick={() => setDrawThickness(s.size)}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition flex items-center gap-1 ${
                      drawThickness === s.size
                        ? 'bg-cyan-500 text-white shadow'
                        : 'bg-slate-800 text-slate-300 hover:text-white'
                    }`}
                  >
                    <span
                      className="rounded-full inline-block"
                      style={{
                        width: `${Math.min(6, Math.max(2, s.size / 2))}px`,
                        height: `${Math.min(6, Math.max(2, s.size / 2))}px`,
                        backgroundColor: drawColor,
                      }}
                    />
                    <span>{s.label}</span>
                  </button>
                ))}
              </div>
            </>
          )}

          {toolMode === 'highlight' && (
            <>
              {/* Highlighter Mode Buttons */}
              <div className="flex items-center gap-1 shrink-0">
                {[
                  { mode: 'line' as const, label: 'Line', icon: '📏' },
                  { mode: 'box' as const, label: 'Box', icon: '📦' },
                  { mode: 'freehand' as const, label: 'Pen', icon: '✏️' },
                ].map((m) => (
                  <button
                    key={m.mode}
                    type="button"
                    onClick={() => setHighlightMode(m.mode)}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 transition ${
                      highlightMode === m.mode
                        ? 'bg-yellow-500 text-slate-950 shadow'
                        : 'bg-slate-800 text-slate-300 hover:text-white'
                    }`}
                  >
                    <span>{m.icon}</span>
                    <span>{m.label}</span>
                  </button>
                ))}
              </div>

              <div className="w-px h-3.5 bg-slate-700 mx-0.5 shrink-0" />

              {/* Highlighter Colors */}
              <div className="flex items-center gap-1 shrink-0">
                {['#facc15', '#4ade80', '#38bdf8', '#f472b6', '#fb923c', '#c084fc'].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setHighlightColor(c)}
                    className={`w-4 h-4 rounded-full border transition shrink-0 ${
                      highlightColor === c
                        ? 'scale-125 border-white ring-2 ring-yellow-400 shadow'
                        : 'border-white/30 opacity-80 hover:opacity-100 hover:scale-110'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>

              {/* Highlighter Thickness (freehand mode) */}
              {highlightMode === 'freehand' && (
                <>
                  <div className="w-px h-3.5 bg-slate-700 mx-0.5 shrink-0" />
                  <div className="flex items-center gap-1 shrink-0">
                    {[
                      { label: '10px', size: 10 },
                      { label: '18px', size: 18 },
                      { label: '28px', size: 28 },
                    ].map((s) => (
                      <button
                        key={s.size}
                        type="button"
                        onClick={() => setHighlightThickness(s.size)}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition ${
                          highlightThickness === s.size
                            ? 'bg-yellow-500 text-slate-950 shadow'
                            : 'bg-slate-800 text-slate-300 hover:text-white'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </>
          )}

          {toolMode === 'text' && (
            <>
              {/* Label */}
              <div className="flex items-center gap-1 text-[10px] font-bold text-cyan-400 shrink-0">
                <Type className="w-3.5 h-3.5" />
                <span>Text</span>
              </div>

              <div className="w-px h-3.5 bg-slate-700 mx-0.5 shrink-0" />

              {/* Unfrozen Direct Number Font Size Input & Stepper */}
              <div className="flex items-center space-x-0.5 bg-slate-950 rounded px-1.5 py-0.5 border border-slate-700 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    const next = Math.max(4, Math.round((currentTextFontSize - 1) * 2) / 2);
                    setTextSizeInput(String(next));
                    handleApplyTextFontSize(next);
                  }}
                  title="Decrease Font Size (-1pt)"
                  className="p-0.5 hover:bg-slate-800 rounded text-slate-300 hover:text-white transition"
                >
                  <Minus className="w-3 h-3" />
                </button>

                <div className="flex items-center">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={textSizeInput}
                    onChange={(e) => {
                      const val = e.target.value;
                      setTextSizeInput(val);
                      const n = parseFloat(val);
                      if (!isNaN(n) && n > 0 && n <= 150) {
                        handleApplyTextFontSize(n);
                      }
                    }}
                    onBlur={() => {
                      const n = parseFloat(textSizeInput);
                      if (isNaN(n) || n < 1) {
                        setTextSizeInput(String(currentTextFontSize));
                      } else {
                        const clamped = Math.max(4, Math.min(150, n));
                        setTextSizeInput(String(clamped));
                        handleApplyTextFontSize(clamped);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        (e.target as HTMLInputElement).blur();
                      }
                    }}
                    className="w-8 bg-transparent text-[11px] font-extrabold font-mono text-cyan-300 text-center outline-none border-none p-0 select-text"
                    title="Direct Font Size (pt) - Type numbers directly"
                  />
                  <span className="text-[9px] font-mono text-slate-400 select-none pr-0.5">pt</span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const next = Math.min(150, Math.round((currentTextFontSize + 1) * 2) / 2);
                    setTextSizeInput(String(next));
                    handleApplyTextFontSize(next);
                  }}
                  title="Increase Font Size (+1pt)"
                  className="p-0.5 hover:bg-slate-800 rounded text-slate-300 hover:text-white transition"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>

              {/* Bold Toggle */}
              <button
                type="button"
                onClick={handleToggleTextBold}
                title="Toggle Bold"
                className={`p-1 rounded transition shrink-0 ${
                  currentTextIsBold
                    ? 'bg-cyan-500 text-white font-bold'
                    : 'hover:bg-slate-800 text-slate-300'
                }`}
              >
                <Bold className="w-3.5 h-3.5" />
              </button>

              {/* Underline Toggle */}
              <button
                type="button"
                onClick={handleToggleTextUnderline}
                title="Toggle Underline"
                className={`p-1 rounded transition shrink-0 ${
                  currentTextIsUnderline ? 'bg-cyan-500 text-white font-bold' : 'hover:bg-slate-800 text-slate-300'
                }`}
              >
                <Underline className="w-3.5 h-3.5" />
              </button>

              <div className="w-px h-3.5 bg-slate-700 mx-0.5 shrink-0" />

              {/* Color Swatches */}
              <div className="flex items-center gap-1 shrink-0">
                {['#000000', '#1e3a8a', '#dc2626', '#58595b'].map((color) => {
                  const isSelected = currentTextTextColor.toLowerCase() === color.toLowerCase();
                  return (
                    <button
                      key={color}
                      type="button"
                      onClick={() => handleApplyTextTextColor(color)}
                      className={`w-3.5 h-3.5 rounded-full border transition shrink-0 ${
                        isSelected
                          ? 'scale-125 border-white ring-2 ring-cyan-400 shadow-md'
                          : 'border-slate-600 opacity-80 hover:opacity-100 hover:scale-110'
                      }`}
                      style={{ backgroundColor: color }}
                      title={`Select ${color}`}
                    />
                  );
                })}

                {/* Custom Palette Picker */}
                <label
                  title="Custom Color Picker"
                  className="cursor-pointer p-0.5 hover:bg-slate-800 rounded transition flex items-center text-slate-300 hover:text-white shrink-0"
                >
                  <Palette className="w-3.5 h-3.5" />
                  <input
                    type="color"
                    value={currentTextTextColor && currentTextTextColor.startsWith('#') ? currentTextTextColor : '#000000'}
                    onChange={(e) => handleApplyTextTextColor(e.target.value)}
                    className="sr-only"
                  />
                </label>
              </div>

              <div className="w-px h-3.5 bg-slate-700 mx-0.5 shrink-0" />

              {/* Whiteout / Redact Toggle */}
              <button
                type="button"
                onClick={handleToggleTextRedact}
                title={currentTextIsRedact ? 'White cover box active' : 'Plain transparent text'}
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 transition shrink-0 ${
                  currentTextIsRedact
                    ? 'bg-white text-slate-900 shadow'
                    : 'bg-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                {currentTextIsRedact ? <EyeOff className="w-3 h-3 text-red-600" /> : <Eye className="w-3 h-3 text-cyan-400" />}
                <span>Whiteout</span>
              </button>

              {/* Delete Button (when text selected) */}
              {selectedTextAnnId && (
                <>
                  <div className="w-px h-3.5 bg-slate-700 mx-0.5 shrink-0" />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteAnnotation(selectedTextAnnId);
                      setSelectedTextAnnId(null);
                    }}
                    title="Delete Text"
                    className="p-1 hover:bg-red-600/80 rounded text-red-400 hover:text-white transition shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </>
          )}
        </div>
      )}

      <main
        ref={containerRef}
        tabIndex={0}
        style={{ touchAction: isDrawingToolActive ? 'none' : 'pan-x pan-y' }}
        className={`flex-1 h-full overflow-y-auto overflow-x-auto max-w-[100vw] ${activeTheme?.bgClass || 'bg-slate-950'} p-2 sm:p-8 pb-24 sm:pb-28 flex flex-col items-start sm:items-center relative focus:outline-none min-w-0 transition-colors duration-500`}
      >
        <div
          ref={pagesWrapperRef}
          className="pdf-pages-wrapper min-w-full flex flex-col items-start sm:items-center space-y-4 sm:space-y-8"
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
            // Dynamic zoom sizing: prevents container from lagging behind canvas resolution
            const w = Math.round(origW * zoom);
            const h = Math.round(origH * zoom);

            return (
              <div
                key={origIdx}
                data-orig-idx={origIdx}
                onTouchEnd={handlePageTouchEnd}
                onDoubleClick={handlePageDoubleClick}
                className="pdf-document-page relative bg-white shadow-2xl my-4 select-none overflow-hidden flex-shrink-0 cursor-default"
                style={{ width: `${w}px`, height: `${h}px`, touchAction: isDrawingToolActive ? 'none' : 'pan-x pan-y' }}
              >
                <canvas
                  ref={(el) => {
                    if (el) canvasRefs.current.set(origIdx, el);
                    else canvasRefs.current.delete(origIdx);
                  }}
                  className="block w-full h-full"
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
                      drawColor={drawColor}
                      thickness={drawThickness}
                      highlightColor={highlightColor}
                      highlightMode={highlightMode}
                      highlightThickness={highlightThickness}
                      eraserThickness={eraserThickness}
                      eraserColor={eraserColor}
                      onSampleEraserColor={setEraserColor}
                      getPageCanvas={() => canvasRefs.current.get(origIdx)}
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
                      selectedAnnotationId={selectedTextAnnId}
                      onSelectAnnotationId={setSelectedTextAnnId}
                      textColor={textColor}
                      setTextColor={setTextColor}
                      textFontSize={textFontSize}
                      setTextFontSize={setTextFontSize}
                      textFontFamily={textFontFamily}
                      setTextFontFamily={setTextFontFamily}
                      textIsRedact={textIsRedact}
                      setTextIsRedact={setTextIsRedact}
                      textIsUnderline={textIsUnderline}
                      setTextIsUnderline={setTextIsUnderline}
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

                {/* Page number badge: 50% transparent */}
                <div className="absolute left-2 sm:-left-14 top-2 bg-slate-900/50 backdrop-blur-sm border border-slate-800/50 text-cyan-300/70 sm:text-slate-400/70 text-[10px] sm:text-[11px] font-mono font-bold px-2 py-0.5 sm:py-1 rounded-full sm:rounded shadow z-30 opacity-50">
                  P.{pageNum}
                </div>
              </div>
            );
          })}
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
    </div>
  );
};
