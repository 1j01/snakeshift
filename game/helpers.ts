import { Block } from "./block"
import { Collectable } from "./collectable"
import Entity from "./entity"
import Snake from "./snake"
import { Tile } from "./types"

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
