import React, { useState, useEffect, useRef } from 'react';
import { Trash2, Move, Maximize2 } from 'lucide-react';
import { SignatureAnnotation } from '../types/pdf';

interface SignatureOverlayProps {
  signatures: SignatureAnnotation[];
  pageIndex: number;
  canvasWidth: number;
  canvasHeight: number;
  originalWidth: number;
  originalHeight: number;
  onUpdateSignature: (id: string, updated: Partial<SignatureAnnotation>) => void;
  onDeleteSignature: (id: string) => void;
}

export const SignatureOverlay: React.FC<SignatureOverlayProps> = ({
  signatures,
  pageIndex,
  canvasWidth,
  canvasHeight,
  originalWidth,
  originalHeight,
  onUpdateSignature,
  onDeleteSignature,
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  
  // Drag State
  const [dragState, setDragState] = useState<{
    sigId: string;
    offsetX: number;
    offsetY: number;
  } | null>(null);

  // Resize State
  const [resizeState, setResizeState] = useState<{
    sigId: string;
    startMouseX: number;
    startMouseY: number;
    startWidth: number;
    startHeight: number;
  } | null>(null);

  const pageSigs = signatures.filter((s) => s.pageIndex === pageIndex);
  const scaleX = originalWidth > 0 ? canvasWidth / originalWidth : 1;
  const scaleY = originalHeight > 0 ? canvasHeight / originalHeight : 1;

  // Mouse Move & Mouse Up Event Listeners MUST be unconditional
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

        onUpdateSignature(dragState.sigId, {
          x: Math.round(newPdfX),
          y: Math.round(newPdfY),
        });
      } else if (resizeState) {
        const deltaX = (e.clientX - resizeState.startMouseX) / scaleX;
        const deltaY = (e.clientY - resizeState.startMouseY) / scaleY;

        const newW = Math.max(30, resizeState.startWidth + deltaX);
        const newH = Math.max(15, resizeState.startHeight + deltaY);

        onUpdateSignature(resizeState.sigId, {
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
  }, [dragState, resizeState, scaleX, scaleY, originalWidth, originalHeight, onUpdateSignature]);

  // Click outside listener to deselect signature handles
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (!selectedId) return;
      const target = e.target as HTMLElement;
      // If click target is outside any signature element, deselect
      if (!target.closest('.signature-element')) {
        setSelectedId(null);
      }
    };

    window.addEventListener('mousedown', handleOutsideClick);
    return () => {
      window.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [selectedId]);

  // Early return AFTER all hooks have been declared
  if (pageSigs.length === 0 || originalWidth <= 0 || originalHeight <= 0) return null;

  // Handle Dragging
  const handleMouseDownDrag = (e: React.MouseEvent, sig: SignatureAnnotation) => {
    e.stopPropagation();
    setSelectedId(sig.id);

    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const sigScreenX = sig.x * scaleX;
    const sigScreenY = sig.y * scaleY;

    const mouseScreenX = e.clientX - containerRect.left;
    const mouseScreenY = e.clientY - containerRect.top;

    setDragState({
      sigId: sig.id,
      offsetX: mouseScreenX - sigScreenX,
      offsetY: mouseScreenY - sigScreenY,
    });
  };

  // Handle Resize Handle Mouse Down
  const handleMouseDownResize = (e: React.MouseEvent, sig: SignatureAnnotation) => {
    e.stopPropagation();
    setSelectedId(sig.id);

    setResizeState({
      sigId: sig.id,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startWidth: sig.width,
      startHeight: sig.height,
    });
  };

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none z-20"
      style={{ width: `${canvasWidth}px`, height: `${canvasHeight}px` }}
    >
      {pageSigs.map((sig) => {
        const scaledX = sig.x * scaleX;
        const scaledY = sig.y * scaleY;
        const scaledWidth = sig.width * scaleX;
        const scaledHeight = sig.height * scaleY;
        const isSelected = selectedId === sig.id;

        return (
          <div
            key={sig.id}
            onMouseDown={(e) => handleMouseDownDrag(e, sig)}
            className={`signature-element absolute pointer-events-auto group cursor-grab active:cursor-grabbing select-none rounded p-1 transition-all ${
              isSelected
                ? 'ring-2 ring-cyan-500 bg-cyan-500/10 shadow-2xl z-30'
                : 'hover:ring-1 hover:ring-slate-400/50 z-20'
            }`}
            style={{
              left: `${scaledX}px`,
              top: `${scaledY}px`,
              width: `${scaledWidth}px`,
              height: `${scaledHeight}px`,
              opacity: sig.opacity !== undefined ? sig.opacity : 1.0,
              transform: sig.rotation ? `translate(-50%, -50%) rotate(${sig.rotation}deg)` : undefined,
              transformOrigin: 'center center',
            }}
          >
            <img
              src={sig.dataUrl}
              alt="Signature"
              className="w-full h-full object-contain pointer-events-none"
            />

            {/* Quick Actions Header */}
            {isSelected && (
              <div className="absolute -top-9 left-0 bg-slate-900 border border-slate-700 rounded-lg p-1 flex items-center space-x-2 shadow-xl z-40">
                <Move className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-[10px] text-slate-300 font-mono">
                  {Math.round(sig.width)}x{Math.round(sig.height)}pt
                </span>
                <button
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteSignature(sig.id);
                  }}
                  className="p-1 text-slate-400 hover:text-red-400 transition"
                  title="Remove Signature"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Bottom Right Resize Handle */}
            {isSelected && (
              <div
                onMouseDown={(e) => handleMouseDownResize(e, sig)}
                className="absolute -bottom-1.5 -right-1.5 w-4 h-4 bg-cyan-500 border-2 border-white rounded-full cursor-se-resize shadow-lg flex items-center justify-center z-40 hover:scale-125 transition-transform"
                title="Drag to resize signature"
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
