import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Download,
  ArrowRight,
  Lock,
  Zap,
  CheckCircle2,
  FileText,
  Edit3,
  PenTool,
  Monitor,
  HelpCircle,
  X,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ExternalLink,
  Layers,
  Mail,
  Shield,
  FileCheck,
  Palette,
  Award,
  Scissors,
  Grid,
  Combine,
  FileType,
  BookOpen,
  Camera,
  Menu
} from 'lucide-react';
import { ThemePreset, ThemeConfig } from '../utils/themeManager';

import appLogo from '../assets/app_logo.jpg';

interface LandingPageProps {
  onLaunchEditor: () => void;
  themePreset?: ThemePreset;
  activeTheme?: ThemeConfig;
  onOpenThemeModal?: () => void;
  onOpenUserGuide?: () => void;
  onOpenScanModal?: () => void;
  isProActive?: boolean;
}

type LegalModalType = 'privacy' | 'terms' | 'refund' | 'contact' | null;

export const LandingPage: React.FC<LandingPageProps> = ({
  onLaunchEditor,
  themePreset,
  activeTheme,
  onOpenThemeModal,
  onOpenUserGuide,
  onOpenScanModal,
  isProActive = false,
}) => {
  const [activeModal, setActiveModal] = useState<LegalModalType>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [isDragOverDropzone, setIsDragOverDropzone] = useState(false);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [isProMonthlyModalOpen, setIsProMonthlyModalOpen] = useState(false);
  const [isProAnnualModalOpen, setIsProAnnualModalOpen] = useState(false);
  const [isLifetimeModalOpen, setIsLifetimeModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleGateCheckAndLaunch = () => {
    // 1-click launch straight into editor workspace with zero registration barrier
    onLaunchEditor();
  };

  const handleDesktopDownload = (platform: 'windows' | 'mac') => {
    // Check active recurring subscription in localStorage
    const isSubscribed =
      localStorage.getItem('isa_pro_subscribed') === 'true' ||
      localStorage.getItem('isa_pro_recurring') === 'true';

    if (!isSubscribed) {
      setIsDownloadModalOpen(false);
      setIsProAnnualModalOpen(true);
    } else {
      const fileUrl = '/dist_packages/ISASecuredPDF_Suite_Windows_Setup.exe';
      const fileName = 'ISASecuredPDF_Suite_Windows_Setup.exe';

      const a = document.createElement('a');
      a.href = fileUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const closeModal = () => setActiveModal(null);

  const scrollToSection = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const isLight = activeTheme?.id === 'light_pearl' || activeTheme?.id === 'gold_sunlight';

  const bgClass = activeTheme?.bgClass || 'bg-slate-950';
  const primaryBtnClass = activeTheme?.primaryBtn || 'from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-cyan-500/25 border-cyan-400/30';
  const accentTextClass = activeTheme?.accentText || 'text-cyan-400';
  const headingTextClass = activeTheme?.headingText || (isLight ? 'text-slate-900 font-extrabold' : 'text-white font-bold');
  const subTextClass = activeTheme?.subText || (isLight ? 'text-slate-700 font-medium' : 'text-slate-400');

  const navBgClass = isLight
    ? 'bg-white/95 backdrop-blur-md border-b border-slate-300 text-slate-900 shadow-sm'
    : 'bg-slate-950/95 backdrop-blur-md border-b border-slate-800/80 text-slate-100';

  const navLinkClass = isLight
    ? 'text-slate-800 hover:text-cyan-700 transition font-bold'
    : 'text-slate-300 hover:text-cyan-400 transition font-semibold';

  const navBtnClass = isLight
    ? 'bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-900 rounded-xl text-xs font-bold transition shadow-sm'
    : 'bg-slate-900 hover:bg-slate-800 border border-slate-700/80 hover:border-cyan-500/50 rounded-xl text-xs font-semibold text-cyan-300 transition shadow';

  const brandTextClass = isLight
    ? 'text-slate-900 font-extrabold text-sm sm:text-lg tracking-tight whitespace-nowrap'
    : 'text-sm sm:text-lg font-extrabold bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent tracking-tight whitespace-nowrap';

  const cardBgClass = isLight
    ? 'bg-white border border-slate-200/90 shadow-lg text-slate-900'
    : 'bg-slate-900/90 border border-slate-800 text-slate-100';

  const cardTitleClass = isLight ? 'text-slate-900 font-extrabold' : 'text-white font-bold';
  const cardDescClass = isLight ? 'text-slate-700 font-medium' : 'text-slate-400';

  const sectionBgClass = isLight
    ? 'bg-slate-200/50 border-y border-slate-300/80'
    : 'bg-slate-900/50 border-y border-slate-800/60';

  const cameraBtnClass = isLight
    ? 'w-full sm:w-1/2 flex items-center justify-center space-x-2.5 px-6 py-4 bg-white hover:bg-slate-100 text-slate-900 font-extrabold text-base rounded-2xl border-2 border-slate-300 hover:border-slate-400 transition transform active:scale-95 shadow-lg group relative'
    : 'w-full sm:w-1/2 flex items-center justify-center space-x-2.5 px-6 py-4 bg-slate-900 hover:bg-slate-800 text-cyan-300 hover:text-white font-extrabold text-base rounded-2xl border-2 border-cyan-500/50 hover:border-cyan-400 transition transform active:scale-95 shadow-xl shadow-cyan-500/20 group relative';

  return (
    <div className={`min-h-screen w-full max-w-[100vw] overflow-y-auto max-lg:overflow-x-auto lg:overflow-x-hidden touch-auto scroll-smooth ${bgClass} ${isLight ? 'text-slate-900' : 'text-slate-100'} font-sans selection:bg-cyan-500 selection:text-white flex flex-col transition-colors duration-500`}>
      {/* 1. Navigation Bar */}
      <nav className={`sticky top-0 z-40 px-3 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between w-full relative ${navBgClass}`}>
        {/* Left: Brand Logo & Title */}
        <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl overflow-hidden shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-500/30 flex items-center justify-center bg-slate-900 flex-shrink-0">
            <img src={appLogo} alt="PDF Engine Studio Logo" className="w-full h-full object-cover" />
          </div>
          <div className="flex items-center space-x-1.5">
            <span className={brandTextClass}>
              ISASecuredPDF
            </span>
            <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 bg-cyan-500/10 border border-cyan-500/30 text-cyan-500 rounded-full whitespace-nowrap">
              100% Client-Side
            </span>
          </div>
        </div>

        {/* Center: Desktop Navigation Links (Centrally Aligned for Desktop) */}
        <div className="hidden md:flex items-center space-x-8 text-xs font-semibold absolute left-1/2 -translate-x-1/2">
          <a href="#features" onClick={(e) => scrollToSection(e, 'features')} className={navLinkClass}>Features</a>
          <a href="#security" onClick={(e) => scrollToSection(e, 'security')} className={navLinkClass}>Security & Compliance</a>
          <a href="#pricing" onClick={(e) => scrollToSection(e, 'pricing')} className={navLinkClass}>Pricing</a>
          <a href="#faq" onClick={(e) => scrollToSection(e, 'faq')} className={navLinkClass}>FAQ</a>
        </div>

        {/* Right: Desktop Buttons & Mobile Hamburger Button */}
        <div className="flex items-center space-x-1.5 sm:space-x-3 flex-shrink-0">
          <button
            onClick={() => setIsDownloadModalOpen(true)}
            title="Download Standalone Desktop Apps (.zip for Windows/macOS)"
            className="hidden md:flex items-center space-x-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 hover:border-cyan-500/50 rounded-xl text-xs font-semibold text-cyan-300 transition active:scale-95 shadow"
          >
            <Monitor className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-bold">Desktop Apps</span>
          </button>

          {onOpenUserGuide && (
            <button
              onClick={onOpenUserGuide}
              title="User Guide & Security Specs Whitepaper"
              className="hidden lg:flex items-center space-x-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 hover:border-slate-600 rounded-xl text-xs font-semibold text-slate-200 transition active:scale-95 shadow"
            >
              <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-bold">User Guide</span>
            </button>
          )}

          {onOpenThemeModal && (
            <button
              onClick={onOpenThemeModal}
              title="Customize Themes & Dynamic Time-of-Day Backgrounds"
              className="hidden lg:flex items-center space-x-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 hover:border-slate-600 rounded-xl text-xs font-semibold text-slate-200 transition active:scale-95 shadow"
            >
              <Palette className={`w-3.5 h-3.5 ${accentTextClass}`} />
              <span className="font-bold">Theme</span>
            </button>
          )}

          <button
            onClick={handleGateCheckAndLaunch}
            className={`flex items-center space-x-1 sm:space-x-2 px-2.5 py-1.5 sm:px-5 sm:py-2.5 bg-gradient-to-r ${primaryBtnClass} text-[11px] sm:text-sm font-extrabold rounded-xl shadow-lg border transition transform active:scale-95 whitespace-nowrap`}
          >
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-300" />
            <span>Open Free Editor →</span>
          </button>

          {/* Mobile Hamburger Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-800 transition"
            aria-label="Toggle Navigation Menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5 text-cyan-400" />}
          </button>
        </div>

        {/* Mobile Dropdown Navigation Drawer with Solid Backdrops */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-slate-950/98 border-b-2 border-slate-800 p-4 space-y-2.5 shadow-2xl backdrop-blur-xl animate-fadeIn z-50">
            <div className="flex flex-col space-y-2 font-extrabold text-sm text-slate-100">
              <a
                href="#features"
                onClick={(e) => {
                  scrollToSection(e, 'features');
                  setIsMobileMenuOpen(false);
                }}
                className="p-3 bg-slate-900 border border-slate-800 rounded-xl hover:border-cyan-500/60 hover:text-cyan-300 transition flex items-center justify-between shadow-md active:scale-98"
              >
                <span>✨ Features</span>
                <span className="text-xs text-slate-500 font-mono">→</span>
              </a>

              <a
                href="#security"
                onClick={(e) => {
                  scrollToSection(e, 'security');
                  setIsMobileMenuOpen(false);
                }}
                className="p-3 bg-slate-900 border border-slate-800 rounded-xl hover:border-cyan-500/60 hover:text-cyan-300 transition flex items-center justify-between shadow-md active:scale-98"
              >
                <span>🛡️ Security & Compliance</span>
                <span className="text-xs text-slate-500 font-mono">→</span>
              </a>

              <a
                href="#pricing"
                onClick={(e) => {
                  scrollToSection(e, 'pricing');
                  setIsMobileMenuOpen(false);
                }}
                className="p-3 bg-slate-900 border border-slate-800 rounded-xl hover:border-cyan-500/60 hover:text-cyan-300 transition flex items-center justify-between shadow-md active:scale-98"
              >
                <span>💎 Pricing</span>
                <span className="text-xs text-slate-500 font-mono">→</span>
              </a>

              <a
                href="#faq"
                onClick={(e) => {
                  scrollToSection(e, 'faq');
                  setIsMobileMenuOpen(false);
                }}
                className="p-3 bg-slate-900 border border-slate-800 rounded-xl hover:border-cyan-500/60 hover:text-cyan-300 transition flex items-center justify-between shadow-md active:scale-98"
              >
                <span>❓ FAQ</span>
                <span className="text-xs text-slate-500 font-mono">→</span>
              </a>
            </div>

            <div className="pt-2 border-t border-slate-800 grid grid-cols-2 gap-2 text-xs font-extrabold">
              <button
                onClick={() => {
                  setIsDownloadModalOpen(true);
                  setIsMobileMenuOpen(false);
                }}
                className="p-3 bg-slate-900 text-cyan-300 hover:text-white rounded-xl border border-slate-800 hover:border-cyan-500/60 flex items-center justify-center space-x-2 shadow-md transition active:scale-95"
              >
                <Monitor className="w-4 h-4 text-cyan-400" />
                <span>💻 Desktop Apps</span>
              </button>

              {onOpenUserGuide && (
                <button
                  onClick={() => {
                    onOpenUserGuide();
                    setIsMobileMenuOpen(false);
                  }}
                  className="p-3 bg-slate-900 text-emerald-300 hover:text-white rounded-xl border border-slate-800 hover:border-emerald-500/60 flex items-center justify-center space-x-2 shadow-md transition active:scale-95"
                >
                  <BookOpen className="w-4 h-4 text-emerald-400" />
                  <span>📖 User Guide</span>
                </button>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* 2. Hero Section */}
      <section className="relative pt-10 sm:pt-16 pb-16 sm:pb-20 px-4 lg:px-8 max-w-7xl mx-auto text-center flex-1 w-full max-lg:overflow-x-auto lg:overflow-x-hidden">
        <div className={`inline-flex items-center space-x-2 px-3 py-1.5 sm:px-4 sm:py-1.5 bg-slate-900/80 border ${activeTheme?.accentBorder || 'border-cyan-500/30'} rounded-full text-[10px] sm:text-xs font-semibold ${accentTextClass} mb-6 sm:mb-8 max-w-full text-center flex-wrap justify-center shadow`}>
          <Lock className="w-3.5 h-3.5 flex-shrink-0" />
          <span>🔒 100% Client-Side • Zero Data Transmission • Phone, Tablet & Desktop Ready</span>
        </div>

        <h1 className={`text-2xl sm:text-6xl font-extrabold ${headingTextClass} tracking-tight leading-tight max-w-5xl mx-auto px-2`}>
          The 100% On-Device, Privacy-First PDF Suite for Modern Teams.
        </h1>

        <p className={`mt-6 text-base sm:text-xl ${subTextClass} max-w-3xl mx-auto leading-relaxed font-normal`}>
          Fill AcroForms, edit text, add vector shapes, encrypt, and compress PDFs locally in your browser. Zero data uploaded to cloud servers. Save up to 80% compared to traditional Acrobat subscriptions.
        </p>

        {/* Hero CTAs - Matching Scale Width, Height, Thickness & Live Camera Flashing Effect */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 max-w-2xl mx-auto w-full">
          {/* Primary CTA: Open Free Web Editor */}
          <button
            onClick={handleGateCheckAndLaunch}
            className={`w-full sm:w-1/2 flex items-center justify-center space-x-2.5 px-6 py-4 bg-gradient-to-r ${primaryBtnClass} text-white font-extrabold text-base rounded-2xl shadow-xl shadow-cyan-500/25 border-2 border-cyan-400/50 transition transform active:scale-95 ring-2 ring-cyan-400/40`}
          >
            <Sparkles className="w-5 h-5 text-yellow-300 flex-shrink-0" />
            <span>Open Free Web Editor →</span>
          </button>

          {/* Camera Scanner CTA with Flashing Liveness Indicator & Single Camera Icon */}
          <button
            onClick={() => {
              if (onOpenScanModal) onOpenScanModal();
            }}
            className={cameraBtnClass}
          >
            {/* Single Camera Icon with Liveness Flashing Pulse Badge */}
            <div className="relative flex items-center justify-center flex-shrink-0">
              <Camera className="w-5 h-5 text-cyan-500 group-hover:scale-110 transition-transform" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border border-slate-900" />
            </div>

            <span>Scan Document (Camera)</span>
          </button>
        </div>

        {/* Hero Interactive Drag-and-Drop Dropzone Mockup */}
        <div className="mt-14 relative max-w-4xl mx-auto">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOverDropzone(true);
            }}
            onDragLeave={() => setIsDragOverDropzone(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragOverDropzone(false);
              onLaunchEditor();
            }}
            onClick={onLaunchEditor}
            className={`relative ${cardBgClass} border-2 ${
              isDragOverDropzone ? 'border-cyan-400 scale-102' : 'border-dashed border-cyan-500/40 hover:border-cyan-400'
            } rounded-3xl p-8 sm:p-12 shadow-2xl transition cursor-pointer group backdrop-blur-xl`}
          >
            <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl -z-10" />
            
            <div className="flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 bg-cyan-500/10 text-cyan-500 border border-cyan-500/30 rounded-2xl flex items-center justify-center group-hover:scale-110 transition shadow-lg shadow-cyan-500/20">
                <FileText className="w-8 h-8 text-cyan-500" />
              </div>

              <div>
                <h3 className={`text-lg sm:text-xl font-extrabold ${cardTitleClass} group-hover:text-cyan-600 transition`}>
                  Drop your PDF here to edit privately in-browser
                </h3>
                <p className={`text-xs sm:text-sm ${cardDescClass} mt-1 max-w-md mx-auto`}>
                  Click or drag any PDF file to open in Web Editor. 100% in-browser processing with zero server uploads.
                </p>
              </div>

              <span className="px-4 py-1.5 bg-cyan-500/10 text-cyan-600 border border-cyan-500/30 text-xs font-bold rounded-full">
                ⚡ Zero Registration Barrier • Instant Launch
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Feature Grid */}
      <section id="features" className={`scroll-mt-24 py-20 ${sectionBgClass} px-4 lg:px-8`}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-cyan-500 mb-3">Complete PDF Worksuite</h2>
            <p className={`text-3xl sm:text-4xl font-extrabold ${headingTextClass}`}>Everything You Need to Edit, Sign & Organize PDFs</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* 1. Fillable AcroForms */}
            <div className={`${cardBgClass} p-6 rounded-2xl hover:border-cyan-500/50 hover:shadow-xl transition group`}>
              <div className="p-3 bg-cyan-500/10 text-cyan-500 rounded-xl w-fit mb-4 group-hover:scale-110 transition">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className={`text-base font-bold ${cardTitleClass} mb-2`}>Fillable AcroForms</h3>
              <p className={`text-xs ${cardDescClass} leading-relaxed`}>Interactive text fields, checkboxes, and radio buttons with auto-detected input fields.</p>
            </div>

            {/* 2. Vector Text & Underline */}
            <div className={`${cardBgClass} p-6 rounded-2xl hover:border-emerald-500/50 hover:shadow-xl transition group`}>
              <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl w-fit mb-4 group-hover:scale-110 transition">
                <Edit3 className="w-6 h-6" />
              </div>
              <h3 className={`text-base font-bold ${cardTitleClass} mb-2`}>Vector Text & Underline</h3>
              <p className={`text-xs ${cardDescClass} leading-relaxed`}>Razor-sharp typography with underline, text color, font size, and background redaction controls.</p>
            </div>

            {/* 3. Vector Shapes */}
            <div className={`${cardBgClass} p-6 rounded-2xl hover:border-indigo-500/50 hover:shadow-xl transition group`}>
              <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-xl w-fit mb-4 group-hover:scale-110 transition">
                <Grid className="w-6 h-6" />
              </div>
              <h3 className={`text-base font-bold ${cardTitleClass} mb-2`}>Vector Shapes</h3>
              <p className={`text-xs ${cardDescClass} leading-relaxed`}>Draw Lines, Rectangles, and Ovals directly on PDF pages with custom stroke, fill, and opacity.</p>
            </div>

            {/* 4. Custom Image & Logo Stamping */}
            <div className={`${cardBgClass} p-6 rounded-2xl hover:border-amber-500/50 hover:shadow-xl transition group`}>
              <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl w-fit mb-4 group-hover:scale-110 transition">
                <Award className="w-6 h-6" />
              </div>
              <h3 className={`text-base font-bold ${cardTitleClass} mb-2`}>Custom Image & Logo Stamping</h3>
              <p className={`text-xs ${cardDescClass} leading-relaxed`}>Embed PNG/JPG logos, corporate seals, and signature images directly into PDF pages in-memory.</p>
            </div>

            {/* 5. Client-Side AES Encryption */}
            <div className={`${cardBgClass} p-6 rounded-2xl hover:border-purple-500/50 hover:shadow-xl transition group`}>
              <div className="p-3 bg-purple-500/10 text-purple-500 rounded-xl w-fit mb-4 group-hover:scale-110 transition">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className={`text-base font-bold ${cardTitleClass} mb-2`}>Client-Side AES Encryption</h3>
              <p className={`text-xs ${cardDescClass} leading-relaxed`}>Add or remove AES-128/256 password protection and permissions without sending data to servers.</p>
            </div>

            {/* 6. Smart PDF Compression */}
            <div className={`${cardBgClass} p-6 rounded-2xl hover:border-rose-500/50 hover:shadow-xl transition group`}>
              <div className="p-3 bg-rose-500/10 text-rose-500 rounded-xl w-fit mb-4 group-hover:scale-110 transition">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className={`text-base font-bold ${cardTitleClass} mb-2`}>Smart PDF Compression</h3>
              <p className={`text-xs ${cardDescClass} leading-relaxed`}>Reduce PDF file size with multi-preset client-side image resampling and stream compaction.</p>
            </div>

            {/* 7. Dynamic Stamps & Signatures */}
            <div className={`${cardBgClass} p-6 rounded-2xl hover:border-cyan-500/50 hover:shadow-xl transition group`}>
              <div className="p-3 bg-cyan-500/10 text-cyan-500 rounded-xl w-fit mb-4 group-hover:scale-110 transition">
                <PenTool className="w-6 h-6" />
              </div>
              <h3 className={`text-base font-bold ${cardTitleClass} mb-2`}>Dynamic Stamps & Signatures</h3>
              <p className={`text-xs ${cardDescClass} leading-relaxed`}>Draw, type, and place legal signatures and official document stamps with drag-and-drop handles.</p>
            </div>

            {/* 8. Page Management */}
            <div className={`${cardBgClass} p-6 rounded-2xl hover:border-teal-500/50 hover:shadow-xl transition group`}>
              <div className="p-3 bg-teal-500/10 text-teal-500 rounded-xl w-fit mb-4 group-hover:scale-110 transition">
                <Scissors className="w-6 h-6" />
              </div>
              <h3 className={`text-base font-bold ${cardTitleClass} mb-2`}>Page Management</h3>
              <p className={`text-xs ${cardDescClass} leading-relaxed`}>Reorder, rotate, extract page ranges into new PDFs, and split multi-page documents visually.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Security & Compliance Highlight */}
      <section id="security" className="scroll-mt-24 py-24 px-4 lg:px-8 max-w-7xl mx-auto w-full">
        <div className={`${isLight ? 'bg-white border border-slate-200/90 shadow-2xl text-slate-900' : 'bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/40 border border-cyan-500/30 text-slate-100'} rounded-3xl p-8 sm:p-14 relative max-lg:overflow-x-auto lg:overflow-hidden`}>
          <div className="max-w-4xl">
            <div className="flex items-center space-x-2 px-3 py-1 bg-cyan-500/10 text-cyan-500 border border-cyan-500/30 rounded-full text-xs font-semibold w-fit mb-6">
              <Shield className="w-4 h-4 text-cyan-500" />
              <span>Enterprise IT Security & Compliance Specs</span>
            </div>

            <h2 className={`text-3xl sm:text-4xl font-extrabold ${headingTextClass} mb-6`}>
              100% Client-Side Architecture. Zero Cloud Transmission.
            </h2>

            <p className={`${cardDescClass} text-sm sm:text-base leading-relaxed mb-8`}>
              Unlike cloud-based PDF tools that upload sensitive contracts and financial documents to remote third-party servers, ISASecuredPDF executes 100% of PDF rendering, text editing, encryption, and compression directly inside your browser memory or desktop operating system RAM.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className={`flex items-start space-x-3 ${isLight ? 'bg-slate-100/80 border border-slate-200' : 'bg-slate-950/40 border border-slate-800/80'} p-4 rounded-xl`}>
                <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                <span className={`text-xs ${cardDescClass}`}><b className={cardTitleClass}>Zero Network Transfer:</b> PDF bytes never leave your local workstation.</span>
              </div>
              <div className={`flex items-start space-x-3 ${isLight ? 'bg-slate-100/80 border border-slate-200' : 'bg-slate-950/40 border border-slate-800/80'} p-4 rounded-xl`}>
                <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                <span className={`text-xs ${cardDescClass}`}><b className={cardTitleClass}>GDPR & HIPAA Compliant:</b> Eliminates third-party cloud data leak vectors.</span>
              </div>
              <div className={`flex items-start space-x-3 ${isLight ? 'bg-slate-100/80 border border-slate-200' : 'bg-slate-950/40 border border-slate-800/80'} p-4 rounded-xl`}>
                <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                <span className={`text-xs ${cardDescClass}`}><b className={cardTitleClass}>Offline Air-Gapped Capable:</b> Edit, encrypt, and compress documents without active internet connections.</span>
              </div>
              <div className={`flex items-start space-x-3 ${isLight ? 'bg-slate-100/80 border border-slate-200' : 'bg-slate-950/40 border border-slate-800/80'} p-4 rounded-xl`}>
                <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                <span className={`text-xs ${cardDescClass}`}><b className={cardTitleClass}>Instant Processing:</b> Zero latency with WebAssembly & local GPU acceleration.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Pricing Section */}
      <section id="pricing" className={`scroll-mt-24 py-24 ${sectionBgClass} px-4 lg:px-8`}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-cyan-500 mb-3">Flexible Plans</h2>
            <p className={`text-3xl sm:text-4xl font-extrabold ${headingTextClass}`}>Simple, Transparent Pricing</p>
            <p className={`text-sm ${cardDescClass} mt-3`}>No hidden subscriptions. 14-Day Money-Back Guarantee.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className={`${cardBgClass} rounded-3xl p-6 flex flex-col justify-between hover:border-slate-400 transition`}>
              <div>
                <h3 className={`text-base font-bold ${cardTitleClass} mb-1`}>Free Starter</h3>
                <p className={`text-xs ${cardDescClass} mb-4`}>For casual web viewing & editing.</p>
                <div className={`text-3xl font-extrabold ${cardTitleClass} mb-6`}>$0 <span className={`text-xs ${cardDescClass} font-normal`}>/ forever</span></div>

                <ul className={`space-y-3 text-xs ${cardDescClass}`}>
                  <li className="flex items-start space-x-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" /><span>Essential Web PDF Editing Tools</span></li>
                  <li className="flex items-start space-x-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" /><span>Smart AcroForm Filling & Annotation</span></li>
                  <li className="flex items-start space-x-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" /><span>Zero Registration Barrier</span></li>
                </ul>
              </div>

              <button
                onClick={handleGateCheckAndLaunch}
                className={`mt-8 w-full py-3 ${isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-900 border-slate-300' : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700/80'} text-xs font-bold rounded-xl transition border hover:border-cyan-500/50`}
              >
                Use Free Web Editor
              </button>
            </div>

            <div className={`${cardBgClass} rounded-3xl p-6 flex flex-col justify-between hover:border-cyan-500/50 transition`}>
              <div>
                <h3 className={`text-base font-bold ${cardTitleClass} mb-1`}>Pro Monthly</h3>
                <p className={`text-xs ${cardDescClass} mb-4`}>For active power users & creators.</p>
                <div className={`text-3xl font-extrabold ${cardTitleClass} mb-6`}>$2.99 <span className={`text-xs ${cardDescClass} font-normal`}>/ month</span></div>

                <ul className={`space-y-3 text-xs ${cardDescClass}`}>
                  <li className="flex items-start space-x-2"><CheckCircle2 className="w-4 h-4 text-cyan-500 flex-shrink-0 mt-0.5" /><span>Unlimited In-Browser Compressions & Password Tools</span></li>
                  <li className="flex items-start space-x-2"><CheckCircle2 className="w-4 h-4 text-cyan-500 flex-shrink-0 mt-0.5" /><span>High-DPI 4K Vector Supersampling</span></li>
                  <li className="flex items-start space-x-2"><CheckCircle2 className="w-4 h-4 text-cyan-500 flex-shrink-0 mt-0.5" /><span>Custom Image Seals & Unlimited Watermarks</span></li>
                </ul>
              </div>

              <a
                href="https://isasecuredpdf.myhelcim.com/hosted/?token=8cab3b693d79e2929b76f9&amount=2.99&amountHash=50954d4d775e1b695075d6cd0d1294c8cb703bee5b3b641c3ab061bf52f41803"
                target="_blank"
                rel="noopener noreferrer"
                className={`mt-8 w-full py-3 ${isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-900 border-slate-300' : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'} text-xs font-bold rounded-xl border hover:border-cyan-500/50 transition text-center block`}
              >
                Start 7-Day Free Trial ($2.99/mo)
              </a>
            </div>

            <div className={`${cardBgClass} border-2 border-cyan-500 rounded-3xl p-6 flex flex-col justify-between relative shadow-xl shadow-cyan-500/10 transform lg:-translate-y-2`}>
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-[10px] font-extrabold uppercase tracking-widest rounded-full shadow-lg whitespace-nowrap">
                Most Popular
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <h3 className={`text-base font-bold ${cardTitleClass}`}>Pro Annual</h3>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full">Save 20%</span>
                </div>
                <p className={`text-xs ${cardDescClass} mb-4`}>Complete web & desktop freedom.</p>
                <div className={`text-3xl font-extrabold ${cardTitleClass} mb-6`}>$29.99 <span className={`text-xs ${cardDescClass} font-normal`}>/ year</span></div>

                <ul className={`space-y-3 text-xs ${cardDescClass}`}>
                  <li className="flex items-start space-x-2"><CheckCircle2 className="w-4 h-4 text-cyan-500 flex-shrink-0 mt-0.5" /><span>Everything in Monthly Plan</span></li>
                  <li className="flex items-start space-x-2"><CheckCircle2 className="w-4 h-4 text-cyan-500 flex-shrink-0 mt-0.5" /><span>Full Offline Standalone / PWA Execution</span></li>
                  <li className="flex items-start space-x-2"><CheckCircle2 className="w-4 h-4 text-cyan-500 flex-shrink-0 mt-0.5" /><span>Air-Gapped Offline Execution</span></li>
                </ul>
              </div>

              <a
                href="https://isasecuredpdf.myhelcim.com/hosted/?token=7c45c83a1f97e5346967ea&amount=29.99&amountHash=a3d5f6510e8f99715faa83f4534261aa00ae5e18a916916a043e4b8fe2e303f4"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-cyan-500/25 transition text-center block"
              >
                Get Annual Plan ($29.99/yr)
              </a>
            </div>

            <div className={`${cardBgClass} rounded-3xl p-6 flex flex-col justify-between hover:border-purple-500/50 transition`}>
              <div>
                <h3 className={`text-base font-bold ${cardTitleClass} mb-1`}>Lifetime License</h3>
                <p className={`text-xs ${cardDescClass} mb-4`}>One-time investment forever.</p>
                <div className={`text-3xl font-extrabold ${cardTitleClass} mb-6`}>$99.99 <span className={`text-xs ${cardDescClass} font-normal`}>/ one-time</span></div>

                <ul className={`space-y-3 text-xs ${cardDescClass}`}>
                  <li className="flex items-start space-x-2"><CheckCircle2 className="w-4 h-4 text-purple-500 flex-shrink-0 mt-0.5" /><span>One-time payment, zero recurring fees forever</span></li>
                  <li className="flex items-start space-x-2"><CheckCircle2 className="w-4 h-4 text-purple-500 flex-shrink-0 mt-0.5" /><span>All future Pro Web & Desktop App updates included</span></li>
                  <li className="flex items-start space-x-2"><CheckCircle2 className="w-4 h-4 text-purple-500 flex-shrink-0 mt-0.5" /><span>Priority IT & Compliance Support</span></li>
                </ul>
              </div>

              <a
                href="https://isasecuredpdf.myhelcim.com/hosted/?token=6deee5a8794d0282a8c3b2&amount=99.99&amountHash=593108da3e6c466ca37c3e0c5928e9e8b068c04b3c02ba4d050060bf2dc7da69"
                target="_blank"
                rel="noopener noreferrer"
                className={`mt-8 w-full py-3 ${isLight ? 'bg-purple-100 hover:bg-purple-200 text-purple-900 border-purple-300' : 'bg-slate-800 hover:bg-purple-950/80 text-purple-300 hover:text-white border-slate-700'} text-xs font-bold rounded-xl border hover:border-purple-500/60 transition text-center block`}
              >
                Buy Lifetime License ($99.99)
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 6. FAQ Section */}
      <section id="faq" className="scroll-mt-24 py-20 px-4 lg:px-8 max-w-4xl mx-auto w-full">
        <div className="text-center mb-14">
          <h2 className="text-xs font-bold uppercase tracking-widest text-cyan-500 mb-3">Got Questions?</h2>
          <p className={`text-3xl font-extrabold ${headingTextClass}`}>Frequently Asked Questions</p>
        </div>

        <div className="space-y-4">
          {[
            {
              q: 'Is my PDF document data truly private and secure?',
              a: 'Yes, 100%. ISASecuredPDF operates entirely on-device using local browser WebAssembly and OS RAM. Your document bytes never touch cloud servers or remote databases.'
            },
            {
              q: 'How does client-side WebAssembly compression work?',
              a: 'PDF compression processes image downscaling and stream compaction 100% locally inside your browser memory, reducing file size significantly without sending documents to third-party APIs.'
            },
            {
              q: 'How does client-side AES password protection work?',
              a: 'PDF password encryption and decryption use in-memory AES-128 algorithms. Passwords are validated locally without sending password credentials or unencrypted PDF data over the web.'
            },
            {
              q: 'Can I use the app offline without an internet connection?',
              a: 'Absolutely. Both the web editor and PWA/desktop execution function 100% offline without requiring active internet connections.'
            },
            {
              q: 'What is your refund policy?',
              a: 'We offer a 14-day no-questions-asked money-back guarantee for all Pro license purchases.'
            }
          ].map((item, idx) => (
            <div key={idx} className={`${cardBgClass} rounded-2xl overflow-hidden`}>
              <button
                onClick={() => toggleFaq(idx)}
                className={`w-full p-5 text-left flex items-center justify-between text-sm font-semibold ${cardTitleClass} hover:text-cyan-600 transition`}
              >
                <span>{item.q}</span>
                {openFaq === idx ? <ChevronUp className="w-4 h-4 text-cyan-500" /> : <ChevronDown className={`w-4 h-4 ${cardDescClass}`} />}
              </button>
              {openFaq === idx && (
                <div className={`px-5 pb-5 text-xs ${cardDescClass} leading-relaxed border-t ${isLight ? 'border-slate-200' : 'border-slate-800/60'} pt-3 font-normal`}>
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 7. Comprehensive Footer */}
      <footer className={`mt-auto ${isLight ? 'bg-white border-t border-slate-200 text-slate-800' : 'bg-slate-950 border-t border-slate-800/80 text-slate-400'} px-4 lg:px-8 py-10`}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs font-normal">
          <div className="flex items-center space-x-3">
            <div className="p-1.5 bg-cyan-500/10 text-cyan-500 rounded-lg">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className={`font-semibold ${isLight ? 'text-slate-900' : 'text-slate-200'}`}>ISASecuredPDF © 2026</span>
          </div>

          <div className={`flex flex-wrap items-center justify-center gap-6 font-medium ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>
            <button onClick={() => setActiveModal('privacy')} className="hover:text-cyan-600 transition">Privacy Policy</button>
            <button onClick={() => setActiveModal('terms')} className="hover:text-cyan-600 transition">Terms of Service</button>
            <button onClick={() => setActiveModal('refund')} className="hover:text-cyan-600 transition">Refund & Cancellation Policy</button>
            <button onClick={() => setActiveModal('contact')} className="hover:text-cyan-600 transition">Contact & Support</button>
          </div>
        </div>
      </footer>

      {/* LEGAL MODAL OVERLAYS */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
              <div className="flex items-center space-x-2 text-white font-bold text-sm">
                <ShieldCheck className="w-5 h-5 text-cyan-400" />
                <span>
                  {activeModal === 'privacy' && 'Privacy Policy'}
                  {activeModal === 'terms' && 'Terms of Service'}
                  {activeModal === 'refund' && 'Refund & Cancellation Policy'}
                  {activeModal === 'contact' && 'Contact & Support'}
                </span>
              </div>
              <button onClick={closeModal} className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 text-xs text-slate-300 leading-relaxed max-h-[60vh] overflow-y-auto space-y-4">
              {activeModal === 'privacy' && (
                <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
                  <div>
                    <h4 className="font-bold text-white mb-1">1. Zero Document Data Collection</h4>
                    <p>
                      ISASecuredPDF (PDF Engine Studio) operates 100% client-side. We do NOT collect, store, transmit, or process your PDF files, document text, signatures, form entries, or metadata on external cloud servers. All document rendering and manipulation happen entirely in your local browser memory or desktop operating system RAM.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-bold text-white mb-1">2. Local Data Storage</h4>
                    <p>
                      Temporary workspace preferences or cached file states may be saved locally within your device's browser memory (via Local Storage or IndexedDB). This data never leaves your workstation and can be cleared at any time by clearing your browser cache.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-bold text-white mb-1">3. Billing & Payments</h4>
                    <p>
                      Any payment or subscription details provided during purchase are processed securely by our Merchant of Record and are subject to their respective privacy standards and PCI-DSS compliance. We do not store or process payment card numbers on our servers.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-bold text-white mb-1">4. Third-Party Analytics & Advertising</h4>
                    <p>
                      We may utilize privacy-compliant third-party analytics and advertising networks (such as Google AdSense) that collect non-personally identifiable usage metrics using browser cookies to display contextual advertisements.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-bold text-white mb-1">5. Contact Us</h4>
                    <p>
                      If you have any questions regarding this Privacy Policy, please contact us at <a href="mailto:support@isasecuredpdf.com" className="text-cyan-400 font-bold hover:underline">support@isasecuredpdf.com</a>.
                    </p>
                  </div>
                </div>
              )}

              {activeModal === 'terms' && (
                <p>
                  <b>Terms of Service:</b> By downloading, installing, or using PDF Engine Studio, you agree to these terms. The software is provided "as-is" without warranties of any kind. You are granted a non-exclusive, non-transferable license to use the software for personal or commercial document editing. You agree not to reverse engineer or illegally redistribute licensed binaries.
                </p>
              )}

              {activeModal === 'refund' && (
                <p>
                  <b>Refund Policy:</b> We offer a 14-day no-questions-asked money-back guarantee for all individual Pro licenses. If the software does not meet your workflow requirements or fails to render your specific PDF files properly, contact <a href="mailto:support@isasecuredpdf.com" className="text-cyan-400 font-bold hover:underline">support@isasecuredpdf.com</a> within 14 days of purchase for a 100% refund.
                </p>
              )}

              {activeModal === 'contact' && (
                <div className="space-y-3">
                  <p>
                    <b>Support & Inquiries:</b> For enterprise licensing, IT security documentation, desktop installation, or software support, email our team directly at:
                  </p>
                  <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center space-x-3 w-fit">
                    <Mail className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                    <a href="mailto:support@isasecuredpdf.com" className="text-sm font-bold text-cyan-400 hover:underline">
                      support@isasecuredpdf.com
                    </a>
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    Official support response time is within 24 business hours.
                  </p>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/50 flex justify-end">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DESKTOP DOWNLOAD MODAL */}
      {isDownloadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-2.5">
                <Download className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white">Download Desktop Apps</h3>
              </div>
              <button onClick={() => setIsDownloadModalOpen(false)} className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Desktop Subscription Benefit Badge */}
            <div className="px-3 py-2 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-xl flex items-center space-x-2 text-xs font-semibold text-cyan-300">
              <Sparkles className="w-4 h-4 text-yellow-300 flex-shrink-0" />
              <span>Includes Standalone Offline Desktop Apps (.exe & .dmg)</span>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => handleDesktopDownload('windows')}
                className="w-full flex items-center justify-between p-4 bg-slate-950/60 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/50 rounded-xl transition group text-left"
              >
                <div className="flex items-center space-x-3">
                  <Monitor className="w-5 h-5 text-cyan-400" />
                  <div>
                    <div className="text-xs font-bold text-white">Windows Standalone Portable App (.zip)</div>
                    <div className="text-[11px] text-slate-400">145 MB • Zero Install Required • Pro Sub Required</div>
                  </div>
                </div>
                <Download className="w-4 h-4 text-slate-400 group-hover:text-cyan-400 transition" />
              </button>

              <button
                onClick={() => handleDesktopDownload('mac')}
                className="w-full flex items-center justify-between p-4 bg-slate-950/60 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/50 rounded-xl transition group text-left"
              >
                <div className="flex items-center space-x-3">
                  <Monitor className="w-5 h-5 text-indigo-400" />
                  <div>
                    <div className="text-xs font-bold text-white">macOS Standalone Portable App (.zip)</div>
                    <div className="text-[11px] text-slate-400">114 MB • Native App Bundle • Pro Sub Required</div>
                  </div>
                </div>
                <Download className="w-4 h-4 text-slate-400 group-hover:text-indigo-400 transition" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRO MONTHLY CHECKOUT / 7-DAY FREE TRIAL MODAL */}
      {isProMonthlyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md bg-slate-900 border border-cyan-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden text-slate-100">
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl -z-10" />
            <button onClick={() => setIsProMonthlyModalOpen(false)} className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition">
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-4">
              <div className="p-3 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-2xl shadow-lg shadow-cyan-500/20">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">Pro Monthly Subscription</h3>
                <p className="text-xs text-cyan-400 font-semibold">$2.99 / month • Cancel Anytime</p>
              </div>
            </div>

            <div className="px-3 py-2 mb-4 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-xl flex items-center space-x-2 text-xs font-semibold text-cyan-300">
              <Sparkles className="w-4 h-4 text-yellow-300 flex-shrink-0" />
              <span>Includes Standalone Offline Desktop Apps (.exe & .dmg)</span>
            </div>

            <div className="space-y-4 my-6">
              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-2.5 text-xs text-slate-300">
                <div className="flex items-center space-x-2"><CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0" /><span>Includes Standalone Offline Desktop Apps (.exe & .dmg)</span></div>
                <div className="flex items-center space-x-2"><CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0" /><span>Zero ads & unlimited PDF web tools</span></div>
                <div className="flex items-center space-x-2"><CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0" /><span>High-DPI 4K supersampling & batch processing</span></div>
              </div>

              <div className="space-y-2.5">
                <button
                  onClick={() => {
                    setIsProMonthlyModalOpen(false);
                    try {
                      localStorage.setItem('isa_pro_trial_active', 'true');
                      localStorage.setItem('isa_trial_start', Date.now().toString());
                    } catch (e) {}
                    handleGateCheckAndLaunch();
                  }}
                  className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-cyan-500/25 transition"
                >
                  🚀 Activate 7-Day Free Trial & Start
                </button>

                <a
                  href="https://isasecuredpdf.myhelcim.com/hosted/?token=8cab3b693d79e2929b76f9&amount=2.99&amountHash=50954d4d775e1b695075d6cd0d1294c8cb703bee5b3b641c3ab061bf52f41803"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition text-center block"
                >
                  💳 Subscribe Now ($2.99/month)
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PRO ANNUAL CHECKOUT & DESKTOP DOWNLOAD MODAL */}
      {isProAnnualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md bg-slate-900 border border-cyan-500/50 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden text-slate-100">
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl -z-10" />
            <button onClick={() => setIsProAnnualModalOpen(false)} className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition">
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-4">
              <div className="p-3 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-2xl shadow-lg shadow-cyan-500/20">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">Pro Annual Plan ($29.99/yr)</h3>
                <p className="text-xs text-emerald-400 font-bold">Save 20% • Web & Desktop Access</p>
              </div>
            </div>

            <div className="px-3 py-2 mb-4 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-xl flex items-center space-x-2 text-xs font-semibold text-cyan-300">
              <Sparkles className="w-4 h-4 text-yellow-300 flex-shrink-0" />
              <span>Includes Standalone Offline Desktop Apps (.exe & .dmg)</span>
            </div>

            <div className="space-y-4 my-6">
              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-2 text-xs text-slate-300">
                <div className="flex items-center space-x-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" /><span>Full Web Editor & Desktop App download binaries</span></div>
                <div className="flex items-center space-x-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" /><span>Includes Standalone Offline Desktop Apps (.exe & .dmg)</span></div>
                <div className="flex items-center space-x-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" /><span>14-Day Money-Back Guarantee</span></div>
              </div>

              <a
                href="https://isasecuredpdf.myhelcim.com/hosted/?token=7c45c83a1f97e5346967ea&amount=29.99&amountHash=a3d5f6510e8f99715faa83f4534261aa00ae5e18a916916a043e4b8fe2e303f4"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-cyan-500/25 transition text-center block"
              >
                💳 Complete Annual Checkout ($29.99/yr) →
              </a>
            </div>
          </div>
        </div>
      )}

      {/* LIFETIME VIP CHECKOUT & DESKTOP DOWNLOAD MODAL */}
      {isLifetimeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md bg-slate-900 border border-purple-500/50 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden text-slate-100">
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl -z-10" />
            <button onClick={() => setIsLifetimeModalOpen(false)} className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition">
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-4">
              <div className="p-3 bg-gradient-to-tr from-purple-500 to-indigo-600 rounded-2xl shadow-lg shadow-purple-500/20">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">Lifetime VIP License</h3>
                <p className="text-xs text-purple-400 font-bold">$99.99 One-Time • Own Forever</p>
              </div>
            </div>

            <div className="space-y-4 my-6">
              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-2 text-xs text-slate-300">
                <div className="flex items-center space-x-2"><CheckCircle2 className="w-4 h-4 text-purple-400 flex-shrink-0" /><span>Zero recurring fees forever</span></div>
                <div className="flex items-center space-x-2"><CheckCircle2 className="w-4 h-4 text-purple-400 flex-shrink-0" /><span>Lifetime access to Web & Desktop App updates</span></div>
                <div className="flex items-center space-x-2"><CheckCircle2 className="w-4 h-4 text-purple-400 flex-shrink-0" /><span>Priority IT Support & Enterprise Specs</span></div>
              </div>

              <a
                href="https://isasecuredpdf.myhelcim.com/hosted/?token=6deee5a8794d0282a8c3b2&amount=99.99&amountHash=593108da3e6c466ca37c3e0c5928e9e8b068c04b3c02ba4d050060bf2dc7da69"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-purple-500/25 transition text-center block"
              >
                💎 Pay Once $99.99 - Unlock Lifetime VIP →
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
