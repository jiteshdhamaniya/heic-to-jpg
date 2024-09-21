// main.js
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs-extra');
const heicConvert = require('heic-convert');

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,    // Keep Node.js integration disabled
      contextIsolation: true,    // Enable context isolation
    },
  });

  win.loadFile('index.html');
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// Handle open-file-dialog event
ipcMain.on('open-file-dialog', (event) => {
  dialog
    .showOpenDialog({
      properties: ['openFile', 'multiSelections'],
      filters: [{ name: 'HEIC Images', extensions: ['heic', 'HEIC'] }],
    })
    .then((result) => {
      if (!result.canceled) {
        event.sender.send('selected-files', result.filePaths);
      }
    })
    .catch((err) => {
      console.error('Error opening file dialog:', err);
    });
});

// Handle file conversion
ipcMain.on('files-selected', async (event, filePaths) => {
  for (const filePath of filePaths) {
    const ext = path.extname(filePath).toLowerCase();
    if (ext === '.heic') {
      try {
        const inputBuffer = await fs.readFile(filePath);
        const outputBuffer = await heicConvert({
          buffer: inputBuffer,
          format: 'JPEG',
          quality: 1,
        });

        const outputFilePath = filePath.replace(/\.heic$/i, '.jpg');
        console.log(`Converting file ${filePath} to ${outputFilePath}`);
        await fs.writeFile(outputFilePath, outputBuffer);
      } catch (err) {
        console.error(`Error converting file ${filePath}:`, err);
      }
    } else {
      console.log(`Skipping non-HEIC file: ${filePath}`);
    }
  }

  event.sender.send('conversion-done');
});
