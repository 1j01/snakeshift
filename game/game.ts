import { deserialize, entities, redos, serialize, undoable, undos } from "./game-state"
import { handleInput } from "./input"
import { handleInputForLevelEditing } from "./level-editor"
import { canvas, draw } from "./rendering"
import { GameState } from "./types"


function step(time: number) {
  for (const entity of entities) {
    entity.step?.(time)
  }
}

export function animate(time = 0) {
  requestAnimationFrame(animate)

  step(time)
  draw()
}

export let editing = true

const editorUndos: GameState[] = []
const editorRedos: GameState[] = []
let editorState: GameState | undefined = undefined
let cleanup = () => { /* TSILB */ }
export function setEditMode(enterEditMode: boolean) {
  cleanup()
  editing = enterEditMode
  document.body.classList.toggle('editing', editing)
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

export function restartLevel() {
  if (editing) return
  if (!editorState) return
  undoable()
  deserialize(editorState)
}
