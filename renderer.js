const toggleAudioPlayPause = () => {
  window.api.setAudioPlay();
}

const audioNext = () => {
  window.api.setAudioNext();
}

const audioPrevious = () => {
  window.api.setAudioPrevious();
}

document.getElementById('audio-play-pause').addEventListener('click', toggleAudioPlayPause);
document.getElementById('audio-next').addEventListener('click', audioNext);
document.getElementById('audio-previous').addEventListener('click', audioPrevious);
