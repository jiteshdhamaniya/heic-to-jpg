// renderer.js

const { ipcRenderer } = require('electron');

const dropZone = document.getElementById('drop-zone');
const fileList = document.getElementById('file-list');

// Store files and their statuses
let filesData = [];

dropZone.addEventListener('dragover', (event) => {
  event.preventDefault();
  event.dataTransfer.dropEffect = 'copy';
});

dropZone.addEventListener('drop', (event) => {
  event.preventDefault();

  const files = event.dataTransfer.files;

  if (files.length > 0) {
    // Reset file list and data
    fileList.innerHTML = '';
    filesData = [];

    const filePaths = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const filePath = file.path;
      const fileName = file.name;

      // Add file to filesData
      filesData.push({
        id: i,
        name: fileName,
        path: filePath,
        status: 'Pending',
      });

      // Add file to UI list
      addFileToList(i, fileName, 'Pending');

      filePaths.push(filePath);
    }

    // Send file paths to main process
    ipcRenderer.send('files-dropped', filesData);
  }
});

function addFileToList(id, fileName, status) {
  const li = document.createElement('li');
  li.id = `file-${id}`;

  const nameSpan = document.createElement('span');
  nameSpan.classList.add('file-name');
  nameSpan.textContent = fileName;

  const statusSpan = document.createElement('span');
  statusSpan.classList.add('file-status');
  statusSpan.textContent = status;

  li.appendChild(nameSpan);
  li.appendChild(statusSpan);

  fileList.appendChild(li);
}

// Update file status in UI
function updateFileStatus(id, status) {
  const li = document.getElementById(`file-${id}`);
  if (li) {
    const statusSpan = li.querySelector('.file-status');
    statusSpan.textContent = status;
  }
}

// Listen for status updates from main process
ipcRenderer.on('file-status-update', (event, { id, status }) => {
  updateFileStatus(id, status);
});

// Listen for conversion completion
ipcRenderer.on('conversion-done', () => {
  dropZone.textContent = 'Conversion complete! Drag and drop more files.';
});
