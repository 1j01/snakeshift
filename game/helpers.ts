import { Block } from "./block"
import { Collectable } from "./collectable"
import { Crate } from "./crate"
import Entity from "./entity"
import { entities } from "./game-state"
import Snake from "./snake"
import { CollisionLayer, Hit, Point, Tile } from "./types"

export function sameTile(a: Tile, b: Tile) {
  return a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height
}

export function neighborOf(tile: Tile, direction: { x: number, y: number }) {
  return {
    x: tile.x + direction.x * tile.width,
    y: tile.y + direction.y * tile.height,
    width: tile.width,
    height: tile.height,
  }
}

export function* bresenham(start: Point, end: Point): Generator<Point> {
  const xDist = Math.abs(end.x - start.x)
  const yDist = -Math.abs(end.y - start.y)
  const xStep = (start.x < end.x ? +1 : -1)
  const yStep = (start.y < end.y ? +1 : -1)

  let x = start.x
  let y = start.y
  let error = xDist + yDist

  yield { x, y }

  // while (x != end.x || y != end.y) { // may cause infinite loop due to floating point error?
  while (Math.abs(x - end.x) > 1e-6 || Math.abs(y - end.y) > 1e-6) { // still getting infinite loops...
    if (2 * error > yDist) {
      // horizontal step
      error += yDist
      x += xStep
    }

    if (2 * error < xDist) {
      // vertical step
      error += xDist
      y += yStep
    }

    yield { x, y }
  }
}

export function* lineNoDiagonals(start: Point, end: Point): Generator<Point> {
  const xDist = Math.abs(end.x - start.x)
  const yDist = -Math.abs(end.y - start.y)
  const xStep = (start.x < end.x ? +1 : -1)
  const yStep = (start.y < end.y ? +1 : -1)

  let x = start.x
  let y = start.y
  let error = xDist + yDist

  yield { x, y }

  // while (x != end.x || y != end.y) { // may cause infinite loop due to floating point error?
  while (Math.abs(x - end.x) > 1e-6 || Math.abs(y - end.y) > 1e-6) {

    if (2 * error - yDist > xDist - 2 * error) {
      // horizontal step
      error += yDist
      x += xStep
    } else {
      // vertical step
      error += xDist
      y += yStep
    }

    yield { x, y }
  }
}

export function makeEntity(entityType: string): Entity {
  switch (entityType) {
    case "Block":
      return new Block()
    case "Snake":
      return new Snake()
    case "Collectable":
      return new Collectable()
    case "Crate":
      return new Crate()
    default:
      throw new Error(`Unknown entity type: ${entityType}`)
  }
}

export function sortEntities() {
  // Ensure collectables are on top, and crates are below snakes.
  // TODO: rule should be crates are below anything they are not inside of,
  // which is complicated, as in this game, crates can be inside of crates inside of snakes inside of crates.
  entities.sort((a, b) => {
    return (
      (+(a instanceof Collectable) - +(b instanceof Collectable)) ||
      (+(b instanceof Crate && a instanceof Snake) - +(a instanceof Crate && b instanceof Snake))
    )
  })
}

export function hitTestAllEntities(x: number, y: number, options: Partial<{ ignoreTailOfSnake: Snake | undefined }> = {}): Hit[] {
  // A snake's tail may be leaving the space, so it can be ignored, optionally.
  const hits: Hit[] = []
  for (const entity of entities) {
    if (entity instanceof Snake) {
      const hit = entity.at(x, y, true, entity !== options.ignoreTailOfSnake)
      if (hit) {
        hits.push(hit)
      }
    } else if (entity.at) {
      const hit = entity.at(x, y)
      if (hit) {
        hits.push(hit)
      }
    }
  }
  return hits
}

export function topLayer(hits: Hit[]): CollisionLayer {
  let layer = CollisionLayer.Black
  for (const hit of hits) {
    if (hit.entity.solid) {
      layer = hit.layer
    }
  }
  return layer
}
export function makeEventListenerGroup() {
  // This is a lot of complexity for simply improving the ergonomics of cleanup.
  // Most of the complexity is for type checking.

  const listenerCleanupFunctions: (() => void)[] = []
  function on<K extends keyof HTMLElementEventMap>(eventTarget: HTMLElement, type: K, listener: (this: HTMLElement, ev: HTMLElementEventMap[K]) => void, options?: boolean | AddEventListenerOptions): void;
  function on<K extends keyof WindowEventMap>(eventTarget: Window, type: K, listener: (this: Window, ev: WindowEventMap[K]) => void, options?: boolean | AddEventListenerOptions): void;
  function on(eventTarget: HTMLElement | Window, type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void {
    eventTarget.addEventListener(type, listener, options)
    listenerCleanupFunctions.push(() => eventTarget.removeEventListener(type, listener, options))
  }

  function removeEventListeners() {
    for (const cleanup of listenerCleanupFunctions) {
      cleanup()
    }
  }

  return { on, removeEventListeners }
}
