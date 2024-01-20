import { Block } from "./block"
import { Collectable } from "./collectable"
import Entity from "./entity"
import { entities } from "./game-state"
import Snake from "./snake"
import { CollisionLayer, HitTestResult, Tile } from "./types"

export function sameTile(a: Tile, b: Tile) {
  return a.x === b.x && a.y === b.y && a.size === b.size
}

export function neighborOf(tile: Tile, direction: { x: number, y: number }) {
  return {
    x: tile.x + direction.x * tile.size,
    y: tile.y + direction.y * tile.size,
    size: tile.size,
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
    default:
      throw new Error(`Unknown entity type: ${entityType}`)
  }
}

export function hitTestAllEntities(x: number, y: number, options: Partial<{ ignoreTailOfSnake: Snake | undefined }> = {}): HitTestResult {
  // A snake's tail may be leaving the space, so it can be ignored, optionally.
  let foremost = CollisionLayer.Black
  const entitiesThere: Entity[] = []
  for (const entity of entities) {
    if (entity instanceof Snake) {
      const there = entity.at(x, y, true, entity !== options.ignoreTailOfSnake)
      if (there) {
        foremost = there
        entitiesThere.push(entity)
      }
    } else if (entity.at) {
      const there = entity.at(x, y)
      if (there) {
        foremost = there
        entitiesThere.push(entity)
      }
    }
  }
  return {
    x,
    y,
    entitiesThere,
    topLayer: foremost,
  }
}
