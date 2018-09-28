'use strict';

// Imports
const electron = require('electron')
const {ipcRenderer, remote} = electron
var THREE = require('three')
var EffectComposer = require('three-effectcomposer')(THREE)

let scene

// Shaders

/**
* Kaleidoscope shader to draw a beautiful mandala
*/
const MandalaShader = {
	uniforms: {
		"tDiffuse": { type: 't', value: null },
		"sides": { type:'i', value: 6.0 },
		"angle": { type:'f', value: 0.0 },
	},
	vertexShader: [
		"varying vec2 vUv;",
		"void main() {",
			"vUv = uv;",
			"gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0);",
		"}"

	].join( "\n" ),
	fragmentShader: [
		"uniform sampler2D tDiffuse;",
		"uniform float sides;",
		"uniform float angle;",
		"varying vec2 vUv;",
		"void main() {",
			"vec2 p = vUv - vec2(0.5);",
			"float pi = 3.1416;",
			"float tau = 2. * pi;",
			"float pihalf = .5 * pi;",
			"float r = length(p);",
			"float a = atan(p.y, p.x) + angle - pihalf;",
			"a = mod(a, tau/sides);",
			"a = abs(a - tau/sides/2.);",
			"p = r * vec2(cos(a), sin(a));",
			"vec4 color = texture2D(tDiffuse, p + 0.5);",
			"gl_FragColor = color;",
		"}"
	].join( "\n" )
}

/**
* Simple component level color add / subtract shader
*/
const ColorizeShader = {
	uniforms: {
		"tDiffuse": { type:'t', value: null },
		"amount": { type:'f', value: 1.0 },
		"red": { type:'f', value: 0. },
		"green": { type:'f', value: 0. },
		"blue": { type:'f', value: 0. },
	},
	vertexShader: [
		"varying vec2 vUv;",
    "void main() {",
			"vUv = uv;",
			"gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",
		"}"
	].join( "\n" ),
	fragmentShader: [
		"uniform float amount;",
		"uniform float red;",
		"uniform float green;",
		"uniform float blue;",
		"uniform sampler2D tDiffuse;",
		"varying vec2 vUv;",
		"void main() {",
			"vec4 color = texture2D(tDiffuse, vUv);",
			"color.rgb = min(vec3(1.), color.rgb + vec3(red, green, blue) * vec3(amount));",
			"gl_FragColor = color;",
		"}"
	].join( "\n" )
}

/**
* Simple component based inverse multiplication lightness shader
*/
const LightnessShader = {
	uniforms: {
		"tDiffuse": { type:'t', value: null },
		"amount": { type:'f', value: 1.0 },
	},
	vertexShader: [
		"varying vec2 vUv;",
    "void main() {",
			"vUv = uv;",
			"gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",
		"}"
	].join( "\n" ),
	fragmentShader: [
		"uniform float amount;",
		"uniform sampler2D tDiffuse;",
		"varying vec2 vUv;",
		"void main() {",
			"vec4 color = texture2D(tDiffuse, vUv);",
			"color.rgb = color.rgb * vec3(amount);",
			"gl_FragColor = color;",
		"}"
	].join( "\n" )
}

/**
* Creates a Vignette
*/
const VignetteShader = {
	uniforms: {
		"tDiffuse": { type:'t', value: null },
		"size":   { type:'f', value: 1.0 },
		"smooth": { type:'f', value: 0.5 },
	},
	vertexShader: [
    "varying vec2 vUv;",
    "void main() {",
			"vUv = uv;",
			"gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",
		"}"
	].join( "\n" ),
	fragmentShader: [
		"uniform float size;",
		"uniform float smooth;",
		"uniform sampler2D tDiffuse;",
		"varying vec2 vUv;",
		"void main() {",
			"vec4 color = texture2D(tDiffuse, vUv);",
			"float dist = distance(vUv, vec2( 0.5 ));",
			"color.rgb *= smoothstep(0.8, size * 0.5, dist * (smooth + size));",
			"gl_FragColor = color;",
		"}"
	].join( "\n" )
}

