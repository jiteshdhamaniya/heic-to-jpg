const { contextBridge, ipcRenderer, webUtils } = require('electron');

function subscribe(channel, callback) {
  const listener = (_event, payload) => callback(payload);
  ipcRenderer.on(channel, listener);
  return () => ipcRenderer.removeListener(channel, listener);
}

contextBridge.exposeInMainWorld('converter', {
  chooseFiles: () => ipcRenderer.invoke('choose-files'),
  convertDroppedFiles: files => {
    const paths = Array.from(files, file => webUtils.getPathForFile(file));
    return ipcRenderer.invoke('convert-files', paths);
  },
  onStart: callback => subscribe('conversion-start', callback),
  onStatus: callback => subscribe('file-status', callback),
  onDone: callback => subscribe('conversion-done', callback),
});
