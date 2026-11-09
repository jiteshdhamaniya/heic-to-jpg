const { app, BrowserWindow, dialog, ipcMain, session } = require('electron');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { convertFile } = require('./conversion');

const pagePath = path.join(__dirname, 'index.html');
const pageURL = pathToFileURL(pagePath).href;
let mainWindow;
let busy = false;

function assertTrusted(event) {
  if (!mainWindow || event.sender !== mainWindow.webContents ||
      event.senderFrame !== mainWindow.webContents.mainFrame || event.senderFrame.url !== pageURL) {
    throw new Error('Request rejected.');
  }
}

async function convertBatch(paths) {
  if (busy) return { error: 'Wait for the current batch to finish.' };
  if (!Array.isArray(paths) || paths.length > 1000 || paths.some(p => typeof p !== 'string' || !path.isAbsolute(p))) {
    return { error: 'Choose up to 1,000 files from your computer.' };
  }
  if (!paths.length) return { cancelled: true };
  busy = true;
  const target = mainWindow.webContents;
  const send = (channel, payload) => { if (!target.isDestroyed()) target.send(channel, payload); };
  let completed = 0, failed = 0, skipped = 0;
  send('conversion-start', paths.map((file, id) => ({ id, name: path.basename(file) })));
  try {
    for (const [id, file] of paths.entries()) {
      send('file-status', { id, status: 'Converting…' });
      try {
        const result = await convertFile(file);
        if (result.status === 'Completed') completed++; else skipped++;
        send('file-status', { id, ...result });
      } catch (error) {
        failed++;
        const reason = error.code === 'EACCES' || error.code === 'EPERM'
          ? 'No permission to read the file or write in its folder.'
          : 'Could not convert this file. Check that it is a readable HEIC image and its folder is writable.';
        send('file-status', { id, status: 'Failed', reason });
      }
    }
  } finally {
    busy = false;
    send('conversion-done', { completed, failed, skipped });
  }
  return { completed, failed, skipped };
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800, height: 600, minWidth: 480, minHeight: 400,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
    },
  });
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  mainWindow.webContents.on('will-navigate', event => event.preventDefault());
  mainWindow.on('close', event => {
    if (busy) {
      event.preventDefault();
      dialog.showMessageBoxSync(mainWindow, {
        type: 'info', message: 'Conversion is still running.',
        detail: 'Please wait for this batch to finish before closing the app.', buttons: ['OK'],
      });
    }
  });
  mainWindow.loadFile(pagePath);
}

app.whenReady().then(() => {
  session.defaultSession.setPermissionRequestHandler((_contents, _permission, callback) => callback(false));
  session.defaultSession.setPermissionCheckHandler(() => false);
  // Conversion and the interface need no network access.
  session.defaultSession.webRequest.onBeforeRequest({ urls: ['http://*/*', 'https://*/*', 'ws://*/*', 'wss://*/*'] },
    (_details, callback) => callback({ cancel: true }));
  ipcMain.handle('convert-files', async (event, paths) => { assertTrusted(event); return convertBatch(paths); });
  ipcMain.handle('choose-files', async event => {
    assertTrusted(event);
    if (busy) return { error: 'Wait for the current batch to finish.' };
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Choose HEIC images', properties: ['openFile', 'multiSelections'],
      filters: [{ name: 'HEIC images', extensions: ['heic'] }],
    });
    return result.canceled ? { cancelled: true } : convertBatch(result.filePaths);
  });
  createWindow();
  app.on('activate', () => { if (!BrowserWindow.getAllWindows().length) createWindow(); });
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
