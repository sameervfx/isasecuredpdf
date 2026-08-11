import React, { useState } from 'react';
import { X, FilePlus, Check, BookOpen, FileText, Receipt, Shield, Building, Home, Car, FileCheck, Crown, Lock, Sparkles, ShieldCheck } from 'lucide-react';
import { CreatePDFOptions, TemplateType } from '../utils/blankPdf';

interface CreatePDFModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreatePDF: (options: CreatePDFOptions) => void;
}

export const CreatePDFModal: React.FC<CreatePDFModalProps> = ({
  isOpen,
  onClose,
  onCreatePDF,
}) => {
  const [templateType, setTemplateType] = useState<TemplateType>('blank');
  const [pageSize, setPageSize] = useState<'A4' | 'Letter' | 'Legal'>('Letter');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [pageCount, setPageCount] = useState<number>(1);
  const [jurisdiction, setJurisdiction] = useState<'US' | 'CA'>('US');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [pendingProTemplate, setPendingProTemplate] = useState<TemplateType | null>(null);

  if (!isOpen) return null;

  const isProActive =
    localStorage.getItem('isasecuredpdf_pro_active') === 'true' ||
    localStorage.getItem('isa_pro_active') === 'true' ||
    localStorage.getItem('isa_pro_annual_active') === 'true' ||
    localStorage.getItem('isa_lifetime_vip') === 'true';

  const proLegalTemplates: {
    id: TemplateType;
    title: string;
    desc: string;
    icon: any;
    badge: string;
    tags: string;
  }[] = [
    {
      id: 'pro_commercial_lease',
      title: 'Commercial Lease Agreement',
      desc: 'Legally binding agreement defining the rights, responsibilities, and obligations of both landlord and tenant. Review all terms carefully before signing — once executed, both parties are bound.',
      icon: Building,
      badge: 'PRO',
      tags: 'Legal | Real Estate | Pro Only',
    },
    {
      id: 'pro_nda',
      title: 'Non-Disclosure Agreement (NDA)',
      desc: 'Comprehensive NDA to protect confidential information between Disclosing and Receiving Parties. Specifies confidentiality obligations, authorized disclosures, and breach remedies for business negotiations.',
      icon: Shield,
      badge: 'PREMIUM',
      tags: 'Business | Legal | Pro Only',
    },
    {
      id: 'pro_roommate_agreement',
      title: 'Roommate Agreement',
      desc: 'Adaptable co-living contract for school roommates or housemates sharing living expenses, rent allocations, house rules, and utility payments.',
      icon: Home,
      badge: 'PRO',
      tags: 'Personal | Housing | Pro Only',
    },
    {
      id: 'pro_real_estate_purchase',
      title: 'Real Estate Purchase Agreement',
      desc: 'Residential Purchase Agreement (RPA) outlining real property terms including purchase price, earnest money deposit, closing dates, contingencies, and disclosures.',
      icon: FileText,
      badge: 'PREMIUM',
      tags: 'Real Estate | Contracts | Pro Only',
    },
  ];

  const standardTemplates: { id: TemplateType; title: string; desc: string; icon: any; category: string }[] = [
    {
      id: 'blank',
      title: 'Blank Document',
      desc: 'Clean canvas with custom size & page count',
      icon: FilePlus,
      category: 'Custom',
    },
  ];

  const handleOpenProTemplateClick = (tplId: TemplateType) => {
    if (isProActive) {
      onCreatePDF({ pageSize: 'Letter', orientation: 'portrait', pageCount: 1, templateType: tplId, jurisdiction });
      onClose();
    } else {
      setPendingProTemplate(tplId);
      setIsCheckoutOpen(true);
    }
  };

  const handleCompleteSubscription = () => {
    try {
      localStorage.setItem('isasecuredpdf_pro_active', 'true');
      localStorage.setItem('isa_pro_active', 'true');
    } catch (e) {}
    setIsCheckoutOpen(false);

    if (pendingProTemplate) {
      onCreatePDF({ pageSize: 'Letter', orientation: 'portrait', pageCount: 1, templateType: pendingProTemplate, jurisdiction });
      setPendingProTemplate(null);
      onClose();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (templateType.startsWith('pro_') && !isProActive) {
      setPendingProTemplate(templateType);
      setIsCheckoutOpen(true);
      return;
    }
    onCreatePDF({ pageSize, orientation, pageCount, templateType, jurisdiction });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">PDF Template Library & Document Creator</h3>
              <p className="text-[10px] text-slate-400">Choose a preset legal, business, government, or Pro commercial form template</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Jurisdiction Toggle Banner */}
        <div className="bg-slate-950/90 px-5 py-2.5 border-b border-slate-800 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-300 flex items-center space-x-1.5">
            <span>Governing Legal Framework & Currency:</span>
          </span>
          <div className="flex items-center bg-slate-900 border border-slate-800 p-1 rounded-xl space-x-1">
            <button
              type="button"
              onClick={() => setJurisdiction('US')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition flex items-center space-x-1.5 ${
                jurisdiction === 'US'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>🇺🇸 United States ($USD)</span>
            </button>
            <button
              type="button"
              onClick={() => setJurisdiction('CA')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition flex items-center space-x-1.5 ${
                jurisdiction === 'CA'
                  ? 'bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>🇨🇦 Canada ($CAD)</span>
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-6 bg-slate-950 overflow-y-auto flex-1">
          {/* SECTION 1: PRO LEGAL FORMS CATEGORY */}
          <div className="bg-slate-900/90 border border-purple-500/30 rounded-2xl p-4 space-y-3.5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/10 rounded-full blur-2xl -z-10" />

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Crown className="w-4 h-4 text-purple-400" />
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-purple-300">
                  Premium Legal Forms & Pro Contracts
                </h4>
              </div>
              <span className="text-[10px] font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full flex items-center space-x-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Commercial Grade</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {proLegalTemplates.map((tpl) => {
                const Icon = tpl.icon;
                const isSelected = templateType === tpl.id;

                return (
                  <div
                    key={tpl.id}
                    onClick={() => setTemplateType(tpl.id)}
                    className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer space-y-3 ${
                      isSelected
                        ? 'border-purple-500 bg-purple-950/40 text-white ring-1 ring-purple-500/50 shadow-lg shadow-purple-500/10'
                        : 'border-slate-800 bg-slate-950/70 text-slate-300 hover:border-purple-500/40 hover:bg-slate-900'
                    }`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 min-w-0">
                          <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 flex-shrink-0">
                            <Icon className="w-4 h-4" />
                          </div>
                          <span className="text-xs font-extrabold text-white truncate">{tpl.title}</span>
                        </div>
                        <span className="text-[9px] font-extrabold uppercase bg-gradient-to-r from-amber-400 to-purple-500 text-slate-950 px-1.5 py-0.5 rounded-md shadow ml-1 flex-shrink-0">
                          {tpl.badge}
                        </span>
                      </div>

                      <p className="text-[10px] text-slate-400 leading-relaxed line-clamp-3">
                        {tpl.desc}
                      </p>

                      <div className="text-[9px] font-mono font-semibold text-purple-400/90 pt-1">
                        {tpl.tags}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenProTemplateClick(tpl.id);
                      }}
                      className="w-full py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center space-x-1.5"
                    >
                      {!isProActive && <Lock className="w-3 h-3 text-amber-300" />}
                      <span>Open Pro Template</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION 2: STANDARD TEMPLATES CATEGORY */}
          <div>
            <label className="block text-xs font-bold text-slate-200 mb-2 flex items-center justify-between">
              <span>Standard Form Templates</span>
              <span className="text-[10px] font-normal text-cyan-400">9 Ready-to-Use Presets</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {standardTemplates.map((tpl) => {
                const Icon = tpl.icon;
                const isSelected = templateType === tpl.id;
                return (
                  <button
                    type="button"
                    key={tpl.id}
                    onClick={() => setTemplateType(tpl.id)}
                    className={`p-3 rounded-xl border text-left transition flex items-start space-x-3 ${
                      isSelected
                        ? 'border-cyan-500 bg-cyan-950/50 text-white ring-1 ring-cyan-500/50 shadow-lg shadow-cyan-500/10'
                        : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${isSelected ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-800 text-slate-400'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white truncate">{tpl.title}</span>
                        <span className="text-[9px] font-semibold uppercase text-cyan-400/80 bg-cyan-500/10 px-1.5 py-0.5 rounded ml-1">
                          {tpl.category}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">{tpl.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sizing & Format Options for Blank Canvas */}
          {templateType === 'blank' && (
            <div className="space-y-4 pt-3 border-t border-slate-800/80">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">Page Format Size</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'Letter', name: 'Letter', desc: '8.5 x 11 in' },
                    { id: 'A4', name: 'A4', desc: '210 x 297 mm' },
                    { id: 'Legal', name: 'Legal', desc: '8.5 x 14 in' },
                  ].map((size) => (
                    <button
                      type="button"
                      key={size.id}
                      onClick={() => setPageSize(size.id as any)}
                      className={`p-2.5 rounded-xl border text-left transition flex flex-col ${
                        pageSize === size.id
                          ? 'border-cyan-500 bg-cyan-950/40 text-white ring-1 ring-cyan-500/50'
                          : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <span className="text-xs font-bold">{size.name}</span>
                      <span className="text-[10px] text-slate-500 mt-0.5">{size.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">Orientation</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'portrait', name: 'Portrait' },
                      { id: 'landscape', name: 'Landscape' },
                    ].map((o) => (
                      <button
                        type="button"
                        key={o.id}
                        onClick={() => setOrientation(o.id as any)}
                        className={`p-2 rounded-xl border text-center text-xs font-semibold transition ${
                          orientation === o.id
                            ? 'border-cyan-500 bg-cyan-950/40 text-white ring-1 ring-cyan-500/50'
                            : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        {o.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">Page Count</label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={pageCount}
                    onChange={(e) => setPageCount(Math.max(1, Math.min(50, Number(e.target.value))))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs font-semibold outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Footer Buttons */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center space-x-1.5 px-5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 rounded-xl shadow-lg transition"
            >
              <Check className="w-4 h-4" />
              <span>
                {templateType === 'blank' ? 'Create Blank PDF' : 'Open Selected Template'}
              </span>
            </button>
          </div>
        </form>
      </div>

      {/* PRO CHECKOUT MODAL OVERLAY */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md bg-slate-900 border border-purple-500/50 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden text-slate-100">
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl -z-10" />
            <button
              onClick={() => setIsCheckoutOpen(false)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-4">
              <div className="p-3 bg-gradient-to-tr from-purple-500 to-indigo-600 rounded-2xl shadow-lg shadow-purple-500/20">
                <Crown className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">Unlock Pro Template Access</h3>
                <p className="text-xs text-purple-300 font-medium">Commercial Legal Forms Suite</p>
              </div>
            </div>

            <div className="mb-5 p-3.5 bg-purple-950/40 border border-purple-500/30 text-purple-200 text-xs rounded-xl font-semibold leading-relaxed">
              "Unlock Commercial Lease, NDA, Real Estate, and all Premium Legal Templates with Pro Access."
            </div>

            <div className="space-y-3">
              <button
                onClick={handleCompleteSubscription}
                className="w-full p-4 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/50 rounded-2xl text-left transition flex items-center justify-between group"
              >
                <div>
                  <div className="text-xs font-bold text-white flex items-center space-x-2">
                    <span>Pro Monthly Subscription</span>
                    <span className="text-[10px] font-extrabold bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full">7-Day Free Trial</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">$2.99 / month • Cancel anytime</div>
                </div>
                <Sparkles className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition" />
              </button>

              <button
                onClick={handleCompleteSubscription}
                className="w-full p-4 bg-gradient-to-r from-cyan-950/50 to-blue-950/50 hover:from-cyan-900/60 hover:to-blue-900/60 border border-cyan-500/40 rounded-2xl text-left transition flex items-center justify-between group"
              >
                <div>
                  <div className="text-xs font-bold text-white flex items-center space-x-2">
                    <span>Pro Annual Plan</span>
                    <span className="text-[10px] font-extrabold bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">Save 20%</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">$29.99 / year • Web & Desktop binaries</div>
                </div>
                <ShieldCheck className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition" />
              </button>

              <button
                onClick={handleCompleteSubscription}
                className="w-full p-4 bg-slate-950 hover:bg-purple-950/60 border border-purple-500/40 rounded-2xl text-left transition flex items-center justify-between group"
              >
                <div>
                  <div className="text-xs font-bold text-white flex items-center space-x-2">
                    <span>Lifetime VIP License</span>
                    <span className="text-[10px] font-extrabold bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full">Best Value</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">$99.00 one-time • Permanent VIP status</div>
                </div>
                <Crown className="w-4 h-4 text-purple-400 group-hover:scale-110 transition" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
