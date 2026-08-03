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
  removeAllListeners: (channel: string) => void;
  isElectron: boolean;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};
