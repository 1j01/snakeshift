import { entities, initLevel, redo, undo } from "./game-state"
import { handleInput } from "./input"
import { handleInputForLevelEditing, initLevelEditorGUI } from "./level-editor"
import { canvas, draw } from "./rendering"

function step(time: number) {
  for (const entity of entities) {
    entity.step?.(time)
  }
}

function animate(time: number) {
  requestAnimationFrame(animate)

  step(time)
  draw()
}

let editing = true
let cleanup = () => { /* TSILB */ }
function setEditMode(enterEditMode: boolean) {
  cleanup()
  if (enterEditMode) {
    cleanup = handleInputForLevelEditing(canvas)
  } else {
    cleanup = handleInput(canvas)
  }
  editing = enterEditMode
  document.body.classList.toggle('editing', editing)
}

initLevelEditorGUI()
initLevel()
setEditMode(true)
animate(0)

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
