import React, { useState, useRef, useEffect } from 'react';
import { 
  ShieldCheck, 
  MousePointer, 
  Type, 
  FormInput, 
  PenTool, 
  RotateCw, 
  Download, 
  Upload, 
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Grid,
  FilePlus,
  Combine,
  CheckSquare,
  XSquare,
  Strikethrough,
  Pencil,
  Trash2,
  Printer,
  Save,
  FolderArchive,
  FolderOpen,
  History,
  FileText,
  FileSpreadsheet,
  Mail,
  Image as ImageIcon,
  Presentation,
  Sparkles,
  Zap,
  Scissors,
  Award,
  BookOpen,
  FileCheck,
  Layers,
  Bot,
  Clock
} from 'lucide-react';
import { ToolMode } from '../types/pdf';
import { getSavedSignatures, deleteSavedSignature, SavedSignature } from '../utils/savedSignatures';
import { getRecentFiles, clearRecentFiles, RecentFileItem } from '../utils/recentFiles';
import { ExportFormatType } from './PremiumExportModal';
import appLogo from '../assets/app_logo.jpg';

interface HeaderToolbarProps {
  onGoToLandingPage?: () => void;
  toolMode: ToolMode;
  setToolMode: (mode: ToolMode) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  onOpenFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onLoadSample: () => void;
  onOpenSignatureModal: (tab?: 'draw' | 'upload') => void;
  onOpenPageManager: () => void;
  onOpenCreateModal: () => void;
  onOpenMergeModal: () => void;
  onOpenSaveMultipleModal: () => void;
  onOpenPremiumExportModal: (format?: ExportFormatType) => void;
  onOpenRecentFile?: (fileItem: RecentFileItem) => void;
  onSelectSavedSignature: (dataUrl: string) => void;
  onRotatePage?: (pageIndex: number) => void;
  onSavePDF: () => void;
  onExportPDF: () => void;
  onPrintPDF: () => void;
  isSaving: boolean;
  isExporting: boolean;
  isPrinting: boolean;
  hasDocument: boolean;
}