/**
* Specialized composing shader combines two mandalas, the spectrum and the logo
*/
const ChannelComposerShader = {
	uniforms: {
		"ringA": { type:'t', value: null },
		"ringB": { type:'t', value: null },
		"mixAmount":   { type:'f', value: 0.5 },
		"spectrum": { type:'t', value: null },
		"spectrumMix": { type:'f', value: 0.5 },
		"spectrumBlendMode": { type:'i', value: 0 },
    "logo": { type:'t', value: null}
	},
	vertexShader: [
    "varying vec2 vUv;",
    "void main() {",
			"vUv = uv;",
			"gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",
		"}"
	].join( "\n" ),
	fragmentShader: [
    "uniform sampler2D ringA;",
    "uniform sampler2D ringB;",
		"uniform float mixAmount;",
    "uniform sampler2D spectrum;",
		"uniform float spectrumMix;",
		"uniform int spectrumBlendMode;",
		"uniform sampler2D logo;",
		"varying vec2 vUv;",
		"void main() {",
      "vec4 color = vec4(.0, .0, .0, 1.);",
			"vec4 ringACol = texture2D(ringA, vUv);",
			"vec4 ringBCol = texture2D(ringB, vUv);",
      "color.rgb = ringACol.rgb * vec3(1. - mixAmount) + ringBCol.rgb * vec3(mixAmount);",
      "vec4 spectrumColor = texture2D(spectrum, vUv);",
      "if (spectrumBlendMode == 0) {", // mix
        "color.rgb = (color.rgb * vec3(1.-spectrumMix)) + (spectrumColor.rgb * vec3(spectrumMix));",
      "} else if (spectrumBlendMode == 1) {", // add
        "color.rgb = min(vec3(1.,1.,1.), color.rgb + (spectrumColor.rgb * vec3(spectrumMix)));",
      "} else if (spectrumBlendMode == 2) {", // subtract
        "color.rgb = max(vec3(0.,0.,0.), color.rgb - (spectrumColor.rgb * vec3(spectrumMix)));",
      "} else if (spectrumBlendMode == 3) {", // multiply
        "color.rgb *= spectrumColor.rgb * vec3(spectrumMix);",
      "} else if (spectrumBlendMode == 4) {", // divide
        "color.rgb = min(vec3(1.), color.rgb / max(vec3(.0001), spectrumColor.rgb * vec3(spectrumMix)));",
      "} else if (spectrumBlendMode == 5) {", // lighten
        "color.rgb = max(color.rgb, spectrumColor.rgb * vec3(spectrumMix));",
      "} else if (spectrumBlendMode == 6) {", // darken
        "color.rgb = min(color.rgb, spectrumColor.rgb * vec3(spectrumMix));",
      "}",
			"vec4 logoCol = texture2D(logo, vUv);",
      "color.rgb = color.rgb * (1.-logoCol.a) + logoCol.rgb * logoCol.a;",
      "gl_FragColor = color;",
		"}"
	].join( "\n" )
}


/**
* Mixes two channels
*/
const ChannelMixerShader = {
	uniforms: {
		"channel": { type:'t', value: null },
		"mixAmount":   { type:'f', value: 0.5 },
	},
	vertexShader: [
    "varying vec2 vUv;",
    "void main() {",
			"vUv = uv;",
			"gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",
		"}"
	].join( "\n" ),
	fragmentShader: [
    "uniform sampler2D channel;",
		"uniform float mixAmount;",
		"varying vec2 vUv;",
		"void main() {",
      "gl_FragColor = texture2D(channel, vUv);",
		"}"
	].join( "\n" )
}

// 0-4 while from 3 up logging wil occur per tick
const LOG_LEVEL = 0

// Audio Analylser Fast Fourier Transform Buffer Size
const FFT_SIZE = 2048
const FFT_MAG = 128
// Render Target Width and Height
const BUFFER_SIZE = 1024
// Cam Settings
const FOV = 75
const ASPECT = BUFFER_SIZE / BUFFER_SIZE
const NEAR = 0.1
const FAR = 10
// Spectrum Settings
const SPECTRUM_POINT_COUNT = 256

