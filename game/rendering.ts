import { entities, levelInfo } from "./game-state"
import { Point, Tile } from "./types"

export const canvas = document.createElement('canvas')
const ctx = canvas.getContext('2d')!
document.body.appendChild(canvas)

let transform: DOMMatrix | undefined = undefined
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
  const viewWidth = levelInfo.width
  const viewHeight = levelInfo.height
  const scale = Math.min(canvas.width / viewWidth, canvas.height / viewHeight)
  ctx.scale(scale, scale)
  ctx.translate(-viewWidth / 2, -viewHeight / 2)
  transform = ctx.getTransform()
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

export function viewToWorld(clientPoint: { clientX: number, clientY: number }): Point {
  const rect = canvas.getBoundingClientRect()
  const x = clientPoint.clientX - rect.left
  const y = clientPoint.clientY - rect.top
  const point = new DOMPoint(x, y)
  return point.matrixTransform(transform!.inverse())
}

export function worldToView(worldPoint: Point): Point {
  const rect = canvas.getBoundingClientRect()
  const point = new DOMPoint(worldPoint.x, worldPoint.y).matrixTransform(transform)
  return {
    x: point.x + rect.left,
    y: point.y + rect.top,
  }
}

export function pageToWorldTile(clientPoint: { clientX: number, clientY: number }): Tile | undefined {
  const worldPoint = viewToWorld(clientPoint)
  if (worldPoint.x < 0 || worldPoint.x >= levelInfo.width || worldPoint.y < 0 || worldPoint.y >= levelInfo.height) {
    return undefined
  }
  return {
    x: Math.floor(worldPoint.x),
    y: Math.floor(worldPoint.y),
    size: 1,
  }
}

export function tileOnPage(tile: Tile): Tile {
  const point = worldToView(tile)
  const point2 = worldToView({ x: tile.x + tile.size, y: tile.y + tile.size })
  return {
    x: point.x,
    y: point.y,
    size: point2.x - point.x,
  }
}
