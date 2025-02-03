import { Collectable } from "./collectable"
import { clearLevel, deserialize, entities, onUpdate, redos, serialize, undoable, undos } from "./game-state"
import { handleInput } from "./input"
import { handleInputForLevelEditing } from "./level-editor"
import { currentLevelID, loadLevelFile, loadNextLevel, setStandaloneLevelMode, updatePageTitleAndLevelSpecificOverlays } from "./level-select"
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
export let levelHasGoal = false
let cleanup = handleInput(canvas)
export function setActivityMode(newMode: "edit" | "play" | "menu") {
  if (activityMode === newMode) return
  console.log("Switching from", activityMode, "to", newMode)
  cleanup()
  activityMode = newMode
  document.body.classList.toggle('editing', activityMode === "edit")

  if (activityMode === "edit") {
    setStandaloneLevelMode()
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
    levelHasGoal = entities.some(e => e instanceof Collectable)
    undos.length = 0
    redos.length = 0
  } else {
    setStandaloneLevelMode()
    cleanup = handleInput(canvas)
    clearLevel(false)
    undos.length = 0
    redos.length = 0
    editorUndos.length = 0
    editorRedos.length = 0
    editorState = undefined
    levelHasGoal = false
  }
  wonLevel = false // might not need this
  updatePageTitleAndLevelSpecificOverlays()
}

export function setBaseLevelState() {
  editorState = serialize()
  levelHasGoal = entities.some(e => e instanceof Collectable)
  wonLevel = false
}

export function restartLevel() {
  if (activityMode !== "play") return
  if (currentLevelID()) {
    // I don't want to special case this, but I'm so tired from whacking moles
    // TODO: XXX: refactor
    void loadLevelFile(currentLevelID(), () => {
      // currentLevelButton = button
      // setStandaloneLevelMode(false)
      updatePageTitleAndLevelSpecificOverlays()
    })
    return
  }
  if (!editorState) return
  undoable()
  deserialize(editorState)
  wonLevel = false
}

export function checkLevelWon() {
  if (window._winLevelCheat) {
    window._winLevelCheat = false
    return true
  }
  if (!levelHasGoal) {
    // No goal, so don't declare victory. It's useful to be able to test incomplete levels.
    console.log("No goal; level is unwinnable.")
    return false
  }
  return entities.filter(e => e instanceof Collectable).length === 0
}

export function handleLevelCompletion() {
  onUpdate(() => {
    if (activityMode !== "play") return
    if (!wonLevel && checkLevelWon()) {
      wonLevel = true
      console.log('Level won!', currentLevelID())
      loadNextLevel()
    } else {
      // in case you undo the winning move
      // Might need to disable movement while the level is won though, if I'm unsetting this...
      wonLevel = false
    }
  })
}
