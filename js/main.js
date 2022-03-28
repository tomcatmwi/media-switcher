'use strict';

const recordButton = document.getElementById('recordButton');
const outputVideo = document.getElementById('outputVideo');
const videoSelector = document.getElementById('video_src');
const audioSelector = document.getElementById('audio_src');

//  Set up video element - this will stream our video files ---------------------------------

const video = document.createElement('video');
video.muted = true;
video.loop = true;
video.oncanplaythrough = () => {
  mediaSwitcher.changeTrack(video.captureStream().getVideoTracks()[0]);
  video.play();
}

//  A second video element is needed to play video soundtracks separately
const videoAudio = document.createElement('video');
videoAudio.muted = true;
videoAudio.loop = true;
videoAudio.oncanplaythrough = () => {
  audio.muted = true;
  videoAudio.muted = false;
  mediaSwitcher.changeTrack(videoAudio.captureStream().getAudioTracks()[0]);
  videoAudio.play();
}

//  Set up audio element - this will stream our audio files ---------------------------------

const audio = new Audio();
audio.loop = true;
audio.oncanplaythrough = () => {
  audio.muted = false;
  videoAudio.muted = true;
  mediaSwitcher.changeTrack(audio.captureStream().getAudioTracks()[0]);
  audio.play();
}

//  Initialize canvas and start animation ---------------------------------------------------

const canvas = document.createElement('canvas');
canvas.width = 320;
canvas.height = 200;
const ctx = canvas.getContext('2d');
ctx.fillStyle = 'black';
ctx.strokeStyle = 'white';
ctx.lineWidth = 1;
ctx.fillRect(0, 0, canvas.width, canvas.height);

var loop = 0;
var step = 1;
var a, b, c, d;
setInterval(() => {

  loop = loop + step;
  if (loop > 200 || loop < -200) step = -step;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (a = 1; a < 639; a += 8) {
    b = loop * Math.sin(a / 60) + 200;
    c = (loop * 0.5) * Math.sin(a / 25) + 320;
    d = (loop * 0.25) * Math.sin(a / 30) + 50;
    b = Math.round(b / 2);
    c = Math.round(c / 2);
    d = Math.round(d / 2);

    ctx.beginPath();
    ctx.moveTo(Math.round(a / 2), b);
    ctx.lineTo(c, d);
    ctx.stroke();
  }
}, (1000 / 30));

//  Initialize camera ----------------------------------------------------------------------

var cameraStream;
navigator.mediaDevices.getUserMedia({
  video: true,
  audio: {
    echoCancellation: true
  }
})
  .then(stream => {
    cameraStream = stream;
    initializeMediaSwitcher(stream);
  })
  .catch(err => alert(err.message));

//  Initialize MediaSwitcher ----------------------------------------------------------------------

const mediaSwitcher = new MediaSwitcher();

const initializeMediaSwitcher = () => {

  mediaSwitcher.initialize(cameraStream)
    .then(stream => {
      outputVideo.srcObject = stream;
      initializeRecorder(stream);

      recordButton.disabled = false;
      videoSelector.disabled = false;
      audioSelector.disabled = false;
    })
    .catch(err => console.error(err.message));
}

//  Set up MediaRecorder ----------------------------------------------------------------------

var recorder;
const recordedChunks = [];

const initializeRecorder = (stream) => {
  recordedChunks.length = 0;
  recorder = new MediaRecorder(stream);
  recorder.ondataavailable = e => recordedChunks.push(e.data);
  recorder.onstart = () => recordButton.innerHTML = 'Stop recording';
  recorder.onstop = () => saveRecording()
}

const saveRecording = async () => {
  recordButton.innerHTML = 'Start recording';
  const blob = new Blob(recordedChunks, { type: "video/webm;codecs=h264" });
  const result = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = result;
  a.download = 'recording.webm';
  a.click();
}

recordButton.onclick = () => {
  recorder.state === 'recording' ? recorder.stop() : recorder.start();
}

//  Set up selector dropdowns ----------------------------------------------------------------------

videoSelector.onchange = e => {
  switch (e.target.value) {
    case 'video1':
    case 'video2':
    case 'video3':
      console.log('Showing ' + e.target.value);
      video.src = `media/${e.target.value}.mp4`;
      break;
    case 'canvas':
      console.log('Showing canvas');
      mediaSwitcher.changeTrack(canvas.captureStream(30).getVideoTracks()[0]);
      break;
    case 'camera':
      console.log('Showing camera feed');
      mediaSwitcher.changeTrack(cameraStream.getVideoTracks()[0]);
      break;
    default:
      alert('Invalid video selection');
      return;
  }
}

audioSelector.onchange = e => {
  switch (e.target.value) {
    case 'video1':
    case 'video2':
    case 'video3':
      console.log('Playing ' + e.target.value);
      videoAudio.src = `media/${e.target.value}.mp4`;
      break;
    case 'audio1':
    case 'audio2':
      console.log('Playing ' + e.target.value);
      audio.src = `media/${e.target.value}.mp3`;
      mediaSwitcher.changeTrack(audio.captureStream().getAudioTracks()[0]);
      break;
    case 'mic':
      console.log('Playing microphone audio');
      audio.muted = true;
      videoAudio.muted = true;
      mediaSwitcher.changeTrack(cameraStream.getAudioTracks()[0]);
      break;
    default:
      alert('Invalid audio selection');
      return;
  }
}
