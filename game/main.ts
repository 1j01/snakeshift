import { entities, initLevel } from "./game-state"
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

addEventListener('keydown', event => {
  if (event.key === '`') {
    setEditMode(!editing)
  }
})
