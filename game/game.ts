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
let cleanup = handleInput(canvas)
export function setActivityMode(newMode: "edit" | "play" | "menu"): boolean {
  if (activityMode === newMode) return true // uhhhhh this is a bit weird, but I'm just adding the bool for the confirmation prompt
  console.log("Switching from", activityMode, "to", newMode, editorUndos.length, editorRedos.length, undos.length, redos.length)
  // This is confusing. The editor's undos/redos are not editorUndos/editorRedos while editing,
  // that's only where they're stored while play testing the level, I think.
  // if (activityMode === "edit" && (editorUndos.length > 0 || editorRedos.length > 0)) {
  if (activityMode === "edit" && (undos.length > 0 || redos.length > 0)) {
    if (!confirm("This will discard any unsaved changes. Are you sure?")) {
      console.log("Cancelled switch")
      return false
    }
  }
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
    cleanup = handleInput(canvas)
    clearLevel(false)
    undos.length = 0
    redos.length = 0
    editorUndos.length = 0
    editorRedos.length = 0
    editorState = undefined
  }
  return true
}

export function restartLevel() {
  if (activityMode !== "play") return
  if (!editorState) return
  undoable()
  deserialize(editorState)
}
