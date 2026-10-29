const { contextBridge, ipcRenderer } = require('electron');

// Expose safe Electron APIs to the renderer process via window.electronAPI
contextBridge.exposeInMainWorld('electronAPI', {
  // File dialogs
  showSaveDialog: (defaultName) => ipcRenderer.invoke('show-save-dialog', defaultName),
  showOpenDialog: () => ipcRenderer.invoke('show-open-dialog'),
  writeFile: (filePath, base64Data) => ipcRenderer.invoke('write-file', filePath, base64Data),

  // Menu & system file association events → React handlers
  onOpenFile: (callback) => ipcRenderer.on('menu-open-file', callback),
  onLoadSample: (callback) => ipcRenderer.on('menu-load-sample', callback),
  onExportPDF: (callback) => ipcRenderer.on('menu-export-pdf', callback),
  onOpenPdfPayload: (callback) => ipcRenderer.on('open-pdf-payload', (_evt, data) => callback(data)),
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
