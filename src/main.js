const {app, BrowserWindow, ipcMain} = require('electron');
const path = require('path');
const BluezPlayer = require('./bluezPlayer');

let bluezPlayer = null;
let window = null

const createWindow = () => {
  window = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  });
  
  window.loadFile('./src/index.html');
}

const updateTrack = () => {
  if (!bluezPlayer) return;
  bluezPlayer.getTrack().then(track => {
    window.webContents.send('set-track-update', track);
  }).catch();
}

const updateStatus = () => {
  if (!bluezPlayer) return;
  bluezPlayer.getStatus().then(status => {
    window.webContents.send('set-status-update', status);
  }).catch();
}

const updatePosition = () => {
  if (!bluezPlayer) return;
  bluezPlayer.getPosition().then(position => {
    window.webContents.send('set-position-update', position);
  }).catch();
}

const updateDevice = () => {
  window.webContents.send('set-device-update', bluezPlayer.alias);
}

app.whenReady().then(() => {
  createWindow();
  
  BluezPlayer.initialize({
    'Track': updateTrack,
    'Status': updateStatus,
    'Position': updatePosition
  }).then(bluezPlayerObject => {
    bluezPlayer = bluezPlayerObject;
    console.info('Bluetooth Player Interface Initialized!');
    console.info('Connected to:', bluezPlayer.alias);
    updateDevice();
  }).catch(err => {
    console.error('Unable to Initialize Bluetooth Interface!', err);
  });
  
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

/**
 * ipcMain functions to handle media player controls through dbus
 */
ipcMain.on('set-audio-pause', () => {
  if (!bluezPlayer) return;
  bluezPlayer.pause();
});

ipcMain.on('set-audio-play', () => {
  if (!bluezPlayer) return;
  bluezPlayer.play();
});

ipcMain.on('set-audio-next', () => {
  if (!bluezPlayer) return;
  bluezPlayer.next();
});

ipcMain.on('set-audio-previous', () => {
  if (!bluezPlayer) return;
  bluezPlayer.previous();
});