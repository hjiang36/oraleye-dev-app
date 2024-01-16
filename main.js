require('dotenv').config();
const { app, BrowserWindow, ipcMain, nativeImage } = require('electron')
const os = require('os');
const Store = require('electron-store');
const bonjour = require('bonjour')();
const Stream = require('node-rtsp-stream');

const net = require('net');
const fs = require('fs');
const fsPromises = require('fs').promises;
const path = require('node:path')
const axios = require('axios');
const store = new Store();

const { Storage } = require('@google-cloud/storage');
const gcStorage = new Storage();
const bucketName = 'session-images';

let stream = null;
ipcMain.on('start-rtsp-stream', (event, streamUrl) => {
  if (stream) {
    // If a stream is already running, stop it before starting a new one
    stream.stop();
  }

  stream = new Stream({
    name: 'streamName',
    streamUrl: streamUrl,
    wsPort: 9999,
    ffmpegOptions: { // options ffmpeg flags
      '-stats': '', // an option with no neccessary value uses a blank string
      '-r': 30
    }
  });
});

ipcMain.on('stop-rtsp-stream', () => {
  if (stream) {
    stream.stop();
    stream = null;
  }
});


function startTcpServer() {
  const server = net.createServer(socket => {
    let fileStream;
    let totalReceived = 0;
    const bufferSize = 1024; // Size of each data chunk to receive (in bytes)
    let dataLength = null; // Total data length (to be set when header is received)
    let isHeaderParsed = false;

    const userDataPath = app.getPath('userData');
    const filePath = path.join(userDataPath, 'rawCaptures', 'capture.bin');
    ensureDirectoryExistence(filePath);

    socket.on('data', (chunk) => {
      if (!isHeaderParsed) {
        if (chunk.length >= 140) { // 4 bytes cmdType, 4 bytes dataLen, 100 bytes fileName, 4 bytes reserved
          const cmdType = chunk.readUInt32BE(0);
          dataLength = chunk.readUInt32BE(4);
          const fileName = chunk.slice(8, 108).toString('utf-8').replace(/\0/g, ''); // Trim null characters
          if (cmdType != 0) {
            // This is not a file transfer command or this is not a proper header. Skip it.
            return;
          }

          // Prepare file to write data
          const userDataPath = app.getPath('userData');
          const filePath = path.join(userDataPath, 'rawCaptures', fileName);
          console.log('Saving raw file to:', filePath);
          fileStream = fs.createWriteStream(filePath);

          // Write the remaining part of the chunk after the header
          fileStream.write(chunk.slice(140));

          totalReceived += chunk.length - 140;
          isHeaderParsed = true;
        }
      } else {
        // Write data to file
        fileStream.write(chunk);
        totalReceived += chunk.length;

        if (totalReceived >= dataLength) {
          // Finished receiving data
          fileStream.end();
          socket.end(); // Close the connection
        }
      }
    });

    socket.on('end', () => {
      if (fileStream) {
        fileStream.end();
      }
    });
  });

  server.on('error', (err) => {
    console.error('Server error:', err);
  });

  server.listen(9000, () => {
    console.log('Server listening on port 9000');
  });
}

startTcpServer();

async function uploadFile(filePath) {
  const userDataPath = app.getPath('userData');
  const localPath = path.join(userDataPath, filePath);
  const remoteFilePath = filePath.replace("captures/", "");
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
    width: 960,
    height: 600,
    titleBarStyle: 'hidden',
    titleBarOverlay: true,
    webPreferences: {
      nodeIntegration: true,
      preload: path.join(__dirname, 'preload.js')
    }
  })
  // win.setWindowButtonVisibility(false)
  win.loadFile('sign_in_page.html')
}

let tray = null;
app.whenReady().then(() => {
  // Create a new window
  createWindow()

  // Create a dock icon
  if (process.platform === 'darwin') {
    const iconPath = path.join(__dirname, 'assets', 'dock_logo.png');
    const dockIcon = nativeImage.createFromPath(iconPath);

    // app.dock.setIcon(dockIcon);
  }

  discoverCameras();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
  bonjour.destroy();
});

let deviceList = [];
function discoverCameras() {
  // Browse for all _camera._tcp services
  const browser = bonjour.find({ type: 'camera', protocol: 'tcp' });

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

ipcMain.on('get-device-list', (event) => {
  event.reply('device-list-response', deviceList);
});

ipcMain.on('get-local-ip-address', (event) => {
  const interfaces = os.networkInterfaces();
  const addresses = [];
  for (const name of Object.keys(interfaces)) {
    for (const interface of interfaces[name]) {
      if (interface.family === 'IPv4' && !interface.internal) {
        addresses.push(interface.address);
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
  fs.writeFile(fullFilePath, imageBuffer, (err) => {
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
      nodeIntegration: false
    }
  });

  const CLIENT_ID = '1046688975280-pi2hjde3trbc6i856gunj6k7iri8b2g5.apps.googleusercontent.com';
  const REDIRECT_URI = 'http://127.0.0.1:2023';
  const CLIENT_SECRET = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${REDIRECT_URI}&scope=profile email`;
  authWindow.loadURL(googleAuthUrl);

  authWindow.webContents.on('will-redirect', async (event, url) => {
    if (url.startsWith(REDIRECT_URI)) {
      event.preventDefault();
      const raw_code = /code=([^&]*)/.exec(url) || null;
      const code = (raw_code && raw_code.length > 1) ? raw_code[1] : null;
      const decodedCode = decodeURIComponent(code);
      await axios.post('https://oauth2.googleapis.com/token', {
        code: decodedCode,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code'
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }).then(response => {
        // Handle success
        const accessToken = response.data.access_token;
        const refreshToken = response.data.refresh_token;

        axios.get('https://people.googleapis.com/v1/people/me?personFields=names,photos', {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }).then(response => {
          // The response object will contain the user's profile information.
          const userName = response.data.names[0].displayName;
          const userPhoto = response.data.photos[0].url;

          // Set in electron store. This will be used in the renderer process.
          store.set('userName', userName);
          store.set('userPhoto', userPhoto);
          win.loadFile('index.html');
        }).catch(error => {
          console.error('Error fetching user profile:', error);
        });
      }).catch(error => {
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
