import { entities, initLevel } from "./game-state"
import { handleInput } from "./input"

const canvas = document.createElement('canvas')
const ctx = canvas.getContext('2d')!
document.body.appendChild(canvas)

function step(time: number) {
  for (const entity of entities) {
    entity.step?.(time)
  }
}

function draw() {
  if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
  }

  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  ctx.save()
  ctx.translate(canvas.width / 2, canvas.height / 2)
  for (const entity of entities) {
    entity.draw?.(ctx)
  }
  ctx.restore()
}

function animate(time: number) {
  requestAnimationFrame(animate)

  step(time)
  draw()
}

initLevel()
handleInput(canvas)
animate(0)

