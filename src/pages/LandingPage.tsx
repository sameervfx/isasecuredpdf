import React, { useState } from 'react';
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
  FileCheck
} from 'lucide-react';

import appLogo from '../assets/app_logo.jpg';

interface LandingPageProps {
  onLaunchEditor: () => void;
}

type LegalModalType = 'privacy' | 'terms' | 'refund' | 'contact' | null;

export const LandingPage: React.FC<LandingPageProps> = ({ onLaunchEditor }) => {
  const [activeModal, setActiveModal] = useState<LegalModalType>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const closeModal = () => setActiveModal(null);

  const scrollToSection = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen w-full max-w-[100vw] overflow-y-auto overflow-x-hidden scroll-smooth bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500 selection:text-white flex flex-col">
      {/* 1. Navigation Bar */}
      <nav className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-3 sm:px-6 lg:px-8 py-3 flex items-center justify-between max-w-[100vw] overflow-x-hidden">
        <div className="flex items-center space-x-2 sm:space-x-3 cursor-pointer flex-shrink-0" onClick={onLaunchEditor}>
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl overflow-hidden shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-500/30 flex items-center justify-center bg-slate-900 flex-shrink-0">
            <img src={appLogo} alt="PDF Engine Studio Logo" className="w-full h-full object-cover" />
          </div>
          <div>
            <span className="text-sm sm:text-lg font-extrabold bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent tracking-tight">
              PDF Engine Studio
            </span>
            <span className="hidden sm:inline-block ml-2 text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 rounded-full">
              SaaS Edition
            </span>
          </div>
        </div>

        <div className="hidden md:flex items-center space-x-8 text-xs font-semibold text-slate-300">
          <a href="#features" onClick={(e) => scrollToSection(e, 'features')} className="hover:text-cyan-400 transition">Features</a>
          <a href="#security" onClick={(e) => scrollToSection(e, 'security')} className="hover:text-cyan-400 transition">Security & Compliance</a>
          <a href="#pricing" onClick={(e) => scrollToSection(e, 'pricing')} className="hover:text-cyan-400 transition">Pricing</a>
          <a href="#faq" onClick={(e) => scrollToSection(e, 'faq')} className="hover:text-cyan-400 transition">FAQ</a>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
          <button
            onClick={() => setIsDownloadModalOpen(true)}
            className="hidden sm:flex items-center space-x-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            <span>Desktop Apps</span>
          </button>

          <button
            onClick={onLaunchEditor}
            className="flex items-center space-x-1.5 sm:space-x-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-cyan-500/25 border border-cyan-400/30 transition transform active:scale-95"
          >
            <span>Launch Web Editor</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </nav>

      {/* 2. Hero Section */}
      <section className="relative pt-10 sm:pt-16 pb-16 sm:pb-20 px-4 lg:px-8 max-w-7xl mx-auto text-center flex-1 w-full overflow-x-hidden">
        <div className="inline-flex items-center space-x-2 px-3 py-1.5 sm:px-4 sm:py-1.5 bg-gradient-to-r from-cyan-500/10 to-indigo-500/10 border border-cyan-500/30 rounded-full text-[10px] sm:text-xs font-semibold text-cyan-300 mb-6 sm:mb-8 max-w-full text-center flex-wrap justify-center">
          <Lock className="w-3.5 h-3.5 flex-shrink-0" />
          <span>🔒 100% Client-Side • Zero Data Transmission • Offline Ready</span>
        </div>

        <h1 className="text-2xl sm:text-6xl font-extrabold text-white tracking-tight leading-tight max-w-5xl mx-auto px-2">
          The 100% On-Device, <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-indigo-400 bg-clip-text text-transparent">Privacy-First PDF Suite</span> for Modern Teams.
        </h1>

        <p className="mt-6 text-base sm:text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed font-normal">
          Fill forms, edit existing text, and sign contracts locally on your machine. Zero data uploaded to cloud servers. Save up to 80% compared to Adobe Acrobat.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => setIsDownloadModalOpen(true)}
            className="w-full sm:w-auto flex items-center justify-center space-x-3 px-7 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm rounded-2xl shadow-xl shadow-cyan-500/25 border border-cyan-400/30 transition transform active:scale-95"
          >
            <Download className="w-5 h-5" />
            <span>Download Desktop App (.exe / .dmg)</span>
          </button>

          <button
            onClick={onLaunchEditor}
            className="w-full sm:w-auto flex items-center justify-center space-x-2 px-7 py-4 bg-slate-900 hover:bg-slate-800 text-slate-200 font-semibold text-sm rounded-2xl border border-slate-800 transition"
          >
            <Sparkles className="w-5 h-5 text-cyan-400" />
            <span>Try Free Web Version</span>
          </button>
        </div>

        {/* Hero Interactive Preview Feature Card */}
        <div className="mt-16 relative max-w-5xl mx-auto bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-8 shadow-2xl overflow-hidden backdrop-blur-xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl -z-10" />
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 rounded-full bg-rose-500" />
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-xs text-slate-400 font-mono ml-2">PDF_Engine_Studio_Workspace.pdf</span>
            </div>
            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-semibold rounded-lg border border-emerald-500/20">
              100% Local RAM Processing
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
            <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800/80">
              <div className="w-10 h-10 bg-cyan-500/10 text-cyan-400 rounded-xl flex items-center justify-center mb-3">
                <Edit3 className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white mb-1">4K Crisp Rendering</h3>
              <p className="text-xs text-slate-400 leading-relaxed">High-DPI vector supersampling keeps fonts razor sharp on Retina screens.</p>
            </div>

            <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800/80">
              <div className="w-10 h-10 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center mb-3">
                <FileCheck className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white mb-1">Smart AcroForms</h3>
              <p className="text-xs text-slate-400 leading-relaxed">Auto-detects multi-line textboxes, checkmarks, and signature areas.</p>
            </div>

            <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800/80">
              <div className="w-10 h-10 bg-indigo-500/10 text-indigo-400 rounded-xl flex items-center justify-center mb-3">
                <PenTool className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white mb-1">Instant Drag & Drop Signatures</h3>
              <p className="text-xs text-slate-400 leading-relaxed">Draw or upload signatures and place them anywhere on your page.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Feature Grid */}
      <section id="features" className="scroll-mt-24 py-20 bg-slate-900/50 border-y border-slate-800/60 px-4 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-cyan-400 mb-3">Complete PDF Worksuite</h2>
            <p className="text-3xl sm:text-4xl font-extrabold text-white">Everything You Need to Edit, Sign & Organize PDFs</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl hover:border-cyan-500/50 transition">
              <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-xl w-fit mb-4">
                <Edit3 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Redact & Overwrite Text</h3>
              <p className="text-xs text-slate-400 leading-relaxed">Cover old text coordinates and replace seamlessly with clean 4K text rendering.</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl hover:border-cyan-500/50 transition">
              <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl w-fit mb-4">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Interactive Form Filling</h3>
              <p className="text-xs text-slate-400 leading-relaxed">Fill standard AcroForm fields effortlessly with visual blue highlight cues.</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl hover:border-cyan-500/50 transition">
              <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl w-fit mb-4">
                <PenTool className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Handwritten & Digital Signatures</h3>
              <p className="text-xs text-slate-400 leading-relaxed">Draw, place, and flatten signatures locally with instant drag-and-drop handles.</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl hover:border-cyan-500/50 transition">
              <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl w-fit mb-4">
                <Monitor className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Cross-Platform Desktop & Web</h3>
              <p className="text-xs text-slate-400 leading-relaxed">Run directly in your browser or install as a native lightweight desktop app.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Security & Compliance Highlight (For Enterprise IT Review) */}
      <section id="security" className="scroll-mt-24 py-24 px-4 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/40 border border-cyan-500/30 rounded-3xl p-8 sm:p-14 shadow-2xl relative overflow-hidden">
          <div className="max-w-4xl">
            <div className="flex items-center space-x-2 px-3 py-1 bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 rounded-full text-xs font-semibold w-fit mb-6">
              <Shield className="w-4 h-4 text-cyan-400" />
              <span>Enterprise IT Security & Compliance Specs</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-6">
              100% Client-Side Architecture. Zero Cloud Transmission.
            </h2>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-8">
              Unlike cloud-based PDF tools that upload sensitive contracts and financial documents to remote third-party servers, PDF Engine Studio executes 100% of PDF rendering, text editing, and signing directly inside your browser memory or desktop operating system RAM.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="flex items-start space-x-3 bg-slate-950/40 p-4 rounded-xl border border-slate-800/80">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span className="text-xs text-slate-300"><b>Zero Network Transfer:</b> PDF bytes never leave your local workstation.</span>
              </div>
              <div className="flex items-start space-x-3 bg-slate-950/40 p-4 rounded-xl border border-slate-800/80">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span className="text-xs text-slate-300"><b>GDPR & HIPAA Compliant:</b> Eliminates third-party cloud data leak vectors.</span>
              </div>
              <div className="flex items-start space-x-3 bg-slate-950/40 p-4 rounded-xl border border-slate-800/80">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span className="text-xs text-slate-300"><b>Offline Air-Gapped Capable:</b> Edit and sign documents without active internet connections.</span>
              </div>
              <div className="flex items-start space-x-3 bg-slate-950/40 p-4 rounded-xl border border-slate-800/80">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span className="text-xs text-slate-300"><b>Instant Processing:</b> Zero latency with local GPU & vector supersampling acceleration.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Pricing Section (Free vs. Pro vs. Team) */}
      <section id="pricing" className="scroll-mt-24 py-24 bg-slate-900/40 border-t border-slate-800/60 px-4 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-cyan-400 mb-3">Flexible Plans</h2>
            <p className="text-3xl sm:text-4xl font-extrabold text-white">Simple, Transparent Pricing</p>
            <p className="text-sm text-slate-400 mt-3">No hidden subscriptions. 14-Day Money-Back Guarantee.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Free Tier */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-white mb-2">Free Starter</h3>
                <p className="text-xs text-slate-400 mb-6">For casual PDF viewing & basic form filling.</p>
                <div className="text-4xl font-extrabold text-white mb-6">$0 <span className="text-xs text-slate-500 font-normal">/ forever</span></div>

                <ul className="space-y-3 text-xs text-slate-300">
                  <li className="flex items-center space-x-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /><span>PDF Viewing & Rendering</span></li>
                  <li className="flex items-center space-x-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /><span>Page Rotation & Deletion</span></li>
                  <li className="flex items-center space-x-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /><span>Basic Form Filling</span></li>
                </ul>
              </div>

              <button
                onClick={onLaunchEditor}
                className="mt-8 w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition"
              >
                Use Free Web Editor
              </button>
            </div>

            {/* Pro License */}
            <div className="bg-slate-900 border-2 border-cyan-500 rounded-3xl p-8 flex flex-col justify-between relative shadow-xl shadow-cyan-500/10">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-[10px] font-extrabold uppercase tracking-widest rounded-full shadow-lg">
                Most Popular
              </div>

              <div>
                <h3 className="text-lg font-bold text-white mb-2">Pro License</h3>
                <p className="text-xs text-slate-400 mb-6">For power users, freelancers & professionals.</p>
                <div className="text-4xl font-extrabold text-white mb-6">$39 <span className="text-xs text-slate-400 font-normal">one-time lifetime</span></div>

                <ul className="space-y-3 text-xs text-slate-200">
                  <li className="flex items-center space-x-2"><CheckCircle2 className="w-4 h-4 text-cyan-400" /><span>Text Overwriting & Redaction</span></li>
                  <li className="flex items-center space-x-2"><CheckCircle2 className="w-4 h-4 text-cyan-400" /><span>Signature Stamping & Flattening</span></li>
                  <li className="flex items-center space-x-2"><CheckCircle2 className="w-4 h-4 text-cyan-400" /><span>Batch PDF Splitting & ZIP Export</span></li>
                  <li className="flex items-center space-x-2"><CheckCircle2 className="w-4 h-4 text-cyan-400" /><span>Unlimited Standalone Desktop Usage</span></li>
                </ul>
              </div>

              <button
                onClick={() => setIsDownloadModalOpen(true)}
                className="mt-8 w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-cyan-500/25 transition"
              >
                Get Pro License
              </button>
            </div>

            {/* Team / Enterprise */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-white mb-2">Team Enterprise</h3>
                <p className="text-xs text-slate-400 mb-6">For companies requiring centralized licenses.</p>
                <div className="text-4xl font-extrabold text-white mb-6">$299 <span className="text-xs text-slate-500 font-normal">/ year</span></div>

                <ul className="space-y-3 text-xs text-slate-300">
                  <li className="flex items-center space-x-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /><span>Multi-seat Company Deployment</span></li>
                  <li className="flex items-center space-x-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /><span>MSI Silent Installers</span></li>
                  <li className="flex items-center space-x-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /><span>Priority 24/7 IT Support</span></li>
                </ul>
              </div>

              <button
                onClick={() => setActiveModal('contact')}
                className="mt-8 w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition"
              >
                Contact Enterprise Sales
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Frequently Asked Questions (FAQ) Accordion */}
      <section id="faq" className="scroll-mt-24 py-20 px-4 lg:px-8 max-w-4xl mx-auto w-full">
        <div className="text-center mb-14">
          <h2 className="text-xs font-bold uppercase tracking-widest text-cyan-400 mb-3">Got Questions?</h2>
          <p className="text-3xl font-extrabold text-white">Frequently Asked Questions</p>
        </div>

        <div className="space-y-4">
          {[
            {
              q: 'Is my PDF document data truly private and secure?',
              a: 'Yes, 100%. PDF Engine Studio operates entirely on-device using local browser memory and OS RAM. Your document bytes never touch cloud servers.'
            },
            {
              q: 'Can I use the app offline without an internet connection?',
              a: 'Absolutely. Both the web editor and native desktop apps function 100% offline without requiring internet access.'
            },
            {
              q: 'What operating systems are supported?',
              a: 'We provide native desktop app builds for Windows (.exe) and macOS (.dmg / .app), as well as support for all modern web browsers.'
            },
            {
              q: 'What is your refund policy?',
              a: 'We offer a 14-day no-questions-asked money-back guarantee for all Pro license purchases.'
            }
          ].map((item, idx) => (
            <div key={idx} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
              <button
                onClick={() => toggleFaq(idx)}
                className="w-full p-5 text-left flex items-center justify-between text-sm font-semibold text-white hover:text-cyan-400 transition"
              >
                <span>{item.q}</span>
                {openFaq === idx ? <ChevronUp className="w-4 h-4 text-cyan-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </button>
              {openFaq === idx && (
                <div className="px-5 pb-5 text-xs text-slate-400 leading-relaxed border-t border-slate-800/60 pt-3">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 7. Comprehensive Footer with Legal Modals (CRITICAL FOR PAYMENT APPROVAL) */}
      <footer className="mt-auto bg-slate-950 border-t border-slate-800/80 px-4 lg:px-8 py-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-slate-400">
          <div className="flex items-center space-x-3">
            <div className="p-1.5 bg-cyan-500/10 text-cyan-400 rounded-lg">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="font-semibold text-slate-200">PDF Engine Studio © 2026</span>
          </div>

          {/* Legal Links (CRITICAL FOR MERCHANT OF RECORD APPROVAL) */}
          <div className="flex flex-wrap items-center justify-center gap-6 font-medium">
            <button onClick={() => setActiveModal('privacy')} className="hover:text-cyan-400 transition">Privacy Policy</button>
            <button onClick={() => setActiveModal('terms')} className="hover:text-cyan-400 transition">Terms of Service</button>
            <button onClick={() => setActiveModal('refund')} className="hover:text-cyan-400 transition">Refund & Cancellation Policy</button>
            <button onClick={() => setActiveModal('contact')} className="hover:text-cyan-400 transition">Contact & Support</button>
          </div>
        </div>
      </footer>

      {/* LEGAL MODAL OVERLAYS (EXACT REQUIRED LEGAL TEXT) */}
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

            <div className="space-y-3">
              <a
                href="/dist_packages/Isa_Secure_PDF_Suite_v1.0.0_Portable_Windows.zip"
                download
                className="flex items-center justify-between p-4 bg-slate-950/60 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/50 rounded-xl transition group"
              >
                <div className="flex items-center space-x-3">
                  <Monitor className="w-5 h-5 text-cyan-400" />
                  <div>
                    <div className="text-xs font-bold text-white">Windows Standalone Portable App</div>
                    <div className="text-[11px] text-slate-400">145 MB • Zero Install Required</div>
                  </div>
                </div>
                <Download className="w-4 h-4 text-slate-400 group-hover:text-cyan-400 transition" />
              </a>

              <a
                href="/dist_packages/Isa_Secure_PDF_Suite_v1.0.0_Portable_Mac.zip"
                download
                className="flex items-center justify-between p-4 bg-slate-950/60 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/50 rounded-xl transition group"
              >
                <div className="flex items-center space-x-3">
                  <Monitor className="w-5 h-5 text-indigo-400" />
                  <div>
                    <div className="text-xs font-bold text-white">macOS Standalone Portable App</div>
                    <div className="text-[11px] text-slate-400">114 MB • Native App Bundle</div>
                  </div>
                </div>
                <Download className="w-4 h-4 text-slate-400 group-hover:text-indigo-400 transition" />
              </a>
            </div>

            <div className="pt-2 text-center">
              <button
                onClick={() => {
                  setIsDownloadModalOpen(false);
                  onLaunchEditor();
                }}
                className="text-xs text-cyan-400 hover:underline font-medium"
              >
                Or continue with Web Editor →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
