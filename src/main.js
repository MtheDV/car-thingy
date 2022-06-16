const {app, BrowserWindow, ipcMain} = require('electron');
const path = require('path');
const {BluezAgent, BluezPlayer} = require('./bluezPlayer');

let bluezAgent = null;
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
  window.webContents.send('set-device-update', bluezPlayer.deviceDetails);
}

const updateDevicesPaired = () => {
  const sendPairedDevices = () => {
    bluezAgent.getPairedDevices().then(deviceList => {
      console.info('[AGENT] Updating paired devices.');
      window.webContents.send('set-agent-device-list', deviceList);
    });
  }
  
  sendPairedDevices();
  setInterval(() => {
    sendPairedDevices();
  }, 3000);
}

const updateConnected = () => {
  if (!bluezPlayer) return;
  bluezPlayer.isConnected().then(async connected => {
    console.info('[PLAYER] Device connected:', connected);
    // If connected, send device details, otherwise clean up player
    if (connected) {
      updateDevice();
      updateTrack();
      updatePosition();
      updateStatus();
    } else {
      bluezPlayer.cleanUp();
      bluezPlayer = undefined;
    }
  }).catch(async err => {
    console.error('[PLAYER] Something went wrong while checking if connected!', err)
    // Clean up player and destroy object
    bluezPlayer.cleanUp();
    bluezPlayer = undefined;
  });
}

const initializePlayer = (devicePath) => {
  console.info('[AGENT] Initializing player.');
  setTimeout(() => {
    BluezPlayer.initialize(
      devicePath,
      {
        'Track': updateTrack,
        'Status': updateStatus,
        'Position': updatePosition
      }, {
        'Connected': updateConnected
      }
    ).then(bluezPlayerObject => {
      bluezPlayer = bluezPlayerObject;
      console.info('[PLAYER] Bluetooth player interface initialized!');
      console.info('[PLAYER] Connected to:', bluezPlayer.alias);
    }).catch(err => {
      console.error('[PLAYER] Unable to initialize bluetooth player interface!', err);
    });
  }, bluezPlayer ? 500 : 0);
  if (bluezPlayer) {
    bluezPlayer.cleanUp();
    bluezPlayer.disconnect();
    bluezPlayer = undefined;
  }
}

app.whenReady().then(async () => {
  createWindow();
  
  BluezAgent.initialize(
    'Subaru Legacy Audio',
    initializePlayer
  ).then(bluezAgentObject => {
    bluezAgent = bluezAgentObject;
    console.info('[AGENT] Bluetooth agent interface initialized!');
    initializePlayer();
    updateDevicesPaired();
  }).catch(err => {
    console.error('[AGENT] Unable to initialize bluetooth agent!', err);
    // TODO: Disable bluetooth functions on frontend
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

/**
 * ipcMain functions to handle device connecting/pairing
 */
ipcMain.on('set-agent-connect', (_, deviceIndex) => {
  if (!bluezAgent) return;
  bluezAgent.getPairedDevices().then(deviceList => {
    if (bluezPlayer && deviceList[deviceIndex].path === bluezPlayer.device.path) return;
    if (bluezPlayer) {
      bluezPlayer.cleanUp();
      bluezPlayer.disconnect();
      bluezPlayer = undefined;
    }
    bluezAgent.connectToDevice(deviceIndex, initializePlayer).then(() => {
      console.info('[AGENT] Connecting to device.')
    }).catch();
  });
});

ipcMain.on('set-agent-discover', () => {
  if (!bluezAgent) return;
  bluezAgent.openDiscovery().then(() => {
    console.info('[AGENT] Started discovering devices.');
  });
});
