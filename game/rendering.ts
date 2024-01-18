import { entities } from "./game-state"
import Snake from "./snake"

export const canvas = document.createElement('canvas')
const ctx = canvas.getContext('2d')!
document.body.appendChild(canvas)

export function draw() {
  // Round down to nearest even number to avoid borders between tiles
  // due to anti-aliasing.
  const width = Math.floor(window.innerWidth / 2) * 2
  const height = Math.floor(window.innerHeight / 2) * 2
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width
    canvas.height = height
  }

  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  ctx.save()
  ctx.translate(canvas.width / 2, canvas.height / 2)
  for (const entity of entities) {
    entity.draw?.(ctx)
  }
  for (const entity of entities) {
    if (entity instanceof Snake) {
      entity.drawHighlight(ctx)
    }
  }
  ctx.restore()
}
