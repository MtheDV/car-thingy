const {app, BrowserWindow, ipcMain} = require('electron');
const path = require('path');
const dbus = require('dbus-next');
const bus = dbus.systemBus();
const Variant = dbus.Variant;

let player = null;
let transport = null;

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

const initializePlayer = async () => {
  const bluezObj = await bus.getProxyObject('org.bluez', '/');
  
  const manager = bluezObj.getInterface('org.freedesktop.DBus.ObjectManager');
  
  let playerPath = null;
  let transportPath = null;
  
  const managedObjects = await manager.GetManagedObjects();
  Object.entries(managedObjects).forEach(([path, managedObject]) => {
    if ('org.bluez.MediaPlayer1' in managedObject) {
      playerPath = path;
    }
    if ('org.bluez.MediaTransport1' in managedObject) {
      transportPath = path;
    }
  });
  
  if (playerPath) {
    player = await bus.getProxyObject('org.bluez', playerPath);
  }
  if (transportPath) {
    transport = await bus.getProxyObject('org.bluez', transportPath);
  }
}

const playerInterface = () => {
  return player.getInterface('org.bluez.MediaPlayer1');
}

const playerProperties = () => {
  return player.getInterface('org.freedesktop.DBus.Properties');
}

const getTrack = async () => {
  const trackVariant = await playerProperties().Get('org.bluez.MediaPlayer1', 'Track');
  return Object.entries(trackVariant.value).reduce((prev, [type, value]) => {
    prev[type] = value;
    return prev;
  }, {});
}

app.whenReady().then(() => {
  createWindow();
  
  initializePlayer().then(() => {
    if (player) console.log('Bluetooth player interface initialized!');
    else console.log('No bluetooth player found!');
    
    getTrack().then(track => {
      console.log(track);
    }).catch();
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
  if (!player) return;
  playerInterface().Pause();
});

ipcMain.on('set-audio-play', () => {
  if (!player) return;
  playerInterface().Play();
});

ipcMain.on('set-audio-next', () => {
  if (!player) return;
  playerInterface().Next();
});

ipcMain.on('set-audio-previous', () => {
  if (!player) return;
  playerInterface().Previous();
});
