import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  XCircle,
  Clock,
  Highlighter,
  RotateCcw,
  Eye,
  EyeOff,
  Eraser,
  Underline,
  Square,
  Circle,
  Minus,
  Lock,
  Unlock,
  Camera,
  Smartphone,
  Apple
} from 'lucide-react';
import { ToolMode } from '../types/pdf';
import { getSavedSignatures, deleteSavedSignature, SavedSignature } from '../utils/savedSignatures';
import { getRecentFiles, clearRecentFiles, RecentFileItem } from '../utils/recentFiles';
import { ExportFormatType } from './PremiumExportModal';
import appLogo from '../assets/app_logo.jpg';

interface HeaderToolbarProps {
  onGoToLandingPage?: () => void;
  onCloseDocument?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  toolMode: ToolMode;
  setToolMode: (mode: ToolMode) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  onFitToWidth?: () => void;
  onOpenFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onLoadSample: () => void;
  onOpenSignatureModal: (tab?: 'draw' | 'upload') => void;
  onOpenWatermarkModal?: () => void;
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
  textFontSize?: number;
  setTextFontSize?: (size: number) => void;
  textFontFamily?: string;
  setTextFontFamily?: (fontFamily: string) => void;
  textColor?: string;
  setTextColor?: (color: string) => void;
  textIsRedact?: boolean;
  setTextIsRedact?: (isRedact: boolean) => void;
  textIsUnderline?: boolean;
  setTextIsUnderline?: (isUnderline: boolean) => void;
  shapeStrokeColor?: string;
  setShapeStrokeColor?: (color: string) => void;
  shapeFillColor?: string;
  setShapeFillColor?: (color: string) => void;
  shapeStrokeWidth?: number;
  setShapeStrokeWidth?: (width: number) => void;
  onAddImageStamp?: (img: Omit<import('../types/pdf').ImageStampAnnotation, 'id'>) => void;
  onOpenPasswordModal?: (mode: 'protect' | 'unlock') => void;
  onOpenCompressModal?: () => void;
  onOpenScanModal?: () => void;
  onOpenDesktopDownloadModal?: () => void;
  isProActive?: boolean;
  onOpenCheckout?: () => void;
  activeTheme?: import('../utils/themeManager').ThemeConfig;
}

