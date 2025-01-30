import { enableAudioViaUserGesture, loadResources, playSound, resourcePaths, resources, toggleMute } from "./audio"
import { activityMode, animate, restartLevel, setActivityMode } from "./game"
import { checkLevelWon, clearLevel, onUpdate, redo, undo } from "./game-state"
import { initLevelEditorGUI, loadLevel, openLevel, saveLevel, savePlaythrough } from "./level-editor"
import { currentLevelID, initLevelSelect, loadNextLevel } from "./level-select"
import { initMainMenu, showMainMenu } from "./menus"
import { canvas } from "./rendering"

const restartLevelButton = document.querySelector<HTMLButtonElement>('#restart-level-button')!

restartLevelButton.addEventListener('click', restartLevel)

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
  }
  enableAudioViaUserGesture()
})

canvas.addEventListener('pointerdown', (event) => {
  event.preventDefault()
  // clear selection, because dragging text can lock up the UI
  // and because the default behavior is not just to select text but also deselecting it,
  // so preventDefault can make it harder to deselect text by default.
  window.getSelection()?.removeAllRanges()

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

let wonLevelID = ""
onUpdate(() => {
  if (activityMode !== "play") return
  if (wonLevelID === currentLevelID()) return
  // TODO: don't try to move to next level for custom levels
  if (checkLevelWon()) {
    wonLevelID = currentLevelID()
    console.log('Level won!', wonLevelID)
    playSound('win')
    loadNextLevel()
  } else {
    wonLevelID = ""
  }
})

initMainMenu()
initLevelEditorGUI()
initLevelSelect()
Object.assign(resources, await loadResources(resourcePaths))
animate()
