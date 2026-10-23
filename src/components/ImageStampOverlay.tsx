import React, { useState, useEffect, useRef } from 'react';
import { Trash2, Maximize2, Image as ImageIcon, ZoomIn, ZoomOut } from 'lucide-react';
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
  const prevCountRef = useRef<number>(0);

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

  const [pinchResizeState, setPinchResizeState] = useState<{
    imgId: string;
    startDist: number;
    startWidth: number;
    startHeight: number;
  } | null>(null);

  const pageImgs = (imageStamps || []).filter((s) => s.pageIndex === pageIndex);
  const scaleX = originalWidth > 0 ? canvasWidth / originalWidth : 1;
  const scaleY = originalHeight > 0 ? canvasHeight / originalHeight : 1;

  // Auto-select newly added image on this page so mobile users immediately see handles & controls
  useEffect(() => {
    if (pageImgs.length > prevCountRef.current && pageImgs.length > 0) {
      const newest = pageImgs[pageImgs.length - 1];
      setSelectedId(newest.id);
    }
    prevCountRef.current = pageImgs.length;
  }, [pageImgs]);

  useEffect(() => {
    const getClientCoords = (e: MouseEvent | TouchEvent) => {
      if ('touches' in e && e.touches.length > 0) {
        return { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY };
      }
      if ('changedTouches' in e && e.changedTouches.length > 0) {
        return { clientX: e.changedTouches[0].clientX, clientY: e.changedTouches[0].clientY };
      }
      const mouseEv = e as MouseEvent;
      return { clientX: mouseEv.clientX, clientY: mouseEv.clientY };
    };

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      if ('touches' in e && e.cancelable) {
        e.preventDefault();
      }

      if (pinchResizeState && 'touches' in e && e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.hypot(dx, dy);
        if (dist > 0 && pinchResizeState.startDist > 0) {
          const ratio = dist / pinchResizeState.startDist;
          const newW = Math.max(25, Math.min(originalWidth, pinchResizeState.startWidth * ratio));
          const newH = Math.max(25, Math.min(originalHeight, pinchResizeState.startHeight * ratio));
          onUpdateImageStamp(pinchResizeState.imgId, {
            width: Math.round(newW),
            height: Math.round(newH),
          });
        }
        return;
      }

      const { clientX, clientY } = getClientCoords(e);

      if (dragState) {
        if (!containerRef.current || originalWidth <= 0 || originalHeight <= 0) return;
        const containerRect = containerRef.current.getBoundingClientRect();
        const mouseX = clientX - containerRect.left;
        const mouseY = clientY - containerRect.top;

        const newScreenX = mouseX - dragState.offsetX;
        const newScreenY = mouseY - dragState.offsetY;

        const newPdfX = Math.max(0, Math.min(originalWidth - 20, newScreenX / scaleX));
        const newPdfY = Math.max(0, Math.min(originalHeight - 20, newScreenY / scaleY));

        onUpdateImageStamp(dragState.imgId, {
          x: Math.round(newPdfX),
          y: Math.round(newPdfY),
        });
      } else if (resizeState) {
        const deltaX = (clientX - resizeState.startMouseX) / scaleX;
        const deltaY = (clientY - resizeState.startMouseY) / scaleY;

        // Preserve aspect ratio when resizing from corner handle if startWidth/startHeight > 0
        const aspect = resizeState.startHeight > 0 ? resizeState.startWidth / resizeState.startHeight : 1;
        const rawW = Math.max(25, resizeState.startWidth + deltaX);
        const rawH = Math.max(25, resizeState.startHeight + deltaY);
        const newW = rawW;
        const newH = Math.abs(deltaX) > Math.abs(deltaY) ? Math.max(25, rawW / aspect) : rawH;

        onUpdateImageStamp(resizeState.imgId, {
          width: Math.round(newW),
          height: Math.round(newH),
        });
      }
    };

    const handlePointerUp = () => {
      if (dragState) setDragState(null);
      if (resizeState) setResizeState(null);
      if (pinchResizeState) setPinchResizeState(null);
    };

    if (dragState || resizeState || pinchResizeState) {
      window.addEventListener('mousemove', handlePointerMove);
      window.addEventListener('mouseup', handlePointerUp);
      window.addEventListener('touchmove', handlePointerMove, { passive: false });
      window.addEventListener('touchend', handlePointerUp);
      window.addEventListener('touchcancel', handlePointerUp);
    }

    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);
      window.removeEventListener('touchcancel', handlePointerUp);
    };
  }, [dragState, resizeState, pinchResizeState, scaleX, scaleY, originalWidth, originalHeight, onUpdateImageStamp]);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (!selectedId) return;
      const target = e.target as HTMLElement;
      if (!target.closest('.image-stamp-element')) {
        setSelectedId(null);
      }
    };
    window.addEventListener('mousedown', handleOutsideClick);
    window.addEventListener('touchstart', handleOutsideClick);
    return () => {
      window.removeEventListener('mousedown', handleOutsideClick);
      window.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [selectedId]);

  if (pageImgs.length === 0 || originalWidth <= 0 || originalHeight <= 0) return null;

  const handleStartDrag = (e: React.MouseEvent | React.TouchEvent, img: ImageStampAnnotation) => {
    e.stopPropagation();
    setSelectedId(img.id);

    // Support 2-finger pinch directly on the image to scale it
    if ('touches' in e && e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      setDragState(null);
      setPinchResizeState({
        imgId: img.id,
        startDist: Math.hypot(dx, dy),
        startWidth: img.width,
        startHeight: img.height,
      });
      return;
    }

    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const imgScreenX = img.x * scaleX;
    const imgScreenY = img.y * scaleY;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const mouseScreenX = clientX - containerRect.left;
    const mouseScreenY = clientY - containerRect.top;

    setDragState({
      imgId: img.id,
      offsetX: mouseScreenX - imgScreenX,
      offsetY: mouseScreenY - imgScreenY,
    });
  };

  const handleStartResize = (e: React.MouseEvent | React.TouchEvent, img: ImageStampAnnotation) => {
    e.stopPropagation();
    setSelectedId(img.id);

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    setResizeState({
      imgId: img.id,
      startMouseX: clientX,
      startMouseY: clientY,
      startWidth: img.width,
      startHeight: img.height,
    });
  };

  const handleStepScale = (img: ImageStampAnnotation, factor: number) => {
    const newW = Math.max(25, Math.min(originalWidth, Math.round(img.width * factor)));
    const newH = Math.max(25, Math.min(originalHeight, Math.round(img.height * factor)));
    onUpdateImageStamp(img.id, { width: newW, height: newH });
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
            onMouseDown={(e) => handleStartDrag(e, img)}
            onTouchStart={(e) => handleStartDrag(e, img)}
            style={{
              left: `${scaledX}px`,
              top: `${scaledY}px`,
              width: `${scaledWidth}px`,
              height: `${scaledHeight}px`,
              touchAction: 'none',
            }}
            className={`image-stamp-element absolute pointer-events-auto cursor-grab active:cursor-grabbing select-none rounded p-0.5 transition-shadow ${
              isSelected
                ? 'ring-2 ring-emerald-500 bg-emerald-500/10 shadow-2xl z-30'
                : 'hover:ring-1 hover:ring-slate-400/50 z-20'
            }`}
          >
            <img
              src={img.dataUrl}
              alt="Attached Stamp"
              className="w-full h-full object-contain pointer-events-none rounded"
            />

            {isSelected && (
              <div
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                className="absolute -top-11 left-0 bg-slate-900/95 border border-slate-700 rounded-lg px-1.5 py-1 flex items-center space-x-1.5 shadow-xl z-40 whitespace-nowrap"
              >
                <ImageIcon className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStepScale(img, 0.85);
                  }}
                  className="p-1 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-200 rounded transition"
                  title="Scale Down (-15%)"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStepScale(img, 1.18);
                  }}
                  className="p-1 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-200 rounded transition"
                  title="Scale Up (+18%)"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteImageStamp(img.id);
                  }}
                  className="p-1 bg-red-500/15 hover:bg-red-500/30 text-red-400 rounded transition"
                  title="Remove Image"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {isSelected && (
              <div
                onMouseDown={(e) => handleStartResize(e, img)}
                onTouchStart={(e) => handleStartResize(e, img)}
                style={{ touchAction: 'none' }}
                className="absolute -bottom-3 -right-3 w-7 h-7 sm:w-5 sm:h-5 bg-emerald-500 border-2 border-white rounded-full cursor-se-resize shadow-lg flex items-center justify-center z-40 hover:scale-125 active:scale-125 transition-transform"
                title="Drag to resize image"
              >
                <Maximize2 className="w-3.5 h-3.5 sm:w-2.5 sm:h-2.5 text-white" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

