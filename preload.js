const { contextBridge, ipcRenderer } = require('electron');
const Store = require('electron-store');

function getDeviceList() {
  return new Promise(resolve => {
    ipcRenderer.once('device-list-response', (event, deviceList) => {
      resolve(deviceList);
    });
    ipcRenderer.send('get-device-list');
  });
}

function getLocalIPAddress() {
  return new Promise(resolve => {
    ipcRenderer.once('local-ip-address-response', (event, address) => {
      resolve(address);
    });
    ipcRenderer.send('get-local-ip-address');
  });
}

// Download a raw capture from the camera
// Optionally attach the metadata to the image if provided
function downloadRawCapture(ip, jobId, light, progressCallback, metadata) {
  return new Promise(resolve => {
    ipcRenderer.on('download-captured-image-progress', (event, progress) => {
      progressCallback(progress);
    });

    ipcRenderer.once('download-captured-image-response', (event, filePath) => {
      resolve(filePath);
    });

    ipcRenderer.send('download-captured-image', ip, jobId, light, metadata);
  });
}

contextBridge.exposeInMainWorld('electronAPI', {
  saveImage: (imageBuffer, filePath) =>
    ipcRenderer.invoke('saveImage', imageBuffer, filePath),
  loadFile: filePath => ipcRenderer.invoke('loadFile', filePath),
  getDeviceList: () => getDeviceList(),
  getLocalIPAddress: () => getLocalIPAddress(),
  getLightStatus: ip => ipcRenderer.invoke('get-light-status', ip),
  setLightStatus: (ip, lightStates) =>
    ipcRenderer.send('set-light-status', ip, lightStates),
  setStreamingStatus: (ip, status) =>
    ipcRenderer.send('set-streaming-status', ip, status),
  captureRawImage: ip => ipcRenderer.invoke('capture-raw-image', ip),
  getCaptureMetadata: (ip, jobId, light) =>
    ipcRenderer.invoke('get-capture-metadata', ip, jobId, light),
  setExposureTime: (ip, exposureTime) =>
    ipcRenderer.send('set-exposure-time', ip, exposureTime),
  setFocusDistance: (ip, focusDistance) =>
    ipcRenderer.send('set-focus-distance', ip, focusDistance),
  downloadRawCapture: (ip, jobId, light, progressCallback, metadata) =>
    downloadRawCapture(ip, jobId, light, progressCallback, metadata),
});

contextBridge.exposeInMainWorld('nodeAPI', {
  createBuffer: data => Buffer.from(data),
});

contextBridge.exposeInMainWorld('gcAPI', {
  uploadFile: filePath => ipcRenderer.invoke('uploadFile', filePath),
});

contextBridge.exposeInMainWorld('api', {
  send: (channel, data) => {
    // whitelist channels
    let validChannels = ['open-auth-window'];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },
});

// Expose the electron store to the renderer process
const store = new Store();
contextBridge.exposeInMainWorld('electronStore', {
  get: key => store.get(key),
  set: (key, value) => store.set(key, value),
});
