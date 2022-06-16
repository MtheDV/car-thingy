const {ipcRenderer, contextBridge} = require('electron');

contextBridge.exposeInMainWorld('api', {
  // Handle changes coming from the frontend
  setAudioPause: () => {
    ipcRenderer.send('set-audio-pause');
  },
  setAudioPlay: () => {
    ipcRenderer.send('set-audio-play');
  },
  setAudioNext: () => {
    ipcRenderer.send('set-audio-next');
  },
  setAudioPrevious: () => {
    ipcRenderer.send('set-audio-previous');
  },
  // Handle changes coming from the bluetooth device
  onTrackUpdate: (callback) => {
    ipcRenderer.on('set-track-update', callback);
  },
  onStatusUpdate: (callback) => {
    ipcRenderer.on('set-status-update', callback);
  },
  onPositionUpdate: (callback) => {
    ipcRenderer.on('set-position-update', callback);
  },
  onDeviceUpdate: (callback) => {
    console.log(callback);
    ipcRenderer.on('set-device-update', callback);
  },
  // Handle connecting to devices and pairing new devices
  onAgentDeviceListUpdate: (callback) => {
    ipcRenderer.on('set-agent-device-list', callback);
  },
  setAgentConnect: (deviceIndex) => {
    ipcRenderer.send('set-agent-connect', deviceIndex);
  },
  setAgentDiscover: () => {
    ipcRenderer.send('set-agent-discover');
  }
});
