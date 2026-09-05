import React, { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { HeaderToolbar } from './components/HeaderToolbar';
import { Sidebar } from './components/Sidebar';
import { ThemePreset, getActiveTheme } from './utils/themeManager';
import { LandingPage } from './pages/LandingPage';
import { createSamplePDF } from './utils/samplePdf';
import { createBlankPDF, CreatePDFOptions } from './utils/blankPdf';
import { saveSignatureToStorage } from './utils/savedSignatures';
import { addRecentFile, RecentFileItem } from './utils/recentFiles';
import { trackEvent } from './utils/analytics';
import { downloadFile, printPdfBlob } from './utils/mobileFileDownload';
import { WatermarkOptions } from './components/WatermarkModal';
import { ExportFormatType } from './components/PremiumExportModal';

// Code-split heavy editor modals and canvas viewer so LandingPage loads instantly in < 5ms
const PDFCanvasViewer = React.lazy(() => import('./components/PDFCanvasViewer').then(m => ({ default: m.PDFCanvasViewer })));
const SignatureModal = React.lazy(() => import('./components/SignatureModal').then(m => ({ default: m.SignatureModal })));
const PageManagerModal = React.lazy(() => import('./components/PageManagerModal').then(m => ({ default: m.PageManagerModal })));
const CreatePDFModal = React.lazy(() => import('./components/CreatePDFModal').then(m => ({ default: m.CreatePDFModal })));
const MergePDFModal = React.lazy(() => import('./components/MergePDFModal').then(m => ({ default: m.MergePDFModal })));
const SaveMultiplePDFsModal = React.lazy(() => import('./components/SaveMultiplePDFsModal').then(m => ({ default: m.SaveMultiplePDFsModal })));
const WatermarkModal = React.lazy(() => import('./components/WatermarkModal').then(m => ({ default: m.WatermarkModal })));
const PremiumExportModal = React.lazy(() => import('./components/PremiumExportModal').then(m => ({ default: m.PremiumExportModal })));
const ThemeModal = React.lazy(() => import('./components/ThemeModal').then(m => ({ default: m.ThemeModal })));
const UserGuideModal = React.lazy(() => import('./components/UserGuideModal').then(m => ({ default: m.UserGuideModal })));
const HelcimCheckoutModal = React.lazy(() => import('./components/HelcimCheckoutModal').then(m => ({ default: m.HelcimCheckoutModal })));
const PasswordModal = React.lazy(() => import('./components/PasswordModal').then(m => ({ default: m.PasswordModal })));
const CompressModal = React.lazy(() => import('./components/CompressModal').then(m => ({ default: m.CompressModal })));
const ScanModal = React.lazy(() => import('./components/ScanModal').then(m => ({ default: m.ScanModal })));
const AppDownloadModal = React.lazy(() => import('./components/AppDownloadModal').then(m => ({ default: m.AppDownloadModal })));
import './types/electron.d';
import {
  PDFDocumentState,
  ToolMode,
  TextAnnotation,
  SignatureAnnotation,
  StampAnnotation,
  ShapeAnnotation,
  ImageStampAnnotation,
  StrikeoutAnnotation,
  FreehandDrawing,
  PageInfo,
} from './types/pdf';

const IS_ELECTRON = Boolean(window.electronAPI?.isElectron);

const EMPTY_STATE: PDFDocumentState = {
  fileName: '',
  fileBytes: null,
  numPages: 0,
  pages: [],
  pageRotations: {},
  deletedPages: new Set<number>(),
  pageOrder: [],
  textAnnotations: [],
  signatures: [],
  stamps: [],
  shapes: [],
  imageStamps: [],
  strikeouts: [],
  drawings: [],
  formFields: [],
};

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'landing' | 'editor'>('landing');
  const [docState, setDocState] = useState<PDFDocumentState>(EMPTY_STATE);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [zoom, setZoom] = useState<number>(1.0);
  const [toolMode, setToolMode] = useState<ToolMode>('select');
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() => window.innerWidth >= 1024);
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState<boolean>(false);
  const [isWatermarkModalOpen, setIsWatermarkModalOpen] = useState<boolean>(false);
  const [isPageManagerOpen, setIsPageManagerOpen] = useState<boolean>(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isMergeModalOpen, setIsMergeModalOpen] = useState<boolean>(false);
  const [isSaveMultipleModalOpen, setIsSaveMultipleModalOpen] = useState<boolean>(false);
  const [isPremiumExportModalOpen, setIsPremiumExportModalOpen] = useState<boolean>(false);
  const [premiumExportFormat, setPremiumExportFormat] = useState<ExportFormatType>('docx');
  const [pendingSignatureDataUrl, setPendingSignatureDataUrl] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isExportingMultiple, setIsExportingMultiple] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isPrinting, setIsPrinting] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState<boolean>(false);
  const [isUserGuideModalOpen, setIsUserGuideModalOpen] = useState<boolean>(false);
  const [isHelcimCheckoutOpen, setIsHelcimCheckoutOpen] = useState<boolean>(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState<boolean>(false);
  const [passwordModalMode, setPasswordModalMode] = useState<'protect' | 'unlock'>('protect');
  const [isCompressModalOpen, setIsCompressModalOpen] = useState<boolean>(false);
  const [isScanModalOpen, setIsScanModalOpen] = useState<boolean>(false);
  const [isAppDownloadModalOpen, setIsAppDownloadModalOpen] = useState<boolean>(false);
  const [isProActive, setIsProActive] = useState<boolean>(
    () => localStorage.getItem('isa_pro_active') === 'true'
  );

  const [themePreset, setThemePreset] = useState<ThemePreset>(
    () => (localStorage.getItem('isa_theme_preset') as ThemePreset) || 'cyan'
  );
  const activeTheme = getActiveTheme(themePreset);

  const [showProWelcomeModal, setShowProWelcomeModal] = useState<boolean>(false);

  // Helcim Payment Redirect Listener & Mode Reset / Tester Unlock
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const modeVal = urlParams.get('mode') || urlParams.get('reset') || urlParams.get('vip');
      
      if (modeVal === 'free' || modeVal === 'reset') {
        localStorage.removeItem('isa_pro_active');
        setIsProActive(false);
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
      }

      if (modeVal === 'pro' || modeVal === 'tester' || modeVal === 'family' || modeVal === 'vip') {
        localStorage.setItem('isa_pro_active', 'true');
        setIsProActive(true);
        setShowProWelcomeModal(true);
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
      }

      const paymentVal = urlParams.get('payment');
      const statusVal = urlParams.get('status');
      const helcimStatusVal = urlParams.get('helcim_status');

      const scanVal = urlParams.get('scan');
      if (scanVal === '1') {
        setIsScanModalOpen(true);
        window.history.replaceState({}, document.title, window.location.pathname);
      }

      if (
        paymentVal === 'success' ||
        statusVal === 'success' ||
        helcimStatusVal === 'APPROVED' ||
        helcimStatusVal === 'success'
      ) {
        localStorage.setItem('isa_pro_active', 'true');
        setIsProActive(true);
        setShowProWelcomeModal(true);
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } catch (e) {}
  }, []);

  // Text Tool Formatting Defaults
  const [textFontSize, setTextFontSize] = useState<number>(14);
  const [textFontFamily, setTextFontFamily] = useState<string>("'Times New Roman', Times, serif");
  const [textColor, setTextColor] = useState<string>('#000000');
  const [textIsRedact, setTextIsRedact] = useState<boolean>(false);
  const [textIsUnderline, setTextIsUnderline] = useState<boolean>(false);
  const [activeFormFieldName, setActiveFormFieldName] = useState<string | null>(null);

  // Shape Tool Defaults
  const [shapeStrokeColor, setShapeStrokeColor] = useState<string>('#3b82f6');
  const [shapeFillColor, setShapeFillColor] = useState<string>('transparent');
  const [shapeStrokeWidth, setShapeStrokeWidth] = useState<number>(2);

  const handleSetTextFontFamily = (family: string) => {
    setTextFontFamily(family);
    if (activeFormFieldName) {
      setDocState((prev) => ({
        ...prev,
        formFields: prev.formFields.map((f) =>
          f.name === activeFormFieldName || f.fieldName === activeFormFieldName
            ? { ...f, fontFamily: family }
            : f
        ),
      }));
    }
  };

  const handleSetTextColor = (color: string) => {
    setTextColor(color);
    if (activeFormFieldName) {
      setDocState((prev) => ({
        ...prev,
        formFields: prev.formFields.map((f) =>
          f.name === activeFormFieldName || f.fieldName === activeFormFieldName
            ? { ...f, fontColor: color }
            : f
        ),
      }));
    }
  };

  const handleSetTextFontSize = (size: number) => {
    setTextFontSize(size);
    if (activeFormFieldName) {
      setDocState((prev) => ({
        ...prev,
        formFields: prev.formFields.map((f) =>
          f.name === activeFormFieldName || f.fieldName === activeFormFieldName
            ? { ...f, fontSize: size }
            : f
        ),
      }));
    }
  };

  const handleSetTextIsRedact = (isRedact: boolean) => {
    setTextIsRedact(isRedact);
    if (activeFormFieldName) {
      setDocState((prev) => ({
        ...prev,
        formFields: prev.formFields.map((f) =>
          f.name === activeFormFieldName || f.fieldName === activeFormFieldName
            ? { ...f, isRedact }
            : f
        ),
      }));
    }
  };

  const handleFitToWidth = useCallback(() => {
    const screenW = window.innerWidth;
    const isMobile = screenW < 768;
    const isTablet = screenW >= 768 && screenW < 1024;
    const sidebarW = isSidebarOpen && !isMobile ? 256 : 48;
    const availableW = screenW - sidebarW - (isMobile ? 16 : 48);
    const pageW = docState.pages[0]?.width || 612;
    if (pageW > 0 && availableW > 0) {
      const fitScale = Math.floor((availableW / pageW) * 100) / 100;
      setZoom(Math.max(0.35, Math.min(2.5, fitScale)));
    }
  }, [docState.pages, isSidebarOpen]);

  const handleOpenPremiumExportModal = (format: ExportFormatType = 'docx') => {
    setPremiumExportFormat(format);
    setIsPremiumExportModalOpen(true);
  };

  const historyRef = useRef<PDFDocumentState[]>([]);
  const futureRef = useRef<PDFDocumentState[]>([]);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const cloneDocState = (state: PDFDocumentState): PDFDocumentState => ({
    fileName: state.fileName,
    fileBytes: state.fileBytes,
    numPages: state.numPages,
    pages: state.pages.map((p) => ({ ...p })),
    pageRotations: { ...state.pageRotations },
    deletedPages: new Set(state.deletedPages),
    pageOrder: [...state.pageOrder],
    textAnnotations: state.textAnnotations.map((a) => ({ ...a })),
    signatures: state.signatures.map((s) => ({ ...s })),
    stamps: state.stamps.map((s) => ({ ...s })),
    shapes: state.shapes.map((sh) => ({ ...sh })),
    imageStamps: state.imageStamps.map((img) => ({ ...img })),
    strikeouts: state.strikeouts.map((s) => ({ ...s })),
    drawings: state.drawings.map((d) => ({ ...d, points: d.points.map((pt) => ({ ...pt })) })),
    formFields: state.formFields.map((f) => ({ ...f, rect: { ...f.rect } })),
  });

  const updateHistoryState = () => {
    setCanUndo(historyRef.current.length > 0);
    setCanRedo(futureRef.current.length > 0);
  };

  const pushToHistory = useCallback((previousState: PDFDocumentState) => {
    if (!previousState.fileBytes) return;
    historyRef.current.push(cloneDocState(previousState));
    if (historyRef.current.length > 40) {
      historyRef.current.shift();
    }
    futureRef.current = [];
    updateHistoryState();
  }, []);

  const handleUndo = useCallback(() => {
    if (historyRef.current.length === 0) return;
    const prevRaw = historyRef.current.pop();
    if (!prevRaw) return;
    setDocState((current) => {
      futureRef.current.push(cloneDocState(current));
      return prevRaw;
    });
    updateHistoryState();
  }, []);

  const handleRedo = useCallback(() => {
    if (futureRef.current.length === 0) return;
    const nextRaw = futureRef.current.pop();
    if (!nextRaw) return;
    setDocState((current) => {
      historyRef.current.push(cloneDocState(current));
      return nextRaw;
    });
    updateHistoryState();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && !e.altKey) {
        if (e.key.toLowerCase() === 'z') {
          if (e.shiftKey) {
            e.preventDefault();
            handleRedo();
          } else {
            e.preventDefault();
            handleUndo();
          }
        } else if (e.key.toLowerCase() === 'y') {
          e.preventDefault();
          handleRedo();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  const handleOpenRecentFile = (fileItem: RecentFileItem) => {
    if (fileItem.dataUrl) {
      const base64Data = fileItem.dataUrl.split(',')[1];
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      loadPDFData(bytes, fileItem.name);
    } else {
      alert(`To open "${fileItem.name}", please use the "Open PDF..." option to select the file from your computer.`);
    }
  };

  const loadPDFData = useCallback(async (data: Uint8Array, fileName: string, initialPassword?: string) => {
    setIsLoading(true);
    setLoadError(null);
    try {
      // Record in recent files history
      addRecentFile(fileName);

      // Dynamically load PDF engines on demand
      const { pdfRenderer } = await import('./services/pdfRenderer');
      const { PDFDocument } = await import('pdf-lib');
      const { pdfEngine } = await import('./services/pdfEngine');

      // Load into PDF.js renderer with password handling
      let pdfjsDoc: any = null;
      try {
        pdfjsDoc = await pdfRenderer.loadDocument(data.slice(0), initialPassword);
      } catch (err: any) {
        if (err?.name === 'PasswordException') {
          let userPass = initialPassword || prompt(`"${fileName}" is password protected. Please enter password to open:`);
          let isAuth = false;
          while (userPass && !isAuth) {
            try {
              pdfjsDoc = await pdfRenderer.loadDocument(data.slice(0), userPass);
              isAuth = true;
            } catch (authErr: any) {
              if (authErr?.name === 'PasswordException') {
                userPass = prompt(`Incorrect password for "${fileName}". Please try again:`);
              } else {
                throw authErr;
              }
            }
          }
          if (!isAuth) {
            setIsLoading(false);
            setLoadError('Password prompt canceled. Could not open protected document.');
            return;
          }
        } else {
          throw err;
        }
      }

      const numPages = pdfjsDoc.numPages;

      // Load into pdf-lib editor
      let rawFields: PDFDocumentState['formFields'] = [];
      try {
        const pdfLibDoc = await PDFDocument.load(data.slice(0), { ignoreEncryption: true });
        rawFields = await pdfEngine.extractFormFields(pdfLibDoc);
      } catch (formErr) {
        console.warn('Form field extraction failed (non-fatal):', formErr);
      }

      const pages: PageInfo[] = [];
      const pageOrder: number[] = [];
      for (let i = 0; i < numPages; i++) {
        const page = await pdfjsDoc.getPage(i + 1);
        const vp = page.getViewport({ scale: 1.0 });
        pages.push({ pageNumber: i + 1, pageIndex: i, width: vp.width, height: vp.height, rotation: page.rotate });
        pageOrder.push(i);
      }

      // Calculate smart auto-fit zoom for mobile, tablet, and desktop viewports
      const screenW = window.innerWidth;
      const isMobile = screenW < 768;
      const isTablet = screenW >= 768 && screenW < 1024;
      const firstPageW = pages[0]?.width || 612;
      const availableW = isMobile ? screenW - 24 : isTablet ? screenW - 80 : screenW - 320;

      let fitZoom = 1.0;
      if (firstPageW > 0 && availableW > 0) {
        const fitScale = availableW / firstPageW;
        if (isMobile) {
          fitZoom = Math.max(0.35, Math.min(1.0, Math.floor(fitScale * 100) / 100));
        } else if (isTablet) {
          fitZoom = Math.max(0.45, Math.min(1.15, Math.floor(fitScale * 100) / 100));
        } else {
          fitZoom = Math.max(0.6, Math.min(1.25, Math.floor(fitScale * 100) / 100));
        }
      }

      setZoom(fitZoom);

      // On mobile or tablet screens, default sidebar to closed so PDF document gets 100% viewport width!
      if (isMobile || isTablet) {
        setIsSidebarOpen(false);
      }

      setDocState({
        fileName,
        fileBytes: data,
        numPages,
        pages,
        pageRotations: {},
        deletedPages: new Set<number>(),
        pageOrder,
        textAnnotations: [],
        signatures: [],
        stamps: [],
        shapes: [],
        imageStamps: [],
        strikeouts: [],
        drawings: [],
        formFields: rawFields,
      });
      setCurrentPage(1);
      setCurrentView('editor');
      trackEvent('pdf_loaded');

      // Generate thumbnails in background
      const thumbs: string[] = [];
      const { pdfRenderer: renderer } = await import('./services/pdfRenderer');
      for (let i = 0; i < numPages; i++) {
        const t = await renderer.getPageThumbnail(i, 160);
        thumbs.push(t);
      }
      setThumbnails(thumbs);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('Error loading PDF:', err);
      setLoadError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);



  const handleOpenFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    const arrayBuffer = await file.arrayBuffer();
    await loadPDFData(new Uint8Array(arrayBuffer), file.name);
    e.target.value = '';
  };

  const handleLoadSample = async () => {
    const bytes = await createSamplePDF();
    await loadPDFData(bytes, 'Sample_Agreement.pdf');
  };

  const handleCreateBlankPDF = async (options: CreatePDFOptions) => {
    const blankBytes = await createBlankPDF(options);
    await loadPDFData(blankBytes, `New_Document_${options.pageSize}.pdf`);
  };

  const handleCloseDocument = () => {
    setDocState(EMPTY_STATE);
    setCurrentPage(1);
    setToolMode('select');
    setPendingSignatureDataUrl(null);
    setThumbnails([]);
    historyRef.current = [];
    futureRef.current = [];
    updateHistoryState();
  };

  const handleMergeComplete = async (mergedBytes: Uint8Array, fileName: string) => {
    await loadPDFData(mergedBytes, fileName);
  };

  const handleRotatePage = (pageIndex: number) => {
    pushToHistory(docState);
    setDocState((prev) => ({
      ...prev,
      pageRotations: {
        ...prev.pageRotations,
        [pageIndex]: ((prev.pageRotations[pageIndex] || 0) + 90) % 360,
      },
    }));
  };

  const handleDeletePage = (pageIndex: number) => {
    pushToHistory(docState);
    setDocState((prev) => {
      const newDeleted = new Set(prev.deletedPages);
      newDeleted.add(pageIndex);
      return { ...prev, deletedPages: newDeleted };
    });
  };

  const handleMovePage = (fromSeqIdx: number, toSeqIdx: number) => {
    pushToHistory(docState);
    setDocState((prev) => {
      const activeIndices = prev.pageOrder.filter((idx) => !prev.deletedPages.has(idx));
      if (toSeqIdx < 0 || toSeqIdx >= activeIndices.length) return prev;
      const newActive = [...activeIndices];
      const [moved] = newActive.splice(fromSeqIdx, 1);
      newActive.splice(toSeqIdx, 0, moved);
      const deletedIndices = prev.pageOrder.filter((idx) => prev.deletedPages.has(idx));
      return { ...prev, pageOrder: [...newActive, ...deletedIndices] };
    });
  };

  const handleUpdateFieldValue = (fieldName: string, value: string | boolean) => {
    pushToHistory(docState);
    setActiveFormFieldName(fieldName);
    setDocState((prev) => ({
      ...prev,
      formFields: prev.formFields.map((f) =>
        f.name === fieldName || f.fieldName === fieldName
          ? {
              ...f,
              value,
              fontSize: f.fontSize || textFontSize || 10,
              fontColor: f.fontColor || textColor || '#000000',
              isRedact: f.isRedact !== undefined ? f.isRedact : Boolean(textIsRedact),
            }
          : f
      ),
    }));
  };

  const handleAddAnnotation = (ann: Omit<TextAnnotation, 'id'>) => {
    pushToHistory(docState);
    const newAnn: TextAnnotation = {
      ...ann,
      id: `text_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    };
    setDocState((prev) => ({ ...prev, textAnnotations: [...prev.textAnnotations, newAnn] }));
  };

  const handleUpdateAnnotation = (id: string, updated: Partial<TextAnnotation>) => {
    setDocState((prev) => ({
      ...prev,
      textAnnotations: prev.textAnnotations.map((a) => (a.id === id ? { ...a, ...updated } : a)),
    }));
  };

  const handleDeleteAnnotation = (id: string) => {
    pushToHistory(docState);
    setDocState((prev) => ({
      ...prev,
      textAnnotations: prev.textAnnotations.filter((a) => a.id !== id),
    }));
  };

  const [signatureModalTab, setSignatureModalTab] = useState<'draw' | 'type' | 'upload'>('draw');

  const handleOpenSignatureModal = (tab: 'draw' | 'type' | 'upload' = 'draw') => {
    setSignatureModalTab(tab);
    setIsSignatureModalOpen(true);
  };

  const handleSaveSignature = (dataUrl: string, saveLocally: boolean = true) => {
    if (saveLocally) {
      saveSignatureToStorage(dataUrl);
    }
    setPendingSignatureDataUrl(dataUrl);
    setToolMode('sign');
    setIsSignatureModalOpen(false);
  };

  const handleSelectSavedSignature = (dataUrl: string) => {
    setPendingSignatureDataUrl(dataUrl);
    setToolMode('sign');
  };

  const handleAddSignatureAtCoords = (sigData: Omit<SignatureAnnotation, 'id'>) => {
    pushToHistory(docState);
    const newSig: SignatureAnnotation = {
      ...sigData,
      id: `sig_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    };
    setDocState((prev) => ({ ...prev, signatures: [...prev.signatures, newSig] }));
    setPendingSignatureDataUrl(null);
    setToolMode('select');
  };

  const handleUpdateSignature = (id: string, updated: Partial<SignatureAnnotation>) => {
    setDocState((prev) => ({
      ...prev,
      signatures: prev.signatures.map((s) => (s.id === id ? { ...s, ...updated } : s)),
    }));
  };

  const handleDeleteSignature = (id: string) => {
    pushToHistory(docState);
    setDocState((prev) => ({ ...prev, signatures: prev.signatures.filter((s) => s.id !== id) }));
  };

  const handleAddDrawing = (drawing: Omit<FreehandDrawing, 'id'>) => {
    pushToHistory(docState);
    const newDraw: FreehandDrawing = {
      ...drawing,
      id: `draw_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    };
    setDocState((prev) => ({ ...prev, drawings: [...prev.drawings, newDraw] }));
  };

  const handleDeleteDrawing = (id: string) => {
    pushToHistory(docState);
    setDocState((prev) => ({ ...prev, drawings: prev.drawings.filter((d) => d.id !== id) }));
  };

  const handleAddStamp = (stamp: Omit<StampAnnotation, 'id'>) => {
    pushToHistory(docState);
    const newStamp: StampAnnotation = {
      ...stamp,
      id: `stamp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    };
    setDocState((prev) => ({ ...prev, stamps: [...prev.stamps, newStamp] }));
  };

  const handleDeleteStamp = (id: string) => {
    pushToHistory(docState);
    setDocState((prev) => ({ ...prev, stamps: prev.stamps.filter((s) => s.id !== id) }));
  };

  const handleAddStrikeout = (strike: Omit<StrikeoutAnnotation, 'id'>) => {
    pushToHistory(docState);
    const newStrike: StrikeoutAnnotation = {
      ...strike,
      id: `strike_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    };
    setDocState((prev) => ({ ...prev, strikeouts: [...prev.strikeouts, newStrike] }));
  };

  const handleDeleteStrikeout = (id: string) => {
    pushToHistory(docState);
    setDocState((prev) => ({ ...prev, strikeouts: prev.strikeouts.filter((s) => s.id !== id) }));
  };

  const handleAddShape = (shape: Omit<ShapeAnnotation, 'id'>) => {
    pushToHistory(docState);
    const newShape: ShapeAnnotation = {
      ...shape,
      id: `shape_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    };
    setDocState((prev) => ({ ...prev, shapes: [...(prev.shapes || []), newShape] }));
  };

  const handleUpdateShape = (id: string, updated: Partial<ShapeAnnotation>) => {
    setDocState((prev) => ({
      ...prev,
      shapes: (prev.shapes || []).map((sh) => (sh.id === id ? { ...sh, ...updated } : sh)),
    }));
  };

  const handleDeleteShape = (id: string) => {
    pushToHistory(docState);
    setDocState((prev) => ({ ...prev, shapes: (prev.shapes || []).filter((sh) => sh.id !== id) }));
  };

  const handleAddImageStamp = (imgData: Omit<ImageStampAnnotation, 'id'>) => {
    pushToHistory(docState);
    const newImg: ImageStampAnnotation = {
      ...imgData,
      id: `img_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    };
    setDocState((prev) => ({ ...prev, imageStamps: [...(prev.imageStamps || []), newImg] }));
  };

  const handleUpdateImageStamp = (id: string, updated: Partial<ImageStampAnnotation>) => {
    setDocState((prev) => ({
      ...prev,
      imageStamps: (prev.imageStamps || []).map((img) => (img.id === id ? { ...img, ...updated } : img)),
    }));
  };

  const handleDeleteImageStamp = (id: string) => {
    pushToHistory(docState);
    setDocState((prev) => ({ ...prev, imageStamps: (prev.imageStamps || []).filter((img) => img.id !== id) }));
  };

  const handleApplyWatermark = (options: WatermarkOptions) => {
    if (!docState.fileBytes || docState.pages.length === 0) return;
    pushToHistory(docState);

    const activePageIndices = docState.pageOrder.filter((idx) => !docState.deletedPages.has(idx));

    if (options.type === 'text' && options.text) {
      const newTextAnns: TextAnnotation[] = [];
      activePageIndices.forEach((pageIdx) => {
        const pageInfo = docState.pages.find((p) => p.pageIndex === pageIdx);
        const w = pageInfo?.width || 612;
        const h = pageInfo?.height || 792;

        let x = (w - (options.text!.length * (options.fontSize || 48) * 0.45)) / 2;
        let y = h / 2 - 20;

        if (options.position === 'top-left') {
          x = 40;
          y = 50;
        } else if (options.position === 'bottom-right') {
          x = w - 250;
          y = h - 80;
        }

        newTextAnns.push({
          id: `wm_text_${Date.now()}_${pageIdx}_${Math.random().toString(36).substring(2, 6)}`,
          pageIndex: pageIdx,
          x: Math.max(10, x),
          y: Math.max(10, y),
          text: options.text!,
          color: options.color || '#ef4444',
          fontSize: options.fontSize || 48,
          isRedact: false,
          opacity: options.opacity,
          rotation: options.rotation,
        });
      });

      setDocState((prev) => ({
        ...prev,
        textAnnotations: [...prev.textAnnotations, ...newTextAnns],
      }));
    } else if (options.type === 'image' && options.dataUrl) {
      const newSigs: SignatureAnnotation[] = [];
      activePageIndices.forEach((pageIdx) => {
        const pageInfo = docState.pages.find((p) => p.pageIndex === pageIdx);
        const w = pageInfo?.width || 612;
        const h = pageInfo?.height || 792;
        const imgW = 240;
        const imgH = 140;

        let x = (w - imgW) / 2;
        let y = (h - imgH) / 2;

        if (options.position === 'top-left') {
          x = 40;
          y = 40;
        } else if (options.position === 'bottom-right') {
          x = w - imgW - 40;
          y = h - imgH - 40;
        }

        newSigs.push({
          id: `wm_img_${Date.now()}_${pageIdx}_${Math.random().toString(36).substring(2, 6)}`,
          pageIndex: pageIdx,
          x: Math.max(10, x),
          y: Math.max(10, y),
          width: imgW,
          height: imgH,
          dataUrl: options.dataUrl!,
          opacity: options.opacity,
          rotation: options.rotation,
        });
      });

      setDocState((prev) => ({
        ...prev,
        signatures: [...prev.signatures, ...newSigs],
      }));
    }
  };

  const convertBytesToBase64 = (bytes: Uint8Array): string => {
    let binary = '';
    const chunkSize = 0x8000; // 32KB chunk limit
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const sub = bytes.subarray(i, i + chunkSize);
      binary += String.fromCharCode.apply(null, Array.from(sub));
    }
    return btoa(binary);
  };

  const handleExportPDF = useCallback(async () => {
    if (!docState.fileBytes) return;
    setIsExporting(true);
    try {
      const { pdfEngine } = await import('./services/pdfEngine');
      const modifiedPdfBytes = await pdfEngine.exportDocument(docState);
      const defaultName = `Edited_${docState.fileName || 'document.pdf'}`;

      if (IS_ELECTRON && window.electronAPI) {
        const result = await window.electronAPI.showSaveDialog(defaultName);
        if (!result.canceled && result.filePath) {
          const base64 = convertBytesToBase64(modifiedPdfBytes);
          const writeResult = await window.electronAPI.writeFile(result.filePath, base64);
          if (!writeResult.success) throw new Error(writeResult.error);
        }
      } else {
        const blob = new Blob([modifiedPdfBytes as any], { type: 'application/pdf' });
        await downloadFile({ fileName: defaultName, blob, mimeType: 'application/pdf' });
      }
      trackEvent('export_downloaded');
    } catch (err) {
      console.error('Export error:', err);
      const errMsg = err instanceof Error ? err.message : String(err);
      alert(`Export failed: ${errMsg}`);
    } finally {
      setIsExporting(false);
    }
  }, [docState]);

  const handleSavePDF = useCallback(async () => {
    if (!docState.fileBytes) return;
    setIsSaving(true);
    try {
      const { pdfEngine } = await import('./services/pdfEngine');
      const modifiedPdfBytes = await pdfEngine.exportDocument(docState);
      const saveName = docState.fileName ? docState.fileName : 'document.pdf';

      if (IS_ELECTRON && window.electronAPI) {
        const result = await window.electronAPI.showSaveDialog(saveName);
        if (!result.canceled && result.filePath) {
          const base64 = convertBytesToBase64(modifiedPdfBytes);
          const writeResult = await window.electronAPI.writeFile(result.filePath, base64);
          if (!writeResult.success) throw new Error(writeResult.error);
        }
      } else {
        const blob = new Blob([modifiedPdfBytes as any], { type: 'application/pdf' });
        await downloadFile({ fileName: saveName, blob, mimeType: 'application/pdf' });
      }
    } catch (err) {
      console.error('Save error:', err);
      const errMsg = err instanceof Error ? err.message : String(err);
      alert(`Save failed: ${errMsg}`);
    } finally {
      setIsSaving(false);
    }
  }, [docState]);

  const handlePrintPDF = useCallback(async () => {
    if (!docState.fileBytes) return;
    setIsPrinting(true);
    try {
      const { pdfEngine } = await import('./services/pdfEngine');
      const modifiedPdfBytes = await pdfEngine.exportDocument(docState);
      const blob = new Blob([new Uint8Array(modifiedPdfBytes)], { type: 'application/pdf' });
      await printPdfBlob(blob);
    } catch (err) {
      console.error('Print error:', err);
      const errMsg = err instanceof Error ? err.message : String(err);
      alert(`Print failed: ${errMsg}`);
    } finally {
      setIsPrinting(false);
    }
  }, [docState]);

  const handleExportMultiplePDFs = useCallback(
    async (mode: 'split_all' | 'custom_range', customRanges?: string) => {
      if (!docState.fileBytes) return;
      setIsExportingMultiple(true);
      try {
        const { pdfEngine } = await import('./services/pdfEngine');
        const result = await pdfEngine.exportMultiplePDFs(docState, mode, customRanges);

        if (IS_ELECTRON && window.electronAPI) {
          const saveRes = await window.electronAPI.showSaveDialog(result.fileName);
          if (!saveRes.canceled && saveRes.filePath) {
            const base64 = convertBytesToBase64(result.data);
            const writeResult = await window.electronAPI.writeFile(saveRes.filePath, saveRes.filePath ? saveRes.filePath : result.fileName);
            if (!writeResult.success) throw new Error(writeResult.error);
          }
        } else {
          const blob = new Blob([result.data.buffer as ArrayBuffer], { type: 'application/zip' });
          await downloadFile({ fileName: result.fileName, blob, mimeType: 'application/zip' });
        }
      } catch (err) {
        console.error('Export multiple PDFs error:', err);
        const errMsg = err instanceof Error ? err.message : String(err);
        alert(`Export multiple PDFs failed: ${errMsg}`);
      } finally {
        setIsExportingMultiple(false);
      }
    },
    [docState]
  );

  const handleOpenPayloadData = useCallback(
    (payload: { fileName: string; base64Data: string }) => {
      try {
        const binaryString = atob(payload.base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        loadPDFData(bytes, payload.fileName);
      } catch (err) {
        console.error('Failed to parse system opened PDF payload:', err);
      }
    },
    [loadPDFData]
  );

  // Wire up Electron native menu events & system file association events
  useEffect(() => {
    if (!IS_ELECTRON || !window.electronAPI) return;
    const api = window.electronAPI;
    api.onOpenFile(() => document.getElementById('__pdf-file-input__')?.click());
    api.onLoadSample(() => handleLoadSample());
    api.onExportPDF(() => handleExportPDF());
    api.onOpenPdfPayload((payload) => handleOpenPayloadData(payload));

    api.requestPendingPdfPayload().then((payload) => {
      if (payload) handleOpenPayloadData(payload);
    });

    return () => {
      api.removeAllListeners('menu-open-file');
      api.removeAllListeners('menu-load-sample');
      api.removeAllListeners('menu-export-pdf');
      api.removeAllListeners('open-pdf-payload');
    };
  }, [handleExportPDF, handleOpenPayloadData]);

  // Automatically launch into PDF Editor Workspace for Desktop App (Electron) or direct link
  useEffect(() => {
    try {
      const isFileProtocol = window.location.protocol === 'file:';
      const isElectronEnv = typeof window !== 'undefined' && ((window as any).electronAPI !== undefined || isFileProtocol);
      const urlParams = new URLSearchParams(window.location.search);
      const hasEditorQuery = urlParams.get('editor') === 'true' || window.location.hash.includes('editor');

      if (isElectronEnv || hasEditorQuery) {
        setCurrentView('editor');
      } else {
        setCurrentView('landing');
      }
    } catch (e) {
      setCurrentView('landing');
    }
  }, []);

  const handleLaunchEditor = () => {
    try {
      localStorage.setItem('isa_editor_unlocked', 'true');
    } catch (e) {}
    setCurrentView('editor');
  };

  if (currentView === 'landing') {
    return (
      <Suspense fallback={null}>
        <LandingPage
          onLaunchEditor={handleLaunchEditor}
          themePreset={themePreset}
          activeTheme={activeTheme}
          onOpenThemeModal={() => setIsThemeModalOpen(true)}
          onOpenUserGuide={() => setIsUserGuideModalOpen(true)}
          onOpenScanModal={() => setIsScanModalOpen(true)}
          isProActive={isProActive}
        />
        {isScanModalOpen && (
          <ScanModal
            isOpen={isScanModalOpen}
            onClose={() => setIsScanModalOpen(false)}
            onScanComplete={(pdfBytes, fileName) => {
              loadPDFData(pdfBytes, fileName);
              setCurrentView('editor');
            }}
          />
        )}
        {isThemeModalOpen && (
          <ThemeModal
            isOpen={isThemeModalOpen}
            onClose={() => setIsThemeModalOpen(false)}
            currentPreset={themePreset}
            onSelectPreset={(p) => {
              setThemePreset(p);
              try {
                localStorage.setItem('isa_theme_preset', p);
              } catch (e) {}
            }}
            onOpenCheckout={() => {
              setIsThemeModalOpen(false);
            }}
          />
        )}
        {isUserGuideModalOpen && (
          <UserGuideModal
            isOpen={isUserGuideModalOpen}
            onClose={() => setIsUserGuideModalOpen(false)}
          />
        )}
      </Suspense>
    );
  }

  const pageOrder = docState?.pageOrder || [];
  const deletedPages = docState?.deletedPages || new Set<number>();
  const activePagesCount = pageOrder.filter((idx) => !deletedPages.has(idx)).length;
  const hasDocument = Boolean(docState?.fileBytes);

  const isLight = activeTheme?.id === 'light_pearl' || activeTheme?.id === 'gold_sunlight';

  return (
    <Suspense fallback={null}>
      <div className={`flex flex-col h-screen w-screen ${activeTheme?.bgClass || 'bg-slate-950'} ${isLight ? 'text-slate-900' : 'text-slate-100'} overflow-hidden font-sans transition-colors duration-500`}>
      <HeaderToolbar
        activeTheme={activeTheme}
        onGoToLandingPage={() => setCurrentView('landing')}
        onCloseDocument={handleCloseDocument}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={canUndo}
        canRedo={canRedo}
        toolMode={toolMode}
        setToolMode={setToolMode}
        currentPage={currentPage}
        totalPages={activePagesCount}
        onPageChange={setCurrentPage}
        zoom={zoom}
        onZoomChange={setZoom}
        onFitToWidth={handleFitToWidth}
        onOpenFile={handleOpenFile}
        onLoadSample={handleLoadSample}
        onOpenSignatureModal={handleOpenSignatureModal}
        onOpenWatermarkModal={() => setIsWatermarkModalOpen(true)}
        onOpenPageManager={() => setIsPageManagerOpen(true)}
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
        onOpenMergeModal={() => setIsMergeModalOpen(true)}
        onOpenSaveMultipleModal={() => setIsSaveMultipleModalOpen(true)}
        onOpenPremiumExportModal={handleOpenPremiumExportModal}
        onOpenRecentFile={handleOpenRecentFile}
        onSelectSavedSignature={handleSelectSavedSignature}
        onRotatePage={handleRotatePage}
        onSavePDF={handleSavePDF}
        onExportPDF={handleExportPDF}
        onPrintPDF={handlePrintPDF}
        isSaving={isSaving}
        isExporting={isExporting}
        isPrinting={isPrinting}
        hasDocument={hasDocument}
        textFontSize={textFontSize}
        setTextFontSize={handleSetTextFontSize}
        textFontFamily={textFontFamily}
        setTextFontFamily={handleSetTextFontFamily}
        textColor={textColor}
        setTextColor={handleSetTextColor}
        textIsRedact={textIsRedact}
        setTextIsRedact={handleSetTextIsRedact}
        textIsUnderline={textIsUnderline}
        setTextIsUnderline={setTextIsUnderline}
        shapeStrokeColor={shapeStrokeColor}
        setShapeStrokeColor={setShapeStrokeColor}
        shapeFillColor={shapeFillColor}
        setShapeFillColor={setShapeFillColor}
        shapeStrokeWidth={shapeStrokeWidth}
        setShapeStrokeWidth={setShapeStrokeWidth}
        onAddImageStamp={handleAddImageStamp}
        onOpenPasswordModal={(mode) => {
          setPasswordModalMode(mode);
          setIsPasswordModalOpen(true);
        }}
        onOpenCompressModal={() => setIsCompressModalOpen(true)}
        onOpenScanModal={() => setIsScanModalOpen(true)}
        onOpenDesktopDownloadModal={() => setIsAppDownloadModalOpen(true)}
        isProActive={isProActive}
        onOpenCheckout={() => setIsHelcimCheckoutOpen(true)}
      />

      <div className="flex flex-1 overflow-hidden relative">
        {hasDocument && (
          <Sidebar
            state={docState}
            thumbnails={thumbnails}
            currentPage={currentPage}
            onSelectPage={setCurrentPage}
            onRotatePage={handleRotatePage}
            onDeletePage={handleDeletePage}
            isOpen={isSidebarOpen}
            onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          />
        )}

        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur">
            <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-sm font-semibold text-cyan-300">Processing PDF Document...</p>
          </div>
        )}

        {/* Load error overlay */}
        {loadError && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-rose-900/90 border border-rose-700 rounded-xl px-6 py-3 text-xs text-rose-200 shadow-xl max-w-md text-center">
            <span className="font-bold text-rose-300">Error:</span> {loadError}
          </div>
        )}

        <PDFCanvasViewer
          state={docState}
          currentPage={currentPage}
          onPageVisibleChange={setCurrentPage}
          zoom={zoom}
          onZoomChange={setZoom}
          onFitToWidth={handleFitToWidth}
          toolMode={toolMode}
          pendingSignatureDataUrl={pendingSignatureDataUrl}
          onCloseDocument={handleCloseDocument}
          onUpdateFieldValue={handleUpdateFieldValue}
          onFocusFormField={(name) => setActiveFormFieldName(name)}
          onAddAnnotation={handleAddAnnotation}
          onUpdateAnnotation={handleUpdateAnnotation}
          onDeleteAnnotation={handleDeleteAnnotation}
          onAddSignatureAtCoords={handleAddSignatureAtCoords}
          onUpdateSignature={handleUpdateSignature}
          onDeleteSignature={handleDeleteSignature}
          onAddDrawing={handleAddDrawing}
          onDeleteDrawing={handleDeleteDrawing}
          onAddStamp={handleAddStamp}
          onDeleteStamp={handleDeleteStamp}
          onAddStrikeout={handleAddStrikeout}
          onDeleteStrikeout={handleDeleteStrikeout}
          onAddShape={handleAddShape}
          onUpdateShape={handleUpdateShape}
          onDeleteShape={handleDeleteShape}
          onAddImageStamp={handleAddImageStamp}
          onUpdateImageStamp={handleUpdateImageStamp}
          onDeleteImageStamp={handleDeleteImageStamp}
          onOpenFile={handleOpenFile}
          onLoadSample={handleLoadSample}
          onOpenCreateModal={() => setIsCreateModalOpen(true)}
          onOpenMergeModal={() => setIsMergeModalOpen(true)}
          onOpenScanModal={() => setIsScanModalOpen(true)}
          onOpenSignatureModal={handleOpenSignatureModal}
          isLoading={isLoading}
          textColor={textColor}
          textFontSize={textFontSize}
          textFontFamily={textFontFamily}
          textIsRedact={textIsRedact}
          textIsUnderline={textIsUnderline}
          shapeStrokeColor={shapeStrokeColor}
          shapeFillColor={shapeFillColor}
          shapeStrokeWidth={shapeStrokeWidth}
          activeTheme={activeTheme}
        />
      </div>

      {/* Signature Modal */}
      <SignatureModal
        isOpen={isSignatureModalOpen}
        onClose={() => setIsSignatureModalOpen(false)}
        onSaveSignature={handleSaveSignature}
        initialTab={signatureModalTab}
        isProActive={isProActive}
        onOpenCheckout={() => setIsHelcimCheckoutOpen(true)}
      />

      {/* Page Manager Grid Modal */}
      <PageManagerModal
        isOpen={isPageManagerOpen}
        onClose={() => setIsPageManagerOpen(false)}
        state={docState}
        thumbnails={thumbnails}
        onRotatePage={handleRotatePage}
        onDeletePage={handleDeletePage}
        onMovePage={handleMovePage}
      />

      {/* Create Blank PDF Modal */}
      <CreatePDFModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreatePDF={handleCreateBlankPDF}
      />

      {/* Merge / Combine PDFs Modal */}
      <MergePDFModal
        isOpen={isMergeModalOpen}
        onClose={() => setIsMergeModalOpen(false)}
        onMergeComplete={handleMergeComplete}
      />

      {/* Save / Export Multiple PDFs Modal */}
      <SaveMultiplePDFsModal
        isOpen={isSaveMultipleModalOpen}
        onClose={() => setIsSaveMultipleModalOpen(false)}
        state={docState}
        onExportMultiple={handleExportMultiplePDFs}
        isProcessing={isExportingMultiple}
      />

      {/* Premium Format Export & Converter Modal */}
      <PremiumExportModal
        isOpen={isPremiumExportModalOpen}
        onClose={() => setIsPremiumExportModalOpen(false)}
        state={docState}
        initialFormat={premiumExportFormat}
        isProActive={isProActive}
        onOpenCheckout={() => setIsHelcimCheckoutOpen(true)}
      />

      {/* Custom Watermark & Logo Overlay Modal */}
      <WatermarkModal
        isOpen={isWatermarkModalOpen}
        onClose={() => setIsWatermarkModalOpen(false)}
        onApplyWatermark={handleApplyWatermark}
      />

      {/* Theme & Background Customizer Modal */}
      <ThemeModal
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
        currentPreset={themePreset}
        onSelectPreset={(p) => {
          setThemePreset(p);
          try {
            localStorage.setItem('isa_theme_preset', p);
          } catch (e) {}
        }}
        onOpenCheckout={() => {
          setIsThemeModalOpen(false);
        }}
      />

      {/* User Guide & Security Whitepaper Modal */}
      <UserGuideModal
        isOpen={isUserGuideModalOpen}
        onClose={() => setIsUserGuideModalOpen(false)}
        onOpenCheckout={() => setIsHelcimCheckoutOpen(true)}
      />

      {/* Helcim Checkout & License Key Modal */}
      <HelcimCheckoutModal
        isOpen={isHelcimCheckoutOpen}
        onClose={() => setIsHelcimCheckoutOpen(false)}
        onPaymentSuccess={(plan) => {
          localStorage.setItem('isa_pro_active', 'true');
          setIsProActive(true);
          setShowProWelcomeModal(true);
        }}
      />

      {/* Password Security Modal (Add / Remove Password) */}
      <PasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        pdfBytes={docState.fileBytes}
        fileName={docState.fileName}
        initialMode={passwordModalMode}
        onApplyDecryptedPDF={(decryptedBytes) => {
          const unlockedName = docState.fileName
            ? docState.fileName.replace(/\.pdf$/i, '_unlocked.pdf')
            : 'document_unlocked.pdf';
          loadPDFData(decryptedBytes, unlockedName);
        }}
      />

      {/* Compress PDF Modal */}
      <CompressModal
        isOpen={isCompressModalOpen}
        onClose={() => setIsCompressModalOpen(false)}
        pdfBytes={docState.fileBytes}
        fileName={docState.fileName}
      />

      {/* Document Camera Scanner Modal */}
      <ScanModal
        isOpen={isScanModalOpen}
        onClose={() => setIsScanModalOpen(false)}
        onScanComplete={(pdfBytes, fileName) => {
          loadPDFData(pdfBytes, fileName);
          setCurrentView('editor');
        }}
      />

      {/* App & Mobile Download Modal */}
      <AppDownloadModal
        isOpen={isAppDownloadModalOpen}
        onClose={() => setIsAppDownloadModalOpen(false)}
      />

      {/* Post-Payment Pro Welcome Modal */}
      {showProWelcomeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md bg-slate-900 border border-emerald-500/50 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden text-slate-100 text-center">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -z-10" />
            <div className="mx-auto w-14 h-14 bg-gradient-to-tr from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-extrabold text-white">Welcome to ISASecuredPDF Pro!</h3>
            <p className="text-xs text-slate-300 my-3 leading-relaxed">
              Your payment was verified successfully. All Pro features, advanced stamps, password encryption, and unlimited batch processing are now 100% unlocked on your device.
            </p>
            <button
              onClick={() => setShowProWelcomeModal(false)}
              className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition active:scale-95"
            >
              Start Using Pro Features →
            </button>
          </div>
        </div>
      )}
    </div>
    </Suspense>
  );
};
