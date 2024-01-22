import Entity from "./entity"
import { entities, levelInfo, postResize } from "./game-state"
import { Point, Tile } from "./types"

export const canvas = document.createElement('canvas')
const ctx = canvas.getContext('2d')!
document.body.appendChild(canvas)

const editorGUI = document.getElementById('entities-bar')!

let transform: DOMMatrix | undefined = undefined
export function draw() {
  const styleWidth = window.innerWidth
  const editorGUIRect = editorGUI.getBoundingClientRect()
  // Note: DOMRect.bottom is a double
  const styleHeight = window.innerHeight - editorGUIRect.bottom
  canvas.style.transform = `translateY(${editorGUIRect.top}px)`
  canvas.style.width = `${styleWidth}px`
  canvas.style.height = `${styleHeight}px`
  // Needs rounding (or else the condition below may be true at rest, since canvas.height is an integer)
  const resolutionWidth = Math.floor(styleWidth * devicePixelRatio)
  const resolutionHeight = Math.floor(styleHeight * devicePixelRatio)
  const resized = canvas.width !== resolutionWidth || canvas.height !== resolutionHeight;
  if (resized) {
    canvas.width = resolutionWidth
    canvas.height = resolutionHeight
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
  if (resized) {
    // Update highlight, as grid size has changed.
    // Has to be after `transform` is set, since viewToWorld/WorldToView use it.
    postResize()
  }
  drawEntities(ctx, entities)
  ctx.restore()
}

export function drawEntities(ctx: CanvasRenderingContext2D, entities: Entity[]) {
  for (const entity of entities) {
    entity.draw?.(ctx)
  }
  for (const entity of entities) {
    entity.draw2?.(ctx)
  }
  for (const entity of entities) {
    entity.draw3?.(ctx)
  }
}

export function viewToWorld(clientPoint: { clientX: number, clientY: number }): Point {
  const rect = canvas.getBoundingClientRect()
  const x = clientPoint.clientX - rect.left
  const y = clientPoint.clientY - rect.top
  const point = new DOMPoint(x * devicePixelRatio, y * devicePixelRatio).matrixTransform(transform!.inverse())
  // Avoid extra z, w properties in case this gets serialized.
  return {
    x: point.x,
    y: point.y,
  }
}

export function worldToView(worldPoint: Point): Point {
  const rect = canvas.getBoundingClientRect()
  const point = new DOMPoint(worldPoint.x, worldPoint.y).matrixTransform(transform)
  return {
    x: point.x / devicePixelRatio + rect.left,
    y: point.y / devicePixelRatio + rect.top,
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
