import React, { useState, useEffect, useRef } from 'react';
import { Trash2, Eye, EyeOff, Move, Clipboard } from 'lucide-react';
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

  // Click-outside handler to deselect text handles
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (!selectedId) return;
      const target = e.target as HTMLElement;
      if (!target.closest('.text-annotation-element')) {
        setSelectedId(null);
      }
    };

    window.addEventListener('mousedown', handleOutsideClick);
    return () => {
      window.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [selectedId]);

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
      text: 'Type or paste text here...',
      fontSize: 12,
      color: '#000000',
      isRedact: false,
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
        const lineCount = Math.max(1, ann.text.split('\n').length);

        return (
          <div
            key={ann.id}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedId(ann.id);
            }}
            className={`text-annotation-element absolute pointer-events-auto group p-1 rounded transition-shadow border ${
              ann.isRedact
                ? 'bg-white text-slate-900 border-slate-300 shadow-md'
                : 'bg-slate-900/80 text-white border-cyan-500/40 backdrop-blur'
            } ${isSelected ? 'ring-2 ring-cyan-500 z-30' : 'z-20'}`}
            style={{
              left: `${scaledX}px`,
              top: `${scaledY}px`,
              minWidth: '140px',
            }}
          >
            {/* Controls Bar for Selected Text */}
            {isSelected && (
              <div className="absolute -top-10 left-0 bg-slate-900 border border-slate-700 rounded-lg p-1 flex items-center space-x-1.5 shadow-xl text-xs z-40">
                {/* Drag Move Handle */}
                <div
                  onMouseDown={(e) => handleMouseDownDrag(e, ann)}
                  className="cursor-grab active:cursor-grabbing p-1 text-cyan-400 hover:text-cyan-300 rounded hover:bg-slate-800"
                  title="Drag to reposition text"
                >
                  <Move className="w-3.5 h-3.5" />
                </div>

                {/* Paste from Clipboard */}
                <button
                  onClick={() => handlePasteClipboard(ann.id)}
                  title="Paste copied text from clipboard (Ctrl+V)"
                  className="p-1 rounded bg-slate-800 text-cyan-300 hover:bg-slate-700 flex items-center space-x-1"
                >
                  <Clipboard className="w-3 h-3 text-cyan-400" />
                  <span className="text-[10px]">Paste</span>
                </button>

                {/* Redact White Background Toggle */}
                <button
                  onClick={() => onUpdateAnnotation(ann.id, { isRedact: !ann.isRedact })}
                  title={ann.isRedact ? 'Solid White Background (Redacting active)' : 'Transparent Background'}
                  className={`p-1 rounded flex items-center space-x-1 ${
                    ann.isRedact ? 'bg-white text-slate-900 font-bold' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {ann.isRedact ? <EyeOff className="w-3 h-3 text-red-600" /> : <Eye className="w-3 h-3" />}
                  <span className="text-[10px]">{ann.isRedact ? 'Redact On' : 'Transparent'}</span>
                </button>

                {/* Font Size Selector */}
                <select
                  value={ann.fontSize}
                  onChange={(e) => onUpdateAnnotation(ann.id, { fontSize: Number(e.target.value) })}
                  className="bg-slate-800 text-slate-200 border border-slate-700 rounded px-1 text-[11px]"
                >
                  {[8, 9, 10, 11, 12, 14, 16, 18, 24, 32, 40].map((size) => (
                    <option key={size} value={size}>
                      {size}pt
                    </option>
                  ))}
                </select>

                {/* Color Palette */}
                <input
                  type="color"
                  value={ann.color || '#000000'}
                  onChange={(e) => onUpdateAnnotation(ann.id, { color: e.target.value })}
                  className="w-5 h-5 rounded cursor-pointer border-0 p-0 bg-transparent"
                  title="Text Color"
                />

                {/* Delete Button */}
                <button
                  onClick={() => onDeleteAnnotation(ann.id)}
                  className="p-1 text-slate-400 hover:text-red-400 rounded transition"
                  title="Delete Text Box"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Editable Multi-Line Text Area */}
            <textarea
              value={ann.text}
              onChange={(e) => onUpdateAnnotation(ann.id, { text: e.target.value })}
              placeholder="Type or paste text here..."
              rows={lineCount}
              className="bg-transparent border-none outline-none font-sans font-medium w-full focus:ring-0 resize-both min-w-[140px] min-h-[30px] p-1 leading-normal"
              style={{
                fontSize: `${ann.fontSize * scaleY}px`,
                color: ann.color || '#000000',
              }}
            />
          </div>
        );
      })}
    </div>
  );
};
