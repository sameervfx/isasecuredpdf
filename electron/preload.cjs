const { contextBridge, ipcRenderer, webUtils } = require('electron');

// Expose safe Electron APIs to the renderer process via window.electronAPI
contextBridge.exposeInMainWorld('electronAPI', {
  // File dialogs & direct disk reads
  showSaveDialog: (defaultName) => ipcRenderer.invoke('show-save-dialog', defaultName),
  showOpenDialog: () => ipcRenderer.invoke('show-open-dialog'),
  readFileByPath: (filePath) => ipcRenderer.invoke('read-file-by-path', filePath),
  getPathForFile: (file) => {
    try {
      return webUtils?.getPathForFile ? webUtils.getPathForFile(file) : '';
    } catch {
      return '';
    }
  },
  writeFile: (filePath, base64Data) => ipcRenderer.invoke('write-file', filePath, base64Data),

  // Menu & system file association events → React handlers
  onOpenFile: (callback) => ipcRenderer.on('menu-open-file', callback),
  onLoadSample: (callback) => ipcRenderer.on('menu-load-sample', callback),
  onExportPDF: (callback) => ipcRenderer.on('menu-export-pdf', callback),
  onOpenPdfPayload: (callback) => ipcRenderer.on('open-pdf-payload', (_evt, data) => callback(data)),
  onZoomIn: (callback) => ipcRenderer.on('menu-zoom-in', callback),
  onZoomOut: (callback) => ipcRenderer.on('menu-zoom-out', callback),
  onZoomActual: (callback) => ipcRenderer.on('menu-zoom-actual', callback),
  requestPendingPdfPayload: () => ipcRenderer.invoke('request-pending-pdf-payload'),
  toggleFullscreen: () => ipcRenderer.invoke('toggle-fullscreen'),
  setFullscreen: (flag) => ipcRenderer.invoke('set-fullscreen', flag),
  isFullscreen: () => ipcRenderer.invoke('is-fullscreen'),
  onSetFullscreenState: (callback) => ipcRenderer.on('set-fullscreen-state', (_evt, val) => callback(val)),
  openPdfInSystemViewer: (base64Data, fileName) => ipcRenderer.invoke('open-pdf-in-system-viewer', base64Data, fileName),

  // Remove listeners
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),

  // Environment
  isElectron: true,
});
