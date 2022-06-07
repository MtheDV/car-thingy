let audioPlaying = true;

const toggleAudioPlayPause = () => {
  if (audioPlaying) window.api.setAudioPause();
  else window.api.setAudioPlay();
  audioPlaying = !audioPlaying;
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

window.api.onTrackUpdate((_, value) => {
  document.getElementById('track-title').innerText = value.Title;
  document.getElementById('track-artist').innerText = value.Artist;
});
