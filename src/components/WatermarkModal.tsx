import React, { useState, useEffect } from 'react';
import {
  X,
  Type,
  Upload,
  Bookmark,
  Check,
  Trash2,
  Sparkles,
  Sliders,
  Image as ImageIcon,
  RotateCw,
} from 'lucide-react';
import {
  getSavedWatermarks,
  saveWatermarkToStorage,
  deleteSavedWatermark,
  SavedWatermark,
} from '../utils/savedWatermarks';

export interface WatermarkOptions {
  type: 'text' | 'image';
  text?: string;
  color?: string;
  fontSize?: number;
  dataUrl?: string;
  opacity: number;
  rotation: number;
  position: 'center' | 'diagonal' | 'top-left' | 'bottom-right';
  saveToLibrary?: boolean;
}

interface WatermarkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyWatermark: (options: WatermarkOptions) => void;
}

const PRESET_TEXTS = [
  'CONFIDENTIAL',
  'DRAFT',
  'SAMPLE',
  'DO NOT COPY',
  'APPROVED',
  'INTERNAL ONLY',
  'FOR REVIEW ONLY',
  'FINAL COPY',
];

const PRESET_COLORS = [
  '#ef4444', // Red
  '#f97316', // Orange
  '#eab308', // Yellow
  '#10b981', // Green
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
  '#8b5cf6', // Purple
  '#64748b', // Slate
  '#000000', // Black
];

