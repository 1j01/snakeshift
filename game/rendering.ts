import Entity from "./entity"
import { entities, levelInfo, postResize } from "./game-state"
import { positionElement, setLevelBorder } from "./tile-highlight"
import { Point, Tile } from "./types"

export const canvas = document.createElement('canvas')
canvas.style.touchAction = 'none'
const ctx = canvas.getContext('2d')!
document.body.appendChild(canvas)

const editorGUI = document.getElementById('entities-bar')!
const gameOptionsBar = document.querySelector('.back-to-main-menu-button')!

let transform: DOMMatrix | undefined = undefined
export function draw() {
  const styleWidth = window.innerWidth
  const gameOptionsBarRect = gameOptionsBar.getBoundingClientRect()
  editorGUI.style.paddingTop = `${gameOptionsBarRect.bottom + 5}px`
  const editorGUIRect = editorGUI.getBoundingClientRect()
  // Note: DOMRect.bottom is a double
  const top = Math.max(editorGUIRect.bottom, gameOptionsBarRect.bottom) + 5
  const styleHeight = window.innerHeight - top - 5 // 5px so border image doesn't get cut off
  canvas.style.transform = `translateY(${top}px)`
  canvas.style.width = `${styleWidth}px`
  canvas.style.height = `${styleHeight}px`
  // Needs rounding (or else the condition below may be true at rest, since canvas.height is an integer)
  const resolutionWidth = Math.floor(styleWidth * devicePixelRatio)
  const resolutionHeight = Math.floor(styleHeight * devicePixelRatio)
  const resized = canvas.width !== resolutionWidth || canvas.height !== resolutionHeight
  if (resized) {
    canvas.width = resolutionWidth
    canvas.height = resolutionHeight
  }

  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  ctx.save()
  ctx.translate(canvas.width / 2, canvas.height / 2)
  const borderSize = 0.2
  const viewWidth = levelInfo.width + borderSize * 2
  const viewHeight = levelInfo.height + borderSize * 2
  const viewCenterX = levelInfo.width / 2
  const viewCenterY = levelInfo.height / 2
  const scale = Math.min(canvas.width / viewWidth, canvas.height / viewHeight)
  ctx.scale(scale, scale)
  ctx.translate(-viewCenterX, -viewCenterY)
  transform = ctx.getTransform()
  if (resized) {
    // Update highlight, as grid size has changed.
    // Has to be after `transform` is set, since viewToWorld/WorldToView use it.
    postResize()
  }
  // drawBorder(ctx)
  drawEntities(ctx, entities)
  drawProblems(ctx)
  // drawGrid(ctx)
  setLevelBorder(levelInfo)
  ctx.restore()

  for (const overlayElement of document.querySelectorAll<HTMLDivElement>('.level-specific-overlay, #level-stuck-hint')) {
    positionElement(overlayElement, tileOnPage({ x: 0, y: 0, width: levelInfo.width, height: levelInfo.height }))
  }

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

const problems: { tile: Tile, type: "overlap" | "collision" | "out-of-bounds" }[] = []
export function addProblem(tile: Tile, type: "overlap" | "collision" | "out-of-bounds") {
  problems.push({ tile, type })
}
export function clearProblems() {
  problems.length = 0
}
export function drawProblems(ctx: CanvasRenderingContext2D) {
  ctx.save()
  ctx.globalAlpha = 0.5 // makes emoji transparent as well, as opposed to rgba() color, although this may look weird on some platforms, where emoji are multi-layer vector graphics
  ctx.fillStyle = '#f00'
  ctx.font = '1px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle' // seems to cause problems with <= 0.5px font size, and isn't very centered anyway...
  for (const { tile, type } of problems) {
    const icon = type === "overlap" ? '🗗' : '🛇'
    const scale = Math.sin(performance.now() / 200) * 0.2 + 1
    ctx.save()
    ctx.translate(tile.x + tile.width / 2, tile.y + tile.height / 2)
    ctx.scale(scale, scale)
    ctx.fillText(icon, 0, 0)
    ctx.restore()
  }
  ctx.restore()
}

export function viewToWorld(clientPoint: { clientX: number, clientY: number }): Point {
  const rect = canvas.getBoundingClientRect()
  const x = clientPoint.clientX - rect.left
  const y = clientPoint.clientY - rect.top
  if (!transform) {
    // I've only noticed this in flaky tests, and I'm guessing the value is not particularly consequential.
    // The transform would only be undefined before the first render, so there's nothing "correct" to return, right?
    // Well it'd probably be possible to extract the part of the rendering code that sets up the transform and run just that.
    // But it probably doesn't MATTER, right? Sigh...
    return { x: 0, y: 0 }
  }
  const point = new DOMPoint(x * devicePixelRatio, y * devicePixelRatio).matrixTransform(transform.inverse())
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

export function pageToWorldTile(clientPoint: { clientX: number, clientY: number }): Tile {
  const worldPoint = viewToWorld(clientPoint)
  // if (!withinLevel(worldPoint)) {
  //   return undefined
  // }
  return {
    x: Math.floor(worldPoint.x),
    y: Math.floor(worldPoint.y),
    width: 1,
    height: 1,
  }
}

export function tileOnPage(tile: Tile): Tile {
  const point = worldToView(tile)
  const point2 = worldToView({ x: tile.x + tile.width, y: tile.y + tile.height })
  return {
    x: point.x,
    y: point.y,
    width: point2.x - point.x,
    height: point2.y - point.y,
  }
}

window._forTesting = { tileOnPage }

// TODO: can I share this interface with the tests?
declare global {
  interface Window {
    _forTesting: {
      tileOnPage: (tile: Tile) => Tile;
    };
  }
}
