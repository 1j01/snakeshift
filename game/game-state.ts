import { Block } from "./block"
import Entity from "./entity"
import Snake from "./snake"
import { CollisionLayer, GameState, ParsedGameState } from "./types"

export const entities: Entity[] = []

export let activePlayer: Snake | undefined = undefined

const undos: GameState[] = []
const redos: GameState[] = []
export function undoable() {
  undos.push(serialize())
  redos.length = 0
}
export function undo() {
  stepHistory(undos, redos)
}
export function redo() {
  stepHistory(redos, undos)
}
function stepHistory(from: GameState[], to: GameState[]) {
  const state = from.pop()
  if (!state) return
  to.push(serialize())
  deserialize(state)
}
export function serialize(): GameState {
  return JSON.stringify({
    format: "snakeshift",
    formatVersion: 1,
    entities,
    entityTypes: entities.map(e => e.constructor.name),
    activePlayerEntityIndex: entities.indexOf(activePlayer!),
  })
}
export function deserialize(state: GameState) {
  entities.length = 0

  const parsed = JSON.parse(state) as ParsedGameState
  if (parsed.format !== "snakeshift") throw new Error("Invalid format")
  if (parsed.formatVersion > 1) throw new Error("Format version is too new")
  if (parsed.formatVersion !== 1) throw new Error("Invalid format version")

  for (let i = 0; i < parsed.entities.length; i++) {
    const entityData = parsed.entities[i]
    const entityType = parsed.entityTypes[i]
    let instance: Entity
    switch (entityType) {
      case "Block":
        instance = new Block()
        break
      case "Snake":
        instance = new Snake()
        break
      default:
        throw new Error(`Unknown entity type: ${entityType}`)
    }
    Object.assign(instance, entityData)
    entities.push(instance)
  }

  activePlayer = entities[parsed.activePlayerEntityIndex] as Snake
}


export function initLevel() {
  entities.length = 0
  const size = 10
  for (let x = 0; x < 16; x++) {
    for (let y = 8; y < 16; y++) {
      entities.push(new Block(x * size, y * size, size, CollisionLayer.White))
    }
  }
  activePlayer = new Snake()
  entities.push(activePlayer)
  const otherSnake = new Snake()
  for (const segment of otherSnake.segments) {
    segment.y += segment.size * 9
    segment.layer = CollisionLayer.Black
  }
  entities.push(otherSnake)
}
