const electron = require('electron')
const app = electron.app
const BrowserWindow = electron.BrowserWindow
const {ipcMain} = electron
var THREE = require('three')

const path = require('path')
const url = require('url')

let controlsWindow
let displayWindow

let fullscreen = false

function toggleFullscreen() {
  //  fullscreen = !fullscreen
  //  displayWindow.setFullScreen(fullscreen)
}
function createWindow() {
  controlsWindow = new BrowserWindow({width: 800, height: 600})
  controlsWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'component/controls/ui.html'),
    protocol: 'file:',
    slashes: true
  }))
  // Open the DevTools.
  //controlsWindow.webContents.openDevTools()
  controlsWindow.on('closed', function () {
    controlsWindow = null
  })

  displayWindow = new BrowserWindow({width: 800, height: 600})
  displayWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'component/display/ui.html'),
    protocol: 'file:',
    slashes: true
  }))
  // Open the DevTools.
  //displayWindow.webContents.openDevTools()
  displayWindow.on('closed', function () {
    displayWindow = null
  })
}

app.on('ready', createWindow)

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function() {
  if (mainWindow === null) {
    createWindow()
  }
})


var model = {
  play: true,
  fullscreen: false,
  rendererSize: 512,
  nthFrame: 1,
  master: 1,
  xOffset: 0,
  yOffset: 0,
  zOffset: 1,
  channel:{
    mix: 0.5,
    left: {
      src: path.resolve('./assets/ringADemo.mp4'),
      playbackSpeed: 1.0,
      sides: 6,
      angle: 0,
      red: 0,
      green: 0,
      blue: 0,
      vignetteSize: 1.,
      vignetteTrigger: .4,
      buffer: new THREE.WebGLRenderTarget(
        512,
        512,
        {
          minFilter: THREE.LinearFilter,
          magFilter: THREE.LinearFilter,
          depthBuffer: false,
          stencilBuffer: false,
        }
      )
    },
    right: {
      src: path.resolve('./assets/ringBDemo.mp4'),
      playbackSpeed: 1.0,
      sides: 6,
      angle: 0,
      red: 0,
      green: 0,
      blue: 0,
      vignetteSize: 1.,
      vignetteTrigger: .4,
      buffer: new THREE.WebGLRenderTarget(
        512,
        512,
        {
          minFilter: THREE.LinearFilter,
          magFilter: THREE.LinearFilter,
          depthBuffer: false,
          stencilBuffer: false,
        }
      )
    },
  },
  logo: {
    src: path.resolve('./assets/logoDemo.png')
  },
  spectrum:{
    size: 0.21,
    scale: 0.25,
    mix: 0.6,
    red: .8,
    green: .8,
    blue: .8,
  },
}

function setRecursive(pointer, path, value) {
  var name = path.shift()
  if(pointer.hasOwnProperty(name)) {
    if(path.length) setRecursive(pointer[name], path, value)
    else pointer[name] = value
  }
}

function notifyRecursive(ipc, pointer, path) {
  if (!ipc) return
  for (var k in pointer) {
    pathBranch = path.slice(0)
    pathBranch.push(k)
    if(pointer[k] !== null && typeof pointer[k]  === 'object') {
      notifyRecursive(ipc, pointer[k], pathBranch)
    } else {
      ipc.send('change', pathBranch.join('.'), pointer[k])
    }
  }
}

ipcMain.on('get', function(event, key, value){
  displayWindow.send('get', key, value)
})

ipcMain.on('initDisplay', function(event){
  notifyRecursive(displayWindow, model, [])
})

ipcMain.on('initControls', function(event){
  notifyRecursive(controlsWindow, model, [])
})

ipcMain.on('set', function(event, key, value){
  setRecursive(model, key.split('.'), value)
  if(displayWindow) displayWindow.send('change', key, value)
  if(controlsWindow) controlsWindow.send('change', key, value)
})
