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

/**
 * When the connected device changes, update the displayed value
 */
const buttonCurrentDevice = document.getElementById('current-device');
window.api.onDeviceUpdate((_, value) => {
  buttonCurrentDevice.setAttribute('data-path', value.path);
  buttonCurrentDevice.innerText = `Connected to ${value.alias}`;
});

/**
 * Wait to receive the device list and update it visually
 * Buttons created will be clickable and call api to connect
 */
window.api.onAgentDeviceListUpdate((_, value) => {
  document.getElementById('device-list').innerHTML = '';
  value.forEach((device, index) => {
    const li = document.createElement('li');
    const button = document.createElement('button');
    button.setAttribute('data-path', device.path);
    button.innerText = device.alias ?? 'Unknown Device';
    button.addEventListener('click', () => {
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
setInterval(() => {
  const currentDate = new Date();
  
  const timeFormat = `${currentDate.getHours()}:${currentDate.getMinutes()}`;
  const dateFormat = currentDate.toLocaleDateString('en', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
  headingTime.innerText = timeFormat;
  headingDate.innerText = dateFormat;
  
  console.log(currentDate.getSeconds());
  console.log(timeFormat);
  console.log(dateFormat);
}, 1000);