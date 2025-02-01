import { playSound } from "./audio"
import { Collectable } from "./collectable"
import Entity from "./entity"
import { activityMode } from "./game"
import { makeEntity } from "./helpers"
import { currentLevelID, setCurrentLevel, updatePageTitleAndLevelSpecificOverlays } from "./level-select"
import Snake from "./snake"
import { ControlScheme, GameState, ParsedGameState } from "./types"

export const entities: Entity[] = []

const defaultLevelInfo = {
  width: 16,
  height: 16,
}

export const levelInfo = {
  // name: "Level 1",
  // description: "This is a level.",
  // par: 10,
  width: defaultLevelInfo.width,
  height: defaultLevelInfo.height,
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
let recentUndoSound = 0
let recentRedoSound = 0
export function undo() {
  const didSomething = stepHistory(undos, redos, true)
  if (didSomething) {
    playSound("undo", { playbackRate: 1 / (1 + recentUndoSound / 2), cutOffEndFraction: Math.min(0.2, recentUndoSound / 5) })
    recentUndoSound += 1
    setTimeout(() => {
      recentUndoSound -= 1
    }, 400)
  }
}
export function redo() {
  const didSomething = stepHistory(redos, undos)
  if (didSomething) {
    playSound("redo", { playbackRate: (1 + recentRedoSound / 10) })
    recentRedoSound += 1
    setTimeout(() => {
      recentRedoSound -= 1
    }, 400)
  }
}
function stepHistory(from: GameState[], to: GameState[], skipOverWinState = false) {
  const state = from.pop()
  if (!state) return false
  const oldState = serialize()
  to.push(oldState)
  // TODO: being lazy with extra parsing here
  // console.log("skipOverWinState", skipOverWinState, JSON.parse(oldState).levelId, JSON.parse(state).levelId)
  if (skipOverWinState && (JSON.parse(oldState) as ParsedGameState).levelId !== (JSON.parse(state) as ParsedGameState).levelId) {
    // Skip over the state where the level was won
    // Don't pass on skipOverWinState because we don't want to recurse more than once.
    stepHistory(from, to)
    return true
  }
  deserialize(state)
  return true
}
const FORMAT_VERSION = 4
export function serialize(): GameState {
  return JSON.stringify({
    format: "snakeshift",
    formatVersion: FORMAT_VERSION,
    levelInfo,
    entities,
    entityTypes: entities.map(e => e.constructor.name),
    activePlayerEntityIndex: entities.indexOf(activePlayer!),
    levelId: currentLevelID(),
  }, null, 2) + "\n"
}
export function deserialize(state: GameState) {
  const whichSnakeBefore = activePlayer?.id ?? ""
  entities.length = 0

  const parsed = JSON.parse(state) as ParsedGameState
  if (parsed.format !== "snakeshift") throw new Error("Invalid format")
  if (parsed.formatVersion > FORMAT_VERSION) throw new Error("Format version is too new")
  // Upgrade save format, version by version
  if (parsed.formatVersion === 1) {
    parsed.formatVersion = 2
    for (let i = 0; i < parsed.entities.length; i++) {
      const entDef = parsed.entities[i]
      if (parsed.entityTypes[i] === "Snake") {
        // @ts-expect-error doesn't know it's Snake-like
        for (const segDef of entDef.segments) {
          if ("width" in segDef) continue // actually already updated data shape before bumping version, so handle that
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          segDef.width = segDef.height = segDef.size
        }
      }
    }
  }
  if (parsed.formatVersion === 2) {
    parsed.formatVersion = 3
    // Levels now store their size in the levelInfo object.
    // Don't use defaultLevelInfo here because it could change in the future, and this should use the historical default size.
    parsed.levelInfo = { width: 16, height: 16 }
  }
  if (parsed.formatVersion === 3) {
    parsed.formatVersion = 4
    // Remove accidentally serialized _time properties from Collectable entities
    for (const entDef of parsed.entities) {
      // @ts-expect-error property is not defined on Entity
      delete entDef._time
    }
  }
  if (parsed.formatVersion !== FORMAT_VERSION) throw new Error("Invalid format version")

  for (let i = 0; i < parsed.entities.length; i++) {
    const entityData = parsed.entities[i]
    const entityType = parsed.entityTypes[i]
    const instance = makeEntity(entityType)
    Object.assign(instance, entityData)
    entities.push(instance)
  }

  levelInfo.width = parsed.levelInfo.width
  levelInfo.height = parsed.levelInfo.height

  activePlayer = entities[parsed.activePlayerEntityIndex] as Snake | undefined

  const whichSnakeAfter = activePlayer?.id ?? ""
  if (whichSnakeBefore !== whichSnakeAfter && activityMode == "play") {
    activePlayer?.highlight()
  }

  setCurrentLevel(parsed.levelId)
  updatePageTitleAndLevelSpecificOverlays()

  postUpdate()
}

export function clearLevel(shouldBeUndoable = true) {
  // Hm, using an adjective for a function name makes this a bit awkward.
  // (Not that I really need to make this a parameter.)
  if (shouldBeUndoable) undoable()
  entities.length = 0
  // TODO: Don't really want to reset the level size with the clear button (but I do when entering the editor)
  levelInfo.width = defaultLevelInfo.width
  levelInfo.height = defaultLevelInfo.height
  activePlayer = undefined
  postUpdate()
}

export function cyclePlayerControl(reverse = false) {
  const players = entities.filter(e => e instanceof Snake) as Snake[]
  // If there is no active player, -1 + 1 naturally gives the first player.
  const index = players.indexOf(activePlayer!)
  const nextIndex = ((index + (reverse ? -1 : 1)) + players.length) % players.length
  // If there are no players at all, avoid creating a useless undo state or erroring.
  if (!players[nextIndex]) return
  undoable()
  activePlayer = players[nextIndex]
  playSound("switchSnakes")
  activePlayer.highlight()
  postUpdate()
}

const updateListeners: (() => void)[] = []
const resizeListeners: (() => void)[] = []

export function onUpdate(listener: () => void) {
  updateListeners.push(listener)
}
export function onResize(listener: () => void) {
  resizeListeners.push(listener)
}
export function postUpdate() {
  for (const listener of updateListeners) {
    listener()
  }
}
export function postResize() {
  for (const listener of resizeListeners) {
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

export function checkLevelWon() {
  if (window._winLevelCheat) {
    window._winLevelCheat = false
    return true
  }
  return entities.filter(e => e instanceof Collectable).length === 0
}

declare global {
  interface Window {
    _winLevelCheat?: boolean;
  }
}
