import { enableAudioViaUserGesture, loadResources, resourcePaths, resources, toggleMute } from "./audio"
import { animate, shouldInputBeAllowed } from "./game"
import { activityMode, clearLevel, goToHistoryIndex, handleLevelCompletion, loadLevel, openLevel, redo, restartLevel, saveLevel, savePlaythrough, setActivityMode, setControlScheme, undo, undoable } from "./game-state"
import { clipboardCopy, clipboardCut, clipboardPaste, deleteSelectedEntities, initLevelEditorGUI, invert, selectAll, translateSelection } from "./level-editor"
import { initLevelSelect } from "./level-select"
import { hideLevelSplash, initMainMenu, showMainMenu } from "./menus"
import { canvas } from "./rendering"
import { safeStorage } from "./safe-storage"
import { LOCAL_STORAGE_FORMAT_VERSION, storageKeys } from "./shared-helpers"
import './testing-interface'
import { ControlScheme } from "./types"

const playEditToggleButton = document.querySelector<HTMLButtonElement>('#play-edit-toggle-button')!
const restartLevelButton = document.querySelector<HTMLButtonElement>('#restart-level-button')!
const undoButton = document.querySelector<HTMLButtonElement>('#undo-button')!
const redoButton = document.querySelector<HTMLButtonElement>('#redo-button')!
const fullscreenButton = document.getElementById("fullscreen-button")!
const replaySlider = document.getElementById("replay-slider") as HTMLInputElement
const settingsButton = document.querySelector<HTMLButtonElement>("#settings-button")!
const settingsDialog = document.querySelector<HTMLDialogElement>('#settings-dialog')!
const settingsDialogOKButton = document.querySelector<HTMLDialogElement>('#settings-dialog-ok-button')!
const settingsDialogCancelButton = document.querySelector<HTMLDialogElement>('#settings-dialog-cancel-button')!
const hapticsEnabledCheckbox = settingsDialog.querySelector<HTMLInputElement>('#settings-haptics-enabled')!
const hapticsValidDurationInput = settingsDialog.querySelector<HTMLInputElement>('#settings-haptics-valid-move-ms')!
const hapticsInvalidDurationInput = settingsDialog.querySelector<HTMLInputElement>('#settings-haptics-invalid-move-ms')!
const gamepadRepeatRateInput = settingsDialog.querySelector<HTMLInputElement>('#settings-gamepad-repeat-rate')!
const gamepadRepeatDelayInput = settingsDialog.querySelector<HTMLInputElement>('#settings-gamepad-repeat-delay')!

playEditToggleButton.addEventListener('click', () => {
  setActivityMode(activityMode === "play" ? "edit" : "play")
})
restartLevelButton.addEventListener('click', restartLevel)
undoButton.addEventListener('click', undo)
redoButton.addEventListener('click', redo)
fullscreenButton.addEventListener('click', toggleFullscreen)

function updateSubSettings() {
  hapticsValidDurationInput.disabled = !hapticsEnabledCheckbox.checked
  hapticsInvalidDurationInput.disabled = !hapticsEnabledCheckbox.checked
  for (const element of document.querySelectorAll('.enabled-by-haptics')) {
    element.classList.toggle('disabled', !hapticsEnabledCheckbox.checked)
  }
}
hapticsEnabledCheckbox.addEventListener('change', updateSubSettings)
settingsButton.addEventListener('click', () => {
  settingsDialog.showModal()
  // TODO: DRY default values, ensure a single source of truth
  hapticsEnabledCheckbox.checked = safeStorage.getItem(storageKeys.hapticsEnabled) === "true"
  hapticsValidDurationInput.value = safeStorage.getItem(storageKeys.hapticsValidDuration) ?? "6"
  hapticsInvalidDurationInput.value = safeStorage.getItem(storageKeys.hapticsInvalidDuration) ?? "60"
  gamepadRepeatRateInput.value = safeStorage.getItem(storageKeys.gamepadRepeatRate) ?? "150"
  gamepadRepeatDelayInput.value = safeStorage.getItem(storageKeys.gamepadRepeatDelay) ?? "300"
  hapticsEnabledCheckbox.focus()
  updateSubSettings()
})
settingsDialog.addEventListener('close', () => {
  console.log(settingsDialog.returnValue)
})
settingsDialog.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    settingsDialog.close()
    event.stopPropagation()
  }
})
settingsDialogOKButton.addEventListener('click', (event) => {
  event.preventDefault()
  const hapticsValidDuration = parseInt(hapticsValidDurationInput.value)
  const hapticsInvalidDuration = parseInt(hapticsInvalidDurationInput.value)
  const gamepadRepeatRate = parseInt(gamepadRepeatRateInput.value)
  const gamepadRepeatDelay = parseInt(gamepadRepeatDelayInput.value)
  if (isNaN(hapticsValidDuration) || isNaN(hapticsInvalidDuration) || isNaN(gamepadRepeatRate) || isNaN(gamepadRepeatDelay)) {
    alert("Invalid input. Please enter a number.")
    return
  }
  const success = [
    safeStorage.setItem(storageKeys.hapticsEnabled, hapticsEnabledCheckbox.checked ? "true" : "false"),
    safeStorage.setItem(storageKeys.hapticsValidDuration, hapticsValidDuration.toString()),
    safeStorage.setItem(storageKeys.hapticsInvalidDuration, hapticsInvalidDuration.toString()),
    safeStorage.setItem(storageKeys.gamepadRepeatRate, gamepadRepeatRate.toString()),
    safeStorage.setItem(storageKeys.gamepadRepeatDelay, gamepadRepeatDelay.toString()),
  ].every(Boolean)
  if (!success) {
    console.error("Failed to save settings to local storage")
    alert("Failed to save settings. Make sure cookies are enabled and try again.")
  }
  settingsDialog.close()
})
settingsDialogCancelButton.addEventListener('click', (event) => {
  event.preventDefault()
  settingsDialog.close()
})


