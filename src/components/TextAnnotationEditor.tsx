import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Trash2, Eye, EyeOff, Move, Clipboard, Minus, Plus, Type, Underline, Bold, Palette, Droplet } from 'lucide-react';
import { TextAnnotation } from '../types/pdf';
import { pdfRenderer, DetectedPDFTextLine } from '../services/pdfRenderer';

interface TextAnnotationEditorProps {
  annotations: TextAnnotation[];
  pageIndex: number;
  canvasWidth: number;
  canvasHeight: number;
  originalWidth: number;
  originalHeight: number;
  onUpdateAnnotation: (id: string, updated: Partial<TextAnnotation>) => void;
  onDeleteAnnotation: (id: string) => void;
  onAddAnnotation: (ann: Omit<TextAnnotation, 'id'>) => void;
  isTextMode: boolean;
  textColor?: string;
  textFontSize?: number;
  textFontFamily?: string;
  textIsRedact?: boolean;
  textIsUnderline?: boolean;
}

export const TextAnnotationEditor: React.FC<TextAnnotationEditorProps> = ({
  annotations,
  pageIndex,
  canvasWidth,
  canvasHeight,
  originalWidth,
  originalHeight,
  onUpdateAnnotation,
  onDeleteAnnotation,
  onAddAnnotation,
  isTextMode,
  textColor,
  textFontSize,
  textFontFamily,
  textIsRedact,
  textIsUnderline,
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detectedLines, setDetectedLines] = useState<DetectedPDFTextLine[]>([]);
  const [hoveredLineId, setHoveredLineId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let isMounted = true;
    if (isTextMode && pageIndex >= 0) {
      pdfRenderer.extractPageTextLines(pageIndex).then((lines) => {
        if (isMounted) setDetectedLines(lines);
      });
    } else {
      setDetectedLines([]);
      setHoveredLineId(null);
    }
    return () => {
      isMounted = false;
    };
  }, [isTextMode, pageIndex]);

  // Drag state for moving text annotations around
  const [dragState, setDragState] = useState<{
    annId: string;
    offsetX: number;
    offsetY: number;
    isToolbarOnly?: boolean;
  } | null>(null);

  // Movable Floating Toolbar Offsets per annotation
  const [toolbarOffsets, setToolbarOffsets] = useState<Record<string, { x: number; y: number }>>({});

  const pageAnnotations = annotations.filter((a) => a.pageIndex === pageIndex);
  const scaleX = originalWidth > 0 ? canvasWidth / originalWidth : 1;
  const scaleY = originalHeight > 0 ? canvasHeight / originalHeight : 1;

  // Dynamic color palette: extracts all detected text colors from current page + universal receipt/invoice colors
  const availableColors = useMemo(() => {
    const set = new Set<string>();
    // Add all detected text colors from page annotations and lines
    pageAnnotations.forEach((a) => {
      if (a.color && a.color.startsWith('#')) set.add(a.color.toLowerCase());
    });
    detectedLines.forEach((l) => {
      if (l.color && l.color.startsWith('#')) set.add(l.color.toLowerCase());
    });
    // Universal Invoice, Receipt, Statement & Brand Colors (Navy, Charcoal, Deep Black, Gray, Cyan, etc.)
    ['#000000', '#17172f', '#555555', '#888888', '#1b365d', '#0094c1', '#aa258d', '#034ea2', '#dc2626', '#16a34a', '#2563eb', '#ffffff'].forEach((c) => set.add(c.toLowerCase()));
    return Array.from(set);
  }, [detectedLines, pageAnnotations]);

  const handlePickColorEyeDropper = async (annId: string) => {
    try {
      if (typeof window !== 'undefined' && 'EyeDropper' in window) {
        const eyeDropper = new (window as any).EyeDropper();
        const result = await eyeDropper.open();
        if (result?.sRGBHex) {
          onUpdateAnnotation(annId, { color: result.sRGBHex });
        }
      } else {
        const input = document.getElementById(`native-color-${annId}`) as HTMLInputElement;
        if (input) input.click();
      }
    } catch (e) {
      // User dismissed eyedropper without picking
    }
  };

  // Global Mouse & Touch Move/Up Handlers for Dragging Text & Floating Toolbar
  useEffect(() => {
    const handleMove = (clientX: number, clientY: number) => {
      if (!dragState || !containerRef.current || originalWidth <= 0 || originalHeight <= 0) return;
      const containerRect = containerRef.current.getBoundingClientRect();

      const mouseX = clientX - containerRect.left;
      const mouseY = clientY - containerRect.top;

      if (dragState.isToolbarOnly) {
        // Move floating toolbar independently
        setToolbarOffsets((prev) => ({
          ...prev,
          [dragState.annId]: {
            x: Math.round(mouseX - dragState.offsetX),
            y: Math.round(mouseY - dragState.offsetY),
          },
        }));
      } else {
        // Move text annotation on PDF page
        const newScreenX = mouseX - dragState.offsetX;
        const newScreenY = mouseY - dragState.offsetY;

        const newPdfX = Math.max(0, Math.min(originalWidth - 30, newScreenX / scaleX));
        const newPdfY = Math.max(0, Math.min(originalHeight - 15, newScreenY / scaleY));

        onUpdateAnnotation(dragState.annId, {
          x: Math.round(newPdfX),
          y: Math.round(newPdfY),
        });
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      handleMove(e.clientX, e.clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (dragState && e.touches.length > 0) {
        e.preventDefault();
        handleMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const handleEnd = () => {
      if (dragState) setDragState(null);
    };

    if (dragState) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleEnd);
      window.addEventListener('touchcancel', handleEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleEnd);
      window.removeEventListener('touchcancel', handleEnd);
    };
  }, [dragState, scaleX, scaleY, originalWidth, originalHeight, onUpdateAnnotation]);

  // Automatically select the newest text annotation when added
  const prevCountRef = useRef(pageAnnotations.length);
  useEffect(() => {
    if (pageAnnotations.length > prevCountRef.current) {
      const newest = pageAnnotations[pageAnnotations.length - 1];
      if (newest) {
        setSelectedId(newest.id);
      }
    }
    prevCountRef.current = pageAnnotations.length;
  }, [pageAnnotations]);

  // Click-outside handler to deselect text handles (and remove empty ones)
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (!selectedId) return;
      const target = e.target as HTMLElement;
      if (!target.closest('.text-annotation-element')) {
        const currentSelected = pageAnnotations.find((a) => a.id === selectedId);
        if (currentSelected && !currentSelected.text.trim()) {
          onDeleteAnnotation(selectedId);
        }
        setSelectedId(null);
      }
    };

    window.addEventListener('mousedown', handleOutsideClick);
    return () => {
      window.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [selectedId, pageAnnotations, onDeleteAnnotation]);

  if (originalWidth <= 0 || originalHeight <= 0) return null;

  const sampleCanvasTextAndBg = (
    screenX: number,
    screenY: number,
    screenW: number,
    screenH: number
  ): { inkColor: string; bgHex: string } => {
    try {
      const canvas = containerRef.current?.parentElement?.querySelector('canvas');
      if (canvas) {
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          // Device pixel ratio (DPR) adjustment between CSS display size and internal pixel buffer
          const dprX = canvas.width / (canvas.clientWidth || canvasWidth || 1);
          const dprY = canvas.height / (canvas.clientHeight || canvasHeight || 1);

          const bufX = Math.round(screenX * dprX);
          const bufY = Math.round(screenY * dprY);
          const bufW = Math.max(1, Math.round(screenW * dprX));
          const bufH = Math.max(1, Math.round(screenH * dprY));

          // 1. Precise background margin sampling in buffer coordinates
          const testMarginPoints = [
            { x: Math.max(1, bufX - Math.round(4 * dprX)), y: Math.max(1, bufY + bufH / 2) },
            { x: Math.min(canvas.width - 2, bufX + bufW + Math.round(4 * dprX)), y: Math.max(1, bufY + bufH / 2) },
            { x: Math.max(1, bufX + bufW / 2), y: Math.max(1, bufY - Math.round(4 * dprY)) },
            { x: Math.max(1, bufX + bufW / 2), y: Math.min(canvas.height - 2, bufY + bufH + Math.round(4 * dprY)) },
          ];

          let bgHex = '#ffffff';
          let bgLum = 255;
          for (const pt of testMarginPoints) {
            const p = ctx.getImageData(Math.round(pt.x), Math.round(pt.y), 1, 1).data;
            if (p[3] > 100) {
              bgLum = 0.299 * p[0] + 0.587 * p[1] + 0.114 * p[2];
              bgHex = '#' + [p[0], p[1], p[2]].map((c) => c.toString(16).padStart(2, '0')).join('');
              break;
            }
          }

          // 2. Sample all pixels inside the text bounding box in buffer coordinates
          const clampX = Math.max(0, Math.min(canvas.width - 1, bufX));
          const clampY = Math.max(0, Math.min(canvas.height - 1, bufY));
          const clampW = Math.max(1, Math.min(canvas.width - clampX, bufW));
          const clampH = Math.max(1, Math.min(canvas.height - clampY, bufH));

          const imgData = ctx.getImageData(clampX, clampY, clampW, clampH);
          const pixels = imgData.data;

          const candidates: { r: number; g: number; b: number; lum: number }[] = [];
          for (let i = 0; i < pixels.length; i += 4) {
            const r = pixels[i];
            const g = pixels[i + 1];
            const b = pixels[i + 2];
            const a = pixels[i + 3];
            if (a > 100) {
              const lum = 0.299 * r + 0.587 * g + 0.114 * b;
              candidates.push({ r, g, b, lum });
            }
          }

          // Contrast-aware sort:
          // If dark background (e.g. Navy table header), text is LIGHT (descending lum)
          // If light background (standard paper), text is DARK (ascending lum)
          if (bgLum < 128) {
            candidates.sort((a, b) => b.lum - a.lum);
          } else {
            candidates.sort((a, b) => a.lum - b.lum);
          }

          let inkColor = bgLum < 128 ? '#ffffff' : '#000000';
          if (candidates.length > 0) {
            const sampleCount = Math.max(1, Math.min(20, Math.floor(candidates.length * 0.08)));
            let sumR = 0;
            let sumG = 0;
            let sumB = 0;
            for (let k = 0; k < sampleCount; k++) {
              sumR += candidates[k].r;
              sumG += candidates[k].g;
              sumB += candidates[k].b;
            }
            const avgR = Math.round(sumR / sampleCount);
            const avgG = Math.round(sumG / sampleCount);
            const avgB = Math.round(sumB / sampleCount);
            const sampledLum = 0.299 * avgR + 0.587 * avgG + 0.114 * avgB;

            // Strict contrast guardrail: NEVER allow low contrast / invisible text
            if (bgLum >= 128) {
              // On light paper, text MUST be dark! If sampled luminance is light, force dark ink
              if (sampledLum > 180) {
                inkColor = '#17172f';
              } else {
                inkColor = '#' + [avgR, avgG, avgB].map((c) => c.toString(16).padStart(2, '0')).join('');
              }
            } else {
              // On dark background, text MUST be light! If sampled luminance is dark, force white
              if (sampledLum < 80) {
                inkColor = '#ffffff';
              } else {
                inkColor = '#' + [avgR, avgG, avgB].map((c) => c.toString(16).padStart(2, '0')).join('');
              }
            }
          }

          return { inkColor, bgHex };
        }
      }
    } catch (e) {}
    return { inkColor: '#000000', bgHex: '#ffffff' };
  };

  const measureTextWidth = (
    text: string,
    fontSize: number,
    fontFamily?: string,
    fontWeight?: string | number
  ): number => {
    if (!text) return 36;
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.font = `${fontWeight || 'normal'} ${fontSize}px ${fontFamily || 'sans-serif'}`;
        const lines = text.split('\n');
        const maxW = Math.max(...lines.map((l) => ctx.measureText(l).width), 0);
        return Math.round(maxW + 4);
      }
    } catch (e) {}
    const lines = text.split('\n');
    const maxChars = Math.max(...lines.map((l) => l.length), 1);
    return Math.round(maxChars * fontSize * 0.55 + 4);
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isTextMode) return;
    
    // Calculate click coordinates in original PDF points
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = (e.clientX - rect.left) / scaleX;
    const clickY = (e.clientY - rect.top) / scaleY;
    const { bgHex } = sampleCanvasTextAndBg(e.clientX - rect.left, e.clientY - rect.top, 50, 20);

    onAddAnnotation({
      pageIndex,
      x: parseFloat(clickX.toFixed(2)),
      y: parseFloat(clickY.toFixed(2)),
      text: '',
      fontSize: textFontSize || 14,
      fontFamily: textFontFamily || "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
      color: textColor || '#000000',
      backgroundColor: bgHex,
      isRedact: textIsRedact || false,
      isUnderline: textIsUnderline || false,
      width: 40,
    });
  };

  const handleLineClick = (e: React.MouseEvent, line: DetectedPDFTextLine) => {
    e.stopPropagation();

    const screenX = line.x * scaleX;
    const screenY = line.y * scaleY;
    const screenW = line.width * scaleX;
    const screenH = line.height * scaleY;
    const { inkColor, bgHex } = sampleCanvasTextAndBg(screenX, screenY, screenW, screenH);

    // Prefer exact vector color from PDF operator stream; fallback to canvas-sampled inkColor
    let chosenInkColor = line.color || inkColor || '#000000';

    // Strict contrast protection: Never allow invisible / low-contrast text
    try {
      const bgR = parseInt(bgHex.slice(1, 3), 16);
      const bgG = parseInt(bgHex.slice(3, 5), 16);
      const bgB = parseInt(bgHex.slice(5, 7), 16);
      const bgLum = 0.299 * bgR + 0.587 * bgG + 0.114 * bgB;

      const inkR = parseInt(chosenInkColor.slice(1, 3), 16);
      const inkG = parseInt(chosenInkColor.slice(3, 5), 16);
      const inkB = parseInt(chosenInkColor.slice(5, 7), 16);
      const inkLum = 0.299 * inkR + 0.587 * inkG + 0.114 * inkB;

      if (bgLum >= 128 && inkLum > 180) {
        chosenInkColor = '#17172f';
      } else if (bgLum < 128 && inkLum < 80) {
        chosenInkColor = '#ffffff';
      }
    } catch (e) {}

    // Measure exact rendered font width to prevent any words wrapping or disappearing
    const measuredInitialW = measureTextWidth(
      line.text,
      line.fontSize,
      line.fontFamily,
      line.fontWeight
    );

    const totalW = Math.max(line.width + 4, measuredInitialW + 4);

    onAddAnnotation({
      pageIndex,
      x: line.x,
      y: line.y, // ZERO padY: Exact line.topY anchored to baseline - (ascent * fontSize)
      text: line.text,
      fontSize: line.fontSize,
      fontFamily: line.fontFamily,
      fontWeight: line.fontWeight || 'normal',
      color: chosenInkColor,
      backgroundColor: bgHex,
      isRedact: true, // Seamlessly masks original text using the EXACT sampled page background color!
      isUnderline: textIsUnderline || false,
      width: parseFloat(totalW.toFixed(2)),
      height: line.height,
    });
  };

  const handleMouseDownDrag = (e: React.MouseEvent, ann: TextAnnotation) => {
    e.stopPropagation();
    setSelectedId(ann.id);

    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const annScreenX = ann.x * scaleX;
    const annScreenY = ann.y * scaleY;

    const mouseScreenX = e.clientX - containerRect.left;
    const mouseScreenY = e.clientY - containerRect.top;

    setDragState({
      annId: ann.id,
      offsetX: mouseScreenX - annScreenX,
      offsetY: mouseScreenY - annScreenY,
    });
  };

  const handleStartToolbarDrag = (clientX: number, clientY: number, annId: string) => {
    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const currentOffset = toolbarOffsets[annId] || { x: 0, y: 4 };

    const mouseX = clientX - containerRect.left;
    const mouseY = clientY - containerRect.top;

    setDragState({
      annId,
      offsetX: mouseX - currentOffset.x,
      offsetY: mouseY - currentOffset.y,
      isToolbarOnly: true,
    });
  };

  const handleTouchStartTextDrag = (e: React.TouchEvent, ann: TextAnnotation) => {
    e.stopPropagation();
    if (!e.touches || e.touches.length === 0 || !containerRef.current) return;
    setSelectedId(ann.id);

    const touch = e.touches[0];
    const containerRect = containerRef.current.getBoundingClientRect();
    const annScreenX = ann.x * scaleX;
    const annScreenY = ann.y * scaleY;

    const mouseScreenX = touch.clientX - containerRect.left;
    const mouseScreenY = touch.clientY - containerRect.top;

    setDragState({
      annId: ann.id,
      offsetX: mouseScreenX - annScreenX,
      offsetY: mouseScreenY - annScreenY,
    });
  };

  const handlePasteClipboard = async (annId: string) => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        onUpdateAnnotation(annId, { text });
      }
    } catch (err) {
      alert('Please use Ctrl+V inside the text area to paste external text.');
    }
  };

  return (
    <div
      ref={containerRef}
      onClick={handleCanvasClick}
      className={`absolute inset-0 z-20 ${
        isTextMode ? 'cursor-crosshair bg-cyan-500/5 ring-2 ring-cyan-500/20 pointer-events-auto' : 'pointer-events-none'
      }`}
      style={{ width: `${canvasWidth}px`, height: `${canvasHeight}px` }}
    >
      {/* Existing Detected Text Lines Overlay (Hover to highlight, click to edit in-place) */}
      {isTextMode &&
        detectedLines.map((line) => {
          // Don't show detected line box if user already edited / placed an annotation over it
          const hasAnnotation = pageAnnotations.some(
            (a) => Math.abs(a.x - line.x) < 25 && Math.abs(a.y - line.y) < 18
          );
          if (hasAnnotation) return null;

          const screenX = line.x * scaleX;
          const screenY = line.y * scaleY;
          const screenW = Math.max(line.width * scaleX, 24);
          const screenH = Math.max(line.height * scaleY, 14);
          const isHovered = hoveredLineId === line.id;

          return (
            <div
              key={line.id}
              onMouseEnter={() => setHoveredLineId(line.id)}
              onMouseLeave={() => setHoveredLineId(null)}
              onClick={(e) => handleLineClick(e, line)}
              className={`absolute pointer-events-auto cursor-text rounded transition-all duration-150 z-10 ${
                isHovered
                  ? 'bg-cyan-500/20 border border-dashed border-cyan-400 shadow-sm ring-2 ring-cyan-400/30'
                  : 'hover:bg-cyan-500/10 hover:border hover:border-dashed hover:border-cyan-400/50'
              }`}
              style={{
                left: `${screenX}px`,
                top: `${screenY}px`,
                width: `${screenW}px`,
                height: `${screenH}px`,
              }}
              title="Click to edit this text in-place"
            >
              {isHovered && (
                <span
                  className={`absolute ${
                    screenY < 24 ? 'top-full mt-1' : '-top-6'
                  } left-0 px-1.5 py-0.5 bg-cyan-600 text-white text-[9px] font-black rounded shadow uppercase tracking-wider whitespace-nowrap pointer-events-none animate-fadeIn`}
                >
                  ✎ Edit Text
                </span>
              )}
            </div>
          );
        })}

      {pageAnnotations.map((ann) => {
        const scaledX = ann.x * scaleX;
        const scaledY = ann.y * scaleY;
        const isSelected = selectedId === ann.id;
        const lines = (ann.text || '').split('\n');
        const lineCount = Math.max(1, lines.length);
        const dynamicW = measureTextWidth(ann.text, ann.fontSize, ann.fontFamily || textFontFamily, ann.fontWeight);
        const effectiveWidth = Math.max(ann.width || 0, dynamicW);
        const effectiveHeight = ann.height ? ann.height * scaleY : undefined;
        const tbOffset = toolbarOffsets[ann.id] || { x: 0, y: 4 };

        return (
          <div
            key={ann.id}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedId(ann.id);
            }}
            className={`text-annotation-element absolute pointer-events-auto p-0 border-0 outline-none select-text ${
              isSelected ? 'ring-1 ring-cyan-400/60 ring-dashed z-30' : 'z-20'
            }`}
            style={{
              left: `${scaledX}px`,
              top: `${scaledY}px`,
              width: `${effectiveWidth * scaleX}px`,
              minHeight: effectiveHeight ? `${effectiveHeight}px` : undefined,
              backgroundColor: ann.isRedact ? (ann.backgroundColor || '#ffffff') : 'transparent',
              opacity: ann.opacity !== undefined ? ann.opacity : 1.0,
              transform: ann.rotation ? `translate(-50%, -50%) rotate(${ann.rotation}deg)` : undefined,
              transformOrigin: 'center center',
            }}
          >
            {/* Plain Text Area - Auto Expands Horizontally Until Enter Key */}
            <textarea
              autoFocus
              ref={(el) => {
                if (el && isSelected && document.activeElement !== el) {
                  el.focus();
                  try {
                    el.setSelectionRange(el.value.length, el.value.length);
                  } catch (e) {}
                }
              }}
              value={ann.text}
              onChange={(e) => {
                const newText = e.target.value;
                const measuredW = measureTextWidth(
                  newText,
                  ann.fontSize,
                  ann.fontFamily || textFontFamily,
                  ann.fontWeight
                );
                onUpdateAnnotation(ann.id, {
                  text: newText,
                  width: Math.max(30, measuredW),
                });
              }}
              placeholder="Type text..."
              rows={lineCount}
              className="bg-transparent border-none outline-none ring-0 focus:ring-0 focus:outline-none focus:border-none p-0 m-0 w-full overflow-hidden resize-none select-text block"
              style={{
                fontSize: `${ann.fontSize * scaleY}px`,
                fontFamily: ann.fontFamily || textFontFamily || "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
                fontWeight: ann.fontWeight || 'normal',
                color: ann.color || '#000000',
                caretColor: ann.color || '#000000',
                textDecoration: ann.isUnderline ? 'underline' : 'none',
                lineHeight: '1',
                padding: '0',
                margin: '0',
                letterSpacing: 'normal',
                width: '100%',
                whiteSpace: 'pre',
                overflow: 'hidden',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                resize: 'none',
              }}
            />

            {/* Movable & Draggable Compact Floating Action Toolbar - Placed BELOW Text Box */}
            {isSelected && (
              <div
                className="absolute top-[calc(100%+8px)] left-0 flex items-center gap-1 bg-slate-900/50 backdrop-blur-md text-white rounded-lg px-2 py-1 shadow-2xl z-50 select-none border border-slate-700/80 whitespace-nowrap ring-1 ring-cyan-500/40 animate-fadeIn"
                style={{ transform: `translate(${tbOffset.x}px, ${tbOffset.y}px)` }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Drag / Move Handle - Moves Text Box Anywhere on PDF Canvas */}
                <div
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    handleMouseDownDrag(e, ann);
                  }}
                  onTouchStart={(e) => {
                    e.stopPropagation();
                    handleTouchStartTextDrag(e, ann);
                  }}
                  title="Touch & Drag to Move Text Anywhere over PDF Page"
                  className="p-1 bg-cyan-500/20 hover:bg-cyan-500/40 rounded text-cyan-300 cursor-grab active:cursor-grabbing transition flex items-center space-x-1 border border-cyan-500/30"
                >
                  <Move className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold">Move</span>
                </div>

                <div className="w-[1px] h-3.5 bg-slate-700" />

                {/* Sub-Point Decimal Font Size Stepper (0.2pt precision) & Direct Numeric Input */}
                <div className="flex items-center space-x-0.5 bg-slate-950 rounded px-1.5 py-0.5 border border-slate-700">
                  <button
                    type="button"
                    onClick={() => onUpdateAnnotation(ann.id, { fontSize: parseFloat(Math.max(4, ann.fontSize - 0.2).toFixed(1)) })}
                    title="Decrease Font Size (-0.2pt)"
                    className="p-0.5 hover:bg-slate-800 rounded text-slate-300 hover:text-white transition"
                  >
                    <Minus className="w-3 h-3" />
                  </button>

                  <div className="flex items-center">
                    <input
                      type="number"
                      step="0.1"
                      min="4"
                      max="120"
                      value={ann.fontSize}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val) && val >= 4 && val <= 120) {
                          onUpdateAnnotation(ann.id, { fontSize: parseFloat(val.toFixed(2)) });
                        }
                      }}
                      className="w-9 bg-transparent text-[10px] font-extrabold font-mono text-cyan-300 text-center outline-none border-none p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      title="Direct Font Size (e.g. 13.2, 13.4, 9.75)"
                    />
                    <span className="text-[9px] font-mono text-slate-400 select-none">pt</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => onUpdateAnnotation(ann.id, { fontSize: parseFloat(Math.min(120, ann.fontSize + 0.2).toFixed(1)) })}
                    title="Increase Font Size (+0.2pt)"
                    className="p-0.5 hover:bg-slate-800 rounded text-slate-300 hover:text-white transition"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                {/* Bold Toggle Button */}
                <button
                  type="button"
                  onClick={() => {
                    const isCurrentlyBold =
                      ann.fontWeight === 'bold' ||
                      ann.fontWeight === '700' ||
                      ann.fontWeight === 700 ||
                      ann.fontWeight === '600';
                    onUpdateAnnotation(ann.id, { fontWeight: isCurrentlyBold ? 'normal' : 'bold' });
                  }}
                  title="Toggle Bold"
                  className={`p-1 rounded transition ${
                    ann.fontWeight === 'bold' ||
                    ann.fontWeight === '700' ||
                    ann.fontWeight === 700 ||
                    ann.fontWeight === '600'
                      ? 'bg-cyan-500 text-white font-bold'
                      : 'hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <Bold className="w-3.5 h-3.5" />
                </button>

                {/* Underline Toggle Button */}
                <button
                  type="button"
                  onClick={() => onUpdateAnnotation(ann.id, { isUnderline: !ann.isUnderline })}
                  title="Toggle Underline"
                  className={`p-1 rounded transition ${
                    ann.isUnderline ? 'bg-cyan-500 text-white font-bold' : 'hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <Underline className="w-3.5 h-3.5" />
                </button>

                {/* Comprehensive Color Palette with Exact Page Color Matching */}
                <div className="flex items-center space-x-1 pl-0.5">
                  {/* EyeDropper Tool to sample exact pixel color from brochure */}
                  <button
                    type="button"
                    onClick={() => handlePickColorEyeDropper(ann.id)}
                    title="EyeDropper: Sample exact color from anywhere on page"
                    className="p-1 hover:bg-cyan-500/30 text-cyan-300 hover:text-white rounded transition flex items-center"
                  >
                    <Droplet className="w-3 h-3" />
                  </button>

                  {/* Dynamic Color Swatches */}
                  {Array.from(new Set([ann.color || '#000000', ...availableColors]))
                    .filter((c): c is string => typeof c === 'string' && c.startsWith('#'))
                    .slice(0, 9)
                    .map((color) => {
                      const currentColor = (ann.color || '#000000').toLowerCase();
                      const isSelected = currentColor === color.toLowerCase();
                      return (
                        <button
                          key={color}
                          type="button"
                          onClick={() => onUpdateAnnotation(ann.id, { color })}
                          className={`w-3.5 h-3.5 rounded-full border transition ${
                            isSelected
                              ? 'scale-125 border-white ring-2 ring-cyan-400 shadow-md'
                              : 'border-slate-600 opacity-80 hover:opacity-100 hover:scale-110'
                          }`}
                          style={{ backgroundColor: color }}
                          title={`Select ${color}`}
                        />
                      );
                    })}

                  {/* Native Color Picker for custom Hex/RGB colors */}
                  <label
                    title="Custom Color Spectrum Picker"
                    className="cursor-pointer p-0.5 hover:bg-slate-800 rounded transition flex items-center text-slate-300 hover:text-white"
                  >
                    <Palette className="w-3 h-3" />
                    <input
                      id={`native-color-${ann.id}`}
                      type="color"
                      value={ann.color && ann.color.startsWith('#') ? ann.color : '#000000'}
                      onChange={(e) => onUpdateAnnotation(ann.id, { color: e.target.value })}
                      className="sr-only"
                    />
                  </label>
                </div>

                <div className="w-[1px] h-3.5 bg-slate-700" />

                {/* Quick Paste Button */}
                <button
                  type="button"
                  onClick={() => handlePasteClipboard(ann.id)}
                  title="Paste Clipboard Text"
                  className="p-1 hover:bg-slate-800 rounded text-slate-300 hover:text-white transition"
                >
                  <Clipboard className="w-3 h-3" />
                </button>

                {/* Delete Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteAnnotation(ann.id);
                  }}
                  title="Delete Text"
                  className="p-1 hover:bg-red-600/80 rounded text-red-400 hover:text-white transition"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
