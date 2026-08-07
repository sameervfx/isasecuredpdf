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
  // Draw & Highlight Options
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<{ x: number; y: number }[]>([]);
  const [drawColor, setDrawColor] = useState<string>('#ef4444'); // Default Red Pen
  const [highlightColor, setHighlightColor] = useState<string>('#facc15'); // Default Yellow Highlighter
  const [thickness, setThickness] = useState<number>(3); // Pen Scale
  const [highlightThickness, setHighlightThickness] = useState<number>(18); // Highlighter Scale

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
    toolMode === 'checkmark' ||
    toolMode === 'crossmark' ||
    toolMode === 'strikeout' ||
    (toolMode === 'sign' && Boolean(pendingSignatureDataUrl));

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

    if (toolMode === 'draw' || toolMode === 'highlight') {
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
    if (!isDrawing || (toolMode !== 'draw' && toolMode !== 'highlight')) return;
    const pt = getPdfCoords(e);
    setCurrentPoints((prev) => [...prev, pt]);
  };

  const handleMouseUp = () => {
    if (isDrawing && currentPoints.length > 0) {
      const isHighlight = toolMode === 'highlight';
      const pts = currentPoints.length === 1
        ? [currentPoints[0], { x: currentPoints[0].x + 1, y: currentPoints[0].y }]
        : currentPoints;

      onAddDrawing({
        pageIndex,
        points: pts,
        color: isHighlight ? highlightColor : drawColor,
        thickness: isHighlight ? highlightThickness : thickness,
        opacity: isHighlight ? 0.45 : 1.0,
      });
    }
    setIsDrawing(false);
    setCurrentPoints([]);
  };

  return (
    <div className="absolute inset-0 z-20 pointer-events-none" style={{ width: `${canvasWidth}px`, height: `${canvasHeight}px` }}>
      {/* Floating Brush & Pencil Scale Toolbar Overlay */}
      {(toolMode === 'draw' || toolMode === 'highlight') && (
        <div className="absolute top-2 right-2 bg-slate-900/95 border border-slate-700/80 backdrop-blur rounded-2xl p-2 flex items-center space-x-3 shadow-2xl pointer-events-auto z-40 text-xs">
          {toolMode === 'draw' ? (
            <>
              <span className="text-[10px] font-extrabold uppercase text-cyan-400">Pencil Scale</span>
              {/* Pencil Colors */}
              <div className="flex items-center space-x-1">
                {['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#000000'].map((c) => (
                  <button
                    key={c}
                    onClick={() => setDrawColor(c)}
                    className={`w-5 h-5 rounded-full border-2 transition ${drawColor === c ? 'scale-125 border-white shadow-md' : 'border-transparent opacity-80'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>

              {/* Stroke Scale presets */}
              <div className="flex items-center space-x-1 border-l border-slate-700 pl-2">
                {[
                  { label: 'Fine', size: 2 },
                  { label: 'Medium', size: 5 },
                  { label: 'Bold', size: 10 },
                  { label: 'Heavy', size: 16 },
                ].map((s) => (
                  <button
                    key={s.size}
                    onClick={() => setThickness(s.size)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
                      thickness === s.size ? 'bg-cyan-500 text-white shadow' : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {s.label} ({s.size}px)
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <span className="text-[10px] font-extrabold uppercase text-yellow-400">Highlighter Scale</span>
              {/* Highlighter Colors */}
              <div className="flex items-center space-x-1">
                {['#facc15', '#4ade80', '#38bdf8', '#f472b6', '#fb923c', '#c084fc'].map((c) => (
                  <button
                    key={c}
                    onClick={() => setHighlightColor(c)}
                    className={`w-5 h-5 rounded-full border-2 transition ${highlightColor === c ? 'scale-125 border-white shadow-md' : 'border-transparent opacity-80'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>

              {/* Highlighter Thickness presets */}
              <div className="flex items-center space-x-1 border-l border-slate-700 pl-2">
                {[
                  { label: 'Fine', size: 10 },
                  { label: 'Standard', size: 18 },
                  { label: 'Broad Bar', size: 28 },
                ].map((s) => (
                  <button
                    key={s.size}
                    onClick={() => setHighlightThickness(s.size)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
                      highlightThickness === s.size ? 'bg-yellow-500 text-slate-950 shadow' : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {s.label} ({s.size}px)
                  </button>
                ))}
              </div>
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
          const isHighlighterOpacity = drawing.opacity < 1.0;
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
              style={{ mixBlendMode: isHighlighterOpacity ? 'multiply' : 'normal' }}
              className="pointer-events-auto hover:stroke-cyan-400 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                if (confirm('Delete this drawn stroke?')) onDeleteDrawing(drawing.id);
              }}
            />
          );
        })}

        {/* Live Active Stroke */}
        {isDrawing && currentPoints.length > 0 && (
          <path
            d={currentPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x * scaleX} ${p.y * scaleY}`).join(' ')}
            stroke={toolMode === 'highlight' ? highlightColor : drawColor}
            strokeWidth={(toolMode === 'highlight' ? highlightThickness : thickness) * scaleY}
            strokeOpacity={toolMode === 'highlight' ? 0.45 : 1.0}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            style={{ mixBlendMode: toolMode === 'highlight' ? 'multiply' : 'normal' }}
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
