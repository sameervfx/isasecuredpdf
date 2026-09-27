import React, { useState, useEffect } from 'react';
import { X, Save, Share2, Smartphone, Cloud, FileText, CheckCircle2, Edit3, Image as ImageIcon } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import {
  DownloadOptions,
  saveToPhoneStorage,
  shareToOtherApps,
  saveMultipleToPhoneStorage,
  shareMultipleToOtherApps,
} from '../utils/mobileFileDownload';

export interface ExportItem {
  fileName: string;
  blob: Blob;
  mimeType?: string;
}

export interface ExportSaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialFileName: string;
  blob?: Blob | null;
  files?: ExportItem[];
  mimeType?: string;
  title?: string;
  subtitle?: string;
  onSaveSuccess?: (message: string) => void;
}

export const ExportSaveModal: React.FC<ExportSaveModalProps> = ({
  isOpen,
  onClose,
  initialFileName,
  blob,
  files,
  mimeType,
  title,
  subtitle,
  onSaveSuccess,
}) => {
  // Parse base name and extension from initialFileName
  const parseNameAndExt = (full: string) => {
    const lastDot = full.lastIndexOf('.');
    if (lastDot > 0) {
      return {
        base: full.substring(0, lastDot),
        ext: full.substring(lastDot),
      };
    }
    return {
      base: full || 'Document',
      ext: '.pdf',
    };
  };

  const [baseName, setBaseName] = useState<string>('');
  const [extension, setExtension] = useState<string>('.pdf');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const isNative = Capacitor.isNativePlatform();

  useEffect(() => {
    if (isOpen && initialFileName) {
      const { base, ext } = parseNameAndExt(initialFileName);
      setBaseName(base);
      setExtension(ext);
    }
  }, [isOpen, initialFileName]);

  if (!isOpen) return null;

  // Resolve target files with edited base name
  const resolveTargetFiles = (): DownloadOptions[] => {
    const cleanBase = baseName.trim().replace(/[^a-zA-Z0-9_\-\s]/g, '_') || 'Exported_Document';

    // Multi-file case (e.g. multi-page scanner images)
    if (files && files.length > 0) {
      return files.map((item, idx) => {
        const itemExt = parseNameAndExt(item.fileName).ext || extension;
        const numberedName =
          files.length === 1
            ? `${cleanBase}${itemExt}`
            : `${cleanBase}_Page_${idx + 1}${itemExt}`;
        return {
          fileName: numberedName,
          blob: item.blob,
          mimeType: item.mimeType || mimeType,
        };
      });
    }

    // Single file case
    if (blob) {
      const finalFileName = `${cleanBase}${extension}`;
      return [
        {
          fileName: finalFileName,
          blob,
          mimeType: mimeType || blob.type || 'application/pdf',
        },
      ];
    }

    return [];
  };

  // 1. Handle Save to Phone
  const handleSaveToPhone = async () => {
    const targetFiles = resolveTargetFiles();
    if (targetFiles.length === 0) return;

    setIsProcessing(true);
    try {
      let successMsg = "Saved to your phone's storage";
      if (targetFiles.length === 1) {
        const res = await saveToPhoneStorage(targetFiles[0]);
        successMsg = res.message || `Saved ${targetFiles[0].fileName} to phone`;
      } else {
        const res = await saveMultipleToPhoneStorage(targetFiles);
        successMsg = res.message || `Saved ${targetFiles.length} files to phone`;
      }

      if (onSaveSuccess) {
        onSaveSuccess(successMsg);
      }
      onClose();
    } catch (err: any) {
      console.error('Save to phone error:', err);
      alert(`Save to phone failed: ${err?.message || err}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // 2. Handle Share / Cloud Drive (Google Drive, OneDrive, WhatsApp, etc.)
  const handleShareToCloud = async () => {
    const targetFiles = resolveTargetFiles();
    if (targetFiles.length === 0) return;

    setIsProcessing(true);
    try {
      const modalTitle = title || 'Export Document';
      if (targetFiles.length === 1) {
        await shareToOtherApps(targetFiles[0]);
      } else {
        await shareMultipleToOtherApps(targetFiles, modalTitle);
      }

      if (onSaveSuccess) {
        onSaveSuccess('Shared successfully');
      }
      onClose();
    } catch (err: any) {
      console.error('Share error:', err);
      alert(`Share failed: ${err?.message || err}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const totalFilesCount = (files && files.length > 0) ? files.length : 1;
  const isImageExport = extension.match(/\.(png|jpe?g|webp)$/i);
  const totalSizeBytes = (files && files.length > 0)
    ? files.reduce((acc, f) => acc + (f.blob?.size || 0), 0)
    : (blob?.size || 0);

  const formatSize = (bytes: number): string => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-sm bg-slate-900 border border-slate-700/80 rounded-3xl p-6 shadow-2xl overflow-hidden text-slate-100 ring-1 ring-cyan-500/20">
        {/* Subtle ambient glow */}
        <div className="absolute top-0 right-0 w-44 h-44 bg-cyan-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-full bg-slate-800/80 hover:bg-slate-700 transition"
          title="Close"
          disabled={isProcessing}
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Icon + Title */}
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-3 bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 text-cyan-400 rounded-2xl border border-cyan-500/30 shrink-0">
            {isImageExport ? <ImageIcon className="w-6 h-6 text-cyan-400" /> : <FileText className="w-6 h-6 text-cyan-400" />}
          </div>
          <div>
            <h3 className="text-base font-extrabold text-white">
              {title || (isImageExport ? 'Export Image' : 'Export Document')}
            </h3>
            <p className="text-[11px] text-slate-400">
              {subtitle || (totalFilesCount > 1 ? `${totalFilesCount} files ready` : `${formatSize(totalSizeBytes)} · ${extension.toUpperCase().replace('.', '')}`)}
            </p>
          </div>
        </div>

        {/* Editable File Name Input Box */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1">
              <Edit3 className="w-3 h-3 text-cyan-400" />
              <span>Name your file:</span>
            </label>
            {totalFilesCount > 1 && (
              <span className="text-[10px] text-cyan-400 font-semibold">
                {totalFilesCount} pages
              </span>
            )}
          </div>
          <div className="relative flex items-center">
            <input
              type="text"
              value={baseName}
              onChange={(e) => setBaseName(e.target.value)}
              placeholder="Enter file name"
              className="w-full bg-slate-950/80 border border-slate-700 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-white pr-16 outline-none transition shadow-inner"
              autoFocus
            />
            <span className="absolute right-2.5 px-2 py-0.5 bg-slate-800 text-cyan-300 font-mono text-[11px] font-bold rounded-md border border-slate-700 select-none">
              {extension}
            </span>
          </div>
          {totalFilesCount > 1 && (
            <p className="text-[10px] text-slate-400 mt-1 pl-1">
              Will be saved as: <span className="text-slate-300 font-mono">{baseName}_Page_1{extension}</span>, etc.
            </p>
          )}
        </div>

        <p className="text-xs text-slate-300 mb-4 leading-relaxed font-medium">
          Choose where you want to save your file:
        </p>

        {/* Action Buttons */}
        <div className="space-y-3">
          {/* Button 1: Save to Phone */}
          <button
            onClick={handleSaveToPhone}
            disabled={isProcessing}
            className="w-full flex items-center justify-between p-3.5 bg-gradient-to-r from-cyan-600 via-teal-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-2xl shadow-lg shadow-cyan-500/25 transition transform active:scale-98 group disabled:opacity-50"
          >
            <div className="flex items-center space-x-3 text-left">
              <div className="p-2 bg-white/15 rounded-xl">
                {isNative ? <Smartphone className="w-5 h-5 text-white" /> : <Save className="w-5 h-5 text-white" />}
              </div>
              <div>
                <div className="text-xs font-extrabold flex items-center space-x-1.5">
                  <span>{isNative ? 'Save to Phone' : 'Save to Device'}</span>
                  <span className="text-[9px] bg-white/20 px-1.5 py-0.2 rounded font-bold uppercase">Direct</span>
                </div>
                <div className="text-[10px] text-cyan-100 font-medium">
                  {isNative ? 'Documents & Downloads folder' : 'Download directly to your device'}
                </div>
              </div>
            </div>
            <span className="text-xs font-extrabold text-white/90 group-hover:translate-x-1 transition shrink-0">→</span>
          </button>

          {/* Button 2: Share / Cloud Drive */}
          <button
            onClick={handleShareToCloud}
            disabled={isProcessing}
            className="w-full flex items-center justify-between p-3.5 bg-slate-800/90 hover:bg-slate-750 text-slate-100 rounded-2xl border border-slate-700/80 hover:border-purple-500/40 transition transform active:scale-98 group disabled:opacity-50"
          >
            <div className="flex items-center space-x-3 text-left">
              <div className="p-2 bg-purple-500/20 text-purple-400 rounded-xl">
                <Cloud className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <div className="text-xs font-extrabold text-slate-100 flex items-center space-x-1.5">
                  <span>Share / Cloud Drive</span>
                </div>
                <div className="text-[10px] text-slate-400 font-medium">
                  Google Drive, OneDrive, WhatsApp, Email
                </div>
              </div>
            </div>
            <span className="text-xs font-bold text-slate-400 group-hover:translate-x-1 transition shrink-0">→</span>
          </button>
        </div>

        {/* Footer Guarantee */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-center space-x-1.5 text-[10px] text-slate-400">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Local offline export · 100% private to your device</span>
        </div>
      </div>
    </div>
  );
};