export const HeaderToolbar: React.FC<HeaderToolbarProps> = ({
  onGoToLandingPage,
  toolMode,
  setToolMode,
  currentPage,
  totalPages,
  onPageChange,
  zoom,
  onZoomChange,
  onOpenFile,
  onOpenSignatureModal,
  onOpenPageManager,
  onOpenCreateModal,
  onOpenMergeModal,
  onOpenSaveMultipleModal,
  onOpenPremiumExportModal,
  onOpenRecentFile,
  onSelectSavedSignature,
  onRotatePage,
  onSavePDF,
  onExportPDF,
  onPrintPDF,
  isSaving,
  isExporting,
  isPrinting,
  hasDocument,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isFileMenuOpen, setIsFileMenuOpen] = useState(false);
  const [isRecentSubmenuOpen, setIsRecentSubmenuOpen] = useState(false);
  const [isSignDropdownOpen, setIsSignDropdownOpen] = useState(false);
  const [isAnnotateDropdownOpen, setIsAnnotateDropdownOpen] = useState(false);
  const [isMoreToolsOpen, setIsMoreToolsOpen] = useState(false);
  const [savedSigs, setSavedSigs] = useState<SavedSignature[]>([]);
  const [recentFilesList, setRecentFilesList] = useState<RecentFileItem[]>([]);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const annotateDropdownRef = useRef<HTMLDivElement>(null);
  const moreToolsRef = useRef<HTMLDivElement>(null);
  const fileMenuRef = useRef<HTMLDivElement>(null);

  // Sync saved signatures & recent files whenever dropdown opens
  useEffect(() => {
    if (isSignDropdownOpen) {
      setSavedSigs(getSavedSignatures());
    }
  }, [isSignDropdownOpen]);

  useEffect(() => {
    if (isFileMenuOpen) {
      setRecentFilesList(getRecentFiles());
    }
  }, [isFileMenuOpen]);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsSignDropdownOpen(false);
      }
      if (annotateDropdownRef.current && !annotateDropdownRef.current.contains(e.target as Node)) {
        setIsAnnotateDropdownOpen(false);
      }
      if (fileMenuRef.current && !fileMenuRef.current.contains(e.target as Node)) {
        setIsFileMenuOpen(false);
        setIsRecentSubmenuOpen(false);
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToolSelect = (mode: ToolMode) => {
    setToolMode(mode);
  };

  const isAnnotateActive = ['draw', 'strikeout', 'checkmark', 'crossmark', 'form'].includes(toolMode);

  const handleDeleteSavedSig = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updated = deleteSavedSignature(id);
    setSavedSigs(updated);
  };

  const handlePickSavedSig = (dataUrl: string) => {
    onSelectSavedSignature(dataUrl);
    setIsSignDropdownOpen(false);
  };

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md text-slate-100 flex items-center justify-between px-2 sm:px-4 sticky top-0 z-30 select-none">
      {/* Brand & File Menu */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl overflow-hidden shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-500/30 flex items-center justify-center bg-slate-900 flex-shrink-0">
          <img src={appLogo} alt="PDF Engine Studio Logo" className="w-full h-full object-cover" />
        </div>
        <div>
          <div className="flex items-center space-x-1.5 sm:space-x-2">
            <h1
              onClick={onGoToLandingPage}
              className="font-bold text-xs sm:text-base tracking-tight text-white hover:text-cyan-400 cursor-pointer transition truncate max-w-[100px] sm:max-w-none"
              title="Return to Landing Page"
            >
              PDF Engine
            </h1>

            {/* File Menu Dropdown */}
            <div className="relative" ref={fileMenuRef}>
              <button
                onClick={() => setIsFileMenuOpen(!isFileMenuOpen)}
                className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 flex items-center space-x-1 transition shadow-sm"
              >
                <span>File</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {isFileMenuOpen && (
                <div className="absolute top-full left-0 mt-2 w-60 sm:w-64 bg-slate-900 border border-slate-700/90 rounded-2xl shadow-2xl p-2 z-50 flex flex-col space-y-1 text-xs">
                  {/* File Operations */}
                  <button
                    onClick={() => {
                      setIsFileMenuOpen(false);
                      onOpenCreateModal();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 text-left font-semibold text-white hover:bg-slate-800 rounded-xl transition"
                  >
                    <div className="flex items-center space-x-2.5">
                      <FilePlus className="w-4 h-4 text-cyan-400" />
                      <span>New Blank PDF...</span>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setIsFileMenuOpen(false);
                      onOpenMergeModal();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 text-left font-semibold text-white hover:bg-slate-800 rounded-xl transition"
                  >
                    <div className="flex items-center space-x-2.5">
                      <Combine className="w-4 h-4 text-purple-400" />
                      <span>Combine / Merge PDFs...</span>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setIsFileMenuOpen(false);
                      fileInputRef.current?.click();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 text-left font-semibold text-white hover:bg-slate-800 rounded-xl transition"
                  >
                    <div className="flex items-center space-x-2.5">
                      <FolderOpen className="w-4 h-4 text-blue-400" />
                      <span>Open PDF...</span>
                    </div>
                    <span className="text-[10px] text-slate-500">Ctrl+O</span>
                  </button>

                  {/* Open Recent Submenu Trigger */}
                  <div
                    className="relative"
                    onMouseEnter={() => setIsRecentSubmenuOpen(true)}
                    onMouseLeave={() => setIsRecentSubmenuOpen(false)}
                  >
                    <button
                      onClick={() => setIsRecentSubmenuOpen(!isRecentSubmenuOpen)}
                      className="w-full flex items-center justify-between px-3 py-2 text-left font-semibold text-white hover:bg-slate-800 rounded-xl transition"
                    >
                      <div className="flex items-center space-x-2.5">
                        <History className="w-4 h-4 text-amber-400" />
                        <span>Open Recent</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    </button>

                    {/* Open Recent Submenu */}
                    {isRecentSubmenuOpen && (
                      <div className="absolute top-0 left-full ml-1 w-56 sm:w-64 bg-slate-900 border border-slate-700/90 rounded-2xl shadow-2xl p-2 z-50 flex flex-col space-y-1">
                        <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between border-b border-slate-800 pb-1.5 mb-1">
                          <span>Recent Files</span>
                          {recentFilesList.length > 0 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                clearRecentFiles();
                                setRecentFilesList([]);
                              }}
                              className="text-rose-400 hover:underline"
                            >
                              Clear
                            </button>
                          )}
                        </div>

                        {recentFilesList.length === 0 ? (
                          <p className="text-xs text-slate-500 px-3 py-2 italic">No recent files opened yet</p>
                        ) : (
                          recentFilesList.map((item) => (
                            <button
                              key={item.id}
                              onClick={() => {
                                setIsFileMenuOpen(false);
                                setIsRecentSubmenuOpen(false);
                                if (onOpenRecentFile) onOpenRecentFile(item);
                              }}
                              className="w-full text-left px-3 py-2 hover:bg-slate-800 rounded-xl transition flex flex-col"
                            >
                              <span className="text-xs font-semibold text-slate-200 truncate">{item.name}</span>
                              <span className="text-[10px] text-slate-500 flex items-center mt-0.5">
                                <Clock className="w-3 h-3 mr-1" />
                                {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  <div className="my-1 border-t border-slate-800" />

                  {/* Save Actions */}
                  <button
                    disabled={!hasDocument || isSaving}
                    onClick={() => {
                      setIsFileMenuOpen(false);
                      onSavePDF();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 text-left font-semibold text-white hover:bg-slate-800 rounded-xl transition disabled:opacity-40"
                  >
                    <div className="flex items-center space-x-2.5">
                      <Save className="w-4 h-4 text-emerald-400" />
                      <span>Save</span>
                    </div>
                    <span className="text-[10px] text-slate-500">Ctrl+S</span>
                  </button>

                  <button
                    disabled={!hasDocument || isExporting}
                    onClick={() => {
                      setIsFileMenuOpen(false);
                      onExportPDF();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 text-left font-semibold text-white hover:bg-slate-800 rounded-xl transition disabled:opacity-40"
                  >
                    <div className="flex items-center space-x-2.5">
                      <Download className="w-4 h-4 text-cyan-400" />
                      <span>Save As PDF...</span>
                    </div>
                  </button>

                  <button
                    disabled={!hasDocument}
                    onClick={() => {
                      setIsFileMenuOpen(false);
                      onOpenSaveMultipleModal();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 text-left font-semibold text-white hover:bg-slate-800 rounded-xl transition disabled:opacity-40"
                  >
                    <div className="flex items-center space-x-2.5">
                      <FolderArchive className="w-4 h-4 text-purple-400" />
                      <span>Save Multiple PDFs (ZIP)...</span>
                    </div>
                  </button>

                  <button
                    disabled={!hasDocument || isPrinting}
                    onClick={() => {
                      setIsFileMenuOpen(false);
                      onPrintPDF();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 text-left font-semibold text-white hover:bg-slate-800 rounded-xl transition disabled:opacity-40"
                  >
                    <div className="flex items-center space-x-2.5">
                      <Printer className="w-4 h-4 text-indigo-400" />
                      <span>Print PDF...</span>
                    </div>
                  </button>

                  <div className="my-1 border-t border-slate-800" />

                  {/* Premium Export Suite Section */}
                  <div className="px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-cyan-400 flex items-center space-x-1">
                    <Sparkles className="w-3 h-3 text-cyan-400" />
                    <span>Premium Exports (PRO)</span>
                  </div>

                  <button
                    disabled={!hasDocument}
                    onClick={() => {
                      setIsFileMenuOpen(false);
                      onOpenPremiumExportModal('docx');
                    }}
                    className="w-full flex items-center space-x-2.5 px-3 py-2 text-left font-semibold text-white hover:bg-slate-800 rounded-xl transition disabled:opacity-40"
                  >
                    <FileText className="w-4 h-4 text-blue-400" />
                    <span>Export to Word (.docx)...</span>
                  </button>

                  <button
                    disabled={!hasDocument}
                    onClick={() => {
                      setIsFileMenuOpen(false);
                      onOpenPremiumExportModal('xlsx');
                    }}
                    className="w-full flex items-center space-x-2.5 px-3 py-2 text-left font-semibold text-white hover:bg-slate-800 rounded-xl transition disabled:opacity-40"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                    <span>Export to Excel (.xlsx)...</span>
                  </button>

                  <button
                    disabled={!hasDocument}
                    onClick={() => {
                      setIsFileMenuOpen(false);
                      onOpenPremiumExportModal('png');
                    }}
                    className="w-full flex items-center space-x-2.5 px-3 py-2 text-left font-semibold text-white hover:bg-slate-800 rounded-xl transition disabled:opacity-40"
                  >
                    <ImageIcon className="w-4 h-4 text-purple-400" />
                    <span>Export to Images (JPG, PNG, TIFF)...</span>
                  </button>

                  <button
                    disabled={!hasDocument}
                    onClick={() => {
                      setIsFileMenuOpen(false);
                      onOpenPremiumExportModal('pptx');
                    }}
                    className="w-full flex items-center space-x-2.5 px-3 py-2 text-left font-semibold text-white hover:bg-slate-800 rounded-xl transition disabled:opacity-40"
                  >
                    <Presentation className="w-4 h-4 text-amber-400" />
                    <span>Export to PowerPoint (.pptx)...</span>
                  </button>

                  <div className="my-1 border-t border-slate-800" />

                  <a
                    href="mailto:support@isasecuredpdf.com"
                    onClick={() => setIsFileMenuOpen(false)}
                    className="w-full flex items-center space-x-2.5 px-3 py-2 text-left font-semibold text-cyan-300 hover:bg-slate-800 rounded-xl transition"
                  >
                    <Mail className="w-4 h-4 text-cyan-400" />
                    <span>Support: support@isasecuredpdf.com</span>
                  </a>
                </div>
              )}
            </div>

            {onGoToLandingPage && (
              <button
                onClick={onGoToLandingPage}
                className="hidden sm:inline-block px-2 py-0.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                title="Return to Landing Page"
              >
                Home
              </button>
            )}

            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1" />
              100% Offline
            </span>
          </div>
          <p className="hidden lg:block text-xs text-slate-400">Zero Server Data Transmission Guarantee</p>
        </div>
      </div>

      {/* Center Toolbar Tool Modes */}
      {hasDocument && (
        <div className="flex items-center space-x-1 sm:space-x-1.5 bg-slate-950/80 p-1 sm:p-1.5 rounded-xl border border-slate-800/80 shadow-inner relative flex-shrink-0">
          {/* Select Mode */}
          <button
            onClick={() => handleToolSelect('select')}
            title="Select & Navigate (S)"
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              toolMode === 'select'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <MousePointer className="w-3.5 h-3.5 text-cyan-400" />
            <span>Select</span>
          </button>

          {/* Edit / Redact Text */}
          <button
            onClick={() => handleToolSelect('text')}
            title="Redact & Overwrite Text (T)"
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              toolMode === 'text'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Type className="w-3.5 h-3.5 text-blue-400" />
            <span>Edit / Redact</span>
          </button>

          {/* Annotate & Markups Dropdown */}
          <div className="relative" ref={annotateDropdownRef}>
            <button
              onClick={() => setIsAnnotateDropdownOpen(!isAnnotateDropdownOpen)}
              title="Annotations, Markups, Stamps & Forms"
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                isAnnotateActive || isAnnotateDropdownOpen
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              {toolMode === 'draw' && <Pencil className="w-3.5 h-3.5 text-yellow-400" />}
              {toolMode === 'strikeout' && <Strikethrough className="w-3.5 h-3.5 text-rose-400" />}
              {toolMode === 'checkmark' && <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />}
              {toolMode === 'crossmark' && <XSquare className="w-3.5 h-3.5 text-rose-400" />}
              {toolMode === 'form' && <FormInput className="w-3.5 h-3.5 text-cyan-400" />}
              {!isAnnotateActive && <Pencil className="w-3.5 h-3.5 text-cyan-400" />}
              <span>
                {toolMode === 'draw'
                  ? 'Draw'
                  : toolMode === 'strikeout'
                  ? 'Cross Out'
                  : toolMode === 'checkmark'
                  ? 'Check ✓'
                  : toolMode === 'crossmark'
                  ? 'Cross ✕'
                  : toolMode === 'form'
                  ? 'Fill Form'
                  : 'Annotate'}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5" />
            </button>

            {/* Annotate Dropdown Popover */}
            {isAnnotateDropdownOpen && (
              <div className="absolute top-full left-0 mt-2 w-60 bg-slate-900 border border-slate-700/90 rounded-2xl shadow-2xl p-2 z-50 flex flex-col space-y-1">
                <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-1 mb-1">
                  Markups & Stamps
                </div>

                <button
                  onClick={() => {
                    handleToolSelect('draw');
                    setIsAnnotateDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-left text-xs font-semibold rounded-xl transition ${
                    toolMode === 'draw' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <Pencil className="w-4 h-4 text-yellow-400" />
                    <span>Freehand Draw & Highlight</span>
                  </div>
                  {toolMode === 'draw' && <span className="w-2 h-2 rounded-full bg-cyan-400" />}
                </button>

                <button
                  onClick={() => {
                    handleToolSelect('strikeout');
                    setIsAnnotateDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-left text-xs font-semibold rounded-xl transition ${
                    toolMode === 'strikeout' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <Strikethrough className="w-4 h-4 text-rose-400" />
                    <span>Cross Out (Strikeout)</span>
                  </div>
                  {toolMode === 'strikeout' && <span className="w-2 h-2 rounded-full bg-cyan-400" />}
                </button>

                <button
                  onClick={() => {
                    handleToolSelect('checkmark');
                    setIsAnnotateDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-left text-xs font-semibold rounded-xl transition ${
                    toolMode === 'checkmark' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <CheckSquare className="w-4 h-4 text-emerald-400" />
                    <span>Stamp Checkmark (✓)</span>
                  </div>
                  {toolMode === 'checkmark' && <span className="w-2 h-2 rounded-full bg-cyan-400" />}
                </button>

                <button
                  onClick={() => {
                    handleToolSelect('crossmark');
                    setIsAnnotateDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-left text-xs font-semibold rounded-xl transition ${
                    toolMode === 'crossmark' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <XSquare className="w-4 h-4 text-rose-400" />
                    <span>Stamp Crossmark (✕)</span>
                  </div>
                  {toolMode === 'crossmark' && <span className="w-2 h-2 rounded-full bg-cyan-400" />}
                </button>
              </div>
            )}
          </div>

          {/* Sign Dropdown Button */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsSignDropdownOpen(!isSignDropdownOpen)}
              title="Signature Options & Saved Signatures"
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                toolMode === 'sign' || isSignDropdownOpen
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <PenTool className="w-3.5 h-3.5 text-cyan-400" />
              <span>Sign</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {/* Dropdown Popover */}
            {isSignDropdownOpen && (
              <div className="absolute top-full left-0 mt-2 w-56 sm:w-64 bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl p-2 z-50 flex flex-col space-y-2">
                <button
                  onClick={() => {
                    setIsSignDropdownOpen(false);
                    onOpenSignatureModal('draw');
                  }}
                  className="w-full flex items-center space-x-2.5 px-3 py-2 text-left text-xs font-semibold text-white hover:bg-slate-800 rounded-lg transition"
                >
                  <PenTool className="w-4 h-4 text-cyan-400" />
                  <span>Draw New Signature...</span>
                </button>

                <button
                  onClick={() => {
                    setIsSignDropdownOpen(false);
                    onOpenSignatureModal('upload');
                  }}
                  className="w-full flex items-center space-x-2.5 px-3 py-2 text-left text-xs font-semibold text-white hover:bg-slate-800 rounded-lg transition"
                >
                  <Upload className="w-4 h-4 text-cyan-400" />
                  <span>Upload Image (JPG/PNG)...</span>
                </button>

                {/* Saved Signatures Section */}
                <div className="pt-2 border-t border-slate-800">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-1.5">
                    Saved Signatures ({savedSigs.length})
                  </p>

                  {savedSigs.length === 0 ? (
                    <p className="text-xs text-slate-500 px-3 py-2 italic">
                      No saved signatures yet. Create one with "Save for future reuse" checked.
                    </p>
                  ) : (
                    <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                      {savedSigs.map((sig) => (
                        <div
                          key={sig.id}
                          onClick={() => handlePickSavedSig(sig.dataUrl)}
                          className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-700 hover:border-cyan-500 cursor-pointer group shadow-sm transition"
                        >
                          <img src={sig.dataUrl} alt="Saved Sig" className="h-8 max-w-[150px] object-contain" />
                          <button
                            onClick={(e) => handleDeleteSavedSig(e, sig.id)}
                            className="p-1 text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition"
                            title="Delete Saved Signature"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Rotate Current Page */}
          <button
            onClick={() => {
              if (onRotatePage) {
                // Rotate active page (currentPage is 1-indexed)
                onRotatePage(currentPage - 1);
              }
            }}
            title="Rotate Current Page 90° Clockwise"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-all"
          >
            <RotateCw className="w-3.5 h-3.5 text-cyan-400" />
            <span>Rotate ↻</span>
          </button>

          {/* Manage Pages / Reorder */}
          <button
            onClick={onOpenPageManager}
            title="Manage, Split & Reorder Pages"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-all"
          >
            <Grid className="w-3.5 h-3.5 text-purple-400" />
            <span>Pages</span>
          </button>

          {/* Expanded Feature Modules Dropdown */}
          <div className="relative" ref={moreToolsRef}>
            <button
              onClick={() => setIsMoreToolsOpen(!isMoreToolsOpen)}
              title="More Feature Modules (E-Sig, Templates, Watermark, AI)"
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                isMoreToolsOpen
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-yellow-400 animate-pulse" />
              <span>Tools</span>
              <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5" />
            </button>

            {/* Feature Modules Popover */}
            {isMoreToolsOpen && (
              <div className="absolute top-full right-0 mt-2 w-72 bg-slate-900 border border-slate-700/90 rounded-2xl shadow-2xl p-2 z-50 flex flex-col space-y-1">
                <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-1 mb-1">
                  Feature Modules
                </div>

                {/* 1. Request E-Signature */}
                <button
                  onClick={() => {
                    setIsMoreToolsOpen(false);
                    onOpenSignatureModal('draw');
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 text-left text-xs font-semibold rounded-xl text-slate-200 hover:bg-slate-800 transition group"
                >
                  <div className="flex items-center space-x-2.5">
                    <FileCheck className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition" />
                    <div>
                      <div className="font-bold text-white">Request E-Signature</div>
                      <div className="text-[10px] text-slate-400">Send contract for digital sign-off</div>
                    </div>
                  </div>
                  <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 bg-cyan-500/10 text-cyan-400 rounded-full border border-cyan-500/30">Upcoming</span>
                </button>

                {/* 2. Split & Extract Pages */}
                <button
                  onClick={() => {
                    setIsMoreToolsOpen(false);
                    onOpenPageManager();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 text-left text-xs font-semibold rounded-xl text-slate-200 hover:bg-slate-800 transition group"
                >
                  <div className="flex items-center space-x-2.5">
                    <Scissors className="w-4 h-4 text-purple-400 group-hover:scale-110 transition" />
                    <div>
                      <div className="font-bold text-white">Split & Extract Pages</div>
                      <div className="text-[10px] text-slate-400">Extract ranges into new PDFs</div>
                    </div>
                  </div>
                  <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 bg-purple-500/10 text-purple-400 rounded-full border border-purple-500/30">Active</span>
                </button>

                {/* 3. Template Library (NDAs, Invoices, Letters) */}
                <button
                  onClick={() => {
                    setIsMoreToolsOpen(false);
                    onOpenCreateModal();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 text-left text-xs font-semibold rounded-xl text-slate-200 hover:bg-slate-800 transition group"
                >
                  <div className="flex items-center space-x-2.5">
                    <BookOpen className="w-4 h-4 text-amber-400 group-hover:scale-110 transition" />
                    <div>
                      <div className="font-bold text-white">Template Library</div>
                      <div className="text-[10px] text-slate-400">NDAs, Invoices, Contracts</div>
                    </div>
                  </div>
                  <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 bg-amber-500/10 text-amber-400 rounded-full border border-amber-500/30">Templates</span>
                </button>

                {/* 4. Apply Watermark / Dynamic Stamps */}
                <button
                  onClick={() => {
                    setIsMoreToolsOpen(false);
                    handleToolSelect('draw');
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 text-left text-xs font-semibold rounded-xl text-slate-200 hover:bg-slate-800 transition group"
                >
                  <div className="flex items-center space-x-2.5">
                    <Award className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition" />
                    <div>
                      <div className="font-bold text-white">Apply Watermark & Stamps</div>
                      <div className="text-[10px] text-slate-400">CONFIDENTIAL, APPROVED stamps</div>
                    </div>
                  </div>
                  <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/30">Watermark</span>
                </button>

                {/* 5. AI Assistant (Letter & Document Generator) */}
                <button
                  onClick={() => {
                    setIsMoreToolsOpen(false);
                    alert('AI Document Assistant: Powered by 100% Client-Side Local Model execution!');
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 text-left text-xs font-semibold rounded-xl text-slate-200 hover:bg-slate-800 transition group border border-cyan-500/20 bg-cyan-950/20"
                >
                  <div className="flex items-center space-x-2.5">
                    <Bot className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition" />
                    <div>
                      <div className="font-bold text-white flex items-center space-x-1">
                        <span>AI Assistant</span>
                        <Sparkles className="w-3 h-3 text-yellow-400" />
                      </div>
                      <div className="text-[10px] text-slate-400">Letter & Document Generator</div>
                    </div>
                  </div>
                  <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-full shadow">AI Pro</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Right Controls & Actions */}
      <div className="flex items-center space-x-1.5 sm:space-x-3">
        {hasDocument && (
          <>
            {/* Page Navigation */}
            <div className="flex items-center bg-slate-950/60 border border-slate-800 rounded-lg p-0.5 sm:p-1 space-x-0.5 sm:space-x-1 text-xs">
              <button
                disabled={currentPage <= 1}
                onClick={() => onPageChange(currentPage - 1)}
                className="p-1 text-slate-400 hover:text-white disabled:opacity-30 rounded hover:bg-slate-800 transition"
              >
                <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>

              <span className="font-mono text-slate-300 px-1 sm:px-2 font-semibold text-[11px] sm:text-xs">
                {currentPage} / {totalPages}
              </span>

              <button
                disabled={currentPage >= totalPages}
                onClick={() => onPageChange(currentPage + 1)}
                className="p-1 text-slate-400 hover:text-white disabled:opacity-30 rounded hover:bg-slate-800 transition"
              >
                <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </div>

            {/* Zoom Controls (Hidden on narrow mobile < 640px) */}
            <div className="hidden sm:flex items-center bg-slate-950/60 border border-slate-800 rounded-lg p-1 space-x-1">
              <button
                onClick={() => onZoomChange(Math.max(0.5, zoom - 0.15))}
                className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>

              <span className="text-xs font-semibold px-1 text-slate-300 w-12 text-center">
                {Math.round(zoom * 100)}%
              </span>

              <button
                onClick={() => onZoomChange(Math.min(2.5, zoom + 0.15))}
                className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>

            {/* Page Grid Manager */}
            <button
              onClick={onOpenPageManager}
              title="Organize Pages Grid"
              className="p-1.5 sm:p-2 text-slate-400 hover:text-white bg-slate-950/60 border border-slate-800 rounded-lg hover:bg-slate-800 transition"
            >
              <Grid className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </>
        )}

        {/* Document Action Buttons: Primary Export CTA */}
        {hasDocument && (
          <div className="flex items-center space-x-2">
            <button
              onClick={onExportPDF}
              disabled={isExporting}
              title="Export & Download PDF File"
              className="flex items-center space-x-1 sm:space-x-2 px-2.5 py-1.5 sm:px-4 sm:py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-cyan-500/25 border border-cyan-400/30 transition transform active:scale-95 disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">{isExporting ? 'Exporting...' : 'Export PDF'}</span>
              <span className="sm:hidden">{isExporting ? '...' : 'Export'}</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
