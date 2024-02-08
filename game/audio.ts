//                                    _    .
// █████ █   █ ████  ███ █████      _/ | ,  \
// █   █ █   █ █   █  █  █   █    _/   |. \  \
// █████ █   █ █   █  █  █   █   (_    | ) | )
// █   █ █   █ █   █  █  █   █     \_  |' /  /
// █   █ █████ ████  ███ █████       \_| '  /
//                                         '

window.AudioContext ??= window.webkitAudioContext
const audioCtx = new AudioContext()
const mainGain = audioCtx.createGain()
mainGain.connect(audioCtx.destination)

const storageKeys = {
  muteSoundEffects: 'snakeshift:muteSoundEffects',
  volume: 'snakeshift:volume',
}

const loadProgress = document.getElementById("load-progress")!
const muteButton = document.getElementById("mute-button")!

const resources: Record<string, AudioBuffer> = {}

const resourcePaths = {
  move: 'move.wav',
  undo: 'undo.wav',
  redo: 'redo.wav',
  winGame: 'win-game.wav',
  levelStart: 'level-start.wav',
}

const totalResources = Object.keys(resourcePaths).length
let loadedResources = 0
const numProgressBricks = 14
const progressBricks = []

// This function can load all resources or just the hot resource bundle, but progress
// will be indicated for the total set of resources.
export const loadResources = async (resourcePathsByID: Record<string, string>) => {
  const entries = Object.entries(resourcePathsByID)
  let silenceErrors = false
  // SILENCING JUST SO I CAN SEE THE CODE, it's a big underline
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return Object.fromEntries(await Promise.all(entries.map(async ([id, path]) => {
    let resource
    try {
      resource = await loadResource(path)
    } catch (error) {
      if (!silenceErrors) {
        if (location.protocol === "file:") {
          // This case is handled only if there was an error, because
          // technically you can disable security features in your browser
          // to allow loading local files, but it's not recommended.
          showErrorMessage(`This page must be served by a web server,\nin order to load files needed for the game.`, error)
          silenceErrors = true
        } else {
          showErrorMessage(`Failed to load resource '${path}'`, error)
          // allow further errors so you can know what specific resources failed
          // (a single dialog box with a list would be better, but this is easier)
        }
      }
    }
    loadedResources += 1
    if (loadedResources / totalResources * numProgressBricks > progressBricks.length) {
      const progressBrick = document.createElement("div")
      progressBrick.classList.add("load-progress-brick")
      progressBricks.push(progressBrick)
      loadProgress.appendChild(progressBrick)
    }
    return [id, resource]
  })))
}
// export let allResourcesLoadedPromise

export let muted = false

export const enableAudioViaUserGesture = () => {
  if (!muted) {
    void audioCtx.resume()
  }
}

export const toggleMute = ({ savePreference = true } = {}) => {
  muted = !muted
  updateMuteButton()
  try {
    if (savePreference) {
      localStorage[storageKeys.muteSoundEffects] = muted
    }
  } catch (error) {
    // that's okay
  }
  if (muted) {
    void audioCtx.suspend()
  } else {
    void audioCtx.resume()
  }
}
export const setVolume = (volume: number) => {
  if (muted) {
    toggleMute()
  }
  mainGain.gain.value = volume
  updateMuteButton()
  try {
    localStorage[storageKeys.volume] = volume
  } catch (error) {
    // no big deal
  }
}

const updateMuteButton = () => {
  muteButton.textContent = muted ? "Unmute" : "Mute"
}

const loadSound = async (path: string) => {
  const response = await fetch(path)
  if (response.ok) {
    return await audioCtx.decodeAudioData(await response.arrayBuffer())
  } else {
    throw new Error(`got HTTP ${response.status} fetching '${path}'`)
  }
}

const loadResource = loadSound // only resource type for now

const showErrorMessage = (message: string, error: unknown) => {
  // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
  alert(`${message}\n\n${error}`)
}

export const playSound = (soundName: string, playbackRate = 1, cutOffEndFraction = 0) => {
  const audioBuffer = resources[soundName]
  if (!audioBuffer) {
    throw new Error(`No AudioBuffer loaded for sound '${soundName}'`)
  }
  if (muted || audioCtx.state !== "running") {
    return
  }
  const gain = audioCtx.createGain()
  const source = audioCtx.createBufferSource()
  source.buffer = audioBuffer
  source.connect(gain)
  gain.connect(mainGain)
  source.playbackRate.value = playbackRate
  if (cutOffEndFraction) {
    gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + audioBuffer.duration * (1 - cutOffEndFraction))
  }
  source.start(0)
}
