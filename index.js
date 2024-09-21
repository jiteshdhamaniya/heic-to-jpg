// main.js

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs-extra');
const heicConvert = require('heic-convert');

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    icon: path.join(__dirname, 'icon.icns'), // Add this line
    webPreferences: {
      nodeIntegration: true,     // Enabled for simplicity
      contextIsolation: false,   // Disabled for simplicity
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

// Handle files dropped from renderer process
ipcMain.on('files-dropped', async (event, filesData) => {
  for (const file of filesData) {
    const { id, path: filePath } = file;
    const ext = path.extname(filePath).toLowerCase();

    // Update status to 'Converting...'
    event.sender.send('file-status-update', { id, status: 'Converting...' });

    if (ext === '.heic') {
      try {
        const inputBuffer = await fs.readFile(filePath);
        const outputBuffer = await heicConvert({
          buffer: inputBuffer,
          format: 'JPEG',
          quality: 1,
        });

        const outputFilePath = filePath.replace(/\.heic$/i, '.jpg');
        await fs.writeFile(outputFilePath, outputBuffer);

        // Update status to 'Completed'
        event.sender.send('file-status-update', { id, status: 'Completed' });
      } catch (err) {
        console.error(`Error converting file ${filePath}:`, err);

        // Update status to 'Error'
        event.sender.send('file-status-update', { id, status: 'Error' });
      }
    } else {
      console.log(`Skipping non-HEIC file: ${filePath}`);

      // Update status to 'Skipped'
      event.sender.send('file-status-update', { id, status: 'Skipped' });
    }
  }

  // Notify renderer that all files have been processed
  event.sender.send('conversion-done');
});
