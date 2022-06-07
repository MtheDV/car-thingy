const {app, BrowserWindow, ipcMain} = require('electron');
const path = require('path');
const dbus = require('dbus-next');
const bus = dbus.systemBus();
const Variant = dbus.Variant;

let player = null;

const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js")
    }
  });
  
  win.loadFile('index.html');
}

const initializePlayer = async () => {
  const bluezObj = await bus.getProxyObject('org.bluez', '/');
  
  console.log(bluezObj.interfaces);
  
  // player = bluezObj.getInterface('');
}

app.whenReady().then(() => {
  createWindow();
  
  initializePlayer().then(() => {
    console.log('bluetooth interface initialized');
  });
  
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// ROBOT.JS Key-presses
ipcMain.on('set-audio-pause', () => {
  // robot.keyTap('audio_pause');
});

ipcMain.on('set-audio-play', () => {
  // robot.keyTap('audio_play');
});

ipcMain.on('set-audio-next', () => {
  // robot.keyTap('audio_next');
});

ipcMain.on('set-audio-previous', () => {
  // robot.keyTap('audio_prev');
});