function toggleFullscreen() {
  if (document.fullscreenElement) {
    // button will actually be hidden in fullscreen mode, by CSS
    // but the 'F' key should still work
    void document.exitFullscreen()
  } else {
    void document.documentElement.requestFullscreen()
  }
}

replaySlider.addEventListener('input', () => {
  const replayIndex = parseInt(replaySlider.value)
  goToHistoryIndex(replayIndex)
})

addEventListener('keydown', (event) => {
  // While a screen is overtop the game, only allow certain actions that will dismiss the screen.
  // - Allow Ctrl+Z while win screen is shown to undo winning the level/game (in case you want to try to solve it with less moves for instance)
  // - Allow Enter/Space/Escape to dismiss the screen
  // - Not really sure about Ctrl+Y, maybe should remove the exclusion
  if (!shouldInputBeAllowed() && event.key !== 'z' && event.key !== 'Z' && event.key !== 'y') {
    if (!event.shiftKey && !event.ctrlKey && !event.altKey && !event.metaKey && !event.repeat) {
      // Press any key to dismiss splash screens? Maybe not directional keys,
      // as you may be pressing these repeatedly to get to the end of a level and accidentally skip the splash screen...
      // There are a lot of directional keys though, so for now, just allow Enter/Space/Escape.
      if (event.key === 'Enter' || event.key === ' ' || event.key === 'Escape') {
        if (document.querySelector('#game-win-screen')?.classList.contains('active')) {
          showMainMenu()
        } else {
          hideLevelSplash()
        }
        event.preventDefault()
      }
    }
    return
  }
  if (event.key === ',') { // Ctrl+Comma is common for settings
    settingsButton.click()
    event.preventDefault()
  } else if (event.key === '`' && !event.repeat) {
    if (activityMode === "play") {
      setActivityMode("edit")
    } else if (activityMode === "edit") {
      setActivityMode("play")
    }
    event.preventDefault()
  } else if (event.key === 'z' || event.key === 'Z') {
    // Shift by itself cycling players breaks (Ctrl+)Shift+Z redo in play mode.
    // I could handle it specially, preserving redos in a separate stack
    // until you release Shift, or I could make it not cycle players
    // until you release Shift, or I could remove Shift cycling players,
    // or just say you need to use Y to redo (in play mode).
    if (event.shiftKey) {
      redo()
    } else {
      undo()
    }
    event.preventDefault()
  } else if (event.key === 'y') {
    redo()
    event.preventDefault()
  } else if (event.key === 'r') {
    restartLevel()
    event.preventDefault()
  } else if (event.key === 'p') {
    savePlaythrough()
    event.preventDefault()
  } else if (event.key === 's' && (event.ctrlKey || event.metaKey)) {
    saveLevel()
    event.preventDefault()
  } else if (event.key === 'o' && (event.ctrlKey || event.metaKey)) {
    openLevel()
    event.preventDefault()
  } else if (event.key === 'n' && activityMode == "edit") { // Ctrl+N is new window and can't be overridden
    clearLevel(true, false)
    event.preventDefault()
  } else if (event.key === 'a' && activityMode == "edit") {
    selectAll()
    event.preventDefault()
  } else if (event.key === 'Delete' && activityMode == "edit") {
    deleteSelectedEntities()
    event.preventDefault()
  } else if (event.key === 'i' && activityMode == "edit") {
    invert()
    event.preventDefault()
  } else if (event.key === 'c' && activityMode == "edit") {
    void clipboardCopy()
    event.preventDefault()
  } else if (event.key === 'x' && activityMode == "edit") {
    void clipboardCut()
    event.preventDefault()
  } else if (event.key === 'v' && activityMode == "edit") {
    void clipboardPaste()
    event.preventDefault()
  } else if (event.key === 'e' && (event.altKey) && activityMode == "edit") {
    // Alt+E is Image Attributes in MS Paint, the equivalent of Level Info here
    // TODO: avoid querySelector
    const levelInfoButton = document.querySelector<HTMLButtonElement>("#level-info-button")!
    levelInfoButton.click()
    event.preventDefault()
  } else if ((event.key === 'ArrowLeft' || event.key === 'ArrowRight' || event.key === 'ArrowUp' || event.key === 'ArrowDown') && activityMode == "edit") {
    const dx = (event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0)
    const dy = (event.key === 'ArrowDown' ? 1 : event.key === 'ArrowUp' ? -1 : 0)
    undoable()
    translateSelection(dx, dy)
    event.preventDefault()
  } else if (event.key === 'Escape') {
    const backButton = document.querySelector<HTMLButtonElement>('#back-to-main-menu-button')!
    backButton.click()
    event.preventDefault()
  } else if (event.key === 'm') {
    toggleMute()
    event.preventDefault()
  } else if (event.key === 'f') {
    toggleFullscreen()
    event.preventDefault()
  }
  enableAudioViaUserGesture()
})

