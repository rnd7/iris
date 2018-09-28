'use strict';
const {ipcRenderer} = require('electron')

// prevent drag and drop defaults
document.addEventListener("dragover",  function(ev){
  ev.preventDefault()
  ev.stopPropagation()
}, false);
document.addEventListener("dragleave",  function(ev){
  ev.preventDefault()
  ev.stopPropagation()
}, false);
document.addEventListener("drop",  function(ev){
  ev.preventDefault()
  ev.stopPropagation()
}, false);

var fullscreen = document.querySelector('#fullscreen')
fullscreen.addEventListener('click', function () {
  ipcRenderer.send('set', 'fullscreen', true)
})

var leaveFullscreen = document.querySelector('#leaveFullscreen')
leaveFullscreen.addEventListener('click', function () {
  ipcRenderer.send('set', 'fullscreen', false)
})

var play = document.querySelector('#play')
play.addEventListener('click', function () {
  ipcRenderer.send('set', 'play', true)
})

var pause = document.querySelector('#pause')
pause.addEventListener('click', function () {
  ipcRenderer.send('set', 'play', false)
})

var rendererSize = document.querySelector('#rendererSize')
rendererSize.addEventListener('change', function (event) {
  ipcRenderer.send('set', 'rendererSize', event.target.value)
})

var nthFrame = document.querySelector('#nthFrame')
nthFrame.addEventListener('change', function (event) {
  ipcRenderer.send('set', 'nthFrame', event.target.value)
})

var xOffset = document.querySelector('#xOffset')
xOffset.addEventListener('input', function (event) {
  ipcRenderer.send('set', 'xOffset', event.target.valueAsNumber)
})

var yOffset = document.querySelector('#yOffset')
yOffset.addEventListener('input', function (event) {
  ipcRenderer.send('set', 'yOffset', event.target.valueAsNumber)
})

var scale = document.querySelector('#scale')
scale.addEventListener('input', function (event) {
  ipcRenderer.send('set', 'scale', event.target.valueAsNumber)
})

var channelRingAVideo = document.querySelector('#channelRingAVideo')
channelRingAVideo.addEventListener("dragover", function(){}, false);
channelRingAVideo.addEventListener("dragleave",  function(){}, false);
channelRingAVideo.addEventListener("drop",  function(ev){
  if( ev.dataTransfer.files.length){
    var filepath = ev.dataTransfer.files[0].path
    ipcRenderer.send('set', 'channel.left.src', filepath)
  }
}, false);

var channelRingBVideo = document.querySelector('#channelRingBVideo')
channelRingBVideo.addEventListener("dragover", function(){}, false);
channelRingBVideo.addEventListener("dragleave",  function(){}, false);
channelRingBVideo.addEventListener("drop",  function(ev){
  ev.preventDefault()
  ev.stopPropagation()
  if( ev.dataTransfer.files.length){
    var filepath = ev.dataTransfer.files[0].path
    ipcRenderer.send('set', 'channel.right.src', filepath)
  }
}, false);

var channelMixAmount = document.querySelector('#channelMixAmount')
channelMixAmount.addEventListener('input', function (event) {
  ipcRenderer.send('set', 'channel.mix', event.target.valueAsNumber)
})

var channelRingAPlaybackSpeed = document.querySelector('#channelRingAPlaybackSpeed')
channelRingAPlaybackSpeed.addEventListener('input', function (event) {
  ipcRenderer.send('set', 'channel.left.playbackSpeed', event.target.valueAsNumber)
})

var channelRingASides = document.querySelector('#channelRingASides')
channelRingASides.addEventListener('input', function (event) {
  ipcRenderer.send('set', 'channel.left.sides', event.target.valueAsNumber)
})

var channelRingBSides = document.querySelector('#channelRingBSides')
channelRingBSides.addEventListener('input', function (event) {
  ipcRenderer.send('set', 'channel.right.sides', event.target.valueAsNumber)
})

var channelRingAAngle = document.querySelector('#channelRingAAngle')
channelRingAAngle.addEventListener('input', function (event) {
  ipcRenderer.send('set', 'channel.left.angle', event.target.valueAsNumber)
})

var channelRingBPlaybackSpeed = document.querySelector('#channelRingBPlaybackSpeed')
channelRingBPlaybackSpeed.addEventListener('input', function (event) {
  ipcRenderer.send('set', 'channel.right.playbackSpeed', event.target.valueAsNumber)
})

var channelRingBAngle = document.querySelector('#channelRingBAngle')
channelRingBAngle.addEventListener('input', function (event) {
  ipcRenderer.send('set', 'channel.right.angle', event.target.valueAsNumber)
})

var channelLogo = document.querySelector('#channelLogo')
channelLogo.addEventListener("dragover", function(){}, false);
channelLogo.addEventListener("dragleave",  function(){}, false);
channelLogo.addEventListener("drop",  function(ev){
  ev.preventDefault()
  ev.stopPropagation()
  if( ev.dataTransfer.files.length){
    var filepath = ev.dataTransfer.files[0].path
    ipcRenderer.send('set', 'logo.src', filepath)
  }
}, false);

var channelSpectrumSize = document.querySelector('#channelSpectrumSize')
channelSpectrumSize.addEventListener('input', function (event) {
  ipcRenderer.send('set', 'spectrum.size', event.target.valueAsNumber)
})

var channelSpectrumScale = document.querySelector('#channelSpectrumScale')
channelSpectrumScale.addEventListener('input', function (event) {
  ipcRenderer.send('set', 'spectrum.scale', event.target.valueAsNumber)
})

