//                                    _    .
// █████ █   █ ████  ███ █████      _/ | ,  \
// █   █ █   █ █   █  █  █   █    _/   |. \  \
// █████ █   █ █   █  █  █   █   (_    | ) | )
// █   █ █   █ █   █  █  █   █     \_  |' /  /
// █   █ █████ ████  ███ █████       \_| '  /
//                                         '

import { safeStorage } from "./safe-storage"
import { storageKeys } from "./shared-helpers"

declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext
  }
}
// For testing with Playwright
// TODO: only track sounds played during testing (could expose a global from playwright to let the page know if it's being tested, if there's not a built-in way,
// or could turn the interface into an event-listener-like trackPlayedSounds function that's only called during tests)
export const playedSounds: SoundID[] = []
export type SoundID = keyof typeof resourcePaths

window.AudioContext ??= window.webkitAudioContext
const audioCtx = new AudioContext()
const mainGain = audioCtx.createGain()
mainGain.connect(audioCtx.destination)

const loadProgress = document.getElementById("load-progress")!
const muteButton = document.getElementById("mute-button")!
const muteButtonText = document.getElementById("mute-button-text")!

let muted = safeStorage.getItem(storageKeys.muteSoundEffects) === "true"
let volume = parseFloat(safeStorage.getItem(storageKeys.volume)!)
if (!isFinite(volume) || volume < 0 || volume > 1) {
  volume = 0.5
}
mainGain.gain.value = volume

export const resources: Record<string, AudioBuffer> = {}

export const resourcePaths = {
  undo: 'audio/sound-effects/undo.wav',
  redo: 'audio/sound-effects/redo.wav',
  gong: 'audio/sound-effects/gong-2-232435.mp3',
  gongBrilliant: 'audio/sound-effects/486629__jenszygar__gong-brilliant-paiste-32.mp3',
  // eat: 'audio/sound-effects/kayageum1_c3-91074.mp3',
  eat: 'audio/sound-effects/glockenspiel_a-102771.mp3',
  move: 'audio/sound-effects/tiny-drip.wav',
  switchSnakes: 'audio/sound-effects/snake-hissing-6092.mp3',
  pushCrate: 'audio/sound-effects/509532__mindlesstrails__bookcasedrag__sample.mp3',
  resize: 'audio/sound-effects/736438__riley_garinger__woodfric-scraping-dragging-wooden-4x4-post-on-concrete-02__sample.mp3',
}

const totalResources = Object.keys(resourcePaths).length
let loadedResources = 0
const numProgressBricks = 14
const progressBricks = []

