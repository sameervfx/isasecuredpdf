interface PdfPayload {
  fileName: string;
  base64Data: string;
  filePath?: string;
}

interface ElectronAPI {
  showSaveDialog: (defaultName?: string) => Promise<{ canceled: boolean; filePath?: string }>;
  showOpenDialog: () => Promise<{ canceled: boolean; filePaths?: string[]; filePath?: string; fileName?: string; base64Data?: string }>;
  readFileByPath?: (filePath: string) => Promise<{ success: boolean; base64Data?: string; fileName?: string; filePath?: string; error?: string }>;
  getPathForFile?: (file: File) => string;
  writeFile: (filePath: string, base64Data: string) => Promise<{ success: boolean; error?: string }>;
  onOpenFile: (callback: () => void) => void;
  onLoadSample: (callback: () => void) => void;
  onExportPDF: (callback: () => void) => void;
  onOpenPdfPayload: (callback: (payload: PdfPayload) => void) => void;
  onZoomIn?: (callback: () => void) => void;
  onZoomOut?: (callback: () => void) => void;
  onZoomActual?: (callback: () => void) => void;
  requestPendingPdfPayload: () => Promise<PdfPayload | null>;
  toggleFullscreen?: () => Promise<boolean>;
  setFullscreen?: (flag: boolean) => Promise<boolean>;
  isFullscreen?: () => Promise<boolean>;
  onSetFullscreenState?: (callback: (isFull: boolean) => void) => void;
  openPdfInSystemViewer?: (base64Data: string, fileName?: string) => Promise<{ success: boolean; filePath?: string; error?: string }>;
  removeAllListeners: (channel: string) => void;
  isElectron: boolean;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};
