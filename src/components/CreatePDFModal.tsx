import React, { useState } from 'react';
import { X, FilePlus, Check } from 'lucide-react';
import { CreatePDFOptions } from '../utils/blankPdf';

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
  const [pageSize, setPageSize] = useState<'A4' | 'Letter' | 'Legal'>('Letter');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [pageCount, setPageCount] = useState<number>(1);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreatePDF({ pageSize, orientation, pageCount });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FilePlus className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-bold text-white tracking-tight">Create Blank PDF Document</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 bg-slate-950">
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
                  className={`p-3 rounded-xl border text-left transition flex flex-col ${
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

          {/* Orientation */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">Orientation</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'portrait', name: 'Portrait (Vertical)' },
                { id: 'landscape', name: 'Landscape (Horizontal)' },
              ].map((o) => (
                <button
                  type="button"
                  key={o.id}
                  onClick={() => setOrientation(o.id as any)}
                  className={`p-3 rounded-xl border text-center text-xs font-semibold transition ${
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

          {/* Page Count */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">Initial Page Count</label>
            <div className="flex items-center space-x-3">
              <input
                type="number"
                min={1}
                max={50}
                value={pageCount}
                onChange={(e) => setPageCount(Math.max(1, Math.min(50, Number(e.target.value))))}
                className="w-24 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm font-semibold outline-none focus:border-cyan-500"
              />
              <span className="text-xs text-slate-400">pages</span>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center space-x-1.5 px-5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 rounded-lg shadow-lg transition"
            >
              <Check className="w-4 h-4" />
              <span>Create Document</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
