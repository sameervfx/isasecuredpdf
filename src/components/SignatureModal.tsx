import React, { useRef, useState, useEffect } from 'react';
import { X, Eraser, Check, PenTool, Upload, Image as ImageIcon, BookmarkPlus } from 'lucide-react';

interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSignature: (dataUrl: string, saveLocally?: boolean) => void;
  initialTab?: 'draw' | 'type' | 'upload';
  isProActive?: boolean;
  onOpenCheckout?: () => void;
}

export const SignatureModal: React.FC<SignatureModalProps> = ({
  isOpen,
  onClose,
  onSaveSignature,
  initialTab = 'draw',
  isProActive = false,
  onOpenCheckout,
}) => {
  const [activeTab, setActiveTab] = useState<'draw' | 'type' | 'upload'>(initialTab);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Draw State
  const [isDrawing, setIsDrawing] = useState(false);
  const [strokeColor, setStrokeColor] = useState('#0f172a');
  const [lineWidth, setLineWidth] = useState(3);
  const [hasDrawn, setHasDrawn] = useState(false);

  // Upload State
  const [uploadedDataUrl, setUploadedDataUrl] = useState<string | null>(null);

  // Save for future reuse checkbox
  const [saveForFuture, setSaveForFuture] = useState(true);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab, isOpen]);

  useEffect(() => {
    if (isOpen && activeTab === 'draw' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setHasDrawn(false);
      }
    }
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = lineWidth;
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
    setHasDrawn(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleClear = () => {
    if (activeTab === 'draw') {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setHasDrawn(false);
    } else {
      setUploadedDataUrl(null);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      if (evt.target?.result) {
        setUploadedDataUrl(evt.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleApplySignature = () => {
    let targetDataUrl: string | null = null;

    if (activeTab === 'draw') {
      const canvas = canvasRef.current;
      if (canvas && hasDrawn) {
        targetDataUrl = canvas.toDataURL('image/png');
      }
    } else if (activeTab === 'upload') {
      targetDataUrl = uploadedDataUrl;
    }

    if (targetDataUrl) {
      onSaveSignature(targetDataUrl, saveForFuture);
      onClose();
    }
  };

  const isReady = activeTab === 'draw' ? hasDrawn : Boolean(uploadedDataUrl);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <PenTool className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-bold text-white tracking-tight">Add Signature</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-800 bg-slate-950 px-4 pt-3 space-x-2">
          <button
            onClick={() => setActiveTab('draw')}
            className={`flex items-center space-x-2 px-4 py-2 text-xs font-semibold rounded-t-xl border-t border-x transition ${
              activeTab === 'draw'
                ? 'bg-slate-900 border-slate-800 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <PenTool className="w-4 h-4" />
            <span>Draw Signature</span>
          </button>

          <button
            onClick={() => {
              if (!isProActive) {
                if (onOpenCheckout) onOpenCheckout();
                return;
              }
              setActiveTab('upload');
            }}
            className={`flex items-center space-x-2 px-4 py-2 text-xs font-semibold rounded-t-xl border-t border-x transition ${
              activeTab === 'upload'
                ? 'bg-slate-900 border-slate-800 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Upload Image (JPG/PNG) {!isProActive && <span className="text-[9px] font-extrabold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 ml-1">PRO</span>}</span>
          </button>
        </div>

        {/* Main Body */}
        {activeTab === 'draw' ? (
          <>
            {/* Canvas Area */}
            <div className="p-4 bg-slate-950 flex flex-col items-center justify-center">
              <div className="relative border-2 border-dashed border-slate-700 hover:border-slate-600 rounded-xl bg-white overflow-hidden shadow-inner cursor-crosshair">
                <canvas
                  ref={canvasRef}
                  width={460}
                  height={180}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="touch-none"
                />
                {!hasDrawn && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-400 text-sm font-medium">
                    Sign here with mouse or touch
                  </div>
                )}
              </div>
            </div>

            {/* Ink & Pen Controls */}
            <div className="px-4 py-2.5 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold text-slate-400">Ink:</span>
                {[
                  { label: 'Black', hex: '#0f172a' },
                  { label: 'Blue', hex: '#1e40af' },
                  { label: 'Red', hex: '#b91c1c' },
                ].map((c) => (
                  <button
                    key={c.hex}
                    onClick={() => setStrokeColor(c.hex)}
                    className={`w-5 h-5 rounded-full border-2 transition ${
                      strokeColor === c.hex ? 'border-cyan-400 scale-110 shadow' : 'border-transparent opacity-80'
                    }`}
                    style={{ backgroundColor: c.hex }}
                    title={c.label}
                  />
                ))}
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold text-slate-400">Width:</span>
                {[2, 3, 5].map((w) => (
                  <button
                    key={w}
                    onClick={() => setLineWidth(w)}
                    className={`px-2 py-0.5 text-xs font-mono rounded ${
                      lineWidth === w ? 'bg-cyan-600 text-white font-bold' : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {w}px
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : (
          /* Upload Tab */
          <div className="p-6 bg-slate-950 flex flex-col items-center justify-center space-y-4 min-h-[240px]">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/jpeg,image/jpg,image/png,image/webp"
              className="hidden"
            />

            {uploadedDataUrl ? (
              <div className="flex flex-col items-center space-y-3 w-full">
                <div className="p-3 bg-white rounded-xl border border-slate-700 max-h-40 flex items-center justify-center overflow-hidden shadow-lg w-full">
                  <img src={uploadedDataUrl} alt="Uploaded Signature" className="max-h-36 object-contain" />
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold underline"
                >
                  Choose a different image
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-slate-700 hover:border-cyan-500 bg-slate-900/60 p-8 rounded-xl flex flex-col items-center justify-center space-y-3 transition group"
              >
                <div className="w-12 h-12 rounded-xl bg-slate-800 group-hover:bg-cyan-950 flex items-center justify-center text-cyan-400">
                  <ImageIcon className="w-6 h-6" />
                </div>
                <p className="text-xs font-semibold text-slate-200">Click to select signature image (JPG / PNG)</p>
                <p className="text-[11px] text-slate-400">Supports transparent PNG, JPG, or WEBP desktop files</p>
              </button>
            )}
          </div>
        )}

        {/* Local Storage Save Checkbox */}
        <div className="px-4 py-2.5 bg-slate-900 border-t border-slate-800/80 flex items-center space-x-2">
          <label className="flex items-center space-x-2 cursor-pointer text-xs text-slate-300 select-none">
            <input
              type="checkbox"
              checked={saveForFuture}
              onChange={(e) => setSaveForFuture(e.target.checked)}
              className="w-4 h-4 text-cyan-500 rounded border-slate-700 focus:ring-cyan-500"
            />
            <BookmarkPlus className="w-3.5 h-3.5 text-cyan-400" />
            <span>Save this signature for 1-click reuse future sessions</span>
          </label>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={handleClear}
            className="flex items-center space-x-1.5 px-3 py-2 text-xs font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition"
          >
            <Eraser className="w-4 h-4" />
            <span>Clear</span>
          </button>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              onClick={handleApplySignature}
              disabled={!isReady}
              className="flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 rounded-lg shadow-lg disabled:opacity-40 transition"
            >
              <Check className="w-4 h-4" />
              <span>Insert Signature</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