/**
* Creates a buffered video texture mandala ring
*/
function makeRing(renderer, analyserData) {
  var t = {}

  t.renderer = renderer
  t.analyserData = analyserData

  // Buffer
  t.buffer = new THREE.WebGLRenderTarget(
     BUFFER_SIZE,
     BUFFER_SIZE,
     {
       minFilter: THREE.LinearFilter,
       magFilter: THREE.LinearFilter,
       depthBuffer: false,
       stencilBuffer: false,
     }
   )

  // Scene
  t.scene = new THREE.Scene()

  t.loaded = false
  t.video = document.createElement("VIDEO")
  t.video.autoplay = true
  t.video.loop = true
  t.video.controls = false
  t.video.muted = true
  t.video.addEventListener('loadeddata', function() {
      if (LOG_LEVEL >= 2) console.log("video loaded")
      t.loaded = true
      t.material.needsUpdate = true
  })
  if (LOG_LEVEL >= 2) console.log(t.video)

  t.texture = new THREE.VideoTexture(t.video)
  t.texture.minFilter = THREE.LinearFilter
  t.texture.magFilter = THREE.LinearFilter;
  t.texture.format = THREE.RGBFormat
  t.material = new THREE.MeshBasicMaterial({map : t.texture})

  t.geometry = new THREE.PlaneBufferGeometry(2, 2)

  t.mesh = new THREE.Mesh(t.geometry, t.material)

  //t.camera = new THREE.PerspectiveCamera(FOV, ASPECT, NEAR, FAR)
  t.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, NEAR, FAR)
  t.camera.position.z = 1;

  t.scene.add(t.mesh)

  // Composer
  t.composer = new EffectComposer(t.renderer, t.buffer)
  t.composer.addPass(new EffectComposer.RenderPass(t.scene, t.camera))

  t.mandala = new EffectComposer.ShaderPass(MandalaShader)
  t.mandala.uniforms.sides.value = 6
  t.mandala.uniforms.angle.value = 0.
  t.composer.addPass(t.mandala)

  t.colorize = new EffectComposer.ShaderPass(ColorizeShader)
  t.colorize.uniforms.amount.value = 1.
  t.colorize.uniforms.red.value = 0.
  t.colorize.uniforms.green.value = 0.
  t.colorize.uniforms.blue.value = 0.
  t.composer.addPass(t.colorize)

  t.vignette = new EffectComposer.ShaderPass(VignetteShader)
  t.vignette.uniforms.size.value = .5
  t.vignetteSize = 1.
  t.minVignetteSize = 1.
  t.vignetteSizeScale = 2.
  t.vignetteTrigger = 0.5
  t.composer.addPass(t.vignette)

  t.render = function() {
    if (LOG_LEVEL >= 3) console.log("render ring")
    var vignetteSize =  t.vignetteSize * (1-t.vignetteTrigger) + t.analyserData.volume * (t.vignetteTrigger)
    t.vignette.uniforms.smooth.value = t.minVignetteSize + (1-vignetteSize)*t.vignetteSizeScale
    if(t.loaded) t.composer.render()
  }

  t.setSrc = function(src) {
    if (LOG_LEVEL >= 2) console.log("set video source")
    t.video.src = src
    t.loaded = false
  }
  return t
}

/**
* Returns an vertices array for spectrum visualation
*/
function makeSpectrumVerticeArray() {
  return new Float32Array( SPECTRUM_POINT_COUNT * 3 * 3)
}

