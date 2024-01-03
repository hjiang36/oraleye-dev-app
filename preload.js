const { contextBridge, ipcRenderer } = require('electron');
const Store = require('electron-store');

contextBridge.exposeInMainWorld('electronAPI', {
  saveImage: (imageBuffer, filePath) => ipcRenderer.invoke('saveImage', imageBuffer, filePath),
  loadFile: (filePath) => ipcRenderer.invoke('loadFile', filePath),
});

contextBridge.exposeInMainWorld('nodeAPI', {
    createBuffer: (data) => Buffer.from(data)
});

contextBridge.exposeInMainWorld('gcAPI', {
  uploadFile: (filePath) => ipcRenderer.invoke('uploadFile', filePath)
});

contextBridge.exposeInMainWorld('api', {
  send: (channel, data) => {
    // whitelist channels
    let validChannels = ['open-auth-window'];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  }
});

// Expose the electron store to the renderer process
const store = new Store();
contextBridge.exposeInMainWorld('electronStore', {
  get: (key) => store.get(key),
  set: (key, value) => store.set(key, value),
});