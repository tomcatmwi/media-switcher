# MediaSwitcher class
A Javascript class that allows the switching of video and audio tracks in a MediaStream.

# What does it do?
JavaScript Media and Streaming API's `MediaRecorder` has a problem. It can not switch streams or stream tracks while recording. Recording stops if this is attempted.

`MediaSwitcher` acts as an intermediary between your stream sources and the `MediaRecorder`. It connects to the `MediaRecorder` as a single, uninterrupted stream source, and transmits your various other stream sources (video, audio, etc.) to the recorder. As a result, you can switch between contents.

# How does it work?
The class is the implementation of a long known workaround for the above problem. It creates an `RTCPeerConnection` with itself and sends your stream through it. The output is actually the receiving peer's stream.

# Installation

You would've never guessed:

`npm i media-switcher`

Alternatively you can include `MediaSwitcher.class.js` the traditional way:

```
<script src="MediaSwitcher.class.js" />
```

# Methods

## initialize(inputStream: MediaStream): Promise(outputStream: MediaStream)
Initializes a `MediaSwitcher`. The stream can be an empty `MediaStream` and you can add tracks later.
Returns a Promise, which resolves to the `MediaStream` coming from the `MediaSwitcher`. Use this stream for your `MediaRecorder`.

## changeTrack(track: MediaStreamTrack | CanvasCaptureMediaStreamTrack)
Changes the current audio or video track to the supplied one. The `kind` of the track will be autodetected.

## changeStream(stream: MediaStream)
Changes both the audio and the video tracks to the one in the supplied stream.

# Examples
Let's say you have two `<video>` elements in your HTML DOM:

```
<video id="inputVideo" loop controls src="nyancat.mp4" />
<video id="outputVideo" muted />
```
The latter is muted so we won't hear two audio streams.

Let's connect the stream from `inputVideo` to `outputVideo`:

```
//  Get videos
const inputVideo = document.getElementById('inputVideo');
const outputVideo = document.getElementById('outputVideo');

//  Create a stream source
var myStream = inputVideo.captureStream();

//  Create instance
var mediaSwitcher = new MediaSwitcher();

//  Initialize MediaSwitcher
mediaSwitcher.initialize(myStream)
    .then(switcherStream => {
        outputVideo.srcObject = switcherStream;
        outputVideo.play();
    })
    .catch(err => console.error(err.message));
```

Now, if you play `inputVideo`, its content will appear in `outputVideo`, but it passes through the `MediaSwitcher`. 

##  Switching streams
Let's change the audio track to a different one, coming from an MP3 file.

```
<video id="inputVideo" loop controls src="nyancat.mp4" />
<video id="outputVideo" muted />
<audio id="inputAudio" loop controls src="erika.mp3" />
```

To achieve this, add this to the code:

```
const inputAudio = document.getElementById('inputAudio');

inputAudio.onplay = () => {
    inputVideo.muted = true;
    const track = inputAudio.srcObject.getAudioStreams()[0];
    mediaSwitcher.changeTrack(track);
}
```

Now when you click the Play button on the audio element, the MP3 will replace the video's original soundtrack, while the video stays.