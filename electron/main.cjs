process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true';

const { app, BrowserWindow, Menu, shell, dialog, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

// Fix Chromium GPU Shader Cache access denied lock on Windows
app.commandLine.appendSwitch('disable-gpu-shader-disk-cache');
app.commandLine.appendSwitch('disable-gpu-program-cache');

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

let mainWindow = null;
let pendingPdfPayload = null;

function parsePdfPathFromArgs(argv) {
  if (!argv || !Array.isArray(argv)) return null;
  for (let i = 1; i < argv.length; i++) {
    const arg = argv[i];
    if (arg && !arg.startsWith('-') && arg.toLowerCase().endsWith('.pdf')) {
      if (fs.existsSync(arg)) return arg;
    }
  }
  return null;
}

function handleOpenedPdfFile(filePath) {
  if (!filePath || !fs.existsSync(filePath)) return;
  try {
    const fileBytes = fs.readFileSync(filePath);
    const payload = {
      fileName: path.basename(filePath),
      base64Data: fileBytes.toString('base64'),
    };
    pendingPdfPayload = payload;
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('open-pdf-payload', payload);
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  } catch (err) {
    console.error('Failed to read opened PDF file from system:', err);
  }
}

// Single instance lock for opening system files
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (_event, commandLine) => {
    const openedPath = parsePdfPathFromArgs(commandLine);
    if (openedPath) {
      handleOpenedPdfFile(openedPath);
    } else if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

// macOS open-file event handler
app.on('open-file', (event, filePath) => {
  event.preventDefault();
  handleOpenedPdfFile(filePath);
});

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 600,
    title: 'Isa Secure PDF Suite',
    icon: path.join(__dirname, 'icon.png'),
    backgroundColor: '#020617', // slate-950
    titleBarStyle: 'default',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webSecurity: true,
    },
    show: false,
  });

  // Gracefully show after paint
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    if (isDev) mainWindow.webContents.openDevTools({ mode: 'detach' });

    const initialPath = parsePdfPathFromArgs(process.argv);
    if (initialPath) {
      handleOpenedPdfFile(initialPath);
    }
  });

  const localDistPath = path.join(__dirname, '../dist/index.html');
  const appDistPath = path.join(__dirname, 'dist/index.html');

  if (isDev && process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:3000').catch(() => {
      if (fs.existsSync(localDistPath)) {
        mainWindow.loadFile(localDistPath);
      }
    });
  } else if (fs.existsSync(localDistPath)) {
    mainWindow.loadFile(localDistPath);
  } else if (fs.existsSync(appDistPath)) {
    mainWindow.loadFile(appDistPath);
  } else {
    mainWindow.loadFile(path.resolve(__dirname, '../dist/index.html'));
  }

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Application Menu
function buildMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Open PDF…',
          accelerator: 'CmdOrCtrl+O',
          click() {
            mainWindow?.webContents.send('menu-open-file');
          },
        },
        {
          label: 'Load Sample Document',
          click() {
            mainWindow?.webContents.send('menu-load-sample');
          },
        },
        { type: 'separator' },
        {
          label: 'Export PDF…',
          accelerator: 'CmdOrCtrl+S',
          click() {
            mainWindow?.webContents.send('menu-export-pdf');
          },
        },
        { type: 'separator' },
        { role: 'quit', label: 'Exit' },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
        { type: 'separator' },
        {
          label: 'Toggle DevTools',
          accelerator: 'F12',
          click() {
            mainWindow?.webContents.toggleDevTools();
          },
        },
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About Isa Secure PDF Suite',
          click() {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About Isa Secure PDF Suite',
              message: 'Isa Secure PDF Suite v1.0.0',
              detail:
                '100% client-side PDF editing.\nNo data is ever transmitted to any server.\n\nBuilt with Electron + React + pdf-lib + pdfjs-dist.',
              buttons: ['OK'],
              icon: path.join(__dirname, 'icon.png'),
            });
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// IPC: Save file dialog for export
ipcMain.handle('show-save-dialog', async (_event, defaultName) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: defaultName || 'Edited_Document.pdf',
    filters: [{ name: 'PDF Documents', extensions: ['pdf'] }],
    title: 'Save Edited PDF',
  });
  return result;
});

// IPC: Open file dialog
ipcMain.handle('show-open-dialog', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    filters: [{ name: 'PDF Documents', extensions: ['pdf'] }],
    properties: ['openFile'],
    title: 'Open PDF Document',
  });
  return result;
});

// IPC: Write file to disk (for native export with dialog)
ipcMain.handle('write-file', async (_event, filePath, base64Data) => {
  try {
    const buffer = Buffer.from(base64Data, 'base64');
    fs.writeFileSync(filePath, buffer);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// IPC: Request pending system-opened PDF payload
ipcMain.handle('request-pending-pdf-payload', async () => {
  const payload = pendingPdfPayload;
  pendingPdfPayload = null;
  return payload;
});

app.whenReady().then(() => {
  buildMenu();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
