// main.js

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs-extra');
const heicConvert = require('heic-convert');

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,     // Enable Node.js integration
      contextIsolation: false,   // Disable context isolation
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

// Handle file paths received from renderer process
ipcMain.on('files-dropped', async (event, filePaths) => {
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
