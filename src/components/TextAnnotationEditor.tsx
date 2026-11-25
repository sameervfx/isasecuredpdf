import React, { useState, useEffect, useLayoutEffect, useRef, useMemo } from 'react';
import { Trash2, Eye, EyeOff, Move, Clipboard, Minus, Plus, Type, Underline, Bold, Palette, Droplet } from 'lucide-react';
import { TextAnnotation } from '../types/pdf';
import { pdfRenderer, DetectedPDFTextLine } from '../services/pdfRenderer';
import { isNativeMobileApp } from '../utils/platform';

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
  selectedAnnotationId?: string | null;
  onSelectAnnotationId?: (id: string | null) => void;
  showToolbar?: boolean;
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
}

interface FontSizeControlProps {
  fontSize: number;
  onUpdate: (newSize: number) => void;
  isNative: boolean;
}

const FontSizeControl: React.FC<FontSizeControlProps> = ({ fontSize, onUpdate, isNative }) => {
  const [textVal, setTextVal] = useState<string>(String(fontSize));
  const [isEditing, setIsEditing] = useState<boolean>(false);

  useEffect(() => {
    if (!isEditing) {
      setTextVal(String(fontSize));
    }
  }, [fontSize, isEditing]);

  const commitValue = (valStr: string) => {
    const cleaned = valStr.trim().replace(/[^0-9.]/g, '');
    const num = parseFloat(cleaned);
    if (!isNaN(num) && num >= 1 && num <= 500) {
      const rounded = Math.round(num * 10) / 10;
      setTextVal(String(rounded));
      onUpdate(rounded);
    } else {
      setTextVal(String(fontSize));
    }
  };

  const step = (delta: number) => {
    // Sub-pixel 0.2 pt fine-tuning step
    const change = delta * 0.2;
    const target = Math.max(1, Math.min(500, Math.round((fontSize + change) * 10) / 10));
    setTextVal(String(target));
    onUpdate(target);
  };

  return (
    <div className="flex items-center space-x-0.5 bg-slate-950 rounded-lg px-1.5 py-0.5 border border-slate-700 shrink-0">
      <button
        type="button"
        onClick={() => step(-1)}
        title="Decrease Font Size"
        className="p-1 hover:bg-slate-800 rounded text-slate-300 hover:text-white transition active:scale-95"
      >
        <Minus className="w-3.5 h-3.5" />
      </button>

      <div className="flex items-center">
        <input
          type="text"
          inputMode="decimal"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          value={isEditing ? textVal : String(fontSize)}
          onFocus={(e) => {
            setIsEditing(true);
            setTextVal(String(fontSize));
            e.target.select();
          }}
          onChange={(e) => {
            const v = e.target.value;
            setTextVal(v);
            const num = parseFloat(v);
            if (!isNaN(num) && num >= 1 && num <= 500 && !v.endsWith('.')) {
              onUpdate(Math.round(num * 10) / 10);
            }
          }}
          onBlur={() => {
            setIsEditing(false);
            commitValue(textVal);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              setIsEditing(false);
              commitValue(textVal);
              (e.target as HTMLInputElement).blur();
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              step(1);
            } else if (e.key === 'ArrowDown') {
              e.preventDefault();
              step(-1);
            }
          }}
          className={`${
            isNative ? 'w-9 text-[11px] py-0.5' : 'w-11 text-[11px] py-0.5'
          } bg-transparent font-black font-mono text-cyan-300 text-center outline-none border-none p-0 selection:bg-cyan-500/40`}
          title="Type any font size (1 to 500 pt)"
        />
        <span className="text-[9px] font-mono text-slate-400 select-none pr-0.5">pt</span>
      </div>

      <button
        type="button"
        onClick={() => step(1)}
        title="Increase Font Size"
        className="p-1 hover:bg-slate-800 rounded text-slate-300 hover:text-white transition active:scale-95"
      >
        <Plus className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

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
  selectedAnnotationId,
  onSelectAnnotationId,
  showToolbar = true,
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
}) => {
  const isNative = isNativeMobileApp();
  const [localSelectedId, setLocalSelectedId] = useState<string | null>(null);
  const selectedId = selectedAnnotationId !== undefined ? selectedAnnotationId : localSelectedId;
  const setSelectedId = (id: string | null) => {
    setLocalSelectedId(id);
    if (onSelectAnnotationId) onSelectAnnotationId(id);
  };
  const [detectedLines, setDetectedLines] = useState<DetectedPDFTextLine[]>([]);
  const [hoveredLineId, setHoveredLineId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const textareaRefs = useRef<Map<string, HTMLTextAreaElement>>(new Map());
  const lastFocusedIdRef = useRef<string | null>(null);

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

  // Keep every textarea unscrolled (never hide start of sentence) and sync box dimensions to real DOM layout
  useLayoutEffect(() => {
    if (!selectedId) {
      lastFocusedIdRef.current = null;
    } else if (selectedId !== lastFocusedIdRef.current) {
      const targetEl = textareaRefs.current.get(selectedId);
      if (targetEl) {
        lastFocusedIdRef.current = selectedId;
        if (document.activeElement !== targetEl) {
          targetEl.focus({ preventScroll: true });
          try {
            targetEl.setSelectionRange(targetEl.value.length, targetEl.value.length);
          } catch (e) {}
        }
        targetEl.scrollLeft = 0;
        targetEl.scrollTop = 0;
        requestAnimationFrame(() => {
          if (targetEl) {
            targetEl.scrollLeft = 0;
            targetEl.scrollTop = 0;
          }
        });
      }
    }

    for (const ann of pageAnnotations) {
      const el = textareaRefs.current.get(ann.id);
      if (!el) continue;

      if (el.scrollLeft !== 0) el.scrollLeft = 0;
      if (el.scrollTop !== 0) el.scrollTop = 0;

      // Only auto-expand PDF dimensions while actively editing this box (prevents jitter when zooming finished text)
      if (ann.id !== selectedId) continue;

      const maxAvailPdfW = Math.max(80, originalWidth - ann.x - 10);
      const updates: Partial<TextAnnotation> = {};

      // If real browser/Android glyph width exceeds clientWidth on a single line, expand box width immediately
      if (el.wrap === 'off' && el.scrollWidth > el.clientWidth + 2 && scaleX > 0) {
        const neededPdfW = parseFloat(
          Math.min(maxAvailPdfW, (el.scrollWidth + 10) / scaleX).toFixed(2)
        );
        if (neededPdfW > (ann.width || 0) + 1) {
          updates.width = neededPdfW;
        }
      }

      // If wrapped/multi-line height exceeds clientHeight, expand box height immediately so lines never clip
      if (el.scrollHeight > el.clientHeight + 2 && scaleY > 0) {
        const neededPdfH = parseFloat(((el.scrollHeight + 2) / scaleY).toFixed(2));
        if (neededPdfH > (ann.height || 0) + 1) {
          updates.height = neededPdfH;
        }
      }

      if (updates.width !== undefined || updates.height !== undefined) {
        onUpdateAnnotation(ann.id, updates);
      }
    }
  }, [pageAnnotations, selectedId, scaleX, scaleY, originalWidth, onUpdateAnnotation]);

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
    if (!text) return Math.max(64, Math.round(fontSize * 5.5));
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.font = `${fontWeight || 'normal'} ${fontSize}px ${fontFamily || 'sans-serif'}`;
        const lines = text.split('\n');
        const maxW = Math.max(...lines.map((l) => ctx.measureText(l.replace(/ /g, '\u00A0')).width), 0);
        return Math.ceil(maxW);
      }
    } catch (e) {}
    const lines = text.split('\n');
    const maxChars = Math.max(...lines.map((l) => l.length), 1);
    return Math.ceil(maxChars * fontSize * 0.55);
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isTextMode) return;
    
    // Calculate click coordinates in original PDF points
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = (e.clientX - rect.left) / scaleX;
    const clickY = (e.clientY - rect.top) / scaleY;
    const { bgHex } = sampleCanvasTextAndBg(e.clientX - rect.left, e.clientY - rect.top, 50, 20);
    const fs = textFontSize || 11;

    onAddAnnotation({
      pageIndex,
      x: parseFloat(clickX.toFixed(2)),
      y: parseFloat(clickY.toFixed(2)),
      text: '',
      fontSize: fs,
      fontFamily: textFontFamily || "'Roboto', Arial, Helvetica, 'Segoe UI', sans-serif",
      color: textColor || '#000000',
      backgroundColor: bgHex,
      isRedact: textIsRedact || false,
      isUnderline: textIsUnderline || false,
      width: Math.max(80, Math.round(fs * 7)),
      height: parseFloat((fs * 1.15).toFixed(2)),
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

    // Sub-pixel metric calibration: compare PDF rendered width vs browser CSS width at detected fontSize
    // Eliminates the ~0.2pt scale oversize caused by differences between embedded PDF fonts and CSS fallback fonts
    let calibratedFontSize = line.fontSize;
    const rawCssW = measureTextWidth(line.text, line.fontSize, line.fontFamily, line.fontWeight);
    if (line.text.trim().length >= 3 && line.width > 0 && rawCssW > 0) {
      const widthRatio = line.width / rawCssW;
      if (widthRatio < 1.0) {
        const clampedRatio = Math.max(0.92, widthRatio);
        calibratedFontSize = Math.max(1, Math.round(line.fontSize * clampedRatio * 10) / 10);
      } else {
        calibratedFontSize = Math.max(1, Math.round(line.fontSize * 10) / 10);
      }
    } else {
      calibratedFontSize = Math.max(1, Math.round(line.fontSize * 10) / 10);
    }

    // Measure exact rendered font width at calibrated size
    const measuredInitialW = measureTextWidth(
      line.text,
      calibratedFontSize,
      line.fontFamily,
      line.fontWeight
    );

    const coverW = parseFloat((line.width + 1.5).toFixed(2));
    const totalW = Math.max(coverW, measuredInitialW + 4);
    const tightH = parseFloat(Math.max(line.height, calibratedFontSize * 1.12).toFixed(2));

    onAddAnnotation({
      pageIndex,
      x: line.x,
      y: line.y, // ZERO padY: Exact line.topY anchored to baseline - (ascent * fontSize)
      text: line.text,
      fontSize: calibratedFontSize,
      fontFamily: line.fontFamily,
      fontWeight: line.fontWeight || 'normal',
      color: chosenInkColor,
      backgroundColor: bgHex,
      isRedact: true, // Seamlessly masks original text using the EXACT sampled page background color!
      isUnderline: textIsUnderline || false,
      width: parseFloat(totalW.toFixed(2)),
      minCoverWidth: coverW,
      height: tightH,
    });
    if (setTextFontSize) {
      setTextFontSize(calibratedFontSize);
    }
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
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text && text.trim()) {
          const ann = pageAnnotations.find((a) => a.id === annId);
          const lines = text.split('\n');
          const fontSize = ann ? ann.fontSize : (textFontSize || 11);
          const maxLineW = Math.max(...lines.map((l) => measureTextWidth(l, fontSize, ann?.fontFamily || textFontFamily, ann?.fontWeight)));
          const availW = Math.max(120, Math.min(originalWidth - (ann?.x || 54) - 20, maxLineW + 24));
          onUpdateAnnotation(annId, {
            text: text.trim(),
            width: availW,
            height: Math.max(30, lines.length * fontSize * 1.35 + 16),
          });
          return;
        }
      }
    } catch (err) {}
    // If direct clipboard reading is blocked by browser permissions, trigger the Quick Paste modal
    window.dispatchEvent(new CustomEvent('isa-open-quick-paste'));
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
              className={`absolute pointer-events-auto cursor-text rounded transition-colors duration-150 z-10 ${
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

        // Pure proportional font scaling across all zoom levels (seamless zoom without erratic jumping)
        const renderedFontSize = ann.fontSize * scaleY;

        // Measure rendered text width on screen to ensure full visibility without clipping on mobile
        const dynamicScreenW = measureTextWidth(
          ann.text,
          renderedFontSize,
          ann.fontFamily || textFontFamily,
          ann.fontWeight
        );
        // While actively editing, generous buffer guarantees cursor never triggers horizontal textarea scroll (never hides start of sentence);
        // when deselected, tight buffer keeps box snug without covering adjacent PDF text.
        const typingBuffer = isSelected ? Math.max(20, Math.round(renderedFontSize * 1.4)) : 4;
        const maxAvailScreenW = Math.max(80, (originalWidth - ann.x - 10) * scaleX);
        const shouldWrap = lineCount > 1 || dynamicScreenW + typingBuffer > maxAvailScreenW;
        const effectiveWidth = shouldWrap
          ? Math.min(maxAvailScreenW, Math.max((ann.width || 0) * scaleX, dynamicScreenW + typingBuffer))
          : Math.max((ann.width || 0) * scaleX, dynamicScreenW + typingBuffer);
        const estimatedVisualLines =
          lineCount === 1 && shouldWrap
            ? Math.max(2, Math.ceil((dynamicScreenW + 12) / Math.max(80, effectiveWidth - 4)))
            : lineCount;
        const effectiveHeight = estimatedVisualLines > 1
          ? Math.max((ann.height || 0) * scaleY, estimatedVisualLines * renderedFontSize * 1.24)
          : Math.max((ann.height || 0) * scaleY, renderedFontSize * 1.15);
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
              width: `${effectiveWidth}px`,
              height: `${effectiveHeight}px`,
              minWidth: '0px',
              backgroundColor: ann.isRedact ? (ann.backgroundColor || '#ffffff') : 'transparent',
              opacity: ann.opacity !== undefined ? ann.opacity : 1.0,
              transform: ann.rotation ? `translate(-50%, -50%) rotate(${ann.rotation}deg)` : undefined,
              transformOrigin: 'center center',
            }}
          >
            {/* Plain Text Area - Auto Expands Horizontally Until Page Margin or Enter Key */}
            <textarea
              spellCheck={false}
              wrap={shouldWrap ? 'soft' : 'off'}
              ref={(el) => {
                if (el) {
                  textareaRefs.current.set(ann.id, el);
                } else {
                  textareaRefs.current.delete(ann.id);
                }
              }}
              value={ann.text}
              onFocus={(e) => {
                setSelectedId(ann.id);
                e.currentTarget.scrollLeft = 0;
                e.currentTarget.scrollTop = 0;
              }}
              onInput={(e) => {
                const target = e.currentTarget;
                if (target.scrollLeft !== 0) target.scrollLeft = 0;
                if (target.scrollTop !== 0) target.scrollTop = 0;
              }}
              onKeyUp={(e) => {
                const target = e.currentTarget;
                if (target.scrollLeft !== 0) target.scrollLeft = 0;
                if (target.scrollTop !== 0) target.scrollTop = 0;
              }}
              onChange={(e) => {
                const target = e.target;
                const newText = target.value;
                target.scrollLeft = 0;
                target.scrollTop = 0;
                const measuredW = measureTextWidth(
                  newText,
                  ann.fontSize,
                  ann.fontFamily || textFontFamily,
                  ann.fontWeight
                );
                const maxAvailPdfW = Math.max(80, originalWidth - ann.x - 10);
                const newLines = newText.split('\n');
                const willWrap = newLines.length > 1 || measuredW + 10 > maxAvailPdfW;
                const nextW = parseFloat(
                  Math.min(
                    maxAvailPdfW,
                    Math.max(
                      ann.minCoverWidth || 0,
                      newText ? measuredW + 10 : Math.max(80, ann.fontSize * 7)
                    )
                  ).toFixed(2)
                );
                const approxLines =
                  newLines.length === 1 && willWrap
                    ? Math.max(2, Math.ceil((measuredW + 8) / Math.max(60, nextW - 4)))
                    : newLines.length;
                const exactH = approxLines > 1
                  ? parseFloat((approxLines * ann.fontSize * 1.24).toFixed(2))
                  : parseFloat((ann.fontSize * 1.15).toFixed(2));
                onUpdateAnnotation(ann.id, {
                  text: newText,
                  width: nextW,
                  height: exactH,
                });
              }}
              onPaste={(e) => {
                const pasted = e.clipboardData?.getData('text/plain');
                if (pasted) {
                  setTimeout(() => {
                    if (e.target) {
                      const newText = (e.target as HTMLTextAreaElement).value;
                      const newLines = newText.split('\n');
                      const maxW = Math.max(
                        ...newLines.map((l) =>
                          measureTextWidth(l, ann.fontSize, ann.fontFamily || textFontFamily, ann.fontWeight)
                        )
                      );
                      const availW = Math.max(
                        ann.minCoverWidth || 40,
                        Math.min(originalWidth - ann.x - 16, maxW + 6)
                      );
                      const exactH = newLines.length > 1
                        ? parseFloat((newLines.length * ann.fontSize * 1.22).toFixed(2))
                        : parseFloat((ann.fontSize * 1.15).toFixed(2));
                      onUpdateAnnotation(ann.id, {
                        text: newText,
                        width: parseFloat(availW.toFixed(2)),
                        height: exactH,
                      });
                    }
                  }, 0);
                }
              }}
              placeholder="Type text..."
              rows={estimatedVisualLines}
              className="bg-transparent border-none outline-none ring-0 focus:ring-0 focus:outline-none focus:border-none p-0 m-0 w-full resize-none select-text block"
              style={{
                fontSize: `${renderedFontSize}px`,
                fontFamily: ann.fontFamily || textFontFamily || "'Roboto', Arial, Helvetica, 'Segoe UI', sans-serif",
                fontWeight: ann.fontWeight || 'normal',
                color: ann.color || '#000000',
                caretColor: ann.color || '#000000',
                textDecoration: ann.isUnderline ? 'underline' : 'none',
                lineHeight: estimatedVisualLines > 1 ? '1.22' : '1.15',
                padding: '0px',
                margin: '0',
                letterSpacing: 'normal',
                width: '100%',
                height: `${effectiveHeight}px`,
                minWidth: '0px',
                whiteSpace: shouldWrap ? 'pre-wrap' : 'pre',
                wordBreak: shouldWrap ? 'break-word' : 'normal',
                overflow: 'hidden',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                resize: 'none',
                boxSizing: 'border-box',
                WebkitTextSizeAdjust: '100%',
              }}
            />

            {/* Movable & Draggable Compact Floating Action Toolbar - Placed with Text Box */}
            {isSelected && (() => {
              const isAbove = scaledY > canvasHeight - 80;
              const isRight = isNative && scaledX > canvasWidth * 0.45;
              const originClass = isAbove
                ? (isRight ? 'origin-bottom-right' : 'origin-bottom-left')
                : (isRight ? 'origin-top-right' : 'origin-top-left');

              return (
                <div
                  className={`absolute ${
                    isAbove ? 'bottom-[calc(100%+6px)]' : 'top-[calc(100%+6px)]'
                  } ${
                    isRight ? 'right-0' : 'left-0'
                  } flex items-center ${
                    isNative ? 'gap-0.5 px-1.5 py-0.5 rounded-lg' : 'gap-1 px-2 py-1 rounded-xl'
                  } bg-slate-900/95 backdrop-blur-md text-white shadow-2xl z-50 select-none border border-slate-700/80 whitespace-nowrap ring-1 ring-cyan-500/40 animate-fadeIn ${originClass} touch-manipulation`}
                  style={{
                    transform: `translate(${tbOffset.x}px, ${tbOffset.y}px) ${isNative ? 'scale(0.82)' : ''}`,
                  }}
                  onClick={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
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
                    className="p-1 bg-cyan-500/20 hover:bg-cyan-500/40 rounded text-cyan-300 cursor-grab active:cursor-grabbing transition flex items-center space-x-1 border border-cyan-500/30 shrink-0"
                  >
                    <Move className="w-3.5 h-3.5" />
                    {!isNative && <span className="text-[10px] font-bold">Move</span>}
                  </div>

                  <div className="w-[1px] h-3.5 bg-slate-700 shrink-0" />

                  {/* Stepper & Direct Font Size Numeric Input (1pt - 500pt) */}
                  <FontSizeControl
                    fontSize={ann.fontSize}
                    isNative={isNative}
                    onUpdate={(newSize) => {
                      const measuredW = measureTextWidth(
                        ann.text,
                        newSize,
                        ann.fontFamily || textFontFamily,
                        ann.fontWeight
                      );
                      const curLines = (ann.text || '').split('\n');
                      const exactH = curLines.length > 1
                        ? parseFloat((curLines.length * newSize * 1.22).toFixed(2))
                        : parseFloat((newSize * 1.15).toFixed(2));
                      onUpdateAnnotation(ann.id, {
                        fontSize: newSize,
                        width: parseFloat(Math.max(ann.minCoverWidth || 0, measuredW + 4).toFixed(2)),
                        height: exactH,
                      });
                      if (setTextFontSize) setTextFontSize(newSize);
                    }}
                  />

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
                    className={`p-1 rounded transition shrink-0 ${
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
                    onClick={() => {
                      const next = !ann.isUnderline;
                      onUpdateAnnotation(ann.id, { isUnderline: next });
                      if (setTextIsUnderline) setTextIsUnderline(next);
                    }}
                    title="Toggle Underline"
                    className={`p-1 rounded transition shrink-0 ${
                      ann.isUnderline ? 'bg-cyan-500 text-white font-bold' : 'hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    <Underline className="w-3.5 h-3.5" />
                  </button>

                  {/* Whiteout / Redact Cover Button */}
                  <button
                    type="button"
                    onClick={() => {
                      const next = !ann.isRedact;
                      onUpdateAnnotation(ann.id, { isRedact: next });
                      if (setTextIsRedact) setTextIsRedact(next);
                    }}
                    title={ann.isRedact ? 'White cover box active' : 'Plain transparent text'}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 transition shrink-0 ${
                      ann.isRedact
                        ? 'bg-white text-slate-900 shadow'
                        : 'bg-slate-800 text-slate-300 hover:text-white'
                    }`}
                  >
                    {ann.isRedact ? <EyeOff className="w-3 h-3 text-red-600" /> : <Eye className="w-3 h-3 text-cyan-400" />}
                    {!isNative && <span>Whiteout</span>}
                  </button>

                  {/* Comprehensive Color Palette with Exact Page Color Matching */}
                  <div className="flex items-center space-x-1 pl-0.5 shrink-0">
                    {/* EyeDropper Tool to sample exact pixel color */}
                    <button
                      type="button"
                      onClick={() => handlePickColorEyeDropper(ann.id)}
                      title="EyeDropper: Sample exact color from anywhere on page"
                      className="p-1 hover:bg-cyan-500/30 text-cyan-300 hover:text-white rounded transition flex items-center shrink-0"
                    >
                      <Droplet className="w-3 h-3" />
                    </button>

                    {/* Dynamic Color Swatches (compact on mobile, full on web) */}
                    <div className={`flex items-center space-x-1 ${isNative ? 'max-w-[70px]' : 'max-w-[140px]'} overflow-x-auto scrollbar-none py-0.5 shrink-0`}>
                      {Array.from(new Set([ann.color || '#000000', ...availableColors]))
                        .filter((c) => typeof c === 'string' && c.startsWith('#'))
                        .slice(0, isNative ? 3 : 9)
                        .map((color) => {
                          const currentColor = (ann.color || '#000000').toLowerCase();
                          const isSelectedColor = currentColor === color.toLowerCase();
                          return (
                            <button
                              key={color}
                              type="button"
                              onClick={() => {
                                onUpdateAnnotation(ann.id, { color });
                                if (setTextColor) setTextColor(color);
                              }}
                              className={`w-3.5 h-3.5 rounded-full border transition shrink-0 ${
                                isSelectedColor
                                  ? 'scale-125 border-white ring-2 ring-cyan-400 shadow-md'
                                  : 'border-slate-600 opacity-80 hover:opacity-100 hover:scale-110'
                              }`}
                              style={{ backgroundColor: color }}
                              title={`Select ${color}`}
                            />
                          );
                        })}
                    </div>

                    {/* Native Color Picker for custom Hex/RGB colors */}
                    <label
                      title="Custom Color Spectrum Picker"
                      className="cursor-pointer p-0.5 hover:bg-slate-800 rounded transition flex items-center text-slate-300 hover:text-white shrink-0"
                    >
                      <Palette className="w-3 h-3" />
                      <input
                        id={`native-color-${ann.id}`}
                        type="color"
                        value={ann.color && ann.color.startsWith('#') ? ann.color : '#000000'}
                        onChange={(e) => {
                          onUpdateAnnotation(ann.id, { color: e.target.value });
                          if (setTextColor) setTextColor(e.target.value);
                        }}
                        className="sr-only"
                      />
                    </label>
                  </div>

                  <div className="w-[1px] h-3.5 bg-slate-700 shrink-0" />

                  {/* Quick Paste Button */}
                  <button
                    type="button"
                    onClick={() => handlePasteClipboard(ann.id)}
                    title="Paste Clipboard Text"
                    className="p-1 hover:bg-slate-800 rounded text-slate-300 hover:text-white transition shrink-0"
                  >
                    <Clipboard className="w-3 h-3" />
                  </button>

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteAnnotation(ann.id);
                      setSelectedId(null);
                    }}
                    title="Delete Text"
                    className="p-1 hover:bg-red-600/80 rounded text-red-400 hover:text-white transition shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })()}
          </div>
        );
      })}
    </div>
  );
};
