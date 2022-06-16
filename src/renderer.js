let audioPlaying = true;

const buttonPlayPause = document.getElementById('audio-play-pause');
const buttonNext = document.getElementById('audio-next');
const buttonPrevious = document.getElementById('audio-previous');

const updatePlayPauseButton = () => {
  buttonPlayPause.innerText = audioPlaying ? 'Pause' : 'Play';
}

/**
 * Call API to pause/play audio when the button is pressed
 */
const toggleAudioPlayPause = () => {
  if (audioPlaying) window.api.setAudioPause();
  else window.api.setAudioPlay();
  audioPlaying = !audioPlaying;
  updatePlayPauseButton();
}
buttonPlayPause.addEventListener('click', toggleAudioPlayPause);

/**
 * Call API to skip to the next song with button is pressed
 */
const audioNext = () => {
  window.api.setAudioNext();
}
buttonNext.addEventListener('click', audioNext);

/**
 * Call API to go to previous song/beginning of song if button is pressed
 */
const audioPrevious = () => {
  window.api.setAudioPrevious();
}
buttonPrevious.addEventListener('click', audioPrevious);

/**
 * When the track is updated, change the title and artist
 */
window.api.onTrackUpdate((_, value) => {
  document.getElementById('track-title').innerText = value.Title;
  document.getElementById('track-artist').innerText = value.Artist;
});

/**
 * When the status is updated outside the app, update the state
 */
window.api.onStatusUpdate((_, value) => {
  // Statuses: "playing", "stopped", "paused", "forward-seek", "reverse-seek" or "error"
  audioPlaying = value === 'playing';
  updatePlayPauseButton();
});

const buttonCurrentDevice = document.getElementById('current-device');
const divDeviceActive = document.getElementById('device-active');
const divDevicePair = document.getElementById('device-pair');

const swapDeviceView = () => {
  if (divDeviceActive.classList.contains('visible')) {
    divDeviceActive.classList.replace('visible', 'hidden');
    divDevicePair.classList.replace('hidden', 'visible');
    return;
  }
  
  divDeviceActive.classList.replace('hidden', 'visible');
  divDevicePair.classList.replace('visible', 'hidden');
}

/**
 * When current device button is clicked, change to device pair view
 */
buttonCurrentDevice.addEventListener('click', () => {
  swapDeviceView();
});

/**
 * When the connected device changes, update the displayed value
 * Change the view to display the device controls (media, etc)
 */
window.api.onDeviceUpdate((_, value) => {
  buttonCurrentDevice.setAttribute('data-path', value.path);
  buttonCurrentDevice.innerText = `Connected to ${value.alias}`;
});

/**
 * Wait to receive the device list and update it visually
 * Buttons created will be clickable and call api to connect
 * If a button is connected and is the current connected device, switch view
 */
window.api.onAgentDeviceListUpdate((_, value) => {
  document.getElementById('device-list').innerHTML = '';
  value.forEach((device, index) => {
    const li = document.createElement('li');
    const button = document.createElement('button');
    button.setAttribute('data-path', device.path);
    button.innerText = device.alias ?? 'Unknown Device';
    button.addEventListener('click', () => {
      if (buttonCurrentDevice.getAttribute('data-path') === device.path) {
        swapDeviceView();
      }
      window.api.setAgentConnect(index);
    });
    li.append(button);
    document.getElementById('device-list').append(li);
  })
})

/**
 * Enter pairing mode when connected
 */
document.getElementById('pair-device').addEventListener('click', () => {
  window.api.setAgentDiscover();
});

/**
 * Update the date and time every 1 second
 */
const headingTime = document.getElementById('time');
const headingDate = document.getElementById('date');
const updateTime = () => {
  const currentDate = new Date();
  
  const timeFormat = `${currentDate.getHours()}:${currentDate.getMinutes()}`;
  const dateFormat = currentDate.toLocaleDateString('en', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
  headingTime.innerText = timeFormat;
  headingDate.innerText = dateFormat;
}
updateTime();
setInterval(() => {
  updateTime();
}, 1000);