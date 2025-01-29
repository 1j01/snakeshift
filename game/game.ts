import { clearLevel, deserialize, entities, redos, serialize, undoable, undos } from "./game-state"
import { handleInput } from "./input"
import { handleInputForLevelEditing } from "./level-editor"
import { unsetCurrentLevel, updatePageTitleAndLevelSpecificOverlays } from "./level-select"
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

export let activityMode: "edit" | "play" | "menu" = "menu"

const editorUndos: GameState[] = []
const editorRedos: GameState[] = []
let editorState: GameState | undefined = undefined
let cleanup = () => { /* TSILB */ }
export function setActivityMode(newMode: "edit" | "play" | "menu") {
  if (activityMode === newMode) return
  console.log("Switching from", activityMode, "to", newMode)
  cleanup()
  activityMode = newMode
  document.body.classList.toggle('editing', activityMode === "edit")

  unsetCurrentLevel()
  updatePageTitleAndLevelSpecificOverlays()

  if (activityMode === "edit") {
    cleanup = handleInputForLevelEditing(canvas)
    if (editorState) {
      undos.splice(0, undos.length, ...editorUndos)
      redos.splice(0, redos.length, ...editorRedos)
      deserialize(editorState)
    }
  } else if (activityMode === "play") {
    cleanup = handleInput(canvas)
    editorUndos.splice(0, editorUndos.length, ...undos)
    editorRedos.splice(0, editorRedos.length, ...redos)
    editorState = serialize()
    undos.length = 0
    redos.length = 0
  } else {
    clearLevel(false)
    undos.length = 0
    redos.length = 0
    editorUndos.length = 0
    editorRedos.length = 0
    editorState = undefined
    cleanup = () => { /* TSILB */ }
  }
}

export function restartLevel() {
  if (activityMode !== "play") return
  if (!editorState) return
  undoable()
  deserialize(editorState)
}
