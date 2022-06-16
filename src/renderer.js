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
window.api.onDeviceUpdate((_, value) => {
  document.getElementById('device-alias').innerText = `Connected to ${value}`;
});

/**
 * Wait to receive the device list and update it visually
 */
window.api.onAgentDeviceListUpdate((_, value) => {
  document.getElementById('device-list').innerHTML = '';
  value.forEach(device => {
    const li = document.createElement('li');
    li.innerText = device.alias ?? 'Unknown Device';
    li.setAttribute('data-path', device.path);
    document.getElementById('device-list').append(li);
  })
})

/**
 * Connect to device when the button is pressed
 */
