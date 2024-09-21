// renderer.js

const { ipcRenderer } = require('electron');

const dropZone = document.getElementById('drop-zone');

dropZone.addEventListener('dragover', (event) => {
  event.preventDefault();
  event.dataTransfer.dropEffect = 'copy';
});

dropZone.addEventListener('drop', (event) => {
  event.preventDefault();

  const files = event.dataTransfer.files;
  const filePaths = [];

  for (let i = 0; i < files.length; i++) {
    console.log(`File ${i} path:`, files[i].path);
    filePaths.push(files[i].path);
  }

  console.log('Dropped file paths:', filePaths);

  if (filePaths.length > 0) {
    dropZone.textContent = 'Converting... Please wait.';
    ipcRenderer.send('files-dropped', filePaths);
  }
});

ipcRenderer.on('conversion-done', () => {
  dropZone.textContent = 'Conversion complete! Drag and drop more files.';
});
