import { Block } from "./block"
import { Collectable } from "./collectable"
import { Crate } from "./crate"
import Entity from "./entity"
import { makeEntity, sortEntities } from "./helpers"
import Snake from "./snake"
import { CollisionLayer, ControlScheme, GameState, ParsedGameState } from "./types"

export const entities: Entity[] = []

export const levelInfo = {
  // name: "Level 1",
  // description: "This is a level.",
  // par: 10,
  width: 16,
  height: 16,
}

// Note: entities can be reordered, so this is safer than
// storing the index within entities, which is only done for serialization.
// An ID could be used instead... I've now added an ID...
export let activePlayer: Snake | undefined = undefined

export let controlScheme = ControlScheme.KeyboardAbsoluteDirection

export const undos: GameState[] = []
export const redos: GameState[] = []
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
  const whichSnakeBefore = activePlayer?.id ?? ""
  entities.length = 0

  const parsed = JSON.parse(state) as ParsedGameState
  if (parsed.format !== "snakeshift") throw new Error("Invalid format")
  if (parsed.formatVersion > 1) throw new Error("Format version is too new")
  if (parsed.formatVersion !== 1) throw new Error("Invalid format version")

  for (let i = 0; i < parsed.entities.length; i++) {
    const entityData = parsed.entities[i]
    const entityType = parsed.entityTypes[i]
    const instance = makeEntity(entityType)
    Object.assign(instance, entityData)
    entities.push(instance)
  }

  activePlayer = entities[parsed.activePlayerEntityIndex] as Snake | undefined

  const whichSnakeAfter = activePlayer?.id ?? ""
  if (whichSnakeBefore !== whichSnakeAfter) {
    activePlayer?.highlight()
  }

  postUpdate()
}


export function initLevel() {
  entities.length = 0
  // for (let x = 0; x < 16; x++) {
  //   for (let y = 8; y < 16; y++) {
  //     entities.push(new Block(x, y, 1, 1, CollisionLayer.White))
  //   }
  // }
  entities.push(new Block(0, 8, 16, 8, CollisionLayer.White))
  for (let x = 9; x < 15; x++) {
    for (let y = 9; y < 15; y++) {
      entities.push(new Block(x, y, 1, 1, CollisionLayer.Black))
    }
  }
  for (let x = 4; x < 12; x++) {
    for (let y = 0; y < 8; y++) {
      entities.push(new Collectable(x, y, 1, 1, CollisionLayer.White))
    }
    for (let y = 8; y < 16; y++) {
      entities.push(new Collectable(x, y, 1, 1, CollisionLayer.Black))
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
  entities.push(new Crate(3, 3, 1, 1, CollisionLayer.White))
  entities.push(new Crate(3, 13, 1, 1, CollisionLayer.Black))
  sortEntities() // because I don't care to manage the order of this code more than I need to
  postUpdate() // might matter to clear a highlight if level is reset
}

export function cyclePlayerControl() {
  const players = entities.filter(e => e instanceof Snake) as Snake[]
  // If there is no active player, -1 + 1 naturally gives the first player.
  const index = players.indexOf(activePlayer!)
  const nextIndex = (index + 1) % players.length
  // If there are no players at all, avoid creating a useless undo state or erroring.
  if (!players[nextIndex]) return
  undoable()
  activePlayer = players[nextIndex]
  activePlayer.highlight()
  postUpdate()
}

const updateListeners: (() => void)[] = []
export function onUpdate(listener: () => void) {
  updateListeners.push(listener)
}

export function postUpdate() {
  for (const listener of updateListeners) {
    listener()
  }
}

export function setControlScheme(scheme: ControlScheme) {
  controlScheme = scheme
  postUpdate()
}

export function setActivePlayer(snake: Snake | undefined) {
  activePlayer = snake
  postUpdate()
}
