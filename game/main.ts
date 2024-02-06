import { animate, editing, restartLevel, setEditMode } from "./game"
import { checkLevelWon, clearLevel, onUpdate, redo, undo } from "./game-state"
import { initLevelEditorGUI, loadLevel, openLevel, saveLevel, savePlaythrough } from "./level-editor"
import { initLevelSelect, loadFirstLevel, loadNextLevel } from "./level-select"
import { initMainMenu } from "./main-menu"
import { canvas } from "./rendering"

addEventListener('keydown', (event) => {
  if (event.key === '`' && !event.repeat) {
    setEditMode(!editing)
    event.preventDefault()
  } else if (event.key === 'z') {
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
  } else if (event.key === 'n' && editing) { // Ctrl+N is new window and can't be overridden
    clearLevel()
    event.preventDefault()
  }
})

canvas.addEventListener('pointerdown', (event) => {
  event.preventDefault()
  // clear selection, because dragging text can lock up the UI
  // and because the default behavior is not just to select text but also deselecting it,
  // so preventDefault can make it harder to deselect text by default.
  window.getSelection()?.removeAllRanges()
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
    // TODO: switch to editing mode, if loaded successfully
    loadLevel(file)
  }
})

onUpdate(() => {
  if (editing) return
  // TODO: don't try to move to next level for custom levels
  if (checkLevelWon()) {
    loadNextLevel()
  }
})

initMainMenu()
initLevelEditorGUI()
initLevelSelect()
loadFirstLevel()
setEditMode(false)
animate()
