import React, { useState } from 'react';
import { FreehandDrawing, SignatureAnnotation, StampAnnotation, StrikeoutAnnotation, ToolMode } from '../types/pdf';

interface DrawingCanvasOverlayProps {
  pageIndex: number;
  canvasWidth: number;
  canvasHeight: number;
  originalWidth: number;
  originalHeight: number;
  toolMode: ToolMode;
  pendingSignatureDataUrl?: string | null;
  drawings: FreehandDrawing[];
  stamps: StampAnnotation[];
  strikeouts: StrikeoutAnnotation[];
  shapeStrokeColor?: string;
  shapeFillColor?: string;
  shapeStrokeWidth?: number;
  drawColor?: string;
  thickness?: number;
  highlightColor?: string;
  highlightMode?: 'line' | 'box' | 'freehand';
  highlightThickness?: number;
  eraserThickness?: number;
  eraserColor?: string;
  onSampleEraserColor?: (color: string) => void;
  getPageCanvas?: () => HTMLCanvasElement | undefined | null;
  onAddDrawing: (drawing: Omit<FreehandDrawing, 'id'>) => void;
  onDeleteDrawing: (id: string) => void;
  onAddStamp: (stamp: Omit<StampAnnotation, 'id'>) => void;
  onDeleteStamp: (id: string) => void;
  onAddStrikeout: (strike: Omit<StrikeoutAnnotation, 'id'>) => void;
  onDeleteStrikeout: (id: string) => void;
  onAddShape?: (shape: Omit<import('../types/pdf').ShapeAnnotation, 'id'>) => void;
  onAddSignatureAtCoords?: (sig: Omit<SignatureAnnotation, 'id'>) => void;
  onOpenSignatureModal?: (tab?: 'draw' | 'type' | 'upload') => void;
}

// Build silky-smooth quadratic Bézier SVG curve path from discrete sampled points
function buildSmoothSvgPath(points: { x: number; y: number }[], scaleX: number, scaleY: number): string {
  if (!points || points.length === 0) return '';
  if (points.length === 1) {
    const p = points[0];
    return `M ${p.x * scaleX} ${p.y * scaleY} L ${(p.x + 0.1) * scaleX} ${(p.y + 0.1) * scaleY}`;
  }
  if (points.length === 2) {
    return `M ${points[0].x * scaleX} ${points[0].y * scaleY} L ${points[1].x * scaleX} ${points[1].y * scaleY}`;
  }
  let path = `M ${points[0].x * scaleX} ${points[0].y * scaleY}`;
  for (let i = 1; i < points.length - 1; i++) {
    const pCurr = points[i];
    const pNext = points[i + 1];
    const midX = ((pCurr.x + pNext.x) / 2) * scaleX;
    const midY = ((pCurr.y + pNext.y) / 2) * scaleY;
    path += ` Q ${pCurr.x * scaleX} ${pCurr.y * scaleY}, ${midX} ${midY}`;
  }
  const last = points[points.length - 1];
  path += ` L ${last.x * scaleX} ${last.y * scaleY}`;
  return path;
}

