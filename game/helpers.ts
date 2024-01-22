import { Block } from "./block"
import { Collectable } from "./collectable"
import { Crate } from "./crate"
import Entity from "./entity"
import { entities } from "./game-state"
import Snake from "./snake"
import { CollisionLayer, Hit, Tile } from "./types"

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
  let foremost = CollisionLayer.Black
  const entitiesThere: Entity[] = []
  const hits: Hit[] = []
  for (const entity of entities) {
    if (entity instanceof Snake) {
      const hit = entity.at(x, y, true, entity !== options.ignoreTailOfSnake)
      if (hit) {
        if (entity.solid) {
          foremost = hit.layer
        }
        entitiesThere.push(entity)
        hits.push(hit)
      }
    } else if (entity.at) {
      const hit = entity.at(x, y)
      if (hit) {
        if (entity.solid) {
          foremost = hit.layer
        }
        entitiesThere.push(entity)
        hits.push(hit)
      }
    }
  }
  return hits
  // return {
  //   x,
  //   y,
  //   entitiesThere, // including non-solid entities (old, redundant with hits, TODO: remove)
  //   hits, // including non-solid entities
  //   topLayer: foremost, // top solid entity's color (might remove too)
  // }
}
