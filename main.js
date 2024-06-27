require('dotenv').config();
const { app, BrowserWindow, ipcMain, nativeImage } = require('electron');
const os = require('os');
const Store = require('electron-store');
const bonjour = require('bonjour')();
var OralEyeApi = require('oral_eye_api');

const net = require('net');
const fs = require('fs');
const fsPromises = require('fs').promises;
const path = require('node:path');
const axios = require('axios');
const store = new Store();

const { Storage } = require('@google-cloud/storage');
const gcStorage = new Storage();
const bucketName = 'session-images';

async function uploadFile(filePath) {
  const userDataPath = app.getPath('userData');
  const localPath = path.join(userDataPath, filePath);
  const remoteFilePath = filePath.replace('captures/', '');
  await gcStorage.bucket(bucketName).upload(localPath, {
    gzip: true,
    destination: remoteFilePath,
    metadata: {
      cacheControl: 'public, max-age=31536000',
    },
  });
}
ipcMain.handle('uploadFile', async (event, arg) => {
  uploadFile(arg).catch(console.error);
});

let win = null;
const createWindow = () => {
  win = new BrowserWindow({
    width: 1280,
    height: 800,
    titleBarStyle: 'hidden',
    titleBarOverlay: true,
    webPreferences: {
      nodeIntegration: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });
  // win.setWindowButtonVisibility(false)
  win.loadFile('sign_in_page.html');
};

let tray = null;
app.whenReady().then(() => {
  // Create a new window
  createWindow();

  // Create a dock icon
  if (process.platform === 'darwin') {
    const iconPath = path.join(__dirname, 'assets', 'dock_logo.png');
    const dockIcon = nativeImage.createFromPath(iconPath);

    // app.dock.setIcon(dockIcon);
  }

  discoverCameras();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
  bonjour.destroy();
});

let deviceList = [];
function discoverCameras() {
  // Browse for all _camera._tcp services
  const browser = bonjour.find({ type: 'http' });

  browser.on('up', service => {
    if (service.name.startsWith('OralEye')) {
      deviceList.push(service);
    }
  });

  browser.on('down', service => {
    if (service.name.startsWith('OralEye')) {
      deviceList.filter(cam => cam.name !== service.name);
    }
  });
}

ipcMain.on('get-device-list', event => {
  event.reply('device-list-response', deviceList);
});

ipcMain.on('get-local-ip-address', event => {
  const interfaces = os.networkInterfaces();
  const addresses = [];
  for (const name of Object.keys(interfaces)) {
    for (const this_interface of interfaces[name]) {
      if (this_interface.family === 'IPv4' && !this_interface.internal) {
        addresses.push(this_interface.address);
      }
    }
  }
  event.reply('local-ip-address-response', addresses[0]);
});

async function ensureDirectoryExistence(filePath) {
  const dirname = path.dirname(filePath);
  try {
    await fsPromises.mkdir(dirname, { recursive: true });
  } catch (err) {
    // Ignore the error if the folder already exists, otherwise throw it
    if (err.code !== 'EEXIST') throw err;
  }
}

// Expose the saveImage function to the renderer process
// file path is relative to the app's userData folder
ipcMain.handle('saveImage', async (event, imageBuffer, filePath) => {
  const userDataPath = app.getPath('userData');
  const fullFilePath = path.join(userDataPath, filePath);
  await ensureDirectoryExistence(fullFilePath);
  fs.writeFile(fullFilePath, imageBuffer, err => {
    if (err) throw err;
  });
  return fullFilePath;
});

// Create oauth window
function createAuthWindow() {
  const authWindow = new BrowserWindow({
    width: 500,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
    },
  });

  const CLIENT_ID =
    '1046688975280-pi2hjde3trbc6i856gunj6k7iri8b2g5.apps.googleusercontent.com';
  const REDIRECT_URI = 'http://127.0.0.1:2023';
  const CLIENT_SECRET = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${REDIRECT_URI}&scope=profile email`;
  authWindow.loadURL(googleAuthUrl);

  authWindow.webContents.on('will-redirect', async (event, url) => {
    if (url.startsWith(REDIRECT_URI)) {
      event.preventDefault();
      const raw_code = /code=([^&]*)/.exec(url) || null;
      const code = raw_code && raw_code.length > 1 ? raw_code[1] : null;
      const decodedCode = decodeURIComponent(code);
      await axios
        .post(
          'https://oauth2.googleapis.com/token',
          {
            code: decodedCode,
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            redirect_uri: REDIRECT_URI,
            grant_type: 'authorization_code',
          },
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          }
        )
        .then(response => {
          // Handle success
          const accessToken = response.data.access_token;
          const refreshToken = response.data.refresh_token;

          axios
            .get(
              'https://people.googleapis.com/v1/people/me?personFields=names,photos',
              {
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                },
              }
            )
            .then(response => {
              // The response object will contain the user's profile information.
              const userName = response.data.names[0].displayName;
              const userPhoto = response.data.photos[0].url;

              // Set in electron store. This will be used in the renderer process.
              store.set('userName', userName);
              store.set('userPhoto', userPhoto);
              win.loadFile('index.html');
            })
            .catch(error => {
              console.error('Error fetching user profile:', error);
            });
        })
        .catch(error => {
          // Handle error
          console.error('Error during token request', error.response.data);
        });

      // Now you can use the accessToken to make API requests on behalf of the user
      // Don't forget to close the authWindow
      authWindow.close();
    }
  });
}

// Listen for an IPC message to open the auth window
ipcMain.on('open-auth-window', (event, arg) => {
  createAuthWindow();
});

ipcMain.handle('loadFile', async (event, filePath) => {
  const userDataPath = app.getPath('userData');
  const fullFilePath = path.join(userDataPath, filePath);
  if (fs.existsSync(fullFilePath)) {
    const fileData = await fsPromises.readFile(fullFilePath);
    return fileData;
  } else {
    return null;
  }
});

// Get light status
ipcMain.handle('get-light-status', async (event, ip) => {
  // Create the API client
  var apiClient = new OralEyeApi.ApiClient(
    (basePath = 'http://' + ip + ':8080')
  );
  var lightsApi = new OralEyeApi.LightsApi(apiClient);

  // Get the device current light information
  return new Promise((resolve, reject) => {
    lightsApi.lightsStatusGet((error, data, response) => {
      if (error) {
        console.error('Error:', error);
        reject(error); // Reject the promise with the error
      } else {
        resolve(data); // Resolve the promise with the data
      }
    });
  });
});

// Set light status
ipcMain.on('set-light-status', (event, ip, lightStates) => {
  // Create the API client
  var apiClient = new OralEyeApi.ApiClient(
    (basePath = 'http://' + ip + ':8080')
  );
  var lightsApi = new OralEyeApi.LightsApi(apiClient);

  // Set the light status
  return new Promise((resolve, reject) => {
    lightsApi.lightsControlPost(lightStates, (error, data, response) => {
      if (error) {
        console.error('Error:', error);
        reject(error); // Reject the promise with the error
      } else {
        resolve(data); // Resolve the promise with the data
      }
    });
  });
});

// Set streaming status
ipcMain.on('set-streaming-status', (event, ip, status) => {
  // Create the API client
  var apiClient = new OralEyeApi.ApiClient(
    (basePath = 'http://' + ip + ':8080')
  );
  var cameraApi = new OralEyeApi.CameraApi(apiClient);

  // Set the streaming status
  return new Promise((resolve, reject) => {
    if (status) {
      cameraApi.cameraPreviewStartPost((error, data, response) => {
        if (error) {
          console.error('Error:', error);
          reject(error); // Reject the promise with the error
        } else {
          resolve(data); // Resolve the promise with the data
        }
      });
    } else {
      cameraApi.cameraPreviewStopPost((error, data, response) => {
        if (error) {
          console.error('Error:', error);
          reject(error); // Reject the promise with the error
        } else {
          resolve(data); // Resolve the promise with the data
        }
      });
    }
  });
});

// Set exposure time
ipcMain.on('set-exposure-time', (event, ip, exposureTime) => {
  // Create the API client
  var apiClient = new OralEyeApi.ApiClient(
    (basePath = 'http://' + ip + ':8080')
  );
  var cameraApi = new OralEyeApi.CameraApi(apiClient);

  // Set the exposure time
  return new Promise((resolve, reject) => {
    cameraApi.cameraExposurePost({"exposure_time": exposureTime}, (error, data, response) => {
      if (error) {
        console.error('Error:', error);
        reject(error); // Reject the promise with the error
      } else {
        resolve(data); // Resolve the promise with the data
      }
    });
  });
});

// Set focus distance
ipcMain.on('set-focus-distance', (event, ip, focusDistance) => {
  // Create the API client
  var apiClient = new OralEyeApi.ApiClient(
    (basePath = 'http://' + ip + ':8080')
  );
  var cameraApi = new OralEyeApi.CameraApi(apiClient);

  if (focusDistance <= 0) {
    // Set the focus distance to auto
    return new Promise((resolve, reject) => {
      cameraApi.cameraAutofocusPost({'autofocus': 'on'}, (error, data, response) => {
        if (error) {
          console.error('Error:', error);
          reject(error); // Reject the promise with the error
        } else {
          resolve(data); // Resolve the promise with the data
        }
      });
    })
  } else {
    // Set autofocus to off and set the focus distance
    cameraApi.cameraAutofocusPost({'autofocus': 'off'}, (error, data, response) => {
      console.log('Autofocus off');
      return new Promise((resolve, reject) => {
        cameraApi.cameraManualFocusPost(
          {'distance': focusDistance},
          (error, data, response) => {
            if (error) {
              console.error('Error:', error);
              reject(error); // Reject the promise with the error
            } else {
              console.log('Manual focus set');
              resolve(data); // Resolve the promise with the data
            }
          }
        );
      })
    });
  }
});

// Capture raw image
ipcMain.handle('capture-raw-image', async (event, ip) => {
  var apiClient = new OralEyeApi.ApiClient(
    (basePath = 'http://' + ip + ':8080')
  );
  var cameraApi = new OralEyeApi.CameraApi(apiClient);

  try {
    const chunks = [];
    return new Promise((resolve, reject) => {
      cameraApi.cameraCapturePost((error, data, response) => {
        if (error) {
          return reject(error);
        }

        // Get the filename
        const contentDisposition = response.headers['content-disposition'];
        const filename = contentDisposition
          ? contentDisposition.split('filename=')[1].replace(/"/g, '')
          : 'unknown.jpg';
        const outputPath = path.join(app.getPath('userData'), filename);

        // Ensure response is a readable stream
        if (!response || typeof response.on !== 'function') {
          return reject(new Error('Invalid response stream from API call'));
        }

        // Attach listeners immediately
        response.on('data', chunk => {
          chunks.push(chunk);
        });

        response.on('end', () => {
          const buffer = Buffer.concat(chunks);
          fs.writeFile(outputPath, buffer, err => {
            if (err) {
              reject(err);
            } else {
              // Generate thumbnail
              resolve(outputPath);
            }
          });

          response.on('error', error => {
            console.error('Stream error:', error);
            reject(error);
          });
        });
      });
    });
  } catch (error) {
    throw new Error(`Failed to download file: ${error.message}`);
  }
});

// Get capture metadata
ipcMain.handle('get-capture-metadata', async (event, ip, job_id, light) => {
  var apiClient = new OralEyeApi.ApiClient(
    (basePath = 'http://' + ip + ':8080')
  );
  var cameraApi = new OralEyeApi.CameraApi(apiClient);

  return new Promise((resolve, reject) => {
    cameraApi.cameraMetadataGet(job_id, light, (error, data, response) => {
      if (error) {
        console.error('Error:', error);
        reject(error); // Reject the promise with the error
      } else {
        resolve(response.text); // Resolve the promise with the text data
      }
    });
  });
});