export const WatermarkModal: React.FC<WatermarkModalProps> = ({
  isOpen,
  onClose,
  onApplyWatermark,
}) => {
  const [activeTab, setActiveTab] = useState<'text' | 'image' | 'saved'>('text');

  // Text state
  const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL');
  const [textColor, setTextColor] = useState('#ef4444');
  const [fontSize, setFontSize] = useState(48);

  // Image state
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);

  // Common options
  const [opacity, setOpacity] = useState(0.25);
  const [rotation, setRotation] = useState(-45);
  const [position, setPosition] = useState<'center' | 'diagonal' | 'top-left' | 'bottom-right'>('center');
  const [saveToLibrary, setSaveToLibrary] = useState(true);

  // Saved library state
  const [savedWatermarks, setSavedWatermarks] = useState<SavedWatermark[]>([]);

  useEffect(() => {
    if (isOpen) {
      setSavedWatermarks(getSavedWatermarks());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setImageDataUrl(event.target.result as string);
        setActiveTab('image');
      }
    };
    reader.readAsDataURL(file);
  };

  const handlePickSaved = (saved: SavedWatermark) => {
    if (saved.type === 'text') {
      setActiveTab('text');
      setWatermarkText(saved.text || 'CONFIDENTIAL');
      if (saved.color) setTextColor(saved.color);
      setOpacity(saved.opacity);
      setRotation(saved.rotation);
    } else if (saved.type === 'image' && saved.dataUrl) {
      setActiveTab('image');
      setImageDataUrl(saved.dataUrl);
      setOpacity(saved.opacity);
      setRotation(saved.rotation);
    }
  };

  const handleDeleteSaved = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updated = deleteSavedWatermark(id);
    setSavedWatermarks(updated);
  };

  const handleApply = () => {
    if (activeTab === 'text' && !watermarkText.trim()) {
      alert('Please enter text for the watermark.');
      return;
    }
    if (activeTab === 'image' && !imageDataUrl) {
      alert('Please upload an image for the watermark.');
      return;
    }

    const options: WatermarkOptions = {
      type: activeTab === 'image' ? 'image' : 'text',
      text: watermarkText.trim(),
      color: textColor,
      fontSize,
      dataUrl: imageDataUrl || undefined,
      opacity,
      rotation,
      position,
      saveToLibrary,
    };

    if (saveToLibrary) {
      saveWatermarkToStorage({
        name: activeTab === 'text' ? watermarkText.trim() : 'Image Watermark',
        type: options.type,
        dataUrl: options.dataUrl,
        text: options.text,
        color: options.color,
        opacity: options.opacity,
        rotation: options.rotation,
      });
      setSavedWatermarks(getSavedWatermarks());
    }

    onApplyWatermark(options);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-gradient-to-tr from-cyan-600 to-blue-600 rounded-xl shadow-md text-white">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                <span>Apply Watermark</span>
              </h2>
              <p className="text-xs text-slate-400">
                Add text or logo watermark, save to library for 1-click reuse
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/30 px-6 pt-3 space-x-2">
          <button
            onClick={() => setActiveTab('text')}
            className={`flex items-center space-x-2 px-4 py-2.5 font-semibold text-xs rounded-t-xl transition-all border-b-2 ${
              activeTab === 'text'
                ? 'bg-slate-800 text-cyan-400 border-cyan-500 shadow'
                : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            <Type className="w-4 h-4" />
            <span>Text Watermark</span>
          </button>

          <button
            onClick={() => setActiveTab('image')}
            className={`flex items-center space-x-2 px-4 py-2.5 font-semibold text-xs rounded-t-xl transition-all border-b-2 ${
              activeTab === 'image'
                ? 'bg-slate-800 text-cyan-400 border-cyan-500 shadow'
                : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Upload Image Logo</span>
          </button>

          <button
            onClick={() => setActiveTab('saved')}
            className={`flex items-center space-x-2 px-4 py-2.5 font-semibold text-xs rounded-t-xl transition-all border-b-2 ${
              activeTab === 'saved'
                ? 'bg-slate-800 text-cyan-400 border-cyan-500 shadow'
                : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            <Bookmark className="w-4 h-4 text-yellow-400" />
            <span>Saved Watermarks ({savedWatermarks.length})</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-200">
          {/* TAB 1: Text Watermark */}
          {activeTab === 'text' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Watermark Text
                </label>
                <input
                  type="text"
                  value={watermarkText}
                  onChange={(e) => setWatermarkText(e.target.value)}
                  placeholder="e.g. CONFIDENTIAL, DRAFT, COMPANY NAME"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-medium focus:outline-none focus:border-cyan-500 text-sm"
                />
              </div>

              {/* Preset Text Chips */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1.5">
                  Quick Presets
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_TEXTS.map((txt) => (
                    <button
                      key={txt}
                      onClick={() => setWatermarkText(txt)}
                      className={`px-2.5 py-1 text-xs rounded-lg border transition ${
                        watermarkText === txt
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500 font-bold'
                          : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      {txt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Font Size & Color */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-300">Font Size</span>
                    <span className="text-cyan-400 font-mono">{fontSize}px</span>
                  </div>
                  <input
                    type="range"
                    min="18"
                    max="100"
                    value={fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                    className="w-full accent-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Text Color
                  </label>
                  <div className="flex items-center space-x-1.5">
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c}
                        onClick={() => setTextColor(c)}
                        style={{ backgroundColor: c }}
                        className={`w-6 h-6 rounded-full border-2 transition ${
                          textColor === c ? 'border-white scale-110 shadow' : 'border-transparent opacity-80'
                        }`}
                      />
                    ))}
                    <input
                      type="color"
                      value={textColor}
                      onChange={(e) => setTextColor(e.target.value)}
                      className="w-6 h-6 rounded-full cursor-pointer bg-transparent border-0"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Upload Image Watermark */}
          {activeTab === 'image' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Upload Logo or Seal Image (PNG, JPG, SVG)
                </label>
                <div className="border-2 border-dashed border-slate-700 hover:border-cyan-500 rounded-2xl p-6 text-center transition bg-slate-950/40 relative">
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/svg+xml,image/webp"
                    onChange={handleImageUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  {imageDataUrl ? (
                    <div className="flex flex-col items-center space-y-2">
                      <img
                        src={imageDataUrl}
                        alt="Watermark Preview"
                        className="max-h-36 object-contain rounded border border-slate-700 bg-white/10 p-2 shadow-md"
                        style={{ opacity, transform: `rotate(${rotation}deg)` }}
                      />
                      <p className="text-xs text-cyan-400 font-semibold">
                        Click or drag new image to replace
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center space-y-2">
                      <ImageIcon className="w-10 h-10 text-slate-500 mb-1" />
                      <p className="text-sm font-semibold text-slate-200">
                        Drop company logo or seal here, or <span className="text-cyan-400 underline">browse</span>
                      </p>
                      <p className="text-xs text-slate-400">
                        Supports PNG (transparent background), JPG, SVG, WebP
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Saved Watermarks Library */}
          {activeTab === 'saved' && (
            <div className="space-y-4">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Saved Watermark Library ({savedWatermarks.length})
              </label>
              {savedWatermarks.length === 0 ? (
                <div className="text-center py-10 bg-slate-950/40 rounded-2xl border border-slate-800 text-slate-400 text-xs italic">
                  No saved watermarks yet. Create a text or image watermark and check "Save to library for future reuse".
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-1">
                  {savedWatermarks.map((wm) => (
                    <div
                      key={wm.id}
                      onClick={() => handlePickSaved(wm)}
                      className="p-3 bg-slate-950 border border-slate-800 hover:border-cyan-500 rounded-xl cursor-pointer group flex items-center justify-between transition shadow-sm"
                    >
                      <div className="flex items-center space-x-3 overflow-hidden">
                        {wm.type === 'image' && wm.dataUrl ? (
                          <img
                            src={wm.dataUrl}
                            alt="Saved Watermark"
                            className="w-10 h-10 object-contain rounded bg-white/10 p-1 border border-slate-700"
                          />
                        ) : (
                          <div
                            className="px-2 py-1 rounded text-xs font-bold font-mono border"
                            style={{ color: wm.color || '#ef4444', borderColor: wm.color || '#ef4444' }}
                          >
                            {wm.text || 'WM'}
                          </div>
                        )}
                        <div className="truncate">
                          <div className="font-bold text-xs text-white truncate">{wm.name}</div>
                          <div className="text-[10px] text-slate-400">
                            Opacity {Math.round(wm.opacity * 100)}% • {wm.rotation}°
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={(e) => handleDeleteSaved(e, wm.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition rounded hover:bg-slate-800"
                        title="Delete Preset"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Common Settings (Opacity, Rotation, Position) */}
          <div className="pt-4 border-t border-slate-800 space-y-4">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <span>Overlay Appearance Controls</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Opacity */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-300">Transparency (Opacity)</span>
                  <span className="text-cyan-400 font-mono">{Math.round(opacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="1.0"
                  step="0.05"
                  value={opacity}
                  onChange={(e) => setOpacity(Number(e.target.value))}
                  className="w-full accent-cyan-500"
                />
              </div>

              {/* Rotation Angle */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-300">Rotation Angle</span>
                  <span className="text-cyan-400 font-mono">{rotation}°</span>
                </div>
                <input
                  type="range"
                  min="-90"
                  max="90"
                  step="5"
                  value={rotation}
                  onChange={(e) => setRotation(Number(e.target.value))}
                  className="w-full accent-cyan-500"
                />
              </div>
            </div>

            {/* Position Option */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Watermark Placement
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'center', label: 'Center Page' },
                  { id: 'diagonal', label: 'Diagonal (-45°)' },
                  { id: 'top-left', label: 'Top-Left Header' },
                  { id: 'bottom-right', label: 'Bottom-Right' },
                ].map((pos) => (
                  <button
                    key={pos.id}
                    onClick={() => {
                      setPosition(pos.id as any);
                      if (pos.id === 'diagonal') setRotation(-45);
                      else if (pos.id === 'center' || pos.id === 'top-left' || pos.id === 'bottom-right') setRotation(0);
                    }}
                    className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition ${
                      position === pos.id
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500 font-bold'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    {pos.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Save to library checkbox */}
            <div className="flex items-center space-x-2 pt-2">
              <input
                type="checkbox"
                id="saveToLibrary"
                checked={saveToLibrary}
                onChange={(e) => setSaveToLibrary(e.target.checked)}
                className="w-4 h-4 text-cyan-600 bg-slate-950 border-slate-700 rounded focus:ring-cyan-500"
              />
              <label htmlFor="saveToLibrary" className="text-xs text-slate-300 font-medium cursor-pointer">
                Save watermark preset to library for 1-click future reuse
              </label>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/60">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            Cancel
          </button>

          <button
            onClick={handleApply}
            className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-cyan-500/20 border border-cyan-400/30 transition transform active:scale-95"
          >
            <Check className="w-4 h-4" />
            <span>Apply Watermark to PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
};
