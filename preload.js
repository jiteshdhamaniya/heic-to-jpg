// preload.js

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  openFileDialog: () => ipcRenderer.send('open-file-dialog'),
  onSelectedFiles: (callback) => ipcRenderer.on('selected-files', (event, filePaths) => callback(filePaths)),
  sendFiles: (filePaths) => ipcRenderer.send('files-selected', filePaths),
  onConversionDone: (callback) => ipcRenderer.on('conversion-done', callback),
});
