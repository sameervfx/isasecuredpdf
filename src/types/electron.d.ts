interface PdfPayload {
  fileName: string;
  base64Data: string;
}

interface ElectronAPI {
  showSaveDialog: (defaultName?: string) => Promise<Electron.SaveDialogReturnValue>;
  showOpenDialog: () => Promise<Electron.OpenDialogReturnValue>;
  writeFile: (filePath: string, base64Data: string) => Promise<{ success: boolean; error?: string }>;
  onOpenFile: (callback: () => void) => void;
  onLoadSample: (callback: () => void) => void;
  onExportPDF: (callback: () => void) => void;
  onOpenPdfPayload: (callback: (payload: PdfPayload) => void) => void;
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
