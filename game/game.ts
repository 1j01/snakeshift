import { checkLevelWon, clearLevel, deserialize, entities, onUpdate, redos, serialize, undoable, undos } from "./game-state"
import { handleInput } from "./input"
import { handleInputForLevelEditing } from "./level-editor"
import { currentLevelID, loadNextLevel, unsetCurrentLevel, updatePageTitleAndLevelSpecificOverlays } from "./level-select"
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
let wonLevel = false

export const editorUndos: GameState[] = []
export const editorRedos: GameState[] = []
let editorState: GameState | undefined = undefined
let cleanup = handleInput(canvas)
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
    cleanup = handleInput(canvas)
    clearLevel(false)
    undos.length = 0
    redos.length = 0
    editorUndos.length = 0
    editorRedos.length = 0
    editorState = undefined
  }
  wonLevel = false // might not need this
}

export function setBaseLevelState(state: GameState) {
  editorState = state
  wonLevel = false
}

export function restartLevel() {
  if (activityMode !== "play") return
  if (!editorState) return
  undoable()
  deserialize(editorState)
  wonLevel = false
}

export function handleLevelCompletion() {
  onUpdate(() => {
    if (activityMode !== "play") return
    if (wonLevel) return
    if (checkLevelWon()) {
      wonLevel = true
      console.log('Level won!', currentLevelID())
      loadNextLevel()
    } else {
      wonLevel = false // might not need this
    }
  })
}
