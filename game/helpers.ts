import { Block } from "./block"
import { Collectable } from "./collectable"
import { Crate } from "./crate"
import Entity from "./entity"
import { entities, levelInfo } from "./game-state"
import { RectangularEntity } from "./rectangular-entity"
import Snake from "./snake"
import { CollisionLayer, Hit, Point, Tile } from "./types"

export function sameTile(a: Tile | undefined, b: Tile | undefined) {
  if (a === b) return true
  if (!a || !b) return false
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

export function withinLevel(tile: Tile) {
  return tile.x >= 0 && tile.y >= 0 && tile.x + tile.width <= levelInfo.width && tile.y + tile.height <= levelInfo.height
}

export function within(tile: Tile, container: Tile) {
  return tile.x >= container.x && tile.y >= container.y && tile.x + tile.width <= container.x + container.width && tile.y + tile.height <= container.y + container.height
}

export function clampToLevel(tile: Tile) {
  return {
    x: Math.max(0, Math.min(levelInfo.width - tile.width, tile.x)),
    y: Math.max(0, Math.min(levelInfo.height - tile.height, tile.y)),
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

  while (true) {
    yield { x, y }

    if (x === end.x && y === end.y) {
      break
    }

    const e2 = 2 * error // must not be inlined in the if statements below since error can change
    if (e2 >= yDist) { // error_xy + error_x > 0
      // horizontal step
      error += yDist
      x += xStep
    }

    if (e2 <= xDist) { // error_xy + error_y < 0
      // vertical step
      error += xDist
      y += yStep
    }
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


  while (true) {
    yield { x, y }

    if (x === end.x && y === end.y) {
      break
    }

    // if (xDist + yDist < 4 * error) { // alternate form, probably less clear but infinitesimally faster
    if (2 * error - yDist > xDist - 2 * error) {
      // horizontal step
      error += yDist
      x += xStep
    } else {
      // vertical step
      error += xDist
      y += yStep
    }
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
  // TODO: rule should be crates are below anything they are not inside of*,
  // which is complicated, as in this game, crates can be inside of crates inside of snakes inside of crates.
  // *except walls? or does that count as being inside of the wall?
  entities.sort((a, b) => {
    return (
      (+(a instanceof Collectable) - +(b instanceof Collectable)) // ||
      // (+(b instanceof Crate && a instanceof Snake) - +(a instanceof Crate && b instanceof Snake))
    )
  })
}

/**
 * Returns all entities at a given point, from top to bottom.
 * 
 * A snake's tail may be leaving the space, so it can be ignored, optionally.
 */
export function hitTestAllEntities(x: number, y: number, options: Partial<{ ignoreTailOfSnake: Snake | undefined }> = {}): Hit[] {
  const hits: Hit[] = []
  for (let i = entities.length - 1; i >= 0; i--) {
    const entity = entities[i]
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

/**
 * Returns the color (collision layer) of the topmost solid entity in a list of hits ordered from top to bottom.
 */
export function topLayer(hits: Hit[]): CollisionLayer {
  for (const hit of hits) {
    if (hit.entity.solid) {
      return hit.layer
    }
  }
  return CollisionLayer.Black
}

export function layersCollide(a: CollisionLayer, b: CollisionLayer) {
  // Previously, this was:
  // return (a === b || a === CollisionLayer.Both || b === CollisionLayer.Both)
  // which would consider CollisionLayer.None to collide with CollisionLayer.None.
  // Simpler bitwise logic is used now.
  return (a & b) !== 0
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

export function translateEntity(dragging: Entity, dx: number, dy: number) {
  if (dragging instanceof RectangularEntity) {
    dragging.x += dx
    dragging.y += dy
  } else if (dragging instanceof Snake) {
    for (const segment of dragging.segments) {
      segment.x += dx
      segment.y += dy
    }
  }
}