export const DrawingCanvasOverlay: React.FC<DrawingCanvasOverlayProps> = ({
  pageIndex,
  canvasWidth,
  canvasHeight,
  originalWidth,
  originalHeight,
  toolMode,
  pendingSignatureDataUrl,
  drawings,
  stamps,
  strikeouts,
  shapeStrokeColor,
  shapeFillColor,
  shapeStrokeWidth,
  drawColor = '#ef4444',
  thickness = 3,
  highlightColor = '#facc15',
  highlightMode = 'line',
  highlightThickness = 18,
  eraserThickness = 12,
  eraserColor = '#ffffff',
  onSampleEraserColor,
  getPageCanvas,
  onAddDrawing,
  onDeleteDrawing,
  onAddStamp,
  onDeleteStamp,
  onAddStrikeout,
  onDeleteStrikeout,
  onAddShape,
  onAddSignatureAtCoords,
  onOpenSignatureModal,
}) => {
  // Draw & Highlight Options
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<{ x: number; y: number }[]>([]);
  const [hoverPt, setHoverPt] = useState<{ x: number; y: number } | null>(null);

  // Sample exact underlying PDF background color from page canvas
  const samplePageColor = (pt: { x: number; y: number }): string => {
    if (!getPageCanvas) return '#ffffff';
    const canvas = getPageCanvas();
    if (!canvas) return '#ffffff';
    try {
      const ctx = canvas.getContext('2d', { willReadFrequently: true }) || canvas.getContext('2d');
      if (!ctx) return '#ffffff';
      const px = Math.max(0, Math.min(canvas.width - 1, Math.round((pt.x / originalWidth) * canvas.width)));
      const py = Math.max(0, Math.min(canvas.height - 1, Math.round((pt.y / originalHeight) * canvas.height)));
      const pixel = ctx.getImageData(px, py, 1, 1).data;
      if (pixel[3] < 10) return '#ffffff'; // Transparent pixel fallback
      const toHex = (n: number) => n.toString(16).padStart(2, '0');
      return `#${toHex(pixel[0])}${toHex(pixel[1])}${toHex(pixel[2])}`;
    } catch {
      return '#ffffff';
    }
  };

  // Shape Drag-to-Draw State
  const [isDrawingShape, setIsDrawingShape] = useState(false);
  const [shapeStartPt, setShapeStartPt] = useState<{ x: number; y: number } | null>(null);
  const [shapeCurrentPt, setShapeCurrentPt] = useState<{ x: number; y: number } | null>(null);

  // Selected item for deletion
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (originalWidth <= 0 || originalHeight <= 0) return null;

  const scaleX = canvasWidth / originalWidth;
  const scaleY = canvasHeight / originalHeight;

  const pageDrawings = drawings.filter((d) => d.pageIndex === pageIndex);
  const pageStamps = stamps.filter((s) => s.pageIndex === pageIndex);
  const pageStrikeouts = strikeouts.filter((s) => s.pageIndex === pageIndex);

  const activeMode =
    toolMode === 'draw' ||
    toolMode === 'highlight' ||
    toolMode === 'eraser' ||
    toolMode === 'checkmark' ||
    toolMode === 'crossmark' ||
    toolMode === 'strikeout' ||
    toolMode === 'sign' ||
    toolMode === 'line' ||
    toolMode === 'rectangle' ||
    toolMode === 'oval';

  const getPdfCoords = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    return {
      x: Math.round(screenX / scaleX),
      y: Math.round(screenY / scaleY),
    };
  };

  const eraseDrawingsNearPoint = (pt: { x: number; y: number }, radius: number) => {
    for (const d of pageDrawings) {
      for (const p of d.points) {
        const dx = p.x - pt.x;
        const dy = p.y - pt.y;
        if (dx * dx + dy * dy <= (radius + (d.thickness || 4)) * (radius + (d.thickness || 4))) {
          onDeleteDrawing(d.id);
          break;
        }
      }
    }
  };

  const handleDropPoint = (pt: { x: number; y: number }) => {
    if (toolMode === 'checkmark') {
      onAddStamp({
        pageIndex,
        type: 'checkmark',
        x: pt.x,
        y: pt.y,
        size: 24,
        color: '#10b981', // Emerald Green
      });
    } else if (toolMode === 'crossmark') {
      onAddStamp({
        pageIndex,
        type: 'crossmark',
        x: pt.x,
        y: pt.y,
        size: 22,
        color: '#ef4444', // Red
      });
    } else if (toolMode === 'strikeout') {
      onAddStrikeout({
        pageIndex,
        x: Math.max(10, pt.x - 40),
        y: pt.y,
        width: 100,
        thickness: 3,
        color: '#ef4444', // Red strikeout line
      });
    } else if (toolMode === 'sign') {
      if (pendingSignatureDataUrl && onAddSignatureAtCoords) {
        onAddSignatureAtCoords({
          pageIndex,
          x: Math.max(0, pt.x - 80),
          y: Math.max(0, pt.y - 35),
          width: 160,
          height: 70,
          dataUrl: pendingSignatureDataUrl,
        });
      } else if (onOpenSignatureModal) {
        onOpenSignatureModal('draw');
      }
    }
  };

  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    const pt = getPdfCoords(e);
    if (toolMode === 'draw' || toolMode === 'highlight' || toolMode === 'eraser') {
      setIsDrawing(true);
      setCurrentPoints([pt]);
      if (toolMode === 'eraser') {
        const sampled = samplePageColor(pt);
        if (onSampleEraserColor) onSampleEraserColor(sampled);
        eraseDrawingsNearPoint(pt, eraserThickness);
      }
    } else if (toolMode === 'line' || toolMode === 'rectangle' || toolMode === 'oval') {
      setIsDrawingShape(true);
      setShapeStartPt(pt);
      setShapeCurrentPt(pt);
    } else {
      handleDropPoint(pt);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const pt = getPdfCoords(e);
    if (toolMode === 'eraser') {
      setHoverPt(pt);
    }

    if (isDrawingShape) {
      setShapeCurrentPt(pt);
      return;
    }

    if (!isDrawing || (toolMode !== 'draw' && toolMode !== 'highlight' && toolMode !== 'eraser')) return;

    if (toolMode === 'highlight' && highlightMode === 'line') {
      const startPt = currentPoints[0] || pt;
      const lockedPt = { x: pt.x, y: startPt.y };
      setCurrentPoints([startPt, lockedPt]);
    } else {
      setCurrentPoints((prev) => [...prev, pt]);
    }

    if (toolMode === 'eraser') {
      eraseDrawingsNearPoint(pt, eraserThickness);
    }
  };

  const handleMouseUp = () => {
    if (isDrawingShape && shapeStartPt && shapeCurrentPt) {
      const x1 = shapeStartPt.x;
      const y1 = shapeStartPt.y;
      let x2 = shapeCurrentPt.x;
      let y2 = shapeCurrentPt.y;

      const dist = Math.hypot(x2 - x1, y2 - y1);

      if (toolMode === 'line') {
        if (dist < 5) {
          // Single click: default horizontal line 140pt long
          x2 = x1 + 140;
          y2 = y1;
        }

        const minX = Math.min(x1, x2);
        const minY = Math.min(y1, y2);
        const maxX = Math.max(x1, x2);
        const maxY = Math.max(y1, y2);
        const w = Math.max(maxX - minX, Math.max((shapeStrokeWidth || 2) * 2, 8));
        const h = Math.max(maxY - minY, Math.max((shapeStrokeWidth || 2) * 2, 8));

        if (onAddShape) {
          onAddShape({
            pageIndex,
            type: 'line',
            x: x1,
            y: y1,
            x2,
            y2,
            width: w,
            height: h,
            strokeColor: shapeStrokeColor || '#3b82f6',
            fillColor: 'transparent',
            strokeWidth: shapeStrokeWidth || 2,
          });
        }
      } else {
        // Rectangle or Oval
        let w = Math.abs(x2 - x1);
        let h = Math.abs(y2 - y1);
        let finalX = Math.min(x1, x2);
        let finalY = Math.min(y1, y2);

        if (w < 6 && h < 6) {
          // Single click: default size
          w = 140;
          h = 80;
          finalX = x1;
          finalY = y1;
        }

        if (onAddShape) {
          onAddShape({
            pageIndex,
            type: toolMode as 'rectangle' | 'oval',
            x: finalX,
            y: finalY,
            width: w,
            height: h,
            strokeColor: shapeStrokeColor || '#3b82f6',
            fillColor: shapeFillColor || 'transparent',
            strokeWidth: shapeStrokeWidth || 2,
          });
        }
      }

      setIsDrawingShape(false);
      setShapeStartPt(null);
      setShapeCurrentPt(null);
      return;
    }
    if (isDrawing && currentPoints.length > 0) {
      const isHighlight = toolMode === 'highlight';
      const isEraser = toolMode === 'eraser';
      const pts = currentPoints.length === 1
        ? [currentPoints[0], { x: currentPoints[0].x + 1, y: currentPoints[0].y }]
        : currentPoints;

      if (isHighlight && highlightMode === 'line') {
        const pStart = currentPoints[0];
        const pEnd = currentPoints[currentPoints.length - 1];
        let minX = Math.min(pStart.x, pEnd.x);
        let maxX = Math.max(pStart.x, pEnd.x);
        if (maxX - minX < 8) {
          minX = Math.max(10, pStart.x - 10);
          maxX = Math.min(originalWidth - 10, pStart.x + 220);
        }

        onAddDrawing({
          pageIndex,
          points: [
            { x: minX, y: pStart.y },
            { x: maxX, y: pStart.y },
          ],
          color: highlightColor,
          thickness: highlightThickness,
          opacity: 0.40,
        });
      } else if (isHighlight && highlightMode === 'box') {
        const pStart = currentPoints[0];
        const pEnd = currentPoints[currentPoints.length - 1];
        let minX = Math.min(pStart.x, pEnd.x);
        let maxX = Math.max(pStart.x, pEnd.x);
        let minY = Math.min(pStart.y, pEnd.y);
        let maxY = Math.max(pStart.y, pEnd.y);
        let w = maxX - minX;
        let h = maxY - minY;

        // Single click on a text line -> auto line highlight rectangle
        if (w < 8 && h < 8) {
          minX = Math.max(10, pStart.x - 10);
          maxX = Math.min(originalWidth - 10, pStart.x + 220);
          minY = pStart.y - 8;
          maxY = pStart.y + 8;
          w = maxX - minX;
          h = 16;
        }

        const midY = minY + h / 2;
        onAddDrawing({
          pageIndex,
          points: [
            { x: minX, y: midY },
            { x: minX + w, y: midY },
          ],
          color: highlightColor,
          thickness: Math.max(12, Math.round(h)),
          opacity: 0.35,
        });
      } else {
        onAddDrawing({
          pageIndex,
          points: pts,
          color: isEraser ? eraserColor : isHighlight ? highlightColor : drawColor,
          thickness: isEraser ? eraserThickness : isHighlight ? highlightThickness : thickness,
          opacity: isHighlight ? 0.45 : 1.0,
        });
      }
    }
    setIsDrawing(false);
    setCurrentPoints([]);
  };

  const getPdfCoordsFromTouch = (e: React.TouchEvent<SVGSVGElement>) => {
    if (!e.touches || e.touches.length === 0) return null;
    const rect = e.currentTarget.getBoundingClientRect();
    const touch = e.touches[0];
    const screenX = touch.clientX - rect.left;
    const screenY = touch.clientY - rect.top;
    return {
      x: Math.round(screenX / scaleX),
      y: Math.round(screenY / scaleY),
    };
  };

  const handleTouchStart = (e: React.TouchEvent<SVGSVGElement>) => {
    if (e.touches && e.touches.length >= 2) {
      setIsDrawing(false);
      setIsDrawingShape(false);
      setCurrentPoints([]);
      return;
    }
    const pt = getPdfCoordsFromTouch(e);
    if (!pt) return;
    if (toolMode === 'draw' || toolMode === 'highlight' || toolMode === 'eraser') {
      setIsDrawing(true);
      setCurrentPoints([pt]);
      if (toolMode === 'eraser') {
        const sampled = samplePageColor(pt);
        if (onSampleEraserColor) onSampleEraserColor(sampled);
        eraseDrawingsNearPoint(pt, eraserThickness);
      }
    } else if (toolMode === 'line' || toolMode === 'rectangle' || toolMode === 'oval') {
      setIsDrawingShape(true);
      setShapeStartPt(pt);
      setShapeCurrentPt(pt);
    } else {
      handleDropPoint(pt);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<SVGSVGElement>) => {
    if (e.touches && e.touches.length >= 2) {
      setIsDrawing(false);
      setIsDrawingShape(false);
      setCurrentPoints([]);
      return;
    }
    const pt = getPdfCoordsFromTouch(e);
    if (!pt) return;

    if (isDrawingShape) {
      setShapeCurrentPt(pt);
      return;
    }

    if (!isDrawing || (toolMode !== 'draw' && toolMode !== 'highlight' && toolMode !== 'eraser')) return;
    setCurrentPoints((prev) => [...prev, pt]);
    if (toolMode === 'eraser') {
      eraseDrawingsNearPoint(pt, eraserThickness);
    }
  };

  return (
    <div className="absolute inset-0 z-20 pointer-events-none" style={{ width: `${canvasWidth}px`, height: `${canvasHeight}px` }}>
      {/* SVG Canvas for Freehand Drawing & Vector Stamps */}
      <svg
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => setHoverPt(null)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleMouseUp}
        onTouchCancel={handleMouseUp}
        style={{ touchAction: activeMode ? 'none' : 'auto' }}
        className={`w-full h-full ${activeMode ? 'pointer-events-auto cursor-crosshair' : 'pointer-events-none'}`}
      >
        {/* Existing Finished Drawings */}
        {pageDrawings.map((drawing) => {
          const isHighlighterOpacity = drawing.opacity < 1.0;
          const isHighlightBox = drawing.opacity <= 0.38 && drawing.points.length === 2 && drawing.points[0].y === drawing.points[1].y;
          const dPath = isHighlightBox
            ? `M ${drawing.points[0].x * scaleX} ${drawing.points[0].y * scaleY} L ${drawing.points[1].x * scaleX} ${drawing.points[1].y * scaleY}`
            : buildSmoothSvgPath(drawing.points, scaleX, scaleY);

          return (
            <path
              key={drawing.id}
              d={dPath}
              stroke={drawing.color}
              strokeWidth={drawing.thickness * scaleY}
              strokeOpacity={drawing.opacity}
              strokeLinecap={isHighlightBox ? 'butt' : 'round'}
              strokeLinejoin="round"
              fill="none"
              style={{ mixBlendMode: isHighlighterOpacity ? 'multiply' : 'normal' }}
              className="pointer-events-auto hover:stroke-cyan-400 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                if (toolMode === 'eraser' || confirm('Delete this drawing / erasure?')) {
                  onDeleteDrawing(drawing.id);
                }
              }}
            />
          );
        })}

        {/* Live Active Stroke / Line / Box Highlight Preview */}
        {isDrawing && currentPoints.length > 0 && (
          toolMode === 'highlight' && highlightMode === 'line' ? (
            (() => {
              const pStart = currentPoints[0];
              const pEnd = currentPoints[currentPoints.length - 1];
              const minX = Math.min(pStart.x, pEnd.x) * scaleX;
              const maxX = Math.max(pStart.x, pEnd.x) * scaleX;
              const y = pStart.y * scaleY;
              return (
                <line
                  x1={minX}
                  y1={y}
                  x2={maxX}
                  y2={y}
                  stroke={highlightColor}
                  strokeWidth={highlightThickness * scaleY}
                  strokeOpacity="0.45"
                  strokeLinecap="butt"
                  style={{ mixBlendMode: 'multiply' }}
                />
              );
            })()
          ) : toolMode === 'highlight' && highlightMode === 'box' ? (
            (() => {
              const pStart = currentPoints[0];
              const pEnd = currentPoints[currentPoints.length - 1];
              const minX = Math.min(pStart.x, pEnd.x) * scaleX;
              const minY = Math.min(pStart.y, pEnd.y) * scaleY;
              const w = Math.max(12, Math.abs(pEnd.x - pStart.x)) * scaleX;
              const h = Math.max(12, Math.abs(pEnd.y - pStart.y)) * scaleY;
              return (
                <rect
                  x={minX}
                  y={minY}
                  width={w}
                  height={h}
                  fill={highlightColor}
                  fillOpacity="0.35"
                  stroke={highlightColor}
                  strokeWidth="1.5"
                  strokeDasharray="4 3"
                  style={{ mixBlendMode: 'multiply' }}
                />
              );
            })()
          ) : (
            <path
              d={buildSmoothSvgPath(currentPoints, scaleX, scaleY)}
              stroke={toolMode === 'eraser' ? eraserColor : toolMode === 'highlight' ? highlightColor : drawColor}
              strokeWidth={(toolMode === 'eraser' ? eraserThickness : toolMode === 'highlight' ? highlightThickness : thickness) * scaleY}
              strokeOpacity={toolMode === 'highlight' ? 0.45 : 1.0}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              style={{ mixBlendMode: toolMode === 'highlight' ? 'multiply' : 'normal' }}
            />
          )
        )}

        {/* Real-time Preview of Vector Shape Being Drawn */}
        {isDrawingShape && shapeStartPt && shapeCurrentPt && (
          <g className="pointer-events-none">
            {toolMode === 'line' && (
              <line
                x1={shapeStartPt.x * scaleX}
                y1={shapeStartPt.y * scaleY}
                x2={shapeCurrentPt.x * scaleX}
                y2={shapeCurrentPt.y * scaleY}
                stroke={shapeStrokeColor || '#3b82f6'}
                strokeWidth={(shapeStrokeWidth || 2) * scaleX}
                strokeDasharray="4 4"
              />
            )}
            {toolMode === 'rectangle' && (
              <rect
                x={Math.min(shapeStartPt.x, shapeCurrentPt.x) * scaleX}
                y={Math.min(shapeStartPt.y, shapeCurrentPt.y) * scaleY}
                width={Math.max(4, Math.abs(shapeCurrentPt.x - shapeStartPt.x)) * scaleX}
                height={Math.max(4, Math.abs(shapeCurrentPt.y - shapeStartPt.y)) * scaleY}
                stroke={shapeStrokeColor || '#3b82f6'}
                strokeWidth={(shapeStrokeWidth || 2) * scaleX}
                fill={shapeFillColor && shapeFillColor !== 'transparent' ? shapeFillColor : 'none'}
                strokeDasharray="4 4"
              />
            )}
            {toolMode === 'oval' && (
              <ellipse
                cx={((shapeStartPt.x + shapeCurrentPt.x) / 2) * scaleX}
                cy={((shapeStartPt.y + shapeCurrentPt.y) / 2) * scaleY}
                rx={Math.max(2, (Math.abs(shapeCurrentPt.x - shapeStartPt.x) / 2) * scaleX)}
                ry={Math.max(2, (Math.abs(shapeCurrentPt.y - shapeStartPt.y) / 2) * scaleY)}
                stroke={shapeStrokeColor || '#3b82f6'}
                strokeWidth={(shapeStrokeWidth || 2) * scaleX}
                fill={shapeFillColor && shapeFillColor !== 'transparent' ? shapeFillColor : 'none'}
                strokeDasharray="4 4"
              />
            )}
          </g>
        )}

        {/* Dynamic Precision Eraser Cursor Indicator */}
        {toolMode === 'eraser' && hoverPt && (
          <g className="pointer-events-none">
            <circle
              cx={hoverPt.x * scaleX}
              cy={hoverPt.y * scaleY}
              r={Math.max(3, (eraserThickness * scaleY) / 2)}
              fill={eraserColor}
              fillOpacity="0.45"
              stroke="#f59e0b"
              strokeWidth="1.5"
              strokeDasharray="3 3"
            />
            <circle
              cx={hoverPt.x * scaleX}
              cy={hoverPt.y * scaleY}
              r="1.5"
              fill="#f59e0b"
            />
          </g>
        )}

        {/* Render Checkmarks & Crossmarks */}
        {pageStamps.map((stamp) => {
          const sx = stamp.x * scaleX;
          const sy = stamp.y * scaleY;
          const sz = stamp.size * scaleX;
          const th = Math.max(2, sz * 0.12);

          return (
            <g
              key={stamp.id}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedId(stamp.id);
              }}
              className="pointer-events-auto cursor-pointer group"
            >
              {stamp.type === 'checkmark' ? (
                <path
                  d={`M ${sx} ${sy + sz * 0.45} L ${sx + sz * 0.35} ${sy + sz * 0.85} L ${sx + sz * 0.95} ${sy + sz * 0.1}`}
                  stroke={stamp.color}
                  strokeWidth={th}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              ) : (
                <g>
                  <line x1={sx} y1={sy} x2={sx + sz} y2={sy + sz} stroke={stamp.color} strokeWidth={th} strokeLinecap="round" />
                  <line x1={sx + sz} y1={sy} x2={sx} y2={sy + sz} stroke={stamp.color} strokeWidth={th} strokeLinecap="round" />
                </g>
              )}
            </g>
          );
        })}

        {/* Render Strikeout Lines */}
        {pageStrikeouts.map((strike) => {
          const sx = strike.x * scaleX;
          const sy = strike.y * scaleY;
          const sw = strike.width * scaleX;

          return (
            <g key={strike.id} className="pointer-events-auto cursor-pointer group">
              <line
                x1={sx}
                y1={sy}
                x2={sx + sw}
                y2={sy}
                stroke={strike.color}
                strokeWidth={strike.thickness * scaleY}
                strokeLinecap="round"
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm('Remove strikeout line?')) onDeleteStrikeout(strike.id);
                }}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
};