var channelSpectrumMix = document.querySelector('#channelSpectrumMix')
channelSpectrumMix.addEventListener('input', function (event) {
  ipcRenderer.send('set', 'spectrum.mix', event.target.valueAsNumber)
})

var channelSpectrumRed = document.querySelector('#channelSpectrumRed')
channelSpectrumRed.addEventListener('input', function (event) {
  ipcRenderer.send('set', 'spectrum.red', event.target.valueAsNumber)
})

var channelSpectrumGreen = document.querySelector('#channelSpectrumGreen')
channelSpectrumGreen.addEventListener('input', function (event) {
  ipcRenderer.send('set', 'spectrum.green', event.target.valueAsNumber)
})

var channelSpectrumBlue = document.querySelector('#channelSpectrumBlue')
channelSpectrumBlue.addEventListener('input', function (event) {
  ipcRenderer.send('set', 'spectrum.blue', event.target.valueAsNumber)
})

var channelRingARed = document.querySelector('#channelRingARed')
channelRingARed.addEventListener('input', function (event) {
  ipcRenderer.send('set', 'channel.left.red', event.target.valueAsNumber)
})

var channelRingAGreen = document.querySelector('#channelRingAGreen')
channelRingAGreen.addEventListener('input', function (event) {
  ipcRenderer.send('set', 'channel.left.green', event.target.valueAsNumber)
})

var channelRingABlue = document.querySelector('#channelRingABlue')
channelRingABlue.addEventListener('input', function (event) {
  ipcRenderer.send('set', 'channel.left.blue', event.target.valueAsNumber)
})

var channelRingBRed = document.querySelector('#channelRingBRed')
channelRingBRed.addEventListener('input', function (event) {
  ipcRenderer.send('set', 'channel.right.red', event.target.valueAsNumber)
})

var channelRingBGreen = document.querySelector('#channelRingBGreen')
channelRingBGreen.addEventListener('input', function (event) {
  ipcRenderer.send('set', 'channel.right.green', event.target.valueAsNumber)
})

var channelRingBBlue = document.querySelector('#channelRingBBlue')
channelRingBBlue.addEventListener('input', function (event) {
  ipcRenderer.send('set', 'channel.right.blue', event.target.valueAsNumber)
})

var channelRingAVignetteSize = document.querySelector('#channelRingAVignetteSize')
channelRingAVignetteSize.addEventListener('input', function (event) {
  ipcRenderer.send('set', 'channel.left.vignetteSize', event.target.valueAsNumber)
})

var channelRingAVignetteTrigger = document.querySelector('#channelRingAVignetteTrigger')
channelRingAVignetteTrigger.addEventListener('input', function (event) {
  ipcRenderer.send('set', 'channel.left.trigger', event.target.valueAsNumber)
})

var channelRingBVignetteSize = document.querySelector('#channelRingBVignetteSize')
channelRingBVignetteSize.addEventListener('input', function (event) {
  ipcRenderer.send('set', "channel.right.vignetteSize", event.target.valueAsNumber)
})

var channelRingBVignetteTrigger = document.querySelector('#channelRingBVignetteTrigger')
channelRingBVignetteTrigger.addEventListener('input', function (event) {
  ipcRenderer.send('set', "channel.right.vignetteTrigger", event.target.valueAsNumber)
})

var master = document.querySelector('#master')
master.addEventListener('input', function (event) {
  ipcRenderer.send('set', 'master', event.target.valueAsNumber)
})



ipcRenderer.on('change', function(event, key, value) {
  switch(key){
    case "play":
    break;
    case "fullscreen":
    break;
    case "rendererSize":
      rendererSize.value = value
    break;
    case "nthFrame":
      nthFrame.value = value
    break;
    case "master":
      master.value = value
    break;
    case "xOffset":
      xOffset.value = value
    break;
    case "yOffset":
      yOffset.value = value
    break;
    case "channel.mix":
      channelMixAmount.value = value
    break;
    case "channel.left.src":
      channelRingAVideo.value = value
    break;
    case "channel.left.sides":
      channelRingASides.value = value
    break;
    case "channel.left.angle":
      channelRingAAngle.value = value
    break;
    case "channel.left.red":
      channelRingARed.value = value
    break;
    case "channel.left.green":
      channelRingAGreen.value = value
    break;
    case "channel.left.blue":
      channelRingABlue.value = value
    break;
    case "channel.left.vignetteSize":
      channelRingAVignetteSize.value = value
    break;
    case "channel.left.vignetteTrigger":
      channelRingAVignetteTrigger.value = value
    break;
    case "channel.right.src":
      channelRingBVideo.value = value
    break;
    case "channel.right.sides":
      channelRingBSides.value = value
    break;
    case "channel.right.angle":
      channelRingBAngle.value = value
    break;
    case "channel.right.red":
      channelRingBRed.value = value
    break;
    case "channel.right.green":
      channelRingBGreen.value = value
    break;
    case "channel.right.blue":
      channelRingBBlue.value = value
    break;
    case "channel.right.vignetteSize":
      channelRingBVignetteSize.value = value
    break;
    case "channel.right.vignetteTrigger":
      channelRingBVignetteTrigger.value = value
    break;
    case "logo.src":
      channelLogo.value = value
    break;
    case "spectrum.size":
      channelSpectrumSize.value = value
    break;
    case "spectrum.scale":
      channelSpectrumScale.value = value
    break;
    case "spectrum.mix":
      channelSpectrumMix.value = value
    break;
    case "spectrum.red":
      channelSpectrumRed.value = value
    break;
    case "spectrum.green":
      channelSpectrumGreen.value = value
    break;
    case "spectrum.blue":
      channelSpectrumBlue.value = value
    break;
  }
})

ipcRenderer.send('initControls')
