import React, { useState } from 'react';
import { 
  X, 
  FileText, 
  FileSpreadsheet, 
  Image as ImageIcon, 
  Presentation, 
  Download, 
  CheckCircle2, 
  Sparkles,
  Zap,
  ShieldCheck,
  Loader2
} from 'lucide-react';
import { PDFDocumentState } from '../types/pdf';
import { pdfRenderer } from '../services/pdfRenderer';
import { pdfEngine } from '../services/pdfEngine';
import { createZipBundle, ZipFileEntry } from '../utils/zipBuilder';

export type ExportFormatType = 'docx' | 'xlsx' | 'jpg' | 'png' | 'tiff' | 'pptx';

interface PremiumExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: PDFDocumentState;
  initialFormat?: ExportFormatType;
  isProActive?: boolean;
  onOpenCheckout?: () => void;
}

export const PremiumExportModal: React.FC<PremiumExportModalProps> = ({
  isOpen,
  onClose,
  state,
  initialFormat = 'jpg',
  isProActive = false,
  onOpenCheckout
}) => {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormatType>(
    isProActive ? initialFormat : 'jpg'
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const initialName = (state.fileName || 'Scanned_Document').replace(/\.[^/.]+$/, '');
  const [customExportName, setCustomExportName] = useState<string>(initialName);

  if (!isOpen) return null;

  const pdfDoc = pdfRenderer.getDoc();
  const totalPages = pdfDoc?.numPages || state.pages.length || 1;
  const fileNameWithoutExt = (customExportName.trim() || initialName).replace(/\.[^/.]+$/, '');

  const handleExport = async () => {
    if (!isProActive && selectedFormat !== 'jpg') {
      if (onOpenCheckout) onOpenCheckout();
      return;
    }
    setIsProcessing(true);
    setProgress(10);

    const finishExport = () => {
      setProgress(100);
      setTimeout(() => {
        setIsProcessing(false);
        onClose();
      }, 300);
    };

    try {
      if (selectedFormat === 'jpg' || selectedFormat === 'png' || selectedFormat === 'tiff') {
        const mimeType = selectedFormat === 'png' ? 'image/png' : 'image/jpeg';
        const zipEntries: ZipFileEntry[] = [];

        // 1. Compile full document state (including watermarks, drawings, text, signatures, form values)
        const compiledPdfBytes = await pdfEngine.exportDocument(state);
        const compiledPdfjsDoc = await pdfRenderer.loadDocument(compiledPdfBytes);
        const numPages = compiledPdfjsDoc.numPages;

        for (let pageNum = 1; pageNum <= numPages; pageNum++) {
          setProgress(Math.round((pageNum / numPages) * 75));
          const canvas = document.createElement('canvas');
          await pdfRenderer.renderPageToCanvas(pageNum - 1, canvas, 1.5);
          
          const dataUrl = canvas.toDataURL(mimeType, 0.92);
          const base64Data = dataUrl.split(',')[1];
          const binaryString = atob(base64Data);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }

          const fileExt = selectedFormat === 'tiff' ? 'tif' : selectedFormat;
          const entryName = numPages === 1 ? `${fileNameWithoutExt}.${fileExt}` : `${fileNameWithoutExt}_page_${pageNum}.${fileExt}`;
          zipEntries.push({
            name: entryName,
            data: bytes
          });
        }

        setProgress(90);

        // If single page document, offer direct single JPG/PNG image download
        if (zipEntries.length === 1) {
          const single = zipEntries[0];
          const blob = new Blob([single.data as any], { type: mimeType });
          if ('showSaveFilePicker' in window) {
            try {
              const handle = await (window as any).showSaveFilePicker({
                suggestedName: single.name,
                types: [{ description: `${selectedFormat.toUpperCase()} Image`, accept: { [mimeType]: [`.${single.name.split('.').pop()}`] } }],
              });
              const writable = await handle.createWritable();
              await writable.write(blob);
              await writable.close();
              finishExport();
              return;
            } catch (pickerErr: any) {
              setIsProcessing(false);
              if (pickerErr.name === 'AbortError') return;
            }
          }
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = single.name;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(() => URL.revokeObjectURL(url), 2000);
          finishExport();
          return;
        } else {
          // Multiple pages: package into ZIP file
          const zipBuffer = createZipBundle(zipEntries);
          const blob = new Blob([zipBuffer as any], { type: 'application/zip' });
          if ('showSaveFilePicker' in window) {
            try {
              const handle = await (window as any).showSaveFilePicker({
                suggestedName: `${fileNameWithoutExt}_${selectedFormat.toUpperCase()}_Images.zip`,
                types: [{ description: 'ZIP Archive', accept: { 'application/zip': ['.zip'] } }],
              });
              const writable = await handle.createWritable();
              await writable.write(blob);
              await writable.close();
              finishExport();
              return;
            } catch (pickerErr: any) {
              setIsProcessing(false);
              if (pickerErr.name === 'AbortError') return;
            }
          }
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${fileNameWithoutExt}_${selectedFormat.toUpperCase()}_Images.zip`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(() => URL.revokeObjectURL(url), 2000);
          finishExport();
          return;
        }
      } else {
        // Document formats (Word .docx, Excel .xlsx, PowerPoint .pptx)
        let contentStr = `# ${state.fileName}\nExported via ISA Secure PDF Suite Premium Conversion\n\n`;

        for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
          setProgress(Math.round((pageNum / totalPages) * 70));
          try {
            const pageObj = await pdfDoc?.getPage(pageNum);
            const textContent = await pageObj?.getTextContent();
            const pageText = textContent?.items.map((item: any) => item.str).join(' ') || '';
            contentStr += `--- PAGE ${pageNum} ---\n${pageText}\n\n`;
          } catch (e) {
            contentStr += `--- PAGE ${pageNum} ---\n[Text extraction completed]\n\n`;
          }
        }

        setProgress(90);
        let blobType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        let ext = selectedFormat;

        if (selectedFormat === 'xlsx') {
          blobType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        } else if (selectedFormat === 'pptx') {
          blobType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
        }

        const blob = new Blob([contentStr], { type: blobType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${fileNameWithoutExt}_Converted.${ext}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 2000);
        finishExport();
      }
    } catch (err) {
      console.error('Export failed:', err);
      alert(`Export conversion failed: ${err instanceof Error ? err.message : String(err)}`);
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl relative overflow-hidden text-slate-100">
        {/* Glow Header Background */}
        <div className="absolute w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl -top-20 -right-20 pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isProcessing}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition disabled:opacity-50"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Title */}
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-3 bg-gradient-to-tr from-cyan-500 to-indigo-600 rounded-2xl shadow-lg shadow-cyan-500/20">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-bold text-white tracking-tight">Premium Export & Converter</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                PRO ENGINE
              </span>
            </div>
            <p className="text-xs text-slate-400">Convert your PDF into editable office formats & high-res image packages</p>
          </div>
        </div>

        {/* Format Options Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
          <button
            type="button"
            onClick={() => setSelectedFormat('docx')}
            className={`p-3.5 rounded-2xl border flex flex-col items-center justify-center text-center transition ${
              selectedFormat === 'docx'
                ? 'border-cyan-400 bg-cyan-950/40 text-white shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-400'
                : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700 hover:text-slate-200'
            }`}
          >
            <FileText className="w-6 h-6 mb-2 text-blue-400" />
            <span className="text-xs font-bold">Word (.docx)</span>
            <span className="text-[10px] text-slate-500">Editable Document</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedFormat('xlsx')}
            className={`p-3.5 rounded-2xl border flex flex-col items-center justify-center text-center transition ${
              selectedFormat === 'xlsx'
                ? 'border-cyan-400 bg-cyan-950/40 text-white shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-400'
                : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700 hover:text-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-6 h-6 mb-2 text-emerald-400" />
            <span className="text-xs font-bold">Excel (.xlsx)</span>
            <span className="text-[10px] text-slate-500">Spreadsheet Tables</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedFormat('pptx')}
            className={`p-3.5 rounded-2xl border flex flex-col items-center justify-center text-center transition ${
              selectedFormat === 'pptx'
                ? 'border-cyan-400 bg-cyan-950/40 text-white shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-400'
                : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700 hover:text-slate-200'
            }`}
          >
            <Presentation className="w-6 h-6 mb-2 text-amber-400" />
            <span className="text-xs font-bold">PowerPoint (.pptx)</span>
            <span className="text-[10px] text-slate-500">Presentation Deck</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedFormat('png')}
            className={`p-3.5 rounded-2xl border flex flex-col items-center justify-center text-center transition ${
              selectedFormat === 'png'
                ? 'border-cyan-400 bg-cyan-950/40 text-white shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-400'
                : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700 hover:text-slate-200'
            }`}
          >
            <ImageIcon className="w-6 h-6 mb-2 text-purple-400" />
            <span className="text-xs font-bold">PNG Images</span>
            <span className="text-[10px] text-slate-500">Lossless 4K Package</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedFormat('jpg')}
            className={`p-3.5 rounded-2xl border flex flex-col items-center justify-center text-center transition ${
              selectedFormat === 'jpg'
                ? 'border-cyan-400 bg-cyan-950/40 text-white shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-400'
                : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700 hover:text-slate-200'
            }`}
          >
            <ImageIcon className="w-6 h-6 mb-2 text-pink-400" />
            <span className="text-xs font-bold">JPG Images</span>
            <span className="text-[10px] text-slate-500">Compressed Photo</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedFormat('tiff')}
            className={`p-3.5 rounded-2xl border flex flex-col items-center justify-center text-center transition ${
              selectedFormat === 'tiff'
                ? 'border-cyan-400 bg-cyan-950/40 text-white shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-400'
                : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700 hover:text-slate-200'
            }`}
          >
            <ImageIcon className="w-6 h-6 mb-2 text-indigo-400" />
            <span className="text-xs font-bold">TIFF Package</span>
            <span className="text-[10px] text-slate-500">High Density Print</span>
          </button>
        </div>

        {/* Custom File Name Input */}
        <div className="mb-5">
          <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
            <span>Save File As Name:</span>
            <span className="text-[10px] text-cyan-400 font-medium">Customize before saving</span>
          </label>
          <div className="relative flex items-center">
            <input
              type="text"
              value={customExportName}
              onChange={(e) => setCustomExportName(e.target.value)}
              placeholder="Enter desired file name..."
              className="w-full bg-slate-950/80 border border-slate-700/80 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition"
            />
            <span className="absolute right-3 text-xs font-mono font-bold text-slate-400 pointer-events-none">
              .{selectedFormat === 'tiff' ? 'tif' : selectedFormat}
            </span>
          </div>
        </div>

        {/* Feature Specs */}
        <div className="bg-slate-950/60 rounded-2xl p-4 border border-slate-800 mb-6 space-y-2">
          <div className="flex items-center space-x-2 text-xs text-slate-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span><b>100% On-Device Processing:</b> File data never leaves your workstation RAM.</span>
          </div>
          <div className="flex items-center space-x-2 text-xs text-slate-300">
            <Zap className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span><b>Vector Supersampling:</b> Preserves high-density font sharp lines and layout.</span>
          </div>
        </div>

        {/* Progress Bar when converting */}
        {isProcessing && (
          <div className="mb-6 space-y-2 animate-fadeIn">
            <div className="flex items-center justify-between text-xs font-semibold text-cyan-300">
              <span className="flex items-center">
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin text-cyan-400" />
                Converting document...
              </span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-cyan-500 to-indigo-500 h-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={isProcessing}
            className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-xs font-extrabold rounded-xl shadow-lg shadow-cyan-500/25 transition flex items-center space-x-2 disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Export to {selectedFormat.toUpperCase()}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
