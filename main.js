const {app, BrowserWindow, ipcMain} = require('electron');
const path = require('path');
const dbus = require('dbus-next');
const BluezPlayer = require('./bluezPlayer');
const bus = dbus.systemBus();
const Variant = dbus.Variant;

let bluezPlayer = null;

const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  });
  
  win.loadFile('index.html');
}

const updateTrack = () => {
  if (!bluezPlayer) return;
  bluezPlayer.getTrack().then(track => {
    // TODO: Notify renderer.js with details through ipcMain
    console.log(track);
  }).catch();
}

const updateStatus = () => {
  if (!bluezPlayer) return;
  bluezPlayer.getStatus().then(status => {
    // TODO: Notify renderer.js with details through ipcMain
    console.log(status);
  }).catch();
}

const updatePosition = () => {
  if (!bluezPlayer) return;
  bluezPlayer.getPosition().then(position => {
    // TODO: Notify renderer.js with details through ipcMain
    console.log(position);
  }).catch();
}

app.whenReady().then(() => {
  createWindow();
  
  BluezPlayer.initialize(bus, {
    'Track': updateTrack,
    'Status': updateStatus,
    'Position': updatePosition
  }).then(bluezPlayerObject => {
    bluezPlayer = bluezPlayerObject;
    console.info('Bluetooth Player Interface Initialized!');
    console.info('Alias:', bluezPlayer.alias);
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
