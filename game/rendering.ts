import { Block } from "./block"
import { entities, levelInfo } from "./game-state"
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
  const viewWidth = levelInfo.width * Block.BASE_SIZE
  const viewHeight = levelInfo.height * Block.BASE_SIZE
  const scale = Math.min(canvas.width / viewWidth, canvas.height / viewHeight)
  ctx.scale(scale, scale)
  ctx.translate(-viewWidth / 2, -viewHeight / 2)
  for (const entity of entities) {
    entity.draw?.(ctx)
  }
  for (const entity of entities) {
    entity.draw2?.(ctx)
  }
  for (const entity of entities) {
    entity.draw3?.(ctx)
  }
  ctx.restore()
}
