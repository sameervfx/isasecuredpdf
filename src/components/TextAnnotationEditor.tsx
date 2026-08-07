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
              value={ann.text}
              onChange={(e) => onUpdateAnnotation(ann.id, { text: e.target.value })}
              placeholder="Type text here..."
              rows={lineCount}
              className="bg-transparent border-none outline-none ring-0 focus:ring-0 focus:outline-none focus:border-none font-sans font-semibold p-0 m-0 leading-normal"
              style={{
                fontSize: `${ann.fontSize * scaleY}px`,
                color: ann.color || '#000000',
                width: `${calculatedWidth * scaleX}px`,
                whiteSpace: 'pre',
                overflow: 'hidden',
                resize: 'none',
              }}
            />
          </div>
        );
      })}
    </div>
  );
};
