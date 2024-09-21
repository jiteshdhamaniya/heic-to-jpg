// renderer.js

document.getElementById('select-files-button').addEventListener('click', () => {
    window.electronAPI.openFileDialog();
  });
  
  window.electronAPI.onSelectedFiles((filePaths) => {
    document.getElementById('status').textContent = 'Converting... Please wait.';
    window.electronAPI.sendFiles(filePaths);
  });
  
  window.electronAPI.onConversionDone(() => {
    document.getElementById('status').textContent = 'Conversion complete! Select more files.';
  });
  