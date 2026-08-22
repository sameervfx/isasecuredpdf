import React, { useState, useEffect, useRef } from 'react';
import { Trash2, Move, Maximize2 } from 'lucide-react';
import { ShapeAnnotation } from '../types/pdf';

interface ShapeOverlayProps {
  shapes: ShapeAnnotation[];
  pageIndex: number;
  canvasWidth: number;
  canvasHeight: number;
  originalWidth: number;
  originalHeight: number;
  onUpdateShape: (id: string, updated: Partial<ShapeAnnotation>) => void;
  onDeleteShape: (id: string) => void;
}

export const ShapeOverlay: React.FC<ShapeOverlayProps> = ({
  shapes,
  pageIndex,
  canvasWidth,
  canvasHeight,
  originalWidth,
  originalHeight,
  onUpdateShape,
  onDeleteShape,
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [dragState, setDragState] = useState<{
    shapeId: string;
    offsetX: number;
    offsetY: number;
  } | null>(null);

  const [resizeState, setResizeState] = useState<{
    shapeId: string;
    startMouseX: number;
    startMouseY: number;
    startWidth: number;
    startHeight: number;
  } | null>(null);

  const pageShapes = (shapes || []).filter((s) => s.pageIndex === pageIndex);
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

        const newPdfX = Math.max(0, Math.min(originalWidth - 10, newScreenX / scaleX));
        const newPdfY = Math.max(0, Math.min(originalHeight - 10, newScreenY / scaleY));

        const targetShape = pageShapes.find((s) => s.id === dragState.shapeId);
        if (targetShape && targetShape.type === 'line') {
          const lineX1 = targetShape.x;
          const lineY1 = targetShape.y;
          const lineX2 = targetShape.x2 ?? (targetShape.x + targetShape.width);
          const lineY2 = targetShape.y2 ?? (targetShape.y + targetShape.height);
          const origMinX = Math.min(lineX1, lineX2);
          const origMinY = Math.min(lineY1, lineY2);

          const deltaX = Math.round(newPdfX - origMinX);
          const deltaY = Math.round(newPdfY - origMinY);

          onUpdateShape(dragState.shapeId, {
            x: lineX1 + deltaX,
            y: lineY1 + deltaY,
            x2: lineX2 + deltaX,
            y2: lineY2 + deltaY,
          });
        } else {
          onUpdateShape(dragState.shapeId, {
            x: Math.round(newPdfX),
            y: Math.round(newPdfY),
          });
        }
      } else if (resizeState) {
        const deltaX = (e.clientX - resizeState.startMouseX) / scaleX;
        const deltaY = (e.clientY - resizeState.startMouseY) / scaleY;

        const targetShape = pageShapes.find((s) => s.id === resizeState.shapeId);
        if (targetShape && targetShape.type === 'line') {
          const lineX2 = targetShape.x2 ?? (targetShape.x + targetShape.width);
          const lineY2 = targetShape.y2 ?? (targetShape.y + targetShape.height);
          onUpdateShape(resizeState.shapeId, {
            x2: Math.round(lineX2 + deltaX),
            y2: Math.round(lineY2 + deltaY),
            width: Math.max(10, Math.round(resizeState.startWidth + deltaX)),
            height: Math.max(10, Math.round(resizeState.startHeight + deltaY)),
          });
        } else {
          const newW = Math.max(10, resizeState.startWidth + deltaX);
          const newH = Math.max(10, resizeState.startHeight + deltaY);

          onUpdateShape(resizeState.shapeId, {
            width: Math.round(newW),
            height: Math.round(newH),
          });
        }
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
  }, [dragState, resizeState, scaleX, scaleY, originalWidth, originalHeight, onUpdateShape, pageShapes]);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (!selectedId) return;
      const target = e.target as HTMLElement;
      if (!target.closest('.shape-element')) {
        setSelectedId(null);
      }
    };
    window.addEventListener('mousedown', handleOutsideClick);
    return () => window.removeEventListener('mousedown', handleOutsideClick);
  }, [selectedId]);

  if (pageShapes.length === 0 || originalWidth <= 0 || originalHeight <= 0) return null;

  const handleMouseDownDrag = (e: React.MouseEvent, shape: ShapeAnnotation) => {
    e.stopPropagation();
    setSelectedId(shape.id);

    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const isLine = shape.type === 'line';
    const lineX1 = shape.x;
    const lineY1 = shape.y;
    const lineX2 = shape.x2 ?? (shape.x + shape.width);
    const lineY2 = shape.y2 ?? (shape.y + shape.height);

    const minX = isLine ? Math.min(lineX1, lineX2) : shape.x;
    const minY = isLine ? Math.min(lineY1, lineY2) : shape.y;

    const shapeScreenX = minX * scaleX;
    const shapeScreenY = minY * scaleY;

    const mouseScreenX = e.clientX - containerRect.left;
    const mouseScreenY = e.clientY - containerRect.top;

    setDragState({
      shapeId: shape.id,
      offsetX: mouseScreenX - shapeScreenX,
      offsetY: mouseScreenY - shapeScreenY,
    });
  };

  const handleMouseDownResize = (e: React.MouseEvent, shape: ShapeAnnotation) => {
    e.stopPropagation();
    setSelectedId(shape.id);

    setResizeState({
      shapeId: shape.id,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startWidth: shape.width,
      startHeight: shape.height,
    });
  };

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none z-20"
      style={{ width: `${canvasWidth}px`, height: `${canvasHeight}px` }}
    >
      {pageShapes.map((shape) => {
        const isLine = shape.type === 'line';
        const lineX1 = shape.x;
        const lineY1 = shape.y;
        const lineX2 = shape.x2 ?? (shape.x + shape.width);
        const lineY2 = shape.y2 ?? (shape.y + shape.height);

        const minX = isLine ? Math.min(lineX1, lineX2) : shape.x;
        const minY = isLine ? Math.min(lineY1, lineY2) : shape.y;
        const maxX = isLine ? Math.max(lineX1, lineX2) : shape.x + shape.width;
        const maxY = isLine ? Math.max(lineY1, lineY2) : shape.y + shape.height;

        const pad = isLine ? Math.max(shape.strokeWidth * 2, 8) : 0;
        const boundsW = Math.max(maxX - minX, pad);
        const boundsH = Math.max(maxY - minY, pad);

        const scaledX = minX * scaleX;
        const scaledY = minY * scaleY;
        const scaledWidth = boundsW * scaleX;
        const scaledHeight = boundsH * scaleY;
        const isSelected = selectedId === shape.id;

        const svgLineX1 = isLine ? (lineX1 - minX) * scaleX : 0;
        const svgLineY1 = isLine ? (lineY1 - minY) * scaleY : 0;
        const svgLineX2 = isLine ? (lineX2 - minX) * scaleX : scaledWidth;
        const svgLineY2 = isLine ? (lineY2 - minY) * scaleY : scaledHeight;

        return (
          <div
            key={shape.id}
            onMouseDown={(e) => handleMouseDownDrag(e, shape)}
            className={`shape-element absolute pointer-events-auto cursor-grab active:cursor-grabbing select-none rounded p-0.5 transition-all ${
              isSelected
                ? 'ring-2 ring-blue-500 bg-blue-500/10 shadow-2xl z-30'
                : 'hover:ring-1 hover:ring-slate-400/50 z-20'
            }`}
            style={{
              left: `${scaledX}px`,
              top: `${scaledY}px`,
              width: `${scaledWidth}px`,
              height: `${scaledHeight}px`,
            }}
          >
            <svg className="w-full h-full overflow-visible pointer-events-none">
              {isLine && (
                <line
                  x1={svgLineX1}
                  y1={svgLineY1}
                  x2={svgLineX2}
                  y2={svgLineY2}
                  stroke={shape.strokeColor}
                  strokeWidth={shape.strokeWidth * scaleX}
                />
              )}
              {shape.type === 'rectangle' && (
                <rect
                  x="0"
                  y="0"
                  width={scaledWidth}
                  height={scaledHeight}
                  stroke={shape.strokeColor}
                  strokeWidth={shape.strokeWidth * scaleX}
                  fill={shape.fillColor && shape.fillColor !== 'transparent' ? shape.fillColor : 'none'}
                />
              )}
              {shape.type === 'oval' && (
                <ellipse
                  cx={scaledWidth / 2}
                  cy={scaledHeight / 2}
                  rx={Math.max(1, scaledWidth / 2 - (shape.strokeWidth * scaleX) / 2)}
                  ry={Math.max(1, scaledHeight / 2 - (shape.strokeWidth * scaleY) / 2)}
                  stroke={shape.strokeColor}
                  strokeWidth={shape.strokeWidth * scaleX}
                  fill={shape.fillColor && shape.fillColor !== 'transparent' ? shape.fillColor : 'none'}
                />
              )}
            </svg>

            {isSelected && (
              <div className="absolute -top-9 left-0 bg-slate-900 border border-slate-700 rounded-lg p-1 flex items-center space-x-2 shadow-xl z-40">
                <Move className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-[10px] text-slate-300 font-mono capitalize">
                  {shape.type} ({Math.round(boundsW)}x{Math.round(boundsH)})
                </span>
                <button
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteShape(shape.id);
                  }}
                  className="p-1 text-slate-400 hover:text-red-400 transition"
                  title="Remove Shape"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {isSelected && (
              <div
                onMouseDown={(e) => handleMouseDownResize(e, shape)}
                className="absolute -bottom-1.5 -right-1.5 w-4 h-4 bg-blue-500 border-2 border-white rounded-full cursor-se-resize shadow-lg flex items-center justify-center z-40 hover:scale-125 transition-transform"
                title="Drag to resize shape"
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
