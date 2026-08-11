import React, { useState, useEffect, useRef } from 'react';
import { Trash2, Eye, EyeOff, Move, Clipboard, Minus, Plus, Type } from 'lucide-react';
import { TextAnnotation } from '../types/pdf';

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
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Drag state for moving text annotations around
  const [dragState, setDragState] = useState<{
    annId: string;
    offsetX: number;
    offsetY: number;
  } | null>(null);

  const pageAnnotations = annotations.filter((a) => a.pageIndex === pageIndex);
  const scaleX = originalWidth > 0 ? canvasWidth / originalWidth : 1;
  const scaleY = originalHeight > 0 ? canvasHeight / originalHeight : 1;

  // Mouse move / up handler
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragState || !containerRef.current || originalWidth <= 0 || originalHeight <= 0) return;
      const containerRect = containerRef.current.getBoundingClientRect();

      const mouseX = e.clientX - containerRect.left;
      const mouseY = e.clientY - containerRect.top;

      const newScreenX = mouseX - dragState.offsetX;
      const newScreenY = mouseY - dragState.offsetY;

      const newPdfX = Math.max(0, Math.min(originalWidth - 30, newScreenX / scaleX));
      const newPdfY = Math.max(0, Math.min(originalHeight - 15, newScreenY / scaleY));

      onUpdateAnnotation(dragState.annId, {
        x: Math.round(newPdfX),
        y: Math.round(newPdfY),
      });
    };

    const handleMouseUp = () => {
      if (dragState) setDragState(null);
    };

    if (dragState) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
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

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isTextMode) return;
    
    // Calculate click coordinates in original PDF points
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = (e.clientX - rect.left) / scaleX;
    const clickY = (e.clientY - rect.top) / scaleY;

    onAddAnnotation({
      pageIndex,
      x: Math.round(clickX),
      y: Math.round(clickY),
      text: '',
      fontSize: textFontSize || 14,
      fontFamily: textFontFamily || "'Times New Roman', Times, serif",
      color: textColor || '#000000',
      isRedact: textIsRedact || false,
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
      {pageAnnotations.map((ann) => {
        const scaledX = ann.x * scaleX;
        const scaledY = ann.y * scaleY;
        const isSelected = selectedId === ann.id;
        const lines = (ann.text || '').split('\n');
        const lineCount = Math.max(1, lines.length);
        const maxCharCount = Math.max(...lines.map((l) => l.length), 1);
        const calculatedWidth = Math.max(80, maxCharCount * (ann.fontSize * 0.62) + 24);

        return (
          <div
            key={ann.id}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedId(ann.id);
            }}
            className={`text-annotation-element absolute pointer-events-auto p-0 border-0 outline-none select-text ${
              ann.isRedact
                ? 'bg-white p-1 rounded shadow-sm'
                : 'bg-transparent'
            } ${isSelected ? 'ring-1 ring-cyan-400/60 ring-dashed z-30' : 'z-20'}`}
            style={{
              left: `${scaledX}px`,
              top: `${scaledY}px`,
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
                }
              }}
              value={ann.text}
              onChange={(e) => onUpdateAnnotation(ann.id, { text: e.target.value })}
              placeholder="Type text..."
              rows={lineCount}
              className="bg-transparent border-none outline-none ring-0 focus:ring-0 focus:outline-none focus:border-none font-sans font-semibold p-0 m-0 leading-normal"
              style={{
                fontSize: `${ann.fontSize * scaleY}px`,
                fontFamily: ann.fontFamily || textFontFamily || "'Times New Roman', Times, serif",
                color: ann.color || '#000000',
                caretColor: ann.color || '#000000',
                width: `${calculatedWidth * scaleX}px`,
                whiteSpace: 'pre',
                overflow: 'hidden',
                resize: 'none',
              }}
            />

            {/* Sleek Floating Action Toolbar (Font Size, Style, Colors, Move, Paste & Delete) */}
            {isSelected && (
              <div
                className="absolute top-[100%] left-0 mt-1 flex items-center gap-1.5 bg-slate-900/95 text-white rounded-xl px-2 py-1 shadow-2xl z-40 select-none border border-slate-700/80 backdrop-blur whitespace-nowrap"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Drag / Move Handle */}
                <button
                  type="button"
                  onMouseDown={(e) => handleMouseDownDrag(e, ann)}
                  title="Click & Drag to Move Text"
                  className="p-1 hover:bg-slate-700/80 rounded text-slate-200 hover:text-white cursor-grab active:cursor-grabbing transition"
                >
                  <Move className="w-3.5 h-3.5" />
                </button>

                <div className="w-[1px] h-4 bg-slate-700" />

                {/* Font Style Family Dropdown */}
                <select
                  value={ann.fontFamily || textFontFamily || "'Times New Roman', Times, serif"}
                  onChange={(e) => onUpdateAnnotation(ann.id, { fontFamily: e.target.value })}
                  className="bg-slate-800 text-cyan-300 border border-slate-700 rounded px-1.5 py-0.5 text-[11px] font-semibold hover:border-cyan-400 transition max-w-[120px] truncate"
                  title="Text Font Style Family"
                >
                  <option value="'Times New Roman', Times, serif">Times New Roman</option>
                  <option value="Arial, Helvetica, sans-serif">Arial / Helvetica</option>
                  <option value="'Courier New', Courier, monospace">Courier New</option>
                  <option value="Georgia, serif">Georgia</option>
                  <option value="Garamond, serif">Garamond</option>
                  <option value="Verdana, Geneva, sans-serif">Verdana</option>
                  <option value="'Trebuchet MS', sans-serif">Trebuchet MS</option>
                  <option value="Impact, Charcoal, sans-serif">Impact</option>
                  <option value="'Comic Sans MS', cursive, sans-serif">Comic Sans</option>
                  <option value="'Palatino Linotype', Palatino, serif">Palatino</option>
                  <option value="Tahoma, Geneva, sans-serif">Tahoma</option>
                  <option value="'Lucida Console', Monaco, monospace">Lucida Console</option>
                  <option value="'Brush Script MT', cursive">Brush Script</option>
                  <option value="'Segoe UI', Tahoma, sans-serif">Segoe UI</option>
                  <option value="'Century Gothic', sans-serif">Century Gothic</option>
                </select>

                <div className="w-[1px] h-4 bg-slate-700" />

                {/* Font Size Stepper & Readout */}
                <div className="flex items-center space-x-1 bg-slate-800/90 rounded px-1 py-0.5 border border-slate-700">
                  <Type className="w-3 h-3 text-cyan-400" />
                  <button
                    type="button"
                    onClick={() => onUpdateAnnotation(ann.id, { fontSize: Math.max(6, ann.fontSize - 2) })}
                    title="Decrease Font Size (-2pt)"
                    className="p-0.5 hover:bg-slate-700 rounded text-slate-300 hover:text-white transition"
                  >
                    <Minus className="w-3 h-3" />
                  </button>

                  <span className="text-[11px] font-extrabold font-mono text-cyan-300 min-w-[28px] text-center">
                    {ann.fontSize}pt
                  </span>

                  <button
                    type="button"
                    onClick={() => onUpdateAnnotation(ann.id, { fontSize: Math.min(120, ann.fontSize + 2) })}
                    title="Increase Font Size (+2pt)"
                    className="p-0.5 hover:bg-slate-700 rounded text-slate-300 hover:text-white transition"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                {/* Font Size Quick Presets */}
                <div className="flex items-center space-x-0.5">
                  {[10, 14, 18, 24, 36, 48].map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => onUpdateAnnotation(ann.id, { fontSize: size })}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition ${
                        ann.fontSize === size ? 'bg-cyan-500 text-slate-950 shadow' : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>

                <div className="w-[1px] h-4 bg-slate-700" />

                {/* Quick Color Swatches */}
                <div className="flex items-center space-x-1">
                  {['#000000', '#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#ffffff'].map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => onUpdateAnnotation(ann.id, { color })}
                      className={`w-4 h-4 rounded-full border border-slate-600 transition ${
                        ann.color === color ? 'scale-125 border-white ring-1 ring-cyan-400 shadow' : 'opacity-80 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>

                <div className="w-[1px] h-4 bg-slate-700" />

                {/* Quick Paste Button */}
                <button
                  type="button"
                  onClick={() => handlePasteClipboard(ann.id)}
                  title="Paste Clipboard Text"
                  className="p-1 hover:bg-slate-700/80 rounded text-slate-300 hover:text-white transition"
                >
                  <Clipboard className="w-3.5 h-3.5" />
                </button>

                <div className="w-[1px] h-4 bg-slate-700" />

                {/* Delete Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteAnnotation(ann.id);
                  }}
                  title="Delete Text Annotation"
                  className="p-1 hover:bg-red-600/80 rounded text-red-400 hover:text-white transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