/**
* Updates vertices array for spectrum visualation
*/
function updateSpectrumVertices(vertices, analyserData, radius, scale) {
  var angleStep = (360 / SPECTRUM_POINT_COUNT) *  Math.PI / 180
  var offset, i
  for (i = 0; i < SPECTRUM_POINT_COUNT; i++) {
    offset = analyserData.spectrum[i] * scale * radius;
    // Expecting Triangles [x, y, z,   x, y, z,   x, y, z]
    vertices[ i*9 + 0 ] = (radius + offset) * Math.cos(angleStep*i) // x
    vertices[ i*9 + 1 ] = (radius + offset) * Math.sin(angleStep*i) // y
    //vertices[ i*3*3 + 2 ] = 0. // z does not change
    if (i<SPECTRUM_POINT_COUNT) {

      vertices[ i*9 + 3 ] = (radius + offset) * Math.cos(angleStep*(i+1)) // x
      vertices[ i*9 + 4 ] = (radius + offset) * Math.sin(angleStep*(i+1)) // y
      //vertices[ i*3*3 + 5 ] = 0. // z does not change
    } else {

      vertices[ i*9 + 3 ] = (radius + offset) * Math.cos(angleStep*(0)) // x
      vertices[ i*9 + 4 ] = (radius + offset) * Math.sin(angleStep*(0)) // y
      //vertices[ i*3*3 + 5 ] = 0. // z does not change
    }
    //vertices[ i*3*3 + 6 ] = 0. // x does not change
    //vertices[ i*3*3 + 7 ] = 0. // y does not change
    //vertices[ i*3*3 + 8 ] = 0. // z does not change
  }
}

/**
* Creates and returns a buffered spectrum visualation
*/
function makeSpectrum(renderer, analyserData) {
  var t = {}

  t.renderer = renderer
  t.analyserData = analyserData

  t.radius = .22
  t.scale = .4

  // Buffer
  t.buffer = new THREE.WebGLRenderTarget(
     BUFFER_SIZE,
     BUFFER_SIZE,
     {
       minFilter: THREE.LinearFilter,
       magFilter: THREE.LinearFilter,
       depthBuffer: false,
       stencilBuffer: false,
     }
   )
  // Scene
  t.scene = new THREE.Scene()

  t.vertices = makeSpectrumVerticeArray();
  t.geometry = new THREE.BufferGeometry()
  t.geometry.addAttribute('position', new THREE.BufferAttribute(t.vertices, 3))
  t.geometry.addAttribute('position', new THREE.BufferAttribute(t.vertices, 3))

  t.color = new THREE.Color(0xFFFFFF, 1.0)

  t.material = new THREE.MeshBasicMaterial({ color:0xFFFFFF, wireframe:false })
  t.mesh = new THREE.Mesh(t.geometry, t.material)

  t.scene.add(t.mesh)

  //t.camera = new THREE.PerspectiveCamera(FOV, ASPECT, NEAR, FAR)
  t.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, NEAR, FAR)
  t.camera.position.z = 1;


  t.updatePoints = function() {
    if (LOG_LEVEL >= 3) console.log("update spectrum points")
    updateSpectrumVertices(t.vertices, t.analyserData, t.radius, t.scale)
    t.geometry.attributes.position.needsUpdate = true;
  }

  t.render = function() {
    if (LOG_LEVEL >= 3) console.log("render spectrum")
    t.updatePoints()
    t.renderer.render(t.scene, t.camera, t.buffer)
  }

  return t
}

/**
* Creates and returns a logo buffer
*/
function makeLogo(renderer) {
  var t = {}

  t.renderer = renderer

  // Buffer
  t.buffer = new THREE.WebGLRenderTarget(
    BUFFER_SIZE,
    BUFFER_SIZE,
    {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      depthBuffer: false,
      stencilBuffer: false,
    }
  )

  // Scene
  t.scene = new THREE.Scene()

  t.image = document.createElement("IMG")
  t.loaded = false
  t.texture = new THREE.Texture(t.image)
  t.material = new THREE.MeshBasicMaterial({ map: t.texture })
  t.image.onload = function() {
      if (LOG_LEVEL >= 2) console.log("logo image loaded")
      t.loaded = true
      t.material.map.image = this
      t.texture.needsUpdate = true
      t.material.needsUpdate = true
  }
  if (LOG_LEVEL >= 2) console.log(t.image)

  t.geometry = new THREE.CircleBufferGeometry(.2, 64)
  t.mesh = new THREE.Mesh(t.geometry, t.material)


  //t.camera = new THREE.PerspectiveCamera(FOV, ASPECT, NEAR, FAR)
  t.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, NEAR, FAR)
  t.camera.position.z = 1;

  t.scene.add(t.mesh)

  t.render = function() {
    if (LOG_LEVEL >= 3) console.log("render logo image")
    if(t.loaded) t.renderer.render(t.scene, t.camera, t.buffer)
  }

  t.setSrc = function(src) {
    if (LOG_LEVEL >= 2) console.log("set logo image source")
    t.image.src = src
    t.loaded = false
  }

  return t
}

