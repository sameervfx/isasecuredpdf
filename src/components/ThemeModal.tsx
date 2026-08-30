import React, { useState, useEffect } from 'react';
import { X, Palette, Sparkles, Check, Sun, Moon, Sunset, Sunrise, Lock, ShieldCheck } from 'lucide-react';
import { ThemePreset, THEME_PRESETS, getTimeOfDayTheme, getActiveTheme } from '../utils/themeManager';

interface ThemeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPreset: ThemePreset;
  onSelectPreset: (preset: ThemePreset) => void;
  onOpenCheckout?: () => void;
}

export const ThemeModal: React.FC<ThemeModalProps> = ({
  isOpen,
  onClose,
  currentPreset,
  onSelectPreset,
  onOpenCheckout,
}) => {
  const [timeTheme, setTimeTheme] = useState(() => getTimeOfDayTheme());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeTheme(getTimeOfDayTheme());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  if (!isOpen) return null;

  const isProActive =
    localStorage.getItem('isasecuredpdf_pro_active') === 'true' ||
    localStorage.getItem('isa_pro_active') === 'true' ||
    localStorage.getItem('isa_pro_annual_active') === 'true' ||
    localStorage.getItem('isa_lifetime_vip') === 'true';

  const presets: ThemePreset[] = ['cyan', 'light_pearl', 'gold_sunlight', 'emerald', 'purple', 'amber', 'time_adaptive'];

  const handleSelect = (p: ThemePreset) => {
    if (p === 'time_adaptive' && !isProActive) {
      if (onOpenCheckout) onOpenCheckout();
      return;
    }
    onSelectPreset(p);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden text-slate-100">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl -z-10" />

        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-6">
          <div className="p-3 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-2xl shadow-lg shadow-cyan-500/20">
            <Palette className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-white">Color Themes & Dynamic Backgrounds</h3>
            <p className="text-xs text-slate-400">Customize visual appearance & activate time-of-day adaptive backgrounds</p>
          </div>
        </div>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1 scrollbar-none">
          {presets.map((presetKey) => {
            const config = presetKey === 'time_adaptive' ? timeTheme : THEME_PRESETS[presetKey];
            const isSelected = currentPreset === presetKey;
            const isProLocked = presetKey === 'time_adaptive' && !isProActive;

            return (
              <div
                key={presetKey}
                onClick={() => handleSelect(presetKey)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                  isSelected
                    ? 'bg-slate-950 border-cyan-500 ring-2 ring-cyan-500/30 shadow-xl'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-950'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className={`p-2.5 rounded-xl border ${config.badgeBg} flex-shrink-0 mt-0.5`}>
                    {presetKey === 'time_adaptive' ? (
                      (config.badge || '').includes('DAWN') ? <Sunrise className="w-5 h-5" /> :
                      (config.badge || '').includes('DAYLIGHT') ? <Sun className="w-5 h-5" /> :
                      (config.badge || '').includes('TWILIGHT') ? <Sunset className="w-5 h-5" /> : <Moon className="w-5 h-5" />
                    ) : (
                      <Palette className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-extrabold text-sm text-white">{config.name}</span>
                      <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${config.badgeBg}`}>
                        {config.badge}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">{config.desc}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 self-end sm:self-auto flex-shrink-0">
                  {/* Live Color Swatches */}
                  <div className="flex items-center space-x-1.5 bg-slate-900 px-2.5 py-1.5 rounded-xl border border-slate-800">
                    <div className={`w-3.5 h-3.5 rounded-full bg-gradient-to-tr ${config.accentGradient}`} />
                    <div className="w-3.5 h-3.5 rounded-full bg-slate-800 border border-slate-700" />
                  </div>

                  {isProLocked ? (
                    <div className="flex items-center space-x-1 px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold rounded-xl">
                      <Lock className="w-3.5 h-3.5" />
                      <span>Unlock PRO</span>
                    </div>
                  ) : isSelected ? (
                    <div className="flex items-center space-x-1 px-3 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-bold rounded-xl shadow">
                      <Check className="w-3.5 h-3.5" />
                      <span>Active</span>
                    </div>
                  ) : (
                    <button className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 transition">
                      Select
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center space-x-1.5 text-emerald-400 font-medium">
            <ShieldCheck className="w-4 h-4" />
            <span>Theme settings saved locally in your browser</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl border border-slate-700 transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
