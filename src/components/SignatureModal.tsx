import React, { useRef, useState, useEffect, useCallback } from 'react';
import { X, Eraser, Check, PenTool, Upload, Type, Image as ImageIcon, BookmarkPlus, Sparkles } from 'lucide-react';
import SignaturePad from 'signature_pad';

interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSignature: (dataUrl: string, saveLocally?: boolean) => void;
  initialTab?: 'draw' | 'type' | 'upload';
  isProActive?: boolean;
  onOpenCheckout?: () => void;
}

const CURSIVE_FONTS = [
  { name: 'Elegant Script', font: 'Dancing Script, cursive', style: 'italic' },
  { name: 'Formal Calligraphy', font: 'Great Vibes, cursive', style: 'normal' },
  { name: 'Modern Signature', font: 'Caveat, cursive', style: 'normal' },
  { name: 'Classic Ink', font: 'Pacifico, cursive', style: 'normal' },
];

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
  const padRef = useRef<SignaturePad | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Draw State
  const [strokeColor, setStrokeColor] = useState('#0f172a');
  const [lineWidth, setLineWidth] = useState(3);
  const [hasDrawn, setHasDrawn] = useState(false);
  const dprRef = useRef<number>(3);

  // Type Signature State
  const [typedName, setTypedName] = useState('');
  const [selectedFontIndex, setSelectedFontIndex] = useState(0);

  // Upload State
  const [uploadedDataUrl, setUploadedDataUrl] = useState<string | null>(null);
  const [hasUsedFreeUpload, setHasUsedFreeUpload] = useState<boolean>(() => {
    try {
      return localStorage.getItem('isa_free_upload_sig_used') === 'true';
    } catch {
      return false;
    }
  });

  // Save for future reuse checkbox
  const [saveForFuture, setSaveForFuture] = useState(true);

  // Initialize canvas with SignaturePad and high-DPI backing store
  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = Math.max(window.devicePixelRatio || 1, 3);
    dprRef.current = dpr;

    const targetWidth = Math.floor(rect.width || 460);
    const targetHeight = Math.floor(rect.height || 180);

    canvas.width = targetWidth * dpr;
    canvas.height = targetHeight * dpr;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
    }

    if (padRef.current) {
      padRef.current.off();
      padRef.current = null;
    }

    const pad = new SignaturePad(canvas, {
      minWidth: Math.max(1.2, lineWidth * 0.6),
      maxWidth: Math.max(2.6, lineWidth * 1.35),
      penColor: strokeColor,
      velocityFilterWeight: 0.72,
      minDistance: 1.5,
    });

    pad.addEventListener('beginStroke', () => {
      setHasDrawn(true);
    });

    padRef.current = pad;
    setHasDrawn(false);
  }, [strokeColor, lineWidth]);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab, isOpen]);

  useEffect(() => {
    if (isOpen && activeTab === 'draw') {
      const timer = setTimeout(setupCanvas, 60);
      return () => clearTimeout(timer);
    }
  }, [isOpen, activeTab, setupCanvas]);

  // Dynamically update pad properties when color or width changes
  useEffect(() => {
    if (padRef.current) {
      padRef.current.penColor = strokeColor;
      padRef.current.minWidth = Math.max(1.2, lineWidth * 0.6);
      padRef.current.maxWidth = Math.max(2.6, lineWidth * 1.35);
    }
  }, [strokeColor, lineWidth]);

  // Clean up SignaturePad instance on unmount
  useEffect(() => {
    return () => {
      if (padRef.current) {
        padRef.current.off();
        padRef.current = null;
      }
    };
  }, []);

  if (!isOpen) return null;

  const handleClear = () => {
    if (activeTab === 'draw') {
      if (padRef.current) {
        padRef.current.clear();
      }
      setHasDrawn(false);
    } else if (activeTab === 'type') {
      setTypedName('');
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

  // Auto-crop whitespace from canvas for tight, pixel-perfect signature bounding box
  const cropCanvasWhitespace = (sourceCanvas: HTMLCanvasElement): string => {
    const ctx = sourceCanvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return sourceCanvas.toDataURL('image/png');

    const width = sourceCanvas.width;
    const height = sourceCanvas.height;
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;

    let minX = width, minY = height, maxX = 0, maxY = 0;
    let found = false;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const alpha = data[(y * width + x) * 4 + 3];
        if (alpha > 10) { // non-transparent
          found = true;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    if (!found) return sourceCanvas.toDataURL('image/png');

    // Add DPI-scaled padding
    const padding = Math.round(20 * (dprRef.current || 2));
    const cropX = Math.max(0, minX - padding);
    const cropY = Math.max(0, minY - padding);
    const cropW = Math.min(width - cropX, maxX - minX + padding * 2);
    const cropH = Math.min(height - cropY, maxY - minY + padding * 2);

    const croppedCanvas = document.createElement('canvas');
    croppedCanvas.width = cropW;
    croppedCanvas.height = cropH;
    const cropCtx = croppedCanvas.getContext('2d');
    if (!cropCtx) return sourceCanvas.toDataURL('image/png');

    cropCtx.drawImage(sourceCanvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
    return croppedCanvas.toDataURL('image/png');
  };

  // Generate typed signature data URL
  const generateTypedSignatureDataUrl = (): string | null => {
    if (!typedName.trim()) return null;

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 700;
    tempCanvas.height = 240;
    const ctx = tempCanvas.getContext('2d');
    if (!ctx) return null;

    const fontObj = CURSIVE_FONTS[selectedFontIndex] || CURSIVE_FONTS[0];
    ctx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
    ctx.font = `${fontObj.style} 68px ${fontObj.font}`;
    ctx.fillStyle = strokeColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(typedName.trim(), tempCanvas.width / 2, tempCanvas.height / 2);

    return cropCanvasWhitespace(tempCanvas);
  };

  const handleApplySignature = () => {
    let targetDataUrl: string | null = null;

    if (activeTab === 'draw') {
      const canvas = canvasRef.current;
      if (canvas && padRef.current && !padRef.current.isEmpty()) {
        targetDataUrl = cropCanvasWhitespace(canvas);
      }
    } else if (activeTab === 'type') {
      targetDataUrl = generateTypedSignatureDataUrl();
    } else if (activeTab === 'upload') {
      targetDataUrl = uploadedDataUrl;
    }

    if (activeTab === 'upload' && !isProActive) {
      try {
        localStorage.setItem('isa_free_upload_sig_used', 'true');
        setHasUsedFreeUpload(true);
      } catch {}
    }

    if (targetDataUrl) {
      onSaveSignature(targetDataUrl, saveForFuture);
      onClose();
    }
  };

  const isReady =
    activeTab === 'draw'
      ? hasDrawn
      : activeTab === 'type'
      ? Boolean(typedName.trim())
      : Boolean(uploadedDataUrl);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-3 sm:p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-lg text-cyan-400">
              <PenTool className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">Create Signature</h3>
              <p className="text-[11px] text-slate-400">Silky smooth Bézier curves & vector stroke dynamics</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-800 bg-slate-950 px-4 pt-2.5 space-x-2">
          <button
            onClick={() => setActiveTab('draw')}
            className={`flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold rounded-t-xl border-t border-x transition ${
              activeTab === 'draw'
                ? 'bg-slate-900 border-slate-800 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <PenTool className="w-3.5 h-3.5" />
            <span>Draw (Smooth Pen)</span>
          </button>

          <button
            onClick={() => setActiveTab('type')}
            className={`flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold rounded-t-xl border-t border-x transition ${
              activeTab === 'type'
                ? 'bg-slate-900 border-slate-800 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Type className="w-3.5 h-3.5" />
            <span>Type Name</span>
          </button>

          <button
            onClick={() => {
              if (!isProActive && hasUsedFreeUpload) {
                if (onOpenCheckout) onOpenCheckout();
                return;
              }
              setActiveTab('upload');
            }}
            className={`flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold rounded-t-xl border-t border-x transition ${
              activeTab === 'upload'
                ? 'bg-slate-900 border-slate-800 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>
              Upload Image{' '}
              {!isProActive && (
                hasUsedFreeUpload ? (
                  <span className="text-[9px] font-extrabold text-amber-400 bg-amber-500/10 px-1 py-0.2 rounded border border-amber-500/20 ml-1">
                    PRO
                  </span>
                ) : (
                  <span className="text-[9px] font-extrabold text-emerald-400 bg-emerald-500/10 px-1 py-0.2 rounded border border-emerald-500/20 ml-1">
                    1 FREE
                  </span>
                )
              )}
            </span>
          </button>
        </div>

        {/* Main Body */}
        {activeTab === 'draw' && (
          <>
            {/* Smooth Canvas Area */}
            <div className="p-4 bg-slate-950 flex flex-col items-center justify-center">
              <div className="relative w-full h-48 border-2 border-dashed border-slate-700 hover:border-cyan-500/50 rounded-xl bg-white overflow-hidden shadow-inner cursor-crosshair transition-colors">
                <canvas
                  ref={canvasRef}
                  className="w-full h-full block touch-none"
                />
                {!hasDrawn && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-slate-400 space-y-1">
                    <PenTool className="w-6 h-6 text-slate-300 animate-pulse opacity-60" />
                    <span className="text-xs font-medium text-slate-500">Sign naturally with your finger, mouse, or stylus</span>
                    <span className="text-[10px] text-slate-400 font-mono">Bézier curve anti-aliasing active</span>
                  </div>
                )}
              </div>
            </div>

            {/* Ink & Pen Width Controls */}
            <div className="px-4 py-2.5 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold text-slate-400">Ink Color:</span>
                {[
                  { label: 'Black Ink', hex: '#0f172a' },
                  { label: 'Navy Blue Ink', hex: '#1e40af' },
                  { label: 'Crimson Red Ink', hex: '#b91c1c' },
                ].map((c) => (
                  <button
                    key={c.hex}
                    onClick={() => setStrokeColor(c.hex)}
                    className={`w-5 h-5 rounded-full border-2 transition ${
                      strokeColor === c.hex ? 'border-cyan-400 scale-110 shadow-lg ring-2 ring-cyan-500/20' : 'border-transparent opacity-80 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: c.hex }}
                    title={c.label}
                  />
                ))}
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold text-slate-400">Stroke:</span>
                {[
                  { w: 2, label: 'Fine' },
                  { w: 3, label: 'Medium' },
                  { w: 5, label: 'Bold' },
                ].map((item) => (
                  <button
                    key={item.w}
                    onClick={() => setLineWidth(item.w)}
                    className={`px-2.5 py-1 text-xs rounded-lg transition ${
                      lineWidth === item.w
                        ? 'bg-cyan-600 text-white font-bold shadow'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Type Signature Tab */}
        {activeTab === 'type' && (
          <div className="p-4 bg-slate-950 flex flex-col space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Type Your Name:</label>
              <input
                type="text"
                value={typedName}
                onChange={(e) => setTypedName(e.target.value)}
                placeholder="e.g. Navjot Bindra"
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500 transition"
                autoFocus
              />
            </div>

            {/* Font Style Options */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-400">Choose Signature Style:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {CURSIVE_FONTS.map((fontItem, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedFontIndex(idx)}
                    className={`p-3 bg-white rounded-xl border-2 transition text-left flex flex-col justify-between h-20 ${
                      selectedFontIndex === idx
                        ? 'border-cyan-500 ring-2 ring-cyan-500/20 shadow-md'
                        : 'border-slate-300 hover:border-slate-400'
                    }`}
                  >
                    <span className="text-[10px] font-mono text-slate-500 font-bold">{fontItem.name}</span>
                    <span
                      style={{
                        fontFamily: fontItem.font,
                        fontStyle: fontItem.style,
                        color: strokeColor,
                      }}
                      className="text-2xl truncate text-slate-900"
                    >
                      {typedName.trim() || 'Your Name'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Ink Color Selection for Typed Signature */}
            <div className="flex items-center space-x-2 pt-2 border-t border-slate-800">
              <span className="text-xs font-semibold text-slate-400">Ink Color:</span>
              {[
                { label: 'Black Ink', hex: '#0f172a' },
                { label: 'Navy Blue Ink', hex: '#1e40af' },
                { label: 'Crimson Red Ink', hex: '#b91c1c' },
              ].map((c) => (
                <button
                  key={c.hex}
                  onClick={() => setStrokeColor(c.hex)}
                  className={`w-5 h-5 rounded-full border-2 transition ${
                    strokeColor === c.hex ? 'border-cyan-400 scale-110 shadow-lg' : 'border-transparent opacity-80'
                  }`}
                  style={{ backgroundColor: c.hex }}
                  title={c.label}
                />
              ))}
            </div>
          </div>
        )}

        {/* Upload Tab */}
        {activeTab === 'upload' && (
          <div className="p-6 bg-slate-950 flex flex-col items-center justify-center space-y-4 min-h-[240px]">
            {!isProActive && !hasUsedFreeUpload && (
              <div className="w-full px-3.5 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-between text-xs text-emerald-300">
                <span className="flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="font-semibold">1 Free Signature Image Upload Included</span>
                </span>
                <span className="text-[10px] uppercase font-bold text-emerald-400/90 tracking-wide bg-emerald-500/20 px-1.5 py-0.5 rounded">Free Trial</span>
              </div>
            )}
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
            <span>Save this signature for 1-click reuse in future sessions</span>
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
              className="flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold text-slate-950 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 rounded-lg shadow-lg disabled:opacity-40 transition font-bold"
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