/**
* Returns a channel instance
*/
function makeChannel(renderer, analyserData) {
  var t = {}

  t.renderer = renderer
  t.analyserData = analyserData
  // Src
  t.ringA = makeRing(t.renderer, t.analyserData)
  t.ringB = makeRing(t.renderer, t.analyserData)
  t.spectrum = makeSpectrum(t.renderer, t.analyserData)
  t.logo = makeLogo(t.renderer)

  // Buffer
  t.buffer = new THREE.WebGLRenderTarget(
    BUFFER_SIZE,
    BUFFER_SIZE,
    {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      depthBuffer: false,
      stencilBuffer: false,
    }
  )

  // Scene
  t.scene = new THREE.Scene()

  //t.camera = new THREE.PerspectiveCamera(FOV, ASPECT, NEAR, FAR)
  t.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, NEAR, FAR)
  t.camera.position.z = 1;

  t.geometry = new THREE.PlaneBufferGeometry(2, 2)

  t.material = new THREE.ShaderMaterial(ChannelComposerShader)
  t.material.uniforms.ringA.value = t.ringA.buffer.texture
  t.material.uniforms.ringB.value = t.ringB.buffer.texture
  t.material.uniforms.mixAmount.value = 0.5
  t.material.uniforms.spectrum.value = t.spectrum.buffer.texture
  t.material.uniforms.spectrumMix.value = 0.3
  t.material.uniforms.spectrumBlendMode.value = 1 // 0: mix, 1: add, 2:subtract, 3:multiply, 4:divide, 5:lighten, 6:darken
  t.material.uniforms.logo.value = t.logo.buffer.texture

  t.mesh = new THREE.Mesh(t.geometry, t.material)

  t.scene.add(t.mesh)

  t.render = function() {
    if (LOG_LEVEL >= 3) console.log("render channel")
    //if(t.material.uniforms.mixAmount.value < 1)
    t.ringA.render()
    //if(t.material.uniforms.mixAmount.value > 0)
    t.ringB.render()
    if(t.material.uniforms.spectrumMix.value > 0) t.spectrum.render()
    t.logo.render()
    t.renderer.render(t.scene, t.camera, t.buffer)
  }
  return t
}

/**
* Creates and return a mixer instance
* pass the renderer and two channel instances as params
*/
function makeMixer(renderer, channel, analyserData) {
  var t = {}

  t.renderer = renderer
  t.analyserData = analyserData

  // Src
  t.channel = channel

  // Buffer
  t.buffer = new THREE.WebGLRenderTarget(
    BUFFER_SIZE,
    BUFFER_SIZE,
    {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      depthBuffer: false,
      stencilBuffer: false,
    }
  )

  // Scene
  t.scene = new THREE.Scene()

  t.geometry = new THREE.PlaneBufferGeometry(2, 2)

  t.material = new THREE.ShaderMaterial(ChannelMixerShader)
  t.material.uniforms.channel.value = t.channel.buffer.texture
  t.material.uniforms.mixAmount.value = 0.5

  t.mesh = new THREE.Mesh(t.geometry, t.material)

  //t.camera = new THREE.PerspectiveCamera(FOV, ASPECT, NEAR, FAR)
  t.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, NEAR, FAR)
  t.camera.position.x = 0
  t.camera.position.y = 0
  t.camera.position.z = 1

  t.scene.add(t.mesh)

  // Shader Passes

  t.composer = new EffectComposer(t.renderer)
  t.composer.addPass(new EffectComposer.RenderPass(t.scene, t.camera))

  t.lightness = new EffectComposer.ShaderPass(LightnessShader)
  t.lightness.uniforms.amount.value = 1.
  t.lightness.renderToScreen = true
  t.lightnessVolumeTrigger = false
  t.lightnessValue = 1.
  t.composer.addPass(t.lightness)

  t.render = function() {
    if (LOG_LEVEL >= 3) console.log("render mixer")
    if(t.lightnessVolumeTrigger) {
      t.lightness.uniforms.amount.value = t.lightnessValue * t.analyserData.volume
    } else {
      t.lightness.uniforms.amount.value = t.lightnessValue
    }
    t.composer.render()
  }

  return t
}

