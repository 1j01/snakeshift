import { enableAudioViaUserGesture, loadResources, resourcePaths, resources, toggleMute } from "./audio"
import { activityMode, animate, handleLevelCompletion, restartLevel, setActivityMode } from "./game"
import { clearLevel, loadLevel, openLevel, redo, saveLevel, savePlaythrough, undo, undoable } from "./game-state"
import { deleteSelectedEntities, initLevelEditorGUI, invert, selectAll, translateSelection } from "./level-editor"
import { initLevelSelect } from "./level-select"
import { initMainMenu, showMainMenu } from "./menus"
import { canvas } from "./rendering"

export const playEditToggleButton = document.querySelector<HTMLButtonElement>('#play-edit-toggle-button')!
const restartLevelButton = document.querySelector<HTMLButtonElement>('#restart-level-button')!
const undoButton = document.querySelector<HTMLButtonElement>('#undo-button')!
const redoButton = document.querySelector<HTMLButtonElement>('#redo-button')!
const fullscreenButton = document.getElementById("fullscreen-button")!

playEditToggleButton.addEventListener('click', () => {
  setActivityMode(activityMode === "play" ? "edit" : "play")
})
restartLevelButton.addEventListener('click', restartLevel)
undoButton.addEventListener('click', undo)
redoButton.addEventListener('click', redo)
fullscreenButton.addEventListener('click', toggleFullscreen)

function toggleFullscreen() {
  if (document.fullscreenElement) {
    // button will actually be hidden in fullscreen mode, by CSS
    // but the 'F' key should still work
    void document.exitFullscreen()
  } else {
    void document.documentElement.requestFullscreen()
  }
}

addEventListener('keydown', (event) => {
  if (event.key === '`' && !event.repeat) {
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
    clearLevel()
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
    if (activityMode === "play") {
      setActivityMode("edit")
    } else {
      // From Level Editor, Level Select, or Credits, go to Main Menu
      showMainMenu()
    }
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
// This should be triggered by clicking in menus as well, not just on the canvas,
// in order for the first level start sound effect to play.
window.addEventListener('pointerdown', () => {
  enableAudioViaUserGesture()
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

handleLevelCompletion()
initMainMenu()
initLevelEditorGUI()
initLevelSelect()
Object.assign(resources, await loadResources(resourcePaths))
animate()
