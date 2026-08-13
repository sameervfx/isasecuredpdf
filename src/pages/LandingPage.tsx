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
  const [isFreeUnlockModalOpen, setIsFreeUnlockModalOpen] = useState(false);
  const [isProMonthlyModalOpen, setIsProMonthlyModalOpen] = useState(false);
  const [isProAnnualModalOpen, setIsProAnnualModalOpen] = useState(false);
  const [isLifetimeModalOpen, setIsLifetimeModalOpen] = useState(false);

  // Mandatory Sign-Up Form Fields
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userProfession, setUserProfession] = useState('');
  const [userCountry, setUserCountry] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Load saved user profile details into form state if available
  useEffect(() => {
    try {
      const savedProfile = localStorage.getItem('isa_user_profile');
      if (savedProfile) {
        const parsed = JSON.parse(savedProfile);
        if (parsed.name) setUserName(parsed.name);
        if (parsed.email) setUserEmail(parsed.email);
        if (parsed.profession) setUserProfession(parsed.profession);
        if (parsed.country) setUserCountry(parsed.country);
      }
    } catch (e) {}
  }, []);

  const handleGateCheckAndLaunch = () => {
    // Always present mandatory registration form modal to unlock Web Editor
    setIsFreeUnlockModalOpen(true);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim() || !userEmail.trim() || !userProfession.trim()) {
      setFormError('Please enter your Name, Email Address, and Profession to unlock the Web Editor.');
      return;
    }
    setFormError(null);

    const profile = {
      name: userName.trim(),
      email: userEmail.trim(),
      profession: userProfession.trim(),
      country: userCountry.trim() || 'Not specified',
      registeredAt: new Date().toISOString(),
    };

    localStorage.setItem('isa_user_profile', JSON.stringify(profile));
    localStorage.setItem('isa_editor_registered', 'true');
    localStorage.setItem('isa_editor_unlocked', 'true');
    setIsFreeUnlockModalOpen(false);
    onLaunchEditor();
  };

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
        <div className="flex items-center space-x-2 sm:space-x-3 cursor-pointer flex-shrink-0" onClick={handleGateCheckAndLaunch}>
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
            onClick={handleGateCheckAndLaunch}
            className="flex items-center space-x-1.5 sm:space-x-2 px-3.5 py-2 sm:px-5 sm:py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs sm:text-sm font-bold rounded-xl shadow-lg shadow-cyan-500/25 border border-cyan-400/30 transition transform active:scale-95"
          >
            <Sparkles className="w-4 h-4 text-yellow-300" />
            <span>Try Free Web Version</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </nav>

      {/* 2. Hero Section */}
      <section className="relative pt-10 sm:pt-16 pb-16 sm:pb-20 px-4 lg:px-8 max-w-7xl mx-auto text-center flex-1 w-full overflow-x-hidden">
        <div className="inline-flex items-center space-x-2 px-3 py-1.5 sm:px-4 sm:py-1.5 bg-gradient-to-r from-cyan-500/10 to-indigo-500/10 border border-cyan-500/30 rounded-full text-[10px] sm:text-xs font-semibold text-cyan-300 mb-6 sm:mb-8 max-w-full text-center flex-wrap justify-center">
          <Lock className="w-3.5 h-3.5 flex-shrink-0" />
          <span>🔒 100% Client-Side • Zero Data Transmission • Phone, Tablet & Desktop Ready</span>
        </div>

        <h1 className="text-2xl sm:text-6xl font-extrabold text-white tracking-tight leading-tight max-w-5xl mx-auto px-2">
          The 100% On-Device, <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-indigo-400 bg-clip-text text-transparent">Privacy-First PDF Suite</span> for Modern Teams.
        </h1>

        <p className="mt-6 text-base sm:text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed font-normal">
          Fill forms, edit existing text, and sign contracts locally on your phone, tablet, or desktop. Zero data uploaded to cloud servers. Save up to 80% compared to Adobe Acrobat.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 max-w-2xl mx-auto">
          {/* First Button: Try Free Phone/Tablet Version */}
          <button
            onClick={handleGateCheckAndLaunch}
            className="w-full sm:w-auto flex items-center justify-center space-x-2.5 px-7 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm sm:text-base rounded-2xl shadow-xl shadow-cyan-500/25 border border-cyan-400/30 transition transform active:scale-95"
          >
            <Sparkles className="w-5 h-5 text-yellow-300 flex-shrink-0" />
            <span>Try Free Phone / Tablet Version</span>
            <ArrowRight className="w-4 h-4 ml-1 flex-shrink-0" />
          </button>

          {/* Second Button: Try Free Web Version */}
          <button
            onClick={handleGateCheckAndLaunch}
            className="w-full sm:w-auto flex items-center justify-center space-x-2.5 px-7 py-4 bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white font-semibold text-sm sm:text-base rounded-2xl border border-slate-700 transition transform active:scale-95 shadow-lg"
          >
            <Monitor className="w-5 h-5 text-cyan-400 flex-shrink-0" />
            <span>Try Free Web Version</span>
            <ArrowRight className="w-4 h-4 ml-1 flex-shrink-0 text-slate-400" />
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
              <div className="w-10 h-10 bg-indigo-500/10 text-indigo-400 rounded-xl flex items-center justify-center mb-3">
                <PenTool className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white mb-1">AcroForms & Watermarks</h3>
              <p className="text-xs text-slate-400 leading-relaxed">Fill interactive PDF text fields, checkboxes, and apply confidential image seals.</p>
            </div>

            <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800/80">
              <div className="w-10 h-10 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center mb-3">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white mb-1">Zero Server Tracking</h3>
              <p className="text-xs text-slate-400 leading-relaxed">Documents process exclusively inside your device browser memory.</p>
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

      {/* 4. Security & Compliance Highlight */}
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

      {/* 5. Pricing Section */}
      <section id="pricing" className="scroll-mt-24 py-24 bg-slate-900/40 border-t border-slate-800/60 px-4 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-cyan-400 mb-3">Flexible Plans</h2>
            <p className="text-3xl sm:text-4xl font-extrabold text-white">Simple, Transparent Pricing</p>
            <p className="text-sm text-slate-400 mt-3">No hidden subscriptions. 14-Day Money-Back Guarantee.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between hover:border-slate-700 transition">
              <div>
                <h3 className="text-base font-bold text-white mb-1">Free Starter</h3>
                <p className="text-xs text-slate-400 mb-4">For casual web viewing & editing.</p>
                <div className="text-3xl font-extrabold text-white mb-6">$0 <span className="text-xs text-slate-500 font-normal">/ forever</span></div>

                <ul className="space-y-3 text-xs text-slate-300">
                  <li className="flex items-start space-x-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" /><span>Essential Web PDF Tools</span></li>
                  <li className="flex items-start space-x-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" /><span>Smart AcroForm Filling & Annotation</span></li>
                  <li className="flex items-start space-x-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" /><span>Standard Local Processing Limits</span></li>
                </ul>
              </div>

              <button
                onClick={handleGateCheckAndLaunch}
                className="mt-8 w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition border border-slate-700/80 hover:border-cyan-500/50"
              >
                Use Free Web Editor
              </button>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between hover:border-cyan-500/50 transition">
              <div>
                <h3 className="text-base font-bold text-white mb-1">Pro Monthly</h3>
                <p className="text-xs text-slate-400 mb-4">For active power users & creators.</p>
                <div className="text-3xl font-extrabold text-white mb-6">$2.99 <span className="text-xs text-slate-400 font-normal">/ month</span></div>

                <ul className="space-y-3 text-xs text-slate-300">
                  <li className="flex items-start space-x-2"><CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" /><span>Zero Ads & Unlimited Web Tools</span></li>
                  <li className="flex items-start space-x-2"><CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" /><span>High-DPI 4K Vector Supersampling</span></li>
                  <li className="flex items-start space-x-2"><CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" /><span>Batch PDF Processing & ZIP Export</span></li>
                </ul>
              </div>

              <button
                onClick={() => setIsProMonthlyModalOpen(true)}
                className="mt-8 w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 hover:border-cyan-500/50 transition"
              >
                Start 7-Day Free Trial ($2.99/mo)
              </button>
            </div>

            <div className="bg-slate-900 border-2 border-cyan-500 rounded-3xl p-6 flex flex-col justify-between relative shadow-xl shadow-cyan-500/10 transform lg:-translate-y-2">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-[10px] font-extrabold uppercase tracking-widest rounded-full shadow-lg whitespace-nowrap">
                Most Popular
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-base font-bold text-white">Pro Annual</h3>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">Save 20%</span>
                </div>
                <p className="text-xs text-slate-400 mb-4">Complete web & desktop freedom.</p>
                <div className="text-3xl font-extrabold text-white mb-6">$29.99 <span className="text-xs text-slate-400 font-normal">/ year</span></div>

                <ul className="space-y-3 text-xs text-slate-200">
                  <li className="flex items-start space-x-2"><CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" /><span>Everything in Monthly Plan</span></li>
                  <li className="flex items-start space-x-2"><CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" /><span>Download Standalone Desktop App (.exe / .dmg)</span></li>
                  <li className="flex items-start space-x-2"><CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" /><span>Air-Gapped Offline Execution</span></li>
                </ul>
              </div>

              <button
                onClick={() => setIsProAnnualModalOpen(true)}
                className="mt-8 w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-cyan-500/25 transition"
              >
                Get Annual Plan ($29.99/yr)
              </button>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between hover:border-purple-500/50 transition">
              <div>
                <h3 className="text-base font-bold text-white mb-1">Lifetime License</h3>
                <p className="text-xs text-slate-400 mb-4">One-time investment forever.</p>
                <div className="text-3xl font-extrabold text-white mb-6">$99.00 <span className="text-xs text-slate-500 font-normal">/ one-time</span></div>

                <ul className="space-y-3 text-xs text-slate-300">
                  <li className="flex items-start space-x-2"><CheckCircle2 className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" /><span>One-time payment, zero recurring fees forever</span></li>
                  <li className="flex items-start space-x-2"><CheckCircle2 className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" /><span>All future Pro Web & Desktop App updates included</span></li>
                  <li className="flex items-start space-x-2"><CheckCircle2 className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" /><span>Priority IT & Compliance Support</span></li>
                </ul>
              </div>

              <button
                onClick={() => setIsLifetimeModalOpen(true)}
                className="mt-8 w-full py-3 bg-slate-800 hover:bg-purple-950/80 text-purple-300 hover:text-white text-xs font-bold rounded-xl border border-slate-700 hover:border-purple-500/60 transition"
              >
                Buy Lifetime License ($99)
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 6. FAQ Section */}
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

      {/* 7. Comprehensive Footer */}
      <footer className="mt-auto bg-slate-950 border-t border-slate-800/80 px-4 lg:px-8 py-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-slate-400">
          <div className="flex items-center space-x-3">
            <div className="p-1.5 bg-cyan-500/10 text-cyan-400 rounded-lg">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="font-semibold text-slate-200">PDF Engine Studio © 2026</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 font-medium">
            <button onClick={() => setActiveModal('privacy')} className="hover:text-cyan-400 transition">Privacy Policy</button>
            <button onClick={() => setActiveModal('terms')} className="hover:text-cyan-400 transition">Terms of Service</button>
            <button onClick={() => setActiveModal('refund')} className="hover:text-cyan-400 transition">Refund & Cancellation Policy</button>
            <button onClick={() => setActiveModal('contact')} className="hover:text-cyan-400 transition">Contact & Support</button>
          </div>
        </div>
      </footer>

      {/* Mandatory Sign-Up Registration Access Gate Modal */}
      {isFreeUnlockModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden text-slate-100">
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl -z-10" />
            
            <button
              onClick={() => setIsFreeUnlockModalOpen(false)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-4">
              <div className="p-3 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-2xl shadow-lg shadow-cyan-500/20">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">Create Free Account to Access Editor</h3>
                <p className="text-xs text-slate-400">Complete sign up to unlock full Web Editor</p>
              </div>
            </div>

            {formError && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded-xl font-medium">
                {formError}
              </div>
            )}

            <form onSubmit={handleRegisterSubmit} className="space-y-3.5 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Full Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="e.g. Alex Morgan"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Email Address <span className="text-rose-400">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  placeholder="alex@company.com"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Profession / Occupation <span className="text-rose-400">*</span>
                </label>
                <select
                  required
                  value={userProfession}
                  onChange={(e) => setUserProfession(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-cyan-500 transition"
                >
                  <option value="">Select your profession...</option>
                  <option value="Accountant / Finance">Accountant / Finance</option>
                  <option value="Lawyer / Legal">Lawyer / Legal</option>
                  <option value="Engineer / IT">Engineer / Software Developer</option>
                  <option value="Executive / Business Manager">Executive / Business Manager</option>
                  <option value="Educator / Student">Educator / Student</option>
                  <option value="Healthcare Professional">Healthcare Professional</option>
                  <option value="Real Estate Agent">Real Estate / Insurance</option>
                  <option value="Creative / Designer">Creative / Designer</option>
                  <option value="Other">Other Profession</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Country / Region <span className="text-slate-500">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={userCountry}
                  onChange={(e) => setUserCountry(e.target.value)}
                  placeholder="e.g. United States, Canada, Germany"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-cyan-500/25 transition active:scale-98"
                >
                  Complete Sign Up & Launch Web Editor →
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                  handleGateCheckAndLaunch();
                }}
                className="text-xs text-cyan-400 hover:underline font-medium"
              >
                Or continue with Web Editor →
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

            <div className="space-y-4 my-6">
              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-2.5 text-xs text-slate-300">
                <div className="flex items-center space-x-2"><CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0" /><span>7-Day Free Trial included</span></div>
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

                <button
                  onClick={() => {
                    setIsProMonthlyModalOpen(false);
                    try {
                      localStorage.setItem('isa_pro_active', 'true');
                    } catch (e) {}
                    handleGateCheckAndLaunch();
                  }}
                  className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition"
                >
                  💳 Subscribe Now ($2.99/month)
                </button>
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

            <div className="space-y-4 my-6">
              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-2 text-xs text-slate-300">
                <div className="flex items-center space-x-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" /><span>Full Web Editor & Desktop App download binaries</span></div>
                <div className="flex items-center space-x-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" /><span>Offline air-gapped PDF processing</span></div>
                <div className="flex items-center space-x-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" /><span>14-Day Money-Back Guarantee</span></div>
              </div>

              <button
                onClick={() => {
                  setIsProAnnualModalOpen(false);
                  try {
                    localStorage.setItem('isa_pro_annual_active', 'true');
                  } catch (e) {}
                  setIsDownloadModalOpen(true);
                }}
                className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-cyan-500/25 transition"
              >
                💳 Complete Annual Checkout ($29.99/yr) →
              </button>
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
                <p className="text-xs text-purple-400 font-bold">$99.00 One-Time • Own Forever</p>
              </div>
            </div>

            <div className="space-y-4 my-6">
              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-2 text-xs text-slate-300">
                <div className="flex items-center space-x-2"><CheckCircle2 className="w-4 h-4 text-purple-400 flex-shrink-0" /><span>Zero recurring fees forever</span></div>
                <div className="flex items-center space-x-2"><CheckCircle2 className="w-4 h-4 text-purple-400 flex-shrink-0" /><span>Lifetime access to Web & Desktop App updates</span></div>
                <div className="flex items-center space-x-2"><CheckCircle2 className="w-4 h-4 text-purple-400 flex-shrink-0" /><span>Priority IT Support & Enterprise Specs</span></div>
              </div>

              <button
                onClick={() => {
                  setIsLifetimeModalOpen(false);
                  try {
                    localStorage.setItem('isa_lifetime_vip', 'true');
                  } catch (e) {}
                  setIsDownloadModalOpen(true);
                }}
                className="w-full py-3.5 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-purple-500/25 transition"
              >
                💎 Pay Once $99.00 - Unlock Lifetime VIP →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