canvas.addEventListener('pointerdown', (event) => {
  event.preventDefault()
  // clear selection, because dragging text can lock up the UI
  // and because the default behavior is not just to select text but also deselecting it,
  // so preventDefault can make it harder to deselect text by default.
  window.getSelection()?.removeAllRanges()
})
window.addEventListener('pointerdown', (event) => {
  // This should be triggered by clicking in menus as well, not just on the canvas,
  // in order for the first level start sound effect to play.
  enableAudioViaUserGesture()
  // This should be triggered in menus, in order for the tutorial text to give appropriate instructions immediately.
  if (event.pointerType === "touch") {
    setControlScheme(ControlScheme.Pointer)
  }
})

canvas.addEventListener('contextmenu', (event) => {
  event.preventDefault()
})

addEventListener('dragover', (event) => {
  event.preventDefault()
})

addEventListener('drop', (event) => {
  event.preventDefault()
  const file = event.dataTransfer?.files[0]
  if (file) {
    loadLevel(file, "edit")
  }
})

function initLocalStorage() {
  const storageVersion = Number(safeStorage.getItem(storageKeys.localStorageFormatVersion) ?? LOCAL_STORAGE_FORMAT_VERSION)
  if (storageVersion > LOCAL_STORAGE_FORMAT_VERSION) {
    console.error("Saved local storage format version is newer than this version of the game. Some data may be lost.")
  }
  // Format upgrades would go here, e.g. in case a level was renamed.
  // This is a sketch of an upgrade, but untested as it's not needed yet:
  // if (storageVersion === 1) {
  //   storageVersion = 2
  //   safeStorage.setItem(storageKeys.bestMoveCount("levels/newLevelName.json"), safeStorage.getItem(storageKeys.bestMoveCount("levels/oldLevelName.json")))
  //   safeStorage.setItem(storageKeys.bestSolution("levels/newLevelName.json"), safeStorage.getItem(storageKeys.bestSolution("levels/oldLevelName.json")))
  //   safeStorage.deleteItem(storageKeys.bestMoveCount("levels/oldLevelName.json"))
  //   safeStorage.deleteItem(storageKeys.bestSolution("levels/oldLevelName.json"))
  //   safeStorage.setItem(storageKeys.localStorageFormatVersion, storageVersion)
  // }
  if (storageVersion !== LOCAL_STORAGE_FORMAT_VERSION) {
    console.error("Invalid local storage format version.")
  } else {
    // Initialize local storage with default values
    safeStorage.setItem(storageKeys.localStorageFormatVersion, LOCAL_STORAGE_FORMAT_VERSION.toString())
    // TODO: Reserve space for level move counts and all settings so that variable size solution replays can never prevent saving basic progress/settings
  }
}

initLocalStorage()
handleLevelCompletion()
initMainMenu()
initLevelEditorGUI()
initLevelSelect()
Object.assign(resources, await loadResources(resourcePaths))
animate()
