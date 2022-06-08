const {ipcRenderer, contextBridge} = require('electron');

contextBridge.exposeInMainWorld('api', {
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
    ipcRenderer.on('set-device-update', callback);
  }
});
