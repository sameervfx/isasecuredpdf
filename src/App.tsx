import React, { useState, useEffect, useCallback, useRef } from 'react';
import { PDFDocument } from 'pdf-lib';
import { HeaderToolbar } from './components/HeaderToolbar';
import { Sidebar } from './components/Sidebar';
import { PDFCanvasViewer } from './components/PDFCanvasViewer';
import { SignatureModal } from './components/SignatureModal';
import { PageManagerModal } from './components/PageManagerModal';
import { CreatePDFModal } from './components/CreatePDFModal';
import { MergePDFModal } from './components/MergePDFModal';
import { SaveMultiplePDFsModal } from './components/SaveMultiplePDFsModal';
import { WatermarkModal, WatermarkOptions } from './components/WatermarkModal';
import { PremiumExportModal, ExportFormatType } from './components/PremiumExportModal';
import { LandingPage } from './pages/LandingPage';
import { pdfRenderer } from './services/pdfRenderer';
import { pdfEngine } from './services/pdfEngine';
import { createSamplePDF } from './utils/samplePdf';
import { createBlankPDF, CreatePDFOptions } from './utils/blankPdf';
import { saveSignatureToStorage } from './utils/savedSignatures';
import { addRecentFile, RecentFileItem } from './utils/recentFiles';
import './types/electron.d';
import {
  PDFDocumentState,
  ToolMode,
  TextAnnotation,
  SignatureAnnotation,
  StampAnnotation,
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
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
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

  // Text Tool Formatting Defaults
  const [textFontSize, setTextFontSize] = useState<number>(14);
  const [textFontFamily, setTextFontFamily] = useState<string>("'Times New Roman', Times, serif");
  const [textColor, setTextColor] = useState<string>('#000000');
  const [textIsRedact, setTextIsRedact] = useState<boolean>(false);
  const [activeFormFieldName, setActiveFormFieldName] = useState<string | null>(null);

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

  const updateHistoryState = () => {
    setCanUndo(historyRef.current.length > 0);
    setCanRedo(futureRef.current.length > 0);
  };

  const pushToHistory = useCallback((previousState: PDFDocumentState) => {
    if (!previousState.fileBytes) return;
    historyRef.current.push(JSON.parse(JSON.stringify({
      ...previousState,
      deletedPages: Array.from(previousState.deletedPages),
    })));
    if (historyRef.current.length > 40) {
      historyRef.current.shift();
    }
    futureRef.current = [];
    updateHistoryState();
  }, []);

  const restoreState = (st: any): PDFDocumentState => ({
    ...st,
    deletedPages: new Set(st.deletedPages || []),
  });

  const handleUndo = useCallback(() => {
    if (historyRef.current.length === 0) return;
    const prevRaw = historyRef.current.pop();
    if (!prevRaw) return;
    setDocState((current) => {
      futureRef.current.push(JSON.parse(JSON.stringify({
        ...current,
        deletedPages: Array.from(current.deletedPages),
      })));
      return restoreState(prevRaw);
    });
    updateHistoryState();
  }, []);

  const handleRedo = useCallback(() => {
    if (futureRef.current.length === 0) return;
    const nextRaw = futureRef.current.pop();
    if (!nextRaw) return;
    setDocState((current) => {
      historyRef.current.push(JSON.parse(JSON.stringify({
        ...current,
        deletedPages: Array.from(current.deletedPages),
      })));
      return restoreState(nextRaw);
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

  const loadPDFData = useCallback(async (data: Uint8Array, fileName: string) => {
    setIsLoading(true);
    setLoadError(null);
    try {
      // Record in recent files history
      addRecentFile(fileName);

      // Load into PDF.js renderer
      const pdfjsDoc = await pdfRenderer.loadDocument(data.slice(0));
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
        strikeouts: [],
        drawings: [],
        formFields: rawFields,
      });
      setCurrentPage(1);
      setCurrentView('editor');

      // Generate thumbnails in background
      const thumbs: string[] = [];
      for (let i = 0; i < numPages; i++) {
        const t = await pdfRenderer.getPageThumbnail(i, 160);
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
    pushToHistory(docState);
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

  const [signatureModalTab, setSignatureModalTab] = useState<'draw' | 'upload'>('draw');

  const handleOpenSignatureModal = (tab: 'draw' | 'upload' = 'draw') => {
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
    pushToHistory(docState);
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
        if ('showSaveFilePicker' in window) {
          try {
            const handle = await (window as any).showSaveFilePicker({
              suggestedName: defaultName,
              types: [{ description: 'PDF Document', accept: { 'application/pdf': ['.pdf'] } }],
            });
            const writable = await handle.createWritable();
            await writable.write(blob);
            await writable.close();
            return;
          } catch (pickerErr: any) {
            if (pickerErr.name === 'AbortError') return;
          }
        }
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = defaultName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 2000);
      }
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
        if ('showSaveFilePicker' in window) {
          try {
            const handle = await (window as any).showSaveFilePicker({
              suggestedName: saveName,
              types: [{ description: 'PDF Document', accept: { 'application/pdf': ['.pdf'] } }],
            });
            const writable = await handle.createWritable();
            await writable.write(blob);
            await writable.close();
            return;
          } catch (pickerErr: any) {
            if (pickerErr.name === 'AbortError') return;
          }
        }
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = saveName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 2000);
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
      // Export current state (flattened text, signatures, forms & annotations)
      const modifiedPdfBytes = await pdfEngine.exportDocument(docState);
      const blob = new Blob([new Uint8Array(modifiedPdfBytes)], { type: 'application/pdf' });
      const blobUrl = URL.createObjectURL(blob);

      // 1. Open dedicated browser Print Preview window with native PDF viewer
      const printWin = window.open(blobUrl, '_blank');
      if (printWin) {
        printWin.focus();
        // Trigger auto-print after viewer rendering
        setTimeout(() => {
          try {
            printWin.print();
          } catch (e) {
            console.log('PDF Preview window opened successfully. User can trigger print via window control:', e);
          }
        }, 600);
      } else {
        // Fallback for pop-up blocked environments
        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = '0';
        iframe.src = blobUrl;

        document.body.appendChild(iframe);
        iframe.onload = () => {
          setTimeout(() => {
            try {
              iframe.contentWindow?.focus();
              iframe.contentWindow?.print();
            } catch (e) {
              console.error('Print iframe error:', e);
            }
            setTimeout(() => {
              if (document.body.contains(iframe)) {
                document.body.removeChild(iframe);
              }
              URL.revokeObjectURL(blobUrl);
            }, 3000);
          }, 300);
        };
      }
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
        const result = await pdfEngine.exportMultiplePDFs(docState, mode, customRanges);

        if (IS_ELECTRON && window.electronAPI) {
          const saveRes = await window.electronAPI.showSaveDialog(result.fileName);
          if (!saveRes.canceled && saveRes.filePath) {
            const base64 = convertBytesToBase64(result.data);
            const writeResult = await window.electronAPI.writeFile(saveRes.filePath, base64);
            if (!writeResult.success) throw new Error(writeResult.error);
          }
        } else {
          const blob = new Blob([result.data.buffer as ArrayBuffer], { type: 'application/zip' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = result.fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setTimeout(() => URL.revokeObjectURL(url), 1000);
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
      <LandingPage
        onLaunchEditor={handleLaunchEditor}
      />
    );
  }

  const activePagesCount = docState.pageOrder.filter((idx) => !docState.deletedPages.has(idx)).length;
  const hasDocument = Boolean(docState.fileBytes);

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 overflow-hidden text-slate-100 font-sans">
      <HeaderToolbar
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
            <div className="flex flex-col items-center space-y-4">
              <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
              <p className="text-sm font-medium text-slate-300">Processing PDF document…</p>
            </div>
          </div>
        )}

        {/* Error banner */}
        {loadError && !isLoading && (
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
          onOpenFile={handleOpenFile}
          onLoadSample={handleLoadSample}
          onOpenCreateModal={() => setIsCreateModalOpen(true)}
          onOpenMergeModal={() => setIsMergeModalOpen(true)}
          isLoading={isLoading}
          textColor={textColor}
          textFontSize={textFontSize}
          textIsRedact={textIsRedact}
        />
      </div>

      {/* Signature Modal */}
      <SignatureModal
        isOpen={isSignatureModalOpen}
        onClose={() => setIsSignatureModalOpen(false)}
        onSaveSignature={handleSaveSignature}
        initialTab={signatureModalTab}
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
      />

      {/* Custom Watermark & Logo Overlay Modal */}
      <WatermarkModal
        isOpen={isWatermarkModalOpen}
        onClose={() => setIsWatermarkModalOpen(false)}
        onApplyWatermark={handleApplyWatermark}
      />
    </div>
  );
};
