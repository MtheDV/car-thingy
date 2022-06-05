const {app, BrowserWindow, ipcMain} = require('electron');
const path = require('path');
const robot = require('robotjs');

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

app.whenReady().then(() => {
  createWindow();
  
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// ROBOT.JS Key-presses
ipcMain.on('set-audio-pause', () => {
  robot.keyTap('audio_pause');
});

ipcMain.on('set-audio-play', () => {
  robot.keyTap('audio_play');
});

ipcMain.on('set-audio-next', () => {
  robot.keyTap('audio_next');
});

ipcMain.on('set-audio-previous', () => {
  robot.keyTap('audio_prev');
});
