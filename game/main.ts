import { clearLevel, deserialize, entities, initLevel, redo, redos, serialize, undo, undoable, undos } from "./game-state"
import { handleInput } from "./input"
import { handleInputForLevelEditing, initLevelEditorGUI, loadLevel, openLevel, saveLevel, savePlaythrough } from "./level-editor"
import { canvas, draw } from "./rendering"
import { GameState } from "./types"

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
const editorUndos: GameState[] = []
const editorRedos: GameState[] = []
let editorState: GameState | undefined = undefined
let cleanup = () => { /* TSILB */ }
function setEditMode(enterEditMode: boolean) {
  cleanup()
  editing = enterEditMode
  document.body.classList.toggle('editing', editing) // used in deserialize(); I would export a bool, but importing main.ts can cause problems
  if (editing) {
    cleanup = handleInputForLevelEditing(canvas)
    if (editorState) {
      undos.splice(0, undos.length, ...editorUndos)
      redos.splice(0, redos.length, ...editorRedos)
      deserialize(editorState)
    }
  } else {
    cleanup = handleInput(canvas)
    editorUndos.splice(0, editorUndos.length, ...undos)
    editorRedos.splice(0, editorRedos.length, ...redos)
    editorState = serialize()
    undos.length = 0
    redos.length = 0
  }
}

function restartLevel() {
  if (editing) return
  if (!editorState) return
  undoable()
  deserialize(editorState)
}

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
    loadLevel(file)
  }
})

initLevelEditorGUI()
initLevel()
setEditMode(true)
animate(0)
