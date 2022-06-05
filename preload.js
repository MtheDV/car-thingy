const {ipcRenderer, contextBridge} = require('electron');

contextBridge.exposeInMainWorld('api', {
  setAudioPause: () => {
    ipcRenderer.send('set-audio-pause');
  },
  setAudioPlay: () => {
    ipcRenderer.send('set-audio-play')
  },
  setAudioNext: () => {
    ipcRenderer.send('set-audio-next')
  },
  setAudioPrevious: () => {
    ipcRenderer.send('set-audio-previous')
  }
});
