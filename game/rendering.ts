import Entity from "./entity"
import { entities, levelInfo, postResize } from "./game-state"
import { setLevelBorder } from "./tile-highlight"
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
  // drawBorder(ctx)
  drawEntities(ctx, entities)
  // drawGrid(ctx)
  setLevelBorder(levelInfo)
  ctx.restore()
}

// function drawBorder(ctx: CanvasRenderingContext2D) {
//   ctx.strokeStyle = '#fff'
//   ctx.lineWidth = 0.1
//   // ctx.strokeRect(0, 0, levelInfo.width, levelInfo.height)
//   const borders: [number, number, number, number][] = [
//     [0, 0, levelInfo.width, 0],
//     [levelInfo.width, 0, levelInfo.width, levelInfo.height],
//     [levelInfo.width, levelInfo.height, 0, levelInfo.height],
//     [0, levelInfo.height, 0, 0],
//   ]
//   for (const line of borders) {
//     ctx.beginPath()
//     // ctx.moveTo(line[0], line[1])
//     // ctx.lineTo(line[2], line[3])
//     const dist = Math.hypot(line[2] - line[0], line[3] - line[1])
//     const angle = Math.atan2(line[3] - line[1], line[2] - line[0])
//     const patternLength = 0.5
//     // ctx.rotate(angle)
//     for (let i = 0; i < dist; i += patternLength) {
//       const x = line[0] + (line[2] - line[0]) * i / dist
//       const y = line[1] + (line[3] - line[1]) * i / dist
//       ctx.moveTo(x, y)
//       ctx.lineTo(x + patternLength / 2, y)
//     }
//     ctx.stroke()
//   }
// }

// function drawGrid(ctx: CanvasRenderingContext2D) {
//   ctx.beginPath()
//   for (let x = 0; x <= levelInfo.width; x++) {
//     ctx.moveTo(x, 0)
//     ctx.lineTo(x, levelInfo.height)
//   }
//   for (let y = 0; y <= levelInfo.height; y++) {
//     ctx.moveTo(0, y)
//     ctx.lineTo(levelInfo.width, y)
//   }
//   ctx.save()
//   // ctx.globalCompositeOperation = 'exclusion'
//   // ctx.setLineDash([0.2, 0.2])
//   ctx.strokeStyle = '#fff'
//   ctx.lineWidth = 0.1
//   ctx.stroke()
//   ctx.strokeStyle = '#000'
//   ctx.lineWidth = 0.05
//   ctx.stroke()
//   ctx.restore()
// }

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

// TODO: DRY, I'm feeling SO LAZY right now
// I figure I should probably replace Tile with a Box or Rect type with width/height
export function rectOnPage(rect: { x: number, y: number, width: number, height: number }): { x: number, y: number, width: number, height: number } {
  const point = worldToView(rect)
  const point2 = worldToView({ x: rect.x + rect.width, y: rect.y + rect.height })
  return {
    x: point.x,
    y: point.y,
    width: point2.x - point.x,
    height: point2.y - point.y,
  }
}