/**
* Calculate average volume from analyserData
*/
function analyse(analyserBuffer, bufferLength, analyserData) {
    analyserData.volume = 0
    analyserData.spectrum = analyserData.spectrum || []
    var sum = 0
    var bandWidth = Math.floor(bufferLength/SPECTRUM_POINT_COUNT)
    var bandSum = 0
    var val, i
    for (i = 0; i < bufferLength; i++) {
      val = (analyserBuffer[i] - FFT_MAG) / FFT_MAG
      analyserData.volume += Math.sqrt(val * val)
      if((i+1)%bandWidth == 0) {
        analyserData.spectrum[Math.floor(i/bandWidth)] = (bandSum/bandWidth)
        bandSum = 0
      }
      bandSum += val
    }
    analyserData.volume /= bufferLength
}

/**
* Create a Scene
*/
function makeScene(selector) {
  var t = {}

  t.selector = selector || "body"
  t.paused = true
  t.scheduled = false

  t.audioCtx = new AudioContext()
  t.analyser = t.audioCtx.createAnalyser()
  t.analyser.fftSize = FFT_SIZE
  t.bufferLength = t.analyser.frequencyBinCount
  t.analyserBuffer = new Uint8Array(t.bufferLength)
  t.analyserData = {}
  t.analyser.getByteTimeDomainData(t.analyserBuffer)
  t.source = null
  t.volume = 0.
  navigator.getUserMedia(
    {audio: true},
    function(stream) {
      t.source = t.audioCtx.createMediaStreamSource(stream);
      t.source.connect(t.analyser);
    },
    function(err) {
       console.warn(err);
    }
  )

  t.renderer = new THREE.WebGLRenderer({ antialias: true })
  t.renderer.setPixelRatio(window.devicePixelRatio)
  t.renderer.setSize(BUFFER_SIZE, BUFFER_SIZE)

  t.container = document.querySelector(t.selector)
  t.container.appendChild(t.renderer.domElement)

  t.channel = makeChannel(t.renderer, t.analyserData)

  t.mixer = makeMixer(t.renderer, t.channel, t.analyserData)

  t.render = function() {
    if (LOG_LEVEL >= 3) console.log("render scene")
    t.channel.render()
    t.mixer.render()
  }

  t.processAudio = function(){
    if (LOG_LEVEL >= 3) console.log("process audio")
    t.analyser.getByteTimeDomainData(t.analyserBuffer)
    analyse(t.analyserBuffer, t.bufferLength, t.analyserData)
    if (LOG_LEVEL >= 4) console.log(t.analyserData)
  }

  t.update = function() {
    if (LOG_LEVEL >= 3) console.log("update scene")
    t.processAudio()
    t.render()
  }

  t.nthFrame = 1
  t.iteration = 0
  t.loop = function() {
    if (LOG_LEVEL >= 3) console.log("loop scene")
    t.iteration++
    t.scheduled = false
    if (!t.paused) {
      t.scheduled = true
      requestAnimationFrame(t.loop)
      if(t.iteration%t.nthFrame == 0) t.update()
    }
  }

  t.play = function() {
    if (LOG_LEVEL >= 2) console.log("scene play")
    if (t.paused) {
      t.paused = false
      if (!t.scheduled) t.loop()
    }
  }

  t.pause = function() {
    if (LOG_LEVEL >= 2) console.log("scene pause")
    if (!t.paused) t.paused = true
  }
  return t
}

/* Expose the API via interprocess communication */

ipcRenderer.on('get', function(event, key, value) {
  switch(key) {
    case "channel.left.buffer":
      ipcRenderer.send('set', 'channel.left.buffer', scene.channel.ringA.buffer)
    break;
    case "channel.right.buffer":
      ipcRenderer.send('set', 'channel.right.buffer', scene.channel.ringB.buffer)
    break;
  }
})