export const HeaderToolbar: React.FC<HeaderToolbarProps> = ({
  activeTheme,
  onGoToLandingPage,
  onCloseDocument,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  toolMode,
  setToolMode,
  currentPage,
  totalPages,
  onPageChange,
  zoom,
  onZoomChange,
  onOpenFile,
  onLoadSample,
  onOpenSignatureModal,
  onOpenWatermarkModal,
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
  isSaving = false,
  isExporting = false,
  isPrinting = false,
  hasDocument = false,
  textFontSize = 14,
  setTextFontSize,
  textFontFamily,
  setTextFontFamily,
  textColor = '#000000',
  setTextColor,
  textIsRedact = false,
  setTextIsRedact,
  textIsUnderline,
  setTextIsUnderline,
  shapeStrokeColor,
  setShapeStrokeColor,
  shapeFillColor,
  setShapeFillColor,
  shapeStrokeWidth,
  setShapeStrokeWidth,
  onAddImageStamp,
  onOpenPasswordModal,
  onOpenCompressModal,
  onOpenScanModal,
  onOpenDesktopDownloadModal,
  isProActive = false,
  onOpenCheckout,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageFileInputRef = useRef<HTMLInputElement>(null);
  const [isFileMenuOpen, setIsFileMenuOpen] = useState(false);
  const [isRecentSubmenuOpen, setIsRecentSubmenuOpen] = useState(false);
  const [isTextDropdownOpen, setIsTextDropdownOpen] = useState(false);
  const [isSignDropdownOpen, setIsSignDropdownOpen] = useState(false);
  const [isAnnotateDropdownOpen, setIsAnnotateDropdownOpen] = useState(false);
  const [isSecurityDropdownOpen, setIsSecurityDropdownOpen] = useState(false);
  const [isMoreToolsOpen, setIsMoreToolsOpen] = useState(false);
  const [savedSigs, setSavedSigs] = useState<SavedSignature[]>([]);
  const [recentFilesList, setRecentFilesList] = useState<RecentFileItem[]>([]);
  const [popoverPos, setPopoverPos] = useState<{ name: string; left: number; top: number }>({ name: '', left: 0, top: 0 });

  const handleImageFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const dataUrl = evt.target?.result as string;
      if (!dataUrl) return;

      const img = new Image();
      img.onload = () => {
        const aspect = img.width / img.height;
        let initW = 160;
        let initH = Math.round(160 / aspect);
        if (initH > 200) {
          initH = 200;
          initW = Math.round(200 * aspect);
        }

        if (onAddImageStamp) {
          onAddImageStamp({
            pageIndex: Math.max(0, currentPage - 1),
            x: 100,
            y: 150,
            width: initW,
            height: initH,
            dataUrl,
            imageType: file.type.includes('png') ? 'png' : 'jpeg',
          });
        }
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };
  
  const textDropdownRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const annotateDropdownRef = useRef<HTMLDivElement>(null);
  const securityDropdownRef = useRef<HTMLDivElement>(null);
  const moreToolsRef = useRef<HTMLDivElement>(null);
  const fileMenuRef = useRef<HTMLDivElement>(null);

  const toggleDropdown = (
    name: 'text' | 'annotate' | 'sign' | 'security' | 'tools' | 'file',
    ref: React.RefObject<HTMLDivElement>,
    popoverWidth = 256
  ) => {
    if (popoverPos.name === name) {
      setPopoverPos({ name: '', left: 0, top: 0 });
      setIsTextDropdownOpen(false);
      setIsAnnotateDropdownOpen(false);
      setIsSignDropdownOpen(false);
      setIsSecurityDropdownOpen(false);
      setIsMoreToolsOpen(false);
      setIsFileMenuOpen(false);
      return;
    }

    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      const idealLeft = rect.left + rect.width / 2 - popoverWidth / 2;
      const left = Math.max(8, Math.min(window.innerWidth - popoverWidth - 8, idealLeft));
      const top = rect.bottom + 6;
      setPopoverPos({ name, left, top });
    }

    setIsTextDropdownOpen(name === 'text');
    setIsAnnotateDropdownOpen(name === 'annotate');
    setIsSignDropdownOpen(name === 'sign');
    setIsSecurityDropdownOpen(name === 'security');
    setIsMoreToolsOpen(name === 'tools');
    setIsFileMenuOpen(name === 'file');
  };

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

  // Click/Touch outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const rawTarget = e.target as Node | null;
      const target = (rawTarget instanceof Element ? rawTarget : rawTarget?.parentElement) as HTMLElement | null;
      const isClickOnPopover = target?.closest('[data-popover="true"]');
      const isClickInsideTrigger =
        (textDropdownRef.current && textDropdownRef.current.contains(rawTarget)) ||
        (annotateDropdownRef.current && annotateDropdownRef.current.contains(rawTarget)) ||
        (dropdownRef.current && dropdownRef.current.contains(rawTarget)) ||
        (securityDropdownRef.current && securityDropdownRef.current.contains(rawTarget)) ||
        (moreToolsRef.current && moreToolsRef.current.contains(rawTarget)) ||
        (fileMenuRef.current && fileMenuRef.current.contains(rawTarget));

      if (!isClickOnPopover && !isClickInsideTrigger) {
        setPopoverPos({ name: '', left: 0, top: 0 });
        setIsTextDropdownOpen(false);
        setIsAnnotateDropdownOpen(false);
        setIsSignDropdownOpen(false);
        setIsSecurityDropdownOpen(false);
        setIsMoreToolsOpen(false);
        setIsFileMenuOpen(false);
        setIsRecentSubmenuOpen(false);
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('touchstart', handleClickOutside);
    return () => {
      window.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const handleToolSelect = (mode: ToolMode) => {
    setToolMode(mode);
  };

  const isAnnotateActive = ['draw', 'highlight', 'eraser', 'strikeout', 'checkmark', 'crossmark', 'form', 'line', 'rectangle', 'oval'].includes(toolMode);

  const handleDeleteSavedSig = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updated = deleteSavedSignature(id);
    setSavedSigs(updated);
  };

  const handlePickSavedSig = (dataUrl: string) => {
    onSelectSavedSignature(dataUrl);
    setIsSignDropdownOpen(false);
  };

  const isLight = activeTheme?.id === 'light_pearl' || activeTheme?.id === 'gold_sunlight';

  return (
    <header
      style={{ paddingTop: 'max(env(safe-area-inset-top, 12px), 12px)' }}
      className={`border-b ${isLight ? 'border-slate-300 bg-white/95 text-slate-900 shadow-md' : 'border-slate-800 bg-slate-900/95 text-slate-100'} backdrop-blur-md flex flex-col lg:flex-row lg:items-center justify-between px-2 sm:px-4 pb-2 lg:pb-0 lg:h-16 sticky top-0 z-30 select-none gap-2 lg:gap-0 transition-colors duration-500`}
    >
      <div className="flex items-center justify-between w-full lg:w-auto">
        {/* Brand & File Menu */}
        <div className="flex items-center space-x-2 sm:space-x-3">
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl overflow-hidden shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-500/30 flex items-center justify-center bg-slate-900 flex-shrink-0">
          <img src={appLogo} alt="PDF Engine Studio Logo" className="w-full h-full object-cover" />
        </div>
        <div>
          <div className="flex items-center space-x-3 gap-3">
            <h1
              onClick={onGoToLandingPage}
              className={`font-bold text-xs sm:text-base tracking-tight ${isLight ? 'text-slate-900 hover:text-cyan-700' : 'text-white hover:text-cyan-400'} cursor-pointer transition truncate max-w-[100px] sm:max-w-none`}
              title="Return to Landing Page"
            >
              PDF Engine
            </h1>

            {/* File Menu Dropdown */}
            <div className="relative ml-3" ref={fileMenuRef}>
              <button
                onClick={() => toggleDropdown('file', fileMenuRef, 208)}
                className="px-2.5 py-1 sm:px-3 sm:py-1 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 flex items-center space-x-1 transition shadow-sm"
              >
                <span>File</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {isFileMenuOpen && popoverPos.name === 'file' && createPortal(
                <div
                  data-popover="true"
                  style={{
                    position: 'fixed',
                    left: `${popoverPos.left}px`,
                    top: `${popoverPos.top}px`,
                    zIndex: 999999,
                  }}
                  className="w-48 sm:w-52 bg-slate-950 border border-slate-700 rounded-xl shadow-2xl p-1.5 flex flex-col space-y-1 text-xs opacity-100 ring-1 ring-cyan-500/30 text-slate-100"
                >
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

                  <button
                    onClick={() => {
                      setIsFileMenuOpen(false);
                      if (onOpenDesktopDownloadModal) onOpenDesktopDownloadModal();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 text-left font-semibold text-white hover:bg-slate-800 rounded-xl transition"
                  >
                    <div className="flex items-center space-x-2.5">
                      <Smartphone className="w-4 h-4 text-cyan-400" />
                      <span>iOS & Mobile App Options...</span>
                    </div>
                    <span className="text-[9px] font-extrabold text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20">iOS / PWA</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsFileMenuOpen(false);
                      if (onOpenDesktopDownloadModal) onOpenDesktopDownloadModal();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 text-left font-semibold text-white hover:bg-slate-800 rounded-xl transition"
                  >
                    <div className="flex items-center space-x-2.5">
                      <Download className="w-4 h-4 text-indigo-400" />
                      <span>Download Desktop Apps (.zip)...</span>
                    </div>
                    <span className="text-[9px] font-extrabold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">PRO SUB</span>
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
                      if (!isProActive) {
                        if (onOpenCheckout) onOpenCheckout();
                        return;
                      }
                      onOpenSaveMultipleModal();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 text-left font-semibold text-white hover:bg-slate-800 rounded-xl transition disabled:opacity-40"
                  >
                    <div className="flex items-center space-x-2.5">
                      <FolderArchive className="w-4 h-4 text-purple-400" />
                      <span>Save Multiple PDFs (ZIP)... {!isProActive && <span className="text-[9px] font-extrabold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 ml-1">PRO</span>}</span>
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

                  <button
                    disabled={!hasDocument}
                    onClick={() => {
                      setIsFileMenuOpen(false);
                      if (onCloseDocument) onCloseDocument();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 text-left font-semibold text-rose-400 hover:bg-rose-950/40 rounded-xl transition disabled:opacity-40 group"
                  >
                    <div className="flex items-center space-x-2.5">
                      <XCircle className="w-4 h-4 text-rose-400 group-hover:scale-110 transition" />
                      <span>Close Document</span>
                    </div>
                    <span className="text-[10px] text-rose-400/70">Discard/Exit</span>
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
                </div>,
                document.body
              )}
            </div>

            {onGoToLandingPage && (
              <>
                <input type="file" ref={fileInputRef} onChange={onOpenFile} accept="application/pdf" className="hidden" />
                <input type="file" ref={imageFileInputRef} onChange={handleImageFileSelect} accept="image/png, image/jpeg, image/jpg" className="hidden" />
                <button
                  onClick={onGoToLandingPage}
                  className="hidden sm:inline-block px-2 py-0.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                  title="Return to Landing Page"
                >
                  Home
                </button>
              </>
            )}

            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1" />
              100% Offline
            </span>
          </div>
          <p className="hidden xl:block text-xs text-slate-400">Zero Server Data Transmission Guarantee</p>
        </div>

        {/* Mobile-Only Action Buttons in Row 1 */}
        {hasDocument && (
          <div className="flex lg:hidden items-center space-x-1.5 shrink-0 ml-auto">
            <button
              onClick={onPrintPDF}
              disabled={isPrinting}
              title="Print Document"
              className="flex items-center space-x-1 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-white text-xs font-bold rounded-lg border border-slate-700 transition active:scale-95 disabled:opacity-50"
            >
              <Printer className="w-3.5 h-3.5 text-indigo-400" />
              <span>{isPrinting ? '...' : 'Print'}</span>
            </button>

            <button
              onClick={onExportPDF}
              disabled={isExporting}
              title="Export PDF"
              className="flex items-center space-x-1 px-2.5 py-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold rounded-lg shadow-md border border-cyan-400/30 transition active:scale-95 disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isExporting ? '...' : 'Export'}</span>
            </button>
          </div>
        )}
      </div>
      </div>

      {/* Center Toolbar Tool Modes: Dedicated 2nd Row on Mobile, Center on Desktop */}
      {hasDocument && (
        <div className="bg-slate-950/90 p-1 sm:p-1.5 rounded-xl border border-slate-800/80 shadow-inner relative w-full lg:w-auto overflow-hidden lg:overflow-visible whitespace-nowrap lg:absolute lg:left-1/2 lg:-translate-x-1/2 lg:top-1/2 lg:-translate-y-1/2 z-20">
          <div className="flex items-center space-x-1 sm:space-x-1.5 flex-nowrap max-lg:overflow-x-auto lg:overflow-visible touch-pan-x scrollbar-none w-full max-w-full py-0.5 px-2 justify-start lg:justify-center">
            {/* Select Mode */}
            <button
              onClick={() => handleToolSelect('select')}
              title="Select & Navigate (S)"
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                toolMode === 'select'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <MousePointer className="w-3.5 h-3.5 text-cyan-400" />
              <span>Select</span>
            </button>

            {/* Edit / Redact Text Dropdown */}
            <div className="relative shrink-0" ref={textDropdownRef}>
              <button
                onClick={() => {
                  handleToolSelect('text');
                  toggleDropdown('text', textDropdownRef, 208);
                }}
                title="Add Text & Type on PDF (T) - Click for text formatting options"
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  toolMode === 'text' || (isTextDropdownOpen && popoverPos.name === 'text')
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Type className="w-3.5 h-3.5 text-cyan-400" />
                <span>Text</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {/* Text Formatting Options Dropdown Popover */}
              {isTextDropdownOpen && popoverPos.name === 'text' && createPortal(
                <div
                  data-popover="true"
                  style={{
                    position: 'fixed',
                    left: `${popoverPos.left}px`,
                    top: `${popoverPos.top}px`,
                    zIndex: 999999,
                  }}
                  className="w-52 bg-slate-950 border border-slate-700 rounded-xl shadow-2xl p-2 flex flex-col space-y-2 animate-fadeIn opacity-100 ring-1 ring-cyan-500/30 text-slate-100"
                >
                  <div className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 border-b border-slate-800 pb-1 flex items-center justify-between">
                    <span>Text Formatting & Style</span>
                    <span className="text-[9px] text-slate-500 font-mono">Real-time</span>
                  </div>

                  {/* Font Family / Style */}
                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] font-semibold text-slate-400">Font Family</label>
                    <select
                      value={textFontFamily || "'Times New Roman', Times, serif"}
                      onChange={(e) => setTextFontFamily && setTextFontFamily(e.target.value)}
                      className="bg-slate-950 text-slate-100 border border-slate-700 rounded-lg px-2 py-1 text-xs font-semibold hover:border-cyan-500 transition w-full"
                    >
                      <option value="'Times New Roman', Times, serif">Times New Roman (Legal)</option>
                      <option value="Arial, Helvetica, sans-serif">Arial / Helvetica (Sans)</option>
                      <option value="'Courier New', Courier, monospace">Courier New (Mono)</option>
                      <option value="Georgia, serif">Georgia (Serif)</option>
                      <option value="Garamond, serif">Garamond (Classic)</option>
                      <option value="Verdana, Geneva, sans-serif">Verdana (Clean)</option>
                      <option value="'Trebuchet MS', sans-serif">Trebuchet MS</option>
                      <option value="Impact, Charcoal, sans-serif">Impact (Bold)</option>
                      <option value="'Comic Sans MS', cursive, sans-serif">Comic Sans</option>
                      <option value="'Palatino Linotype', Palatino, serif">Palatino</option>
                      <option value="Tahoma, Geneva, sans-serif">Tahoma</option>
                      <option value="'Lucida Console', Monaco, monospace">Lucida Console</option>
                      <option value="'Brush Script MT', cursive">Brush Script</option>
                      <option value="'Segoe UI', Tahoma, sans-serif">Segoe UI</option>
                      <option value="'Century Gothic', sans-serif">Century Gothic</option>
                    </select>
                  </div>

                  {/* Font Size & Stepper */}
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-semibold text-slate-400">Font Size</label>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => setTextFontSize && setTextFontSize(Math.max(8, (textFontSize || 14) - 2))}
                        className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-bold transition"
                        title="Decrease Font Size"
                      >
                        -
                      </button>
                      <select
                        value={textFontSize || 14}
                        onChange={(e) => setTextFontSize && setTextFontSize(Number(e.target.value))}
                        className="bg-slate-950 text-slate-100 border border-slate-700 rounded-lg px-2 py-0.5 text-xs font-mono font-bold hover:border-cyan-500 transition"
                      >
                        {[8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 40, 48, 64].map((size) => (
                          <option key={size} value={size}>
                            {size}pt
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => setTextFontSize && setTextFontSize(Math.min(72, (textFontSize || 14) + 2))}
                        className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-bold transition"
                        title="Increase Font Size"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Color Palette */}
                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] font-semibold text-slate-400">Text Color</label>
                    <div className="flex items-center space-x-1.5 bg-slate-950 border border-slate-800 rounded-lg p-1.5 justify-between">
                      {['#000000', '#1e3a8a', '#dc2626', '#15803d', '#7e22ce', '#ffffff'].map((c) => (
                        <button
                          key={c}
                          onClick={() => setTextColor && setTextColor(c)}
                          style={{ backgroundColor: c }}
                          className={`w-4 h-4 rounded-full border transition ${
                            textColor === c ? 'border-cyan-400 scale-110 ring-1 ring-cyan-400' : 'border-slate-600 opacity-80'
                          }`}
                          title={`Color ${c}`}
                        />
                      ))}
                      <input
                        type="color"
                        value={textColor || '#000000'}
                        onChange={(e) => setTextColor && setTextColor(e.target.value)}
                        className="w-4 h-4 rounded cursor-pointer border-0 p-0 bg-transparent"
                        title="Custom Color Picker"
                      />
                    </div>
                  </div>

                  {/* Underline Toggle */}
                  <button
                    onClick={() => setTextIsUnderline && setTextIsUnderline(!textIsUnderline)}
                    className={`w-full py-1.5 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 transition border ${
                      textIsUnderline
                        ? 'bg-cyan-500 text-white border-cyan-400 shadow'
                        : 'bg-slate-950 text-slate-300 border-slate-700 hover:text-white'
                    }`}
                  >
                    <Underline className="w-3.5 h-3.5" />
                    <span>{textIsUnderline ? 'Underline Text Active' : 'Normal Text (No Underline)'}</span>
                  </button>

                  {/* Redact Background Cover Toggle */}
                  <button
                    onClick={() => setTextIsRedact && setTextIsRedact(!textIsRedact)}
                    className={`w-full py-1.5 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 transition border ${
                      textIsRedact
                        ? 'bg-white text-slate-900 border-white shadow'
                        : 'bg-slate-950 text-slate-300 border-slate-700 hover:text-white'
                    }`}
                  >
                    {textIsRedact ? <EyeOff className="w-3.5 h-3.5 text-red-600" /> : <Eye className="w-3.5 h-3.5 text-cyan-400" />}
                    <span>{textIsRedact ? 'White Cover Box Active' : 'Plain Transparent Text'}</span>
                  </button>
                </div>,
                document.body
              )}
            </div>

          {/* Annotate & Markups Dropdown */}
          <div className="relative shrink-0" ref={annotateDropdownRef}>
            <button
              onClick={() => toggleDropdown('annotate', annotateDropdownRef, 208)}
              title="Annotations, Markups, Vector Shapes, Stamps & Forms"
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                isAnnotateActive || (isAnnotateDropdownOpen && popoverPos.name === 'annotate')
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              {toolMode === 'draw' && <Pencil className="w-3.5 h-3.5 text-yellow-400" />}
              {toolMode === 'highlight' && <Highlighter className="w-3.5 h-3.5 text-yellow-400" />}
              {toolMode === 'eraser' && <Eraser className="w-3.5 h-3.5 text-amber-400" />}
              {toolMode === 'strikeout' && <Strikethrough className="w-3.5 h-3.5 text-rose-400" />}
              {toolMode === 'checkmark' && <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />}
              {toolMode === 'crossmark' && <XSquare className="w-3.5 h-3.5 text-rose-400" />}
              {toolMode === 'form' && <FormInput className="w-3.5 h-3.5 text-cyan-400" />}
              {toolMode === 'line' && <Minus className="w-3.5 h-3.5 text-blue-400" />}
              {toolMode === 'rectangle' && <Square className="w-3.5 h-3.5 text-blue-400" />}
              {toolMode === 'oval' && <Circle className="w-3.5 h-3.5 text-blue-400" />}
              {!isAnnotateActive && <Pencil className="w-3.5 h-3.5 text-cyan-400" />}
              <span>
                {toolMode === 'draw'
                  ? 'Draw'
                  : toolMode === 'highlight'
                  ? 'Highlight'
                  : toolMode === 'eraser'
                  ? 'Eraser'
                  : toolMode === 'strikeout'
                  ? 'Cross Out'
                  : toolMode === 'checkmark'
                  ? 'Check ✓'
                  : toolMode === 'crossmark'
                  ? 'Cross ✕'
                  : toolMode === 'form'
                  ? 'Fill Form'
                  : toolMode === 'line'
                  ? 'Line'
                  : toolMode === 'rectangle'
                  ? 'Rectangle'
                  : toolMode === 'oval'
                  ? 'Oval'
                  : 'Annotate'}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5" />
            </button>

            {/* Annotate Dropdown Popover */}
            {isAnnotateDropdownOpen && popoverPos.name === 'annotate' && createPortal(
              <div
                data-popover="true"
                style={{
                  position: 'fixed',
                  left: `${popoverPos.left}px`,
                  top: `${popoverPos.top}px`,
                  zIndex: 999999,
                }}
                className="w-56 bg-slate-950 border border-slate-700 rounded-xl shadow-2xl p-2 flex flex-col space-y-1 opacity-100 ring-1 ring-cyan-500/30 text-slate-100 animate-fadeIn"
              >
                <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-1 mb-1">
                  Markups & Freehand
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
                    <span>Freehand Pencil / Pen</span>
                  </div>
                  {toolMode === 'draw' && <span className="w-2 h-2 rounded-full bg-cyan-400" />}
                </button>

                <button
                  onClick={() => {
                    handleToolSelect('highlight');
                    setIsAnnotateDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-left text-xs font-semibold rounded-xl transition ${
                    toolMode === 'highlight' ? 'bg-amber-500/20 text-yellow-300 font-bold' : 'text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <Highlighter className="w-4 h-4 text-yellow-400" />
                    <span>Highlight Text & Passages</span>
                  </div>
                  {toolMode === 'highlight' && <span className="w-2 h-2 rounded-full bg-yellow-400" />}
                </button>

                <button
                  onClick={() => {
                    handleToolSelect('eraser');
                    setIsAnnotateDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-left text-xs font-semibold rounded-xl transition ${
                    toolMode === 'eraser' ? 'bg-amber-500/20 text-amber-300 font-bold' : 'text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <Eraser className="w-4 h-4 text-amber-400" />
                    <span>Eraser / Whiteout Brush</span>
                  </div>
                  {toolMode === 'eraser' && <span className="w-2 h-2 rounded-full bg-amber-400" />}
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

                {/* Vector Shapes Section */}
                <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800 space-y-1.5 my-1">
                  <div className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Vector Shapes</div>
                  <div className="grid grid-cols-3 gap-1">
                    <button
                      onClick={() => {
                        setToolMode('line');
                        setIsAnnotateDropdownOpen(false);
                      }}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold flex flex-col items-center justify-center space-y-0.5 transition ${
                        toolMode === 'line' ? 'bg-blue-600 text-white shadow' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                      title="Draw Line"
                    >
                      <Minus className="w-3.5 h-3.5" />
                      <span className="text-[9px]">Line</span>
                    </button>

                    <button
                      onClick={() => {
                        setToolMode('rectangle');
                        setIsAnnotateDropdownOpen(false);
                      }}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold flex flex-col items-center justify-center space-y-0.5 transition ${
                        toolMode === 'rectangle' ? 'bg-blue-600 text-white shadow' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                      title="Draw Rectangle"
                    >
                      <Square className="w-3.5 h-3.5" />
                      <span className="text-[9px]">Rect</span>
                    </button>

                    <button
                      onClick={() => {
                        setToolMode('oval');
                        setIsAnnotateDropdownOpen(false);
                      }}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold flex flex-col items-center justify-center space-y-0.5 transition ${
                        toolMode === 'oval' ? 'bg-blue-600 text-white shadow' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                      title="Draw Oval / Ellipse"
                    >
                      <Circle className="w-3.5 h-3.5" />
                      <span className="text-[9px]">Oval</span>
                    </button>
                  </div>

                  {/* Shape Controls: Stroke & Fill */}
                  <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-800">
                    <div className="flex items-center space-x-1">
                      <span className="text-slate-400">Stroke:</span>
                      <input
                        type="color"
                        value={shapeStrokeColor || '#3b82f6'}
                        onChange={(e) => setShapeStrokeColor && setShapeStrokeColor(e.target.value)}
                        className="w-4 h-4 rounded cursor-pointer border-0 p-0 bg-transparent"
                        title="Stroke Color"
                      />
                    </div>

                    <div className="flex items-center space-x-1">
                      <span className="text-slate-400">Fill:</span>
                      <select
                        value={shapeFillColor || 'transparent'}
                        onChange={(e) => setShapeFillColor && setShapeFillColor(e.target.value)}
                        className="bg-slate-950 text-slate-200 text-[9px] border border-slate-700 rounded px-1 py-0.5 font-bold"
                      >
                        <option value="transparent">None</option>
                        <option value="#3b82f6">Blue</option>
                        <option value="#ef4444">Red</option>
                        <option value="#10b981">Green</option>
                        <option value="#facc15">Yellow</option>
                        <option value="#ffffff">White</option>
                        <option value="#000000">Black</option>
                      </select>
                    </div>

                    <div className="flex items-center space-x-1">
                      <span className="text-slate-400">Width:</span>
                      <select
                        value={shapeStrokeWidth || 2}
                        onChange={(e) => setShapeStrokeWidth && setShapeStrokeWidth(Number(e.target.value))}
                        className="bg-slate-950 text-slate-200 text-[9px] border border-slate-700 rounded px-1 py-0.5 font-bold"
                      >
                        <option value={1}>1px</option>
                        <option value={2}>2px</option>
                        <option value={4}>4px</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>,
              document.body
            )}
          </div>

          {/* Sign Dropdown Button */}
          <div className="relative shrink-0" ref={dropdownRef}>
            <button
              onClick={() => toggleDropdown('sign', dropdownRef, 224)}
              title="Signature Options & Saved Signatures"
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                toolMode === 'sign' || (isSignDropdownOpen && popoverPos.name === 'sign')
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <PenTool className="w-3.5 h-3.5 text-cyan-400" />
              <span>Sign</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {/* Dropdown Popover */}
            {isSignDropdownOpen && popoverPos.name === 'sign' && createPortal(
              <div
                data-popover="true"
                style={{
                  position: 'fixed',
                  left: `${popoverPos.left}px`,
                  top: `${popoverPos.top}px`,
                  zIndex: 999999,
                }}
                className="w-56 bg-slate-950 border border-slate-700 rounded-xl shadow-2xl p-2.5 flex flex-col space-y-2 opacity-100 ring-1 ring-cyan-500/30 text-slate-100"
              >
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
              </div>,
              document.body
            )}
          </div>

          {/* Security Dropdown Button */}
          <div className="relative shrink-0" ref={securityDropdownRef}>
            <button
              onClick={() => toggleDropdown('security', securityDropdownRef, 224)}
              title="Protect PDF (AES-256 Password) & Unlock PDF (Remove Password)"
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                isSecurityDropdownOpen && popoverPos.name === 'security'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>Security</span>
              <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5" />
            </button>

            {/* Security Dropdown Popover */}
            {isSecurityDropdownOpen && popoverPos.name === 'security' && createPortal(
              <div
                data-popover="true"
                style={{
                  position: 'fixed',
                  left: `${popoverPos.left}px`,
                  top: `${popoverPos.top}px`,
                  zIndex: 999999,
                }}
                className="w-56 bg-slate-950 border border-slate-700 rounded-xl shadow-2xl p-2.5 flex flex-col space-y-1.5 opacity-100 ring-1 ring-cyan-500/30 text-slate-100 animate-fadeIn"
              >
                <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-1 mb-1">
                  PDF Encryption & Password Control
                </div>

                {/* Protect PDF (Add Password) */}
                <button
                  onClick={() => {
                    setIsSecurityDropdownOpen(false);
                    if (onOpenPasswordModal) onOpenPasswordModal('protect');
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 text-left text-xs font-semibold rounded-xl text-slate-200 hover:bg-slate-800 transition group"
                >
                  <div className="flex items-center space-x-2.5">
                    <Lock className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition" />
                    <div>
                      <div className="font-bold text-white">Protect PDF</div>
                      <div className="text-[10px] text-slate-400">Add AES-256 password & permissions</div>
                    </div>
                  </div>
                  <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 bg-cyan-500/10 text-cyan-400 rounded-full border border-cyan-500/30">Protect</span>
                </button>

                {/* Unlock PDF (Remove Password) */}
                <button
                  onClick={() => {
                    setIsSecurityDropdownOpen(false);
                    if (onOpenPasswordModal) onOpenPasswordModal('unlock');
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 text-left text-xs font-semibold rounded-xl text-slate-200 hover:bg-slate-800 transition group"
                >
                  <div className="flex items-center space-x-2.5">
                    <Unlock className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition" />
                    <div>
                      <div className="font-bold text-white">Unlock PDF</div>
                      <div className="text-[10px] text-slate-400">Remove password & decrypt PDF</div>
                    </div>
                  </div>
                  <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/30">Unlock</span>
                </button>
              </div>,
              document.body
            )}
          </div>

          {/* Expanded Feature Modules Dropdown */}
          <div className="relative shrink-0" ref={moreToolsRef}>
            <button
              onClick={() => toggleDropdown('tools', moreToolsRef, 224)}
              title="More Feature Modules (Compress, Watermark, Split, Templates)"
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                isMoreToolsOpen && popoverPos.name === 'tools'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-yellow-400 animate-pulse" />
              <span>Tools</span>
              <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5" />
            </button>

            {/* Feature Modules Popover */}
            {isMoreToolsOpen && popoverPos.name === 'tools' && createPortal(
              <div
                data-popover="true"
                style={{
                  position: 'fixed',
                  left: `${popoverPos.left}px`,
                  top: `${popoverPos.top}px`,
                  zIndex: 999999,
                }}
                className="w-56 bg-slate-950 border border-slate-700 rounded-xl shadow-2xl p-2 flex flex-col space-y-1 opacity-100 ring-1 ring-cyan-500/30 text-slate-100"
              >
                <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-1 mb-1">
                  Feature Modules
                </div>

                {/* Scan Document via Camera */}
                <button
                  onClick={() => {
                    setIsMoreToolsOpen(false);
                    if (onOpenScanModal) onOpenScanModal();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 text-left text-xs font-semibold rounded-xl text-slate-200 hover:bg-slate-800 transition group"
                >
                  <div className="flex items-center space-x-2.5">
                    <Camera className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition" />
                    <div>
                      <div className="font-bold text-white">Scan Document (Camera)</div>
                      <div className="text-[10px] text-slate-400">Snap & convert paper to PDF</div>
                    </div>
                  </div>
                  <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 bg-cyan-500/10 text-cyan-400 rounded-full border border-cyan-500/30">Scanner</span>
                </button>

                {/* iOS & Mobile App Install */}
                <button
                  onClick={() => {
                    setIsMoreToolsOpen(false);
                    if (onOpenDesktopDownloadModal) onOpenDesktopDownloadModal();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 text-left text-xs font-semibold rounded-xl text-slate-200 hover:bg-slate-800 transition group"
                >
                  <div className="flex items-center space-x-2.5">
                    <Apple className="w-4 h-4 text-purple-400 group-hover:scale-110 transition" />
                    <div>
                      <div className="font-bold text-white">iOS & Mobile App Install</div>
                      <div className="text-[10px] text-slate-400">Safari PWA & TestFlight links</div>
                    </div>
                  </div>
                  <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 bg-purple-500/10 text-purple-400 rounded-full border border-purple-500/30">iOS</span>
                </button>

                {/* Add Image / Logo Attachment */}
                <button
                  onClick={() => {
                    setIsMoreToolsOpen(false);
                    imageFileInputRef.current?.click();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 text-left text-xs font-semibold rounded-xl text-slate-200 hover:bg-slate-800 transition group"
                >
                  <div className="flex items-center space-x-2.5">
                    <ImageIcon className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition" />
                    <div>
                      <div className="font-bold text-white">Add Image / Logo</div>
                      <div className="text-[10px] text-slate-400">Attach PNG/JPG stamp on page</div>
                    </div>
                  </div>
                  <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/30">Stamp</span>
                </button>

                {/* Compress PDF */}
                <button
                  onClick={() => {
                    setIsMoreToolsOpen(false);
                    if (onOpenCompressModal) onOpenCompressModal();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 text-left text-xs font-semibold rounded-xl text-slate-200 hover:bg-slate-800 transition group"
                >
                  <div className="flex items-center space-x-2.5">
                    <Zap className="w-4 h-4 text-amber-400 group-hover:scale-110 transition" />
                    <div>
                      <div className="font-bold text-white">Compress PDF</div>
                      <div className="text-[10px] text-slate-400">Reduce file size (Medium, High, Lossless)</div>
                    </div>
                  </div>
                  <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 bg-amber-500/10 text-amber-400 rounded-full border border-amber-500/30">Size</span>
                </button>

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
                    if (!isProActive) {
                      if (onOpenCheckout) onOpenCheckout();
                      return;
                    }
                    if (onOpenWatermarkModal) onOpenWatermarkModal();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 text-left text-xs font-semibold rounded-xl text-slate-200 hover:bg-slate-800 transition group"
                >
                  <div className="flex items-center space-x-2.5">
                    <Award className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition" />
                    <div>
                      <div className="font-bold text-white flex items-center space-x-1">
                        <span>Apply Watermark & Stamps</span>
                        {!isProActive && <span className="text-[9px] font-extrabold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">PRO</span>}
                      </div>
                      <div className="text-[10px] text-slate-400">CONFIDENTIAL, APPROVED stamps</div>
                    </div>
                  </div>
                  <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/30">Watermark</span>
                </button>
              </div>,
              document.body
            )}
          </div>

          {/* Mobile-Only Action Buttons in Row 2 */}
          <button
            onClick={() => onRotatePage && onRotatePage(currentPage - 1)}
            title="Rotate Current Page 90° Clockwise"
            className="lg:hidden flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-all shrink-0"
          >
            <RotateCw className="w-3.5 h-3.5 text-cyan-400" />
            <span>Rotate</span>
          </button>

          <button
            onClick={onOpenPageManager}
            title="Manage, Split & Reorder Pages"
            className="lg:hidden flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-all shrink-0"
          >
            <Grid className="w-3.5 h-3.5 text-purple-400" />
            <span>Pages</span>
          </button>

          <button
            disabled={!canUndo}
            onClick={onUndo}
            title="Undo Action (Ctrl+Z)"
            className="lg:hidden flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition disabled:opacity-30 shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
            <span>Undo</span>
          </button>

          <button
            disabled={!canRedo}
            onClick={onRedo}
            title="Redo Action (Ctrl+Y)"
            className="lg:hidden flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition disabled:opacity-30 shrink-0"
          >
            <RotateCw className="w-3.5 h-3.5 text-cyan-400" />
            <span>Redo</span>
          </button>
          </div>
        </div>
      )}

      {/* Right Header Action Buttons: Rotate, Pages, Undo/Redo, Print & Export PDF (Web Desktop Only) */}
      {hasDocument && (
        <div className="hidden lg:flex items-center space-x-1.5 sm:space-x-2 shrink-0 ml-auto z-20">
          {/* Rotate Current Page */}
          <button
            onClick={() => {
              if (onRotatePage) {
                onRotatePage(currentPage - 1);
              }
            }}
            title="Rotate Current Page 90° Clockwise"
            className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-all"
          >
            <RotateCw className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Rotate ↻</span>
          </button>

          {/* Manage Pages / Reorder */}
          <button
            onClick={onOpenPageManager}
            title="Manage, Split & Reorder Pages"
            className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-all"
          >
            <Grid className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden sm:inline">Pages</span>
          </button>

          {/* Undo & Redo Controls */}
          <div className="flex items-center space-x-0.5 border-l border-slate-800 pl-1">
            <button
              disabled={!canUndo}
              onClick={onUndo}
              title="Undo Action (Ctrl+Z)"
              className="flex items-center space-x-1 px-1.5 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition disabled:opacity-30 disabled:hover:bg-transparent"
            >
              <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden xl:inline">Undo</span>
            </button>
            <button
              disabled={!canRedo}
              onClick={onRedo}
              title="Redo Action (Ctrl+Y / Ctrl+Shift+Z)"
              className="flex items-center space-x-1 px-1.5 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition disabled:opacity-30 disabled:hover:bg-transparent"
            >
              <RotateCw className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden xl:inline">Redo</span>
            </button>
          </div>

          {/* Right-Side Action Group: Print & Export PDF */}
          <div className="flex items-center space-x-1.5 sm:space-x-2 border-l border-slate-800 pl-1.5 sm:pl-2">
            <button
              onClick={onPrintPDF}
              disabled={isPrinting}
              title="Print Document or Open Print Preview (Ctrl+P)"
              className="flex items-center space-x-1 px-2.5 py-1.5 sm:px-3 sm:py-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-white text-xs font-bold rounded-lg sm:rounded-xl border border-slate-700 transition active:scale-95 disabled:opacity-50"
            >
              <Printer className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">{isPrinting ? 'Preparing...' : 'Print'}</span>
            </button>

            <button
              onClick={onExportPDF}
              disabled={isExporting}
              title="Export & Download PDF File"
              className="flex items-center space-x-1 px-3 py-1.5 sm:px-3.5 sm:py-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold rounded-lg sm:rounded-xl shadow-md border border-cyan-400/30 transition active:scale-95 disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isExporting ? 'Exporting...' : 'Export'}</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
