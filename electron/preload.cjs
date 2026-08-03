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

  // Remove listeners
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),

  // Environment
  isElectron: true,
});
