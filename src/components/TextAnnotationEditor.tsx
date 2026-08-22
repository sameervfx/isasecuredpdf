import React, { useState, useEffect, useRef } from 'react';
import { Trash2, Eye, EyeOff, Move, Clipboard, Minus, Plus, Type, Underline } from 'lucide-react';
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
  const containerRef = useRef<HTMLDivElement | null>(null);

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
      isUnderline: textIsUnderline || false,
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
    const currentOffset = toolbarOffsets[annId] || { x: 0, y: 35 };

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
      {pageAnnotations.map((ann) => {
        const scaledX = ann.x * scaleX;
        const scaledY = ann.y * scaleY;
        const isSelected = selectedId === ann.id;
        const lines = (ann.text || '').split('\n');
        const lineCount = Math.max(1, lines.length);
        const maxCharCount = Math.max(...lines.map((l) => l.length), 1);
        const calculatedWidth = Math.max(80, maxCharCount * (ann.fontSize * 0.62) + 24);
        const tbOffset = toolbarOffsets[ann.id] || { x: 0, y: 35 };

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
                textDecoration: ann.isUnderline ? 'underline' : 'none',
                width: `${calculatedWidth * scaleX}px`,
                whiteSpace: 'pre',
                overflow: 'hidden',
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

                {/* Font Size Stepper */}
                <div className="flex items-center space-x-0.5 bg-slate-950 rounded px-1 py-0.5 border border-slate-700">
                  <button
                    type="button"
                    onClick={() => onUpdateAnnotation(ann.id, { fontSize: Math.max(6, ann.fontSize - 2) })}
                    title="Decrease Font Size (-2pt)"
                    className="p-0.5 hover:bg-slate-800 rounded text-slate-300 hover:text-white transition"
                  >
                    <Minus className="w-3 h-3" />
                  </button>

                  <span className="text-[10px] font-extrabold font-mono text-cyan-300 min-w-[24px] text-center">
                    {ann.fontSize}pt
                  </span>

                  <button
                    type="button"
                    onClick={() => onUpdateAnnotation(ann.id, { fontSize: Math.min(120, ann.fontSize + 2) })}
                    title="Increase Font Size (+2pt)"
                    className="p-0.5 hover:bg-slate-800 rounded text-slate-300 hover:text-white transition"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

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

                {/* Quick Color Swatches */}
                <div className="flex items-center space-x-1 pl-0.5">
                  {['#000000', '#dc2626', '#2563eb', '#ffffff'].map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => onUpdateAnnotation(ann.id, { color })}
                      className={`w-3.5 h-3.5 rounded-full border border-slate-600 transition ${
                        ann.color === color ? 'scale-125 border-white ring-1 ring-cyan-400 shadow' : 'opacity-80 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
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
