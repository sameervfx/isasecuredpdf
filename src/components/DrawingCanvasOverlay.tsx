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
  onAddDrawing: (drawing: Omit<FreehandDrawing, 'id'>) => void;
  onDeleteDrawing: (id: string) => void;
  onAddStamp: (stamp: Omit<StampAnnotation, 'id'>) => void;
  onDeleteStamp: (id: string) => void;
  onAddStrikeout: (strike: Omit<StrikeoutAnnotation, 'id'>) => void;
  onDeleteStrikeout: (id: string) => void;
  onAddSignatureAtCoords?: (sig: Omit<SignatureAnnotation, 'id'>) => void;
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
  onAddDrawing,
  onDeleteDrawing,
  onAddStamp,
  onDeleteStamp,
  onAddStrikeout,
  onDeleteStrikeout,
  onAddSignatureAtCoords,
}) => {
  // Draw State
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<{ x: number; y: number }[]>([]);
  const [drawColor, setDrawColor] = useState<string>('#ef4444'); // Default Red
  const [thickness, setThickness] = useState<number>(3);
  const [isHighlighter, setIsHighlighter] = useState<boolean>(false);

  // Selected Stamp / Strikeout for deletion
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (originalWidth <= 0 || originalHeight <= 0) return null;

  const scaleX = canvasWidth / originalWidth;
  const scaleY = canvasHeight / originalHeight;

  const pageDrawings = drawings.filter((d) => d.pageIndex === pageIndex);
  const pageStamps = stamps.filter((s) => s.pageIndex === pageIndex);
  const pageStrikeouts = strikeouts.filter((s) => s.pageIndex === pageIndex);

  const getPdfCoords = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    return {
      x: Math.round(screenX / scaleX),
      y: Math.round(screenY / scaleY),
    };
  };

  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    const pt = getPdfCoords(e);

    if (toolMode === 'draw') {
      setIsDrawing(true);
      setCurrentPoints([pt]);
    } else if (toolMode === 'checkmark') {
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
    } else if (toolMode === 'sign' && pendingSignatureDataUrl && onAddSignatureAtCoords) {
      onAddSignatureAtCoords({
        pageIndex,
        x: Math.max(0, pt.x - 80),
        y: Math.max(0, pt.y - 35),
        width: 160,
        height: 70,
        dataUrl: pendingSignatureDataUrl,
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDrawing || toolMode !== 'draw') return;
    const pt = getPdfCoords(e);
    setCurrentPoints((prev) => [...prev, pt]);
  };

  const handleMouseUp = () => {
    if (isDrawing && currentPoints.length > 1) {
      onAddDrawing({
        pageIndex,
        points: currentPoints,
        color: isHighlighter ? '#fef08a' : drawColor,
        thickness: isHighlighter ? 12 : thickness,
        opacity: isHighlighter ? 0.45 : 1.0,
      });
    }
    setIsDrawing(false);
    setCurrentPoints([]);
  };

  const activeMode = toolMode === 'draw' || toolMode === 'checkmark' || toolMode === 'crossmark' || toolMode === 'strikeout';

  return (
    <div className="absolute inset-0 z-20 pointer-events-none" style={{ width: `${canvasWidth}px`, height: `${canvasHeight}px` }}>
      {/* Floating Drawing Options Bar */}
      {toolMode === 'draw' && (
        <div className="absolute top-2 right-2 bg-slate-900/90 border border-slate-700/80 backdrop-blur rounded-xl p-1.5 flex items-center space-x-2 shadow-2xl pointer-events-auto z-40 text-xs">
          <button
            onClick={() => setIsHighlighter(!isHighlighter)}
            className={`px-2 py-1 rounded font-semibold transition ${
              isHighlighter ? 'bg-yellow-400 text-slate-950 shadow' : 'bg-slate-800 text-slate-300'
            }`}
          >
            {isHighlighter ? 'Highlighter' : 'Pen'}
          </button>

          {!isHighlighter && (
            <>
              {/* Color options */}
              {['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#000000'].map((c) => (
                <button
                  key={c}
                  onClick={() => setDrawColor(c)}
                  className={`w-5 h-5 rounded-full border-2 transition ${drawColor === c ? 'scale-125 border-white shadow' : 'border-transparent'}`}
                  style={{ backgroundColor: c }}
                />
              ))}

              {/* Thickness selector */}
              <select
                value={thickness}
                onChange={(e) => setThickness(Number(e.target.value))}
                className="bg-slate-800 text-slate-200 border border-slate-700 rounded px-1 text-[11px]"
              >
                <option value={2}>2px</option>
                <option value={4}>4px</option>
                <option value={8}>8px</option>
                <option value={12}>12px</option>
              </select>
            </>
          )}
        </div>
      )}

      {/* SVG Canvas for Freehand Drawing & Vector Stamps */}
      <svg
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        className={`w-full h-full ${activeMode ? 'pointer-events-auto cursor-crosshair' : 'pointer-events-none'}`}
      >
        {/* Existing Finished Drawings */}
        {pageDrawings.map((drawing) => {
          const dPath = drawing.points
            .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x * scaleX} ${p.y * scaleY}`)
            .join(' ');
          return (
            <path
              key={drawing.id}
              d={dPath}
              stroke={drawing.color}
              strokeWidth={drawing.thickness * scaleY}
              strokeOpacity={drawing.opacity}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              className="pointer-events-auto hover:stroke-cyan-400 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                if (confirm('Delete this drawn stroke?')) onDeleteDrawing(drawing.id);
              }}
            />
          );
        })}

        {/* Live Active Stroke */}
        {isDrawing && currentPoints.length > 1 && (
          <path
            d={currentPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x * scaleX} ${p.y * scaleY}`).join(' ')}
            stroke={isHighlighter ? '#fef08a' : drawColor}
            strokeWidth={(isHighlighter ? 12 : thickness) * scaleY}
            strokeOpacity={isHighlighter ? 0.45 : 1.0}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
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
