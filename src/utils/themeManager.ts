export type ThemePreset = 'cyan' | 'emerald' | 'purple' | 'amber' | 'time_adaptive';

export interface ThemeConfig {
  id: ThemePreset;
  name: string;
  desc: string;
  badge?: string;
  isPro?: boolean;
  bgClass: string;
  accentGradient: string;
  accentText: string;
  accentBorder: string;
  accentGlow: string;
  primaryBtn: string;
  badgeBg: string;
}

export const THEME_PRESETS: Record<ThemePreset, ThemeConfig> = {
  cyan: {
    id: 'cyan',
    name: 'Cyber Cyan & Electric Blue',
    desc: 'Signature high-contrast dark theme with cyan & electric blue accents.',
    badge: 'DEFAULT',
    bgClass: 'bg-gradient-to-b from-slate-950 via-cyan-950/20 to-slate-950',
    accentGradient: 'from-cyan-400 via-teal-300 to-indigo-400',
    accentText: 'text-cyan-400',
    accentBorder: 'border-cyan-500/30',
    accentGlow: 'shadow-cyan-500/20',
    primaryBtn: 'from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-cyan-500/25 border-cyan-400/30',
    badgeBg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
  },
  emerald: {
    id: 'emerald',
    name: 'Emerald Neon & Mint',
    desc: 'Vibrant green neon aesthetic inspired by clean finance and security.',
    badge: 'CREATIVE',
    bgClass: 'bg-gradient-to-b from-slate-950 via-emerald-950/40 to-slate-950',
    accentGradient: 'from-emerald-400 via-teal-300 to-green-500',
    accentText: 'text-emerald-400',
    accentBorder: 'border-emerald-500/30',
    accentGlow: 'shadow-emerald-500/20',
    primaryBtn: 'from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-emerald-500/25 border-emerald-400/30',
    badgeBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  },
  purple: {
    id: 'purple',
    name: 'Violet Amethyst & Royal',
    desc: 'Deep purple royalty with neon fuchsia glow effects.',
    badge: 'CREATIVE',
    bgClass: 'bg-gradient-to-b from-purple-950/60 via-slate-950 to-indigo-950/50',
    accentGradient: 'from-purple-400 via-fuchsia-300 to-indigo-400',
    accentText: 'text-purple-400',
    accentBorder: 'border-purple-500/30',
    accentGlow: 'shadow-purple-500/20',
    primaryBtn: 'from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-500/25 border-purple-400/30',
    badgeBg: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  },
  amber: {
    id: 'amber',
    name: 'Sunset Amber & Gold',
    desc: 'Warm sunset glow with golden amber & rose accents.',
    badge: 'CREATIVE',
    bgClass: 'bg-gradient-to-b from-rose-950/60 via-slate-950 to-amber-950/40',
    accentGradient: 'from-amber-400 via-orange-300 to-rose-400',
    accentText: 'text-amber-400',
    accentBorder: 'border-amber-500/30',
    accentGlow: 'shadow-amber-500/20',
    primaryBtn: 'from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white shadow-amber-500/25 border-amber-400/30',
    badgeBg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  },
  time_adaptive: {
    id: 'time_adaptive',
    name: 'Dynamic Time-of-Day (Adaptive)',
    desc: 'Automatically shifts background and light gradients based on your real-world local time (Dawn, Daylight, Sunset, Midnight).',
    badge: 'PRO VIP',
    isPro: true,
    bgClass: 'bg-gradient-to-b from-slate-950 via-cyan-950/20 to-slate-950',
    accentGradient: 'from-cyan-400 via-teal-300 to-indigo-400',
    accentText: 'text-cyan-400',
    accentBorder: 'border-cyan-500/30',
    accentGlow: 'shadow-cyan-500/20',
    primaryBtn: 'from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-cyan-500/25 border-cyan-400/30',
    badgeBg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
  },
};

export function getTimeOfDayTheme(): ThemeConfig {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 8) {
    // Dawn / Sunrise
    return {
      id: 'time_adaptive',
      name: 'Dawn Sunrise (5 AM - 8 AM)',
      desc: 'Soft morning dawn glow with warm rose and golden amber hues.',
      badge: 'DAWN 🌅',
      isPro: true,
      bgClass: 'bg-gradient-to-b from-rose-950/60 via-slate-950 to-amber-950/40',
      accentGradient: 'from-amber-400 via-rose-300 to-orange-400',
      accentText: 'text-amber-400',
      accentBorder: 'border-amber-500/40',
      accentGlow: 'shadow-amber-500/30',
      primaryBtn: 'from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-white shadow-amber-500/30 border-amber-400/40',
      badgeBg: 'bg-amber-500/10 text-amber-300 border-amber-500/40',
    };
  } else if (hour >= 8 && hour < 17) {
    // Daylight
    return {
      id: 'time_adaptive',
      name: 'Daylight Sky (8 AM - 5 PM)',
      desc: 'Crisp energetic daytime palette optimized for high visibility.',
      badge: 'DAYLIGHT ☀️',
      isPro: true,
      bgClass: 'bg-gradient-to-b from-slate-950 via-cyan-950/20 to-slate-950',
      accentGradient: 'from-cyan-400 via-teal-300 to-blue-500',
      accentText: 'text-cyan-400',
      accentBorder: 'border-cyan-500/30',
      accentGlow: 'shadow-cyan-500/20',
      primaryBtn: 'from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-cyan-500/25 border-cyan-400/30',
      badgeBg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
    };
  } else if (hour >= 17 && hour < 20) {
    // Sunset Twilight
    return {
      id: 'time_adaptive',
      name: 'Sunset Twilight (5 PM - 8 PM)',
      desc: 'Rich sunset horizon with purple-violet twilight glow.',
      badge: 'TWILIGHT 🌇',
      isPro: true,
      bgClass: 'bg-gradient-to-b from-purple-950/60 via-slate-950 to-indigo-950/50',
      accentGradient: 'from-fuchsia-400 via-purple-300 to-pink-500',
      accentText: 'text-fuchsia-400',
      accentBorder: 'border-fuchsia-500/40',
      accentGlow: 'shadow-fuchsia-500/30',
      primaryBtn: 'from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white shadow-fuchsia-500/30 border-fuchsia-400/40',
      badgeBg: 'bg-fuchsia-500/10 text-fuchsia-300 border-fuchsia-500/40',
    };
  } else {
    // Midnight Galaxy
    return {
      id: 'time_adaptive',
      name: 'Midnight Galaxy (8 PM - 5 AM)',
      desc: 'Deep slate-midnight galaxy with subtle starry neon cyan accents.',
      badge: 'MIDNIGHT 🌙',
      isPro: true,
      bgClass: 'bg-gradient-to-b from-slate-950 via-indigo-950/50 to-slate-950',
      accentGradient: 'from-indigo-400 via-cyan-400 to-purple-400',
      accentText: 'text-indigo-400',
      accentBorder: 'border-indigo-500/40',
      accentGlow: 'shadow-indigo-500/30',
      primaryBtn: 'from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white shadow-indigo-500/30 border-indigo-400/40',
      badgeBg: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/40',
    };
  }
}

export function getActiveTheme(preset: ThemePreset = 'cyan'): ThemeConfig {
  if (preset === 'time_adaptive') {
    return getTimeOfDayTheme();
  }
  return THEME_PRESETS[preset] || THEME_PRESETS.cyan;
}
