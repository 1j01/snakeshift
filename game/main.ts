import { entities, initLevel } from "./game-state"
import { handleInput } from "./input"
import { handleInputForLevelEditing } from "./level-editor"
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

initLevel()
handleInput(canvas)
handleInputForLevelEditing(canvas)
animate(0)

