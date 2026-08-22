import React, { useState, useEffect, useRef } from 'react';
import { Trash2, Move, Maximize2, Image as ImageIcon } from 'lucide-react';
import { ImageStampAnnotation } from '../types/pdf';

interface ImageStampOverlayProps {
  imageStamps: ImageStampAnnotation[];
  pageIndex: number;
  canvasWidth: number;
  canvasHeight: number;
  originalWidth: number;
  originalHeight: number;
  onUpdateImageStamp: (id: string, updated: Partial<ImageStampAnnotation>) => void;
  onDeleteImageStamp: (id: string) => void;
}

export const ImageStampOverlay: React.FC<ImageStampOverlayProps> = ({
  imageStamps,
  pageIndex,
  canvasWidth,
  canvasHeight,
  originalWidth,
  originalHeight,
  onUpdateImageStamp,
  onDeleteImageStamp,
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [dragState, setDragState] = useState<{
    imgId: string;
    offsetX: number;
    offsetY: number;
  } | null>(null);

  const [resizeState, setResizeState] = useState<{
    imgId: string;
    startMouseX: number;
    startMouseY: number;
    startWidth: number;
    startHeight: number;
  } | null>(null);

  const pageImgs = (imageStamps || []).filter((s) => s.pageIndex === pageIndex);
  const scaleX = originalWidth > 0 ? canvasWidth / originalWidth : 1;
  const scaleY = originalHeight > 0 ? canvasHeight / originalHeight : 1;

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (dragState) {
        if (!containerRef.current || originalWidth <= 0 || originalHeight <= 0) return;
        const containerRect = containerRef.current.getBoundingClientRect();
        const mouseX = e.clientX - containerRect.left;
        const mouseY = e.clientY - containerRect.top;

        const newScreenX = mouseX - dragState.offsetX;
        const newScreenY = mouseY - dragState.offsetY;

        const newPdfX = Math.max(0, Math.min(originalWidth - 20, newScreenX / scaleX));
        const newPdfY = Math.max(0, Math.min(originalHeight - 20, newScreenY / scaleY));

        onUpdateImageStamp(dragState.imgId, {
          x: Math.round(newPdfX),
          y: Math.round(newPdfY),
        });
      } else if (resizeState) {
        const deltaX = (e.clientX - resizeState.startMouseX) / scaleX;
        const deltaY = (e.clientY - resizeState.startMouseY) / scaleY;

        const newW = Math.max(20, resizeState.startWidth + deltaX);
        const newH = Math.max(20, resizeState.startHeight + deltaY);

        onUpdateImageStamp(resizeState.imgId, {
          width: Math.round(newW),
          height: Math.round(newH),
        });
      }
    };

    const handleMouseUp = () => {
      if (dragState) setDragState(null);
      if (resizeState) setResizeState(null);
    };

    if (dragState || resizeState) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState, resizeState, scaleX, scaleY, originalWidth, originalHeight, onUpdateImageStamp]);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (!selectedId) return;
      const target = e.target as HTMLElement;
      if (!target.closest('.image-stamp-element')) {
        setSelectedId(null);
      }
    };
    window.addEventListener('mousedown', handleOutsideClick);
    return () => window.removeEventListener('mousedown', handleOutsideClick);
  }, [selectedId]);

  if (pageImgs.length === 0 || originalWidth <= 0 || originalHeight <= 0) return null;

  const handleMouseDownDrag = (e: React.MouseEvent, img: ImageStampAnnotation) => {
    e.stopPropagation();
    setSelectedId(img.id);

    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const imgScreenX = img.x * scaleX;
    const imgScreenY = img.y * scaleY;

    const mouseScreenX = e.clientX - containerRect.left;
    const mouseScreenY = e.clientY - containerRect.top;

    setDragState({
      imgId: img.id,
      offsetX: mouseScreenX - imgScreenX,
      offsetY: mouseScreenY - imgScreenY,
    });
  };

  const handleMouseDownResize = (e: React.MouseEvent, img: ImageStampAnnotation) => {
    e.stopPropagation();
    setSelectedId(img.id);

    setResizeState({
      imgId: img.id,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startWidth: img.width,
      startHeight: img.height,
    });
  };

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none z-20"
      style={{ width: `${canvasWidth}px`, height: `${canvasHeight}px` }}
    >
      {pageImgs.map((img) => {
        const scaledX = img.x * scaleX;
        const scaledY = img.y * scaleY;
        const scaledWidth = img.width * scaleX;
        const scaledHeight = img.height * scaleY;
        const isSelected = selectedId === img.id;

        return (
          <div
            key={img.id}
            onMouseDown={(e) => handleMouseDownDrag(e, img)}
            className={`image-stamp-element absolute pointer-events-auto cursor-grab active:cursor-grabbing select-none rounded p-0.5 transition-all ${
              isSelected
                ? 'ring-2 ring-emerald-500 bg-emerald-500/10 shadow-2xl z-30'
                : 'hover:ring-1 hover:ring-slate-400/50 z-20'
            }`}
            style={{
              left: `${scaledX}px`,
              top: `${scaledY}px`,
              width: `${scaledWidth}px`,
              height: `${scaledHeight}px`,
            }}
          >
            <img
              src={img.dataUrl}
              alt="Attached Stamp"
              className="w-full h-full object-contain pointer-events-none rounded"
            />

            {isSelected && (
              <div className="absolute -top-9 left-0 bg-slate-900 border border-slate-700 rounded-lg p-1 flex items-center space-x-2 shadow-xl z-40">
                <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[10px] text-slate-300 font-mono">
                  Image ({Math.round(img.width)}x{Math.round(img.height)})
                </span>
                <button
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteImageStamp(img.id);
                  }}
                  className="p-1 text-slate-400 hover:text-red-400 transition"
                  title="Remove Image"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {isSelected && (
              <div
                onMouseDown={(e) => handleMouseDownResize(e, img)}
                className="absolute -bottom-1.5 -right-1.5 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full cursor-se-resize shadow-lg flex items-center justify-center z-40 hover:scale-125 transition-transform"
                title="Drag to resize image"
              >
                <Maximize2 className="w-2 h-2 text-white" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
