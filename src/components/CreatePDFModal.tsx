import React, { useState } from 'react';
import { X, FilePlus, Check, BookOpen, FileText, Receipt, Shield, Building } from 'lucide-react';
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

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreatePDF({ pageSize, orientation, pageCount, templateType });
    onClose();
  };

  const templatesList: { id: TemplateType; title: string; desc: string; icon: any; category: string }[] = [
    {
      id: 'blank',
      title: 'Blank Document',
      desc: 'Clean canvas with custom size & page count',
      icon: FilePlus,
      category: 'Custom',
    },
    {
      id: 'nda',
      title: 'Mutual NDA Agreement',
      desc: 'Non-Disclosure Agreement with Party A/B signature lines',
      icon: Shield,
      category: 'Legal',
    },
    {
      id: 'invoice',
      title: 'Commercial Business Invoice',
      desc: 'Itemized billing table, subtotal, tax & payment notes',
      icon: Receipt,
      category: 'Finance',
    },
    {
      id: 'contractor',
      title: 'Independent Contractor Agreement',
      desc: 'Service terms, IP ownership & execution block',
      icon: FileText,
      category: 'Business',
    },
    {
      id: 'w9',
      title: 'Form W-9 (Taxpayer ID Request)',
      desc: 'IRS Taxpayer Identification & Certification form',
      icon: Building,
      category: 'Government',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">PDF Template Library & Document Creator</h3>
              <p className="text-[10px] text-slate-400">Choose a preset legal, business, or government form template</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-5 bg-slate-950 overflow-y-auto flex-1">
          {/* Template Selector Grid */}
          <div>
            <label className="block text-xs font-bold text-slate-200 mb-2 flex items-center justify-between">
              <span>Select Document Template</span>
              <span className="text-[10px] font-normal text-cyan-400">5 Ready-to-Use Presets</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {templatesList.map((tpl) => {
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

          {/* Sizing & Format Options */}
          {templateType === 'blank' && (
            <div className="space-y-4 pt-3 border-t border-slate-800/80">
              {/* Page Size */}
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

              {/* Orientation & Page Count */}
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
                {templateType === 'blank' ? 'Create Blank PDF' : `Generate ${templatesList.find(t => t.id === templateType)?.title}`}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
