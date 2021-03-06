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

const swapDeviceView = (viewDevicePair) => {
  if (viewDevicePair === true || (viewDevicePair === undefined && divDeviceActive.classList.contains('visible'))) {
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

const createContainerHeadingSpan = (text, subText) => {
  const headingSpan = document.createElement('span');
  headingSpan.classList.add('pill-container__heading');
  const headingTextSpan = document.createElement('span');
  headingTextSpan.classList.add('pill-container__heading_text');
  headingTextSpan.innerText = text;
  const headingSubSpan = document.createElement('span');
  headingSubSpan.classList.add('pill-container__heading_sub_text');
  headingSubSpan.innerText = subText;
  headingSpan.append(headingTextSpan, headingSubSpan);
  return headingSpan
}

/**
 * When the connected device changes, update the displayed value
 */
window.api.onDeviceUpdate((_, value) => {
  if (!value) {
    // No device is connected, so return to connection view, hide this button, and show device list button
    buttonCurrentDevice.classList.replace('visible', 'hidden');
    buttonCurrentDevice.setAttribute('data-path', '');
    [...document.getElementById('device-list').children].forEach(listItem => {
      listItem.children[0].classList.remove('hidden');
    });
    swapDeviceView(true);
    return;
  }
  // Create a connected button with device details, and hide the related button in the device list
  buttonCurrentDevice.classList.replace('hidden', 'visible');
  buttonCurrentDevice.setAttribute('data-path', value.path);
  buttonCurrentDevice.innerHTML = '';
  buttonCurrentDevice.append(createContainerHeadingSpan(value.alias, 'Connected'));
  [...document.getElementById('device-list').children].forEach(listItem => {
    if (listItem.children[0].getAttribute('data-path') === value.path) {
      listItem.children[0].classList.add('hidden');
    } else {
      listItem.children[0].classList.remove('hidden');
    }
  });
});

const createDeviceListButton = (device, index) => {
  const button = document.createElement('button');
  button.classList.add('pill-container', `${device.path === buttonCurrentDevice.getAttribute('data-path') ? 'hidden' : ''}`);
  button.setAttribute('data-path', device.path);
  button.append(createContainerHeadingSpan(device.alias, 'Connect Device'));
  button.addEventListener('click', () => {
    if (buttonCurrentDevice.getAttribute('data-path') === device.path) {
      swapDeviceView(false);
    }
    window.api.setAgentConnect(index);
  });
  return button;
}

/**
 * Wait to receive the device list and update it visually
 * Buttons created will be clickable and call api to connect
 * If a button is connected and is the current connected device, switch view
 */
window.api.onAgentDeviceListUpdate((_, value) => {
  document.getElementById('device-list').innerHTML = '';
  value.forEach((device, index) => {
    const li = document.createElement('li');
    li.append(createDeviceListButton(device, index));
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
  
  const timeFormat = currentDate.toLocaleTimeString('en', {
    hour12: true,
    hour: 'numeric',
    minute: '2-digit'
  }).replace(' PM', '').replace(' AM', '');
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