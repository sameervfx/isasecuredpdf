import React, { useState, useRef } from 'react';
import { X, Layers, Upload, ArrowUp, ArrowDown, Trash2, Combine } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import { pdfEngine } from '../services/pdfEngine';

export interface MergeFileItem {
  id: string;
  file: File;
  numPages: number;
  bytes: Uint8Array;
}

interface MergePDFModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMergeComplete: (mergedBytes: Uint8Array, fileName: string) => void;
}

export const MergePDFModal: React.FC<MergePDFModalProps> = ({
  isOpen,
  onClose,
  onMergeComplete,
}) => {
  const [fileItems, setFileItems] = useState<MergeFileItem[]>([]);
  const [isMerging, setIsMerging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleAddFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newItems: MergeFileItem[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type !== 'application/pdf') continue;

      try {
        const ab = await file.arrayBuffer();
        const bytes = new Uint8Array(ab);
        const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
        newItems.push({
          id: `file_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`,
          file,
          numPages: doc.getPageCount(),
          bytes,
        });
      } catch (err) {
        console.error('Failed to read PDF file for merge:', file.name, err);
      }
    }

    setFileItems((prev) => [...prev, ...newItems]);
    e.target.value = '';
  };

  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    setFileItems((prev) => {
      const list = [...prev];
      const temp = list[index - 1];
      list[index - 1] = list[index];
      list[index] = temp;
      return list;
    });
  };

  const handleMoveDown = (index: number) => {
    if (index >= fileItems.length - 1) return;
    setFileItems((prev) => {
      const list = [...prev];
      const temp = list[index + 1];
      list[index + 1] = list[index];
      list[index] = temp;
      return list;
    });
  };

  const handleRemove = (index: number) => {
    setFileItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleExecuteMerge = async () => {
    if (fileItems.length < 2) {
      alert('Please add at least 2 PDF files to combine.');
      return;
    }

    setIsMerging(true);
    try {
      const fileBytesList = fileItems.map((item) => item.bytes);
      const mergedBytes = await pdfEngine.mergePDFDocuments(fileBytesList);
      onMergeComplete(mergedBytes, `Combined_${fileItems.length}_Documents.pdf`);
      onClose();
    } catch (err) {
      console.error('Error merging PDFs:', err);
      alert('An error occurred while merging PDF files.');
    } finally {
      setIsMerging(false);
    }
  };

  const totalPages = fileItems.reduce((acc, curr) => acc + curr.numPages, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-w-xl w-full h-[75vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Combine className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-bold text-white tracking-tight">Combine / Merge PDF Files</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Upload Action */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleAddFiles}
            accept="application/pdf"
            multiple
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center space-x-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition"
          >
            <Upload className="w-4 h-4 text-cyan-400" />
            <span>Add PDF Files</span>
          </button>

          <span className="text-xs text-slate-400 font-mono">
            {fileItems.length} Files selected ({totalPages} total pages)
          </span>
        </div>

        {/* File List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-950">
          {fileItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-3">
              <Layers className="w-12 h-12 opacity-30" />
              <p className="text-xs font-medium text-center max-w-xs">
                No files added yet. Click "Add PDF Files" above to select multiple documents to combine into one.
              </p>
            </div>
          ) : (
            fileItems.map((item, index) => (
              <div
                key={item.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-center justify-between shadow-sm hover:border-slate-700 transition"
              >
                <div className="flex items-center space-x-3 overflow-hidden">
                  <span className="w-6 h-6 rounded-full bg-slate-800 text-cyan-400 text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {index + 1}
                  </span>
                  <div className="truncate">
                    <p className="text-xs font-semibold text-white truncate">{item.file.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono">
                      {item.numPages} {item.numPages === 1 ? 'page' : 'pages'} • {(item.file.size / 1024).toFixed(0)} KB
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-1">
                  <button
                    disabled={index === 0}
                    onClick={() => handleMoveUp(index)}
                    className="p-1.5 text-slate-400 hover:text-white disabled:opacity-20 rounded hover:bg-slate-800 transition"
                    title="Move Up"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>

                  <button
                    disabled={index === fileItems.length - 1}
                    onClick={() => handleMoveDown(index)}
                    className="p-1.5 text-slate-400 hover:text-white disabled:opacity-20 rounded hover:bg-slate-800 transition"
                    title="Move Down"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleRemove(index)}
                    className="p-1.5 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800 transition"
                    title="Remove File"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between bg-slate-900">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition"
          >
            Cancel
          </button>

          <button
            onClick={handleExecuteMerge}
            disabled={fileItems.length < 2 || isMerging}
            className="flex items-center space-x-2 px-5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 rounded-lg shadow-lg disabled:opacity-40 transition"
          >
            <Combine className="w-4 h-4" />
            <span>{isMerging ? 'Merging Documents...' : 'Combine & Open PDF'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