ipcRenderer.on('change', function(event, key, value) {
  if (LOG_LEVEL >= 2) console.log("change", key, value)
  switch(key) {
    case "play":
      if(value) scene.play()
      else scene.pause()
    break;
    case "fullscreen":
      remote.getCurrentWindow().setFullScreen(value);
    break;
    case "rendererSize":
      scene.renderer.setSize(value, value)
    break;
    case "nthFrame":
      scene.nthFrame = value
    break;
    case "master":
      scene.mixer.lightnessValue = value
    break;
    case "xOffset":
      scene.mixer.camera.position.x = value
    break;
    case "yOffset":
      scene.mixer.camera.position.y = value
    break;
    case "scale":
      scene.mixer.camera.zoom = value
      scene.mixer.camera.updateProjectionMatrix()
    break;
    case "channel.mix":
      scene.channel.material.uniforms.mixAmount.value = value
    break;
    case "channel.left.src":
      scene.channel.ringA.setSrc(value)
    break;
    case "channel.left.playbackSpeed":
      scene.channel.ringA.video.playbackRate = value
    break;
    case "channel.left.sides":
      scene.channel.ringA.mandala.uniforms.sides.value = value
    break;
    case "channel.left.angle":
      scene.channel.ringA.mandala.uniforms.angle.value = value * Math.PI * 2
    break;
    case "channel.left.red":
      scene.channel.ringA.colorize.uniforms.red.value = value
    break;
    case "channel.left.green":
      scene.channel.ringA.colorize.uniforms.green.value = value
    break;
    case "channel.left.blue":
      scene.channel.ringA.colorize.uniforms.blue.value = value
    break;
    case "channel.left.vignetteSize":
      scene.channel.ringA.vignetteSize = value
    break;
    case "channel.left.vignetteTrigger":
      scene.channel.ringA.vignetteTrigger = value
    break;
    case "channel.left.buffer":
      scene.channel.ringA.buffer = value
    break;
    case "channel.right.src":
      scene.channel.ringB.setSrc(value)
    break;
    case "channel.right.playbackSpeed":
      scene.channel.ringB.video.playbackRate = value
    break;
    case "channel.right.sides":
      scene.channel.ringB.mandala.uniforms.sides.value = value
    break;
    case "channel.right.angle":
      scene.channel.ringB.mandala.uniforms.angle.value = value * Math.PI * 2
    break;
    case "channel.right.red":
      scene.channel.ringB.colorize.uniforms.red.value = value
    break;
    case "channel.right.green":
      scene.channel.ringB.colorize.uniforms.green.value = value
    break;
    case "channel.right.blue":
      scene.channel.ringB.colorize.uniforms.blue.value = value
    break;
    case "channel.right.vignetteSize":
      scene.channel.ringB.vignetteSize = value
    break;
    case "channel.right.vignetteTrigger":
      scene.channel.ringB.vignetteTrigger = value
    break;
    case "channel.right.buffer":
      scene.channel.ringB.buffer = value
    break;
    case "logo.src":
      scene.channel.logo.setSrc(value)
    break;
    case "spectrum.size":
      scene.channel.spectrum.radius = value
    break;
    case "spectrum.scale":
      scene.channel.spectrum.scale = value
    break;
    case "spectrum.mix":
      scene.channel.material.uniforms.spectrumMix.value = value
    break;
    case "spectrum.red":
      scene.channel.spectrum.material.color.r = value
      scene.channel.spectrum.material.needsUpdate = true
    break;
    case "spectrum.green":
      scene.channel.spectrum.material.color.g = value
      scene.channel.spectrum.material.needsUpdate = true
    break;
    case "spectrum.blue":
      scene.channel.spectrum.material.color.b = value
      scene.channel.spectrum.material.needsUpdate = true
    break;
  }
})

function init(mode) {
  // hit it
  scene = makeScene('#screen')
  if(mode === 'preview') ipcRenderer.send('initPreview')
  else ipcRenderer.send('initDisplay')

}
module.exports.init = init