// This function can load all resources or just the hot resource bundle, but progress
// will be indicated for the total set of resources.
export const loadResources = async (resourcePathsByID: Record<string, string>): Promise<Record<string, AudioBuffer>> => {
  const entries = Object.entries(resourcePathsByID)
  let silenceErrors = false
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

export function enableAudioViaUserGesture() {
  if (!muted) {
    void audioCtx.resume()
  }
}

export function toggleMute({ savePreference = true } = {}) {
  muted = !muted
  updateMuteButton()
  if (savePreference) {
    safeStorage.setItem(storageKeys.muteSoundEffects, String(muted))
  }
  if (muted) {
    void audioCtx.suspend()
  } else {
    void audioCtx.resume()
  }
}
export function setVolume(volume: number) {
  if (muted) {
    toggleMute()
  }
  mainGain.gain.value = volume
  updateMuteButton()
  safeStorage.setItem(storageKeys.volume, String(volume))
}

const updateMuteButton = () => {
  muteButton.ariaPressed = muted ? "true" : "false"
  muteButtonText.textContent = muted ? "Unmute" : "Mute"

  // const volume = mainGain.gain.value
  // const icon = muteButton.querySelector(".sprited-icon")
  // let iconIndex
  // if (muted) {
  // 	iconIndex = 21 // muted
  // } else if (volume < 0.3) {
  // 	iconIndex = 22 // volume-low
  // } else if (volume < 0.6) {
  // 	iconIndex = 23 // volume-medium
  // } else {
  // 	iconIndex = 24 // volume-high
  // }
  // icon.style.setProperty("--icon-index", iconIndex)
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

export function playSound(soundName: SoundID, { playbackRate = 1, volume = 1, cutOffEndFraction = 0 } = {}) {
  try {
    if (muted) {
      return
    }
    // For now, test that a sound was attempted to be played.
    // (Actually playing sounds in tests is spotty, though it does happen, and not particularly desirable...)
    playedSounds.push(soundName)

    const audioBuffer = resources[soundName]
    if (!audioBuffer) {
      throw new Error(`No AudioBuffer loaded for sound '${soundName}'`)
    }
    if (audioCtx.state !== "running") {
      console.warn("Audio context not running, can't play sound")
      return
    }
    const gain = audioCtx.createGain()
    const source = audioCtx.createBufferSource()
    source.buffer = audioBuffer
    source.connect(gain)
    gain.connect(mainGain)
    gain.gain.value = volume
    source.playbackRate.value = playbackRate
    if (cutOffEndFraction) {
      gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + audioBuffer.duration * (1 - cutOffEndFraction))
    }
    source.start(0)
  } catch (error) {
    console.error(`Failed to play sound '${soundName}':`, error)
  }
}

const midiToFreq = (midiNote: number) => 440 * Math.pow(2, (midiNote - 69) / 12)
// const songABC = `
// X:231
// T:The Snake Charmer Song
// T:The Streets of Cairo
// Z:Jack Campin, http://www.campin.me.uk/
// F:Jack Campin's Nine-Note Tunebook
// % last edit 03-02-2013
// C:Sol Bloom and James Thornton, 1893
// H:see http://www.shira.net/streets-of-cairo.htm
// M:4/4
// L:1/8
// Q:1/4=120
// K:DMin
// DE| F2 E2 D2 DE|FA  EF  D2   :|\
// z2| AA AB AG EF|
//                 GG  GA  GF     \
// DE| FF FG FE DE|F2  EE  D2 z2||
// K:F
//   |:A4    A3  F|G>A G>F D2 C2 |\
// [1  F2 A2 c2 d2|
//                 c2  d2  cA G2:|\
// [2  F2 AF G2 A2|F4      z2   |]
// `
// Original compositions/improvisations, trying to make it sound good when played with one note every beat since the rhythm is in the player's hands so the only obvious way to play it is 4 on the floor.
// const songABC = "c d e f g a f g e f d e c d"
// const songABC = "c d e f g a b a g f e d c d e d g f a b a f g e f c d g, d ,a c e g b a b g e"
// songABC = "c d e g a c e a f
// const songABC = `
// X:1
// T:2025 02 02T064421Z CDEGA Patter (One Note Every Beat)
// L:1/4
// Q:1/4=120
// M:4/4
// K:none
// %%stretchlast true
// V:1 treble
// V:1
//  C- C/4 (6:5:1D E G/ z/ | (3:2:1z/4 A (6:5:1C F A (3:2:1G/4- | (6:5:1G C (6:5:2E z/8 G F/- | F/ (6:5:2E z/8 C3/4 (6:5:1A, G, C/4- |
//  (12:7:2C D (6:5:2F E (6:5:2C G,/4- | (6:5:2G, E (6:5:1D B,3/4 (6:5:2G, D/- | D/ (3:2:2C G, E,3/4 (6:5:1G, C,/- | C,7/2 z/ |
//  z4 | D,3/4 E, G, A,3/4 F,3/4- | F,/4 (6:5:2C A, (6:5:1E D3/4 (3:2:2C A,/4- | (6:5:2A, F (3:2:1E C3/4 A,3/4 (3:2:2z/8 G,/4- (3:2:1G,/4- |
//  (48:35:2G,4 A, (3:2:1C/- | (3:2:2C/ E- (3:2:2E/4 G (3E C G,- | (3:2:1G,/4 A3/4 (3G D B, E3/4 G/4- | G/ (3:2:2C E G,3/4 C3/4 (3:2:2E, G,/4- |
//  (12:7:2G, z/8 (6:5:1C, G, G,, (6:5:1E,- | (3:2:1E,/ C, G,,- G,,/4 C,,3/2- (3:2:1[EcC]/4- | (3:2:2C,,/4 [EcC]2 (12:7:1z4 |]
// `
// The above was recorded with midi-recorder.web.app and then converted to ABC notation with https://michaeleskin.com/abctools/abctools.html
// It has a lot of timing information that I don't want and complex formatting that I don't want to try to understand.
// I used the rendering with note names shown, and selected the text and copied it and deleted extra stuff, giving the following.
// (This loses octaves but maybe that's fine.)
// spell-checker:disable
const songABC = `CDEGACFAGCEGFECAGCDFECGEDBGDCGEGCDEGAFCAEDCAFECAGACEGECGAGDBEGCEGCEGCGGECGC`
// spell-checker:enable

const melodyMidi = [...songABC.replace(/^([A-Z]:|%).*$/gim, "").matchAll(/([A-G])([,'])*/gi)].map(match => {
  const letter = match[1]
  const octaveModifier = match[2] === "'" ? 1 : match[2] === "," ? -1 : 0
  const octave = (letter === letter.toUpperCase() ? 1 : 0) + octaveModifier
  const midiNote = 12 * (octave + 4) + 'CDEFGAB'.indexOf(letter.toUpperCase())
  return midiNote
})
const melodyFrequencies = melodyMidi.map(midiToFreq)
export function playMelodicSound(soundName: SoundID, noteIndex: number) {
  // const playbackRate = Math.pow(2, this.segments.length / 10) / 10
  // const playbackRate = [1, 2, 3, 4, 5, 6, 4, 3, 2][this.segments.length % 8] * 10
  // const scale = [1, 9 / 8, 5 / 4, 4 / 3, 3 / 2, 5 / 3, 15 / 8, 2]
  // const playbackRate = scale[this.segments.length % scale.length]

  // const playbackRate = melodyFrequencies[this.segments.length % melodyFrequencies.length] / 440
  const playbackRate = melodyFrequencies[noteIndex % melodyFrequencies.length] / 440
  playSound(soundName, { playbackRate })
}

muteButton.addEventListener("click", () => {
  toggleMute()
})

updateMuteButton()
