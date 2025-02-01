import { playSound } from "./audio"
import { Collectable } from "./collectable"
import Entity from "./entity"
import { activityMode, editorRedos, editorUndos, setActivityMode, setBaseLevelState } from "./game"
import { makeEntity } from "./helpers"
import { currentLevelID, setCurrentLevel, updatePageTitleAndLevelSpecificOverlays } from "./level-select"
import { hideScreens } from "./menus"
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

export function saveLevel() {
  const levelJSON = serialize()
  const blob = new Blob([levelJSON], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'snakeshift-level.json'
  a.click()
}

export function savePlaythrough() {
  // TODO: better playthrough format
  // Since I've already saved some playthroughs by just copying `JSON.stringify(undos)` from the console,
  // I figure I might as well make it easy to save them like this for now, as I'll have files to convert anyway.
  // This format's pretty bad though - JSON strings in JSON, and no format identifier/version.
  // BTW: this function doesn't have to do with level editing, except I suppose I MIGHT allow saving while editing,
  // but it's just similar to saveLevel.
  // New files will include the final state, but old files will be slightly unsatisfying to watch. :P
  const json = JSON.stringify([...undos, serialize()])
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'snakeshift-level-playthrough.json'
  a.click()
}
function loadPlaythrough(json: string) {

  const playthrough = JSON.parse(json) as GameState[]
  if (!Array.isArray(playthrough)) {
    throw new Error("Invalid playthrough format")
  }
  // TODO: make "replay" a separate activity mode, where you can only step through the history?
  // Not sure if I want to limit it like that, might be useful to continue playing from replay,
  // if only for testing purposes.
  loadLevelFromText(playthrough[0], "play")
  for (const state of playthrough.toReversed()) {
    redos.push(state)
  }
  redo()
  alert(`Loaded playthrough with ${playthrough.length} moves. Press 'Y' (Redo) to step through it.`)
}
// TODO: simplify with promises

export function loadLevel(file: Blob, newMode: "edit" | "play", loadedCallback?: () => void) {
  // Error Message Itself Test
  // Promise.reject(new Error("EMIT oh no!")).then((fileText) => {
  file.text().then((fileText) => {
    if (loadLevelFromText(fileText, newMode)) {
      loadedCallback?.()
    }
  }, (error) => {
    alert(`Failed to read level file. ${error}`)
  })
}

export function confirmLoseUnsavedChanges() {
  // When play-testing a level, the undo/redo stacks are swapped into `editorUndos`/`editorRedos`.
  // `editorUndos`/`editorRedos` only represent the editor's history while in play mode.
  // While in edit mode, the editor's history is stored in `undos`/`redos`.
  // This is a bit messy with state ownership.
  // Before adding this confirmation dialog, the editor didn't have to know about `editorUndos`/`editorRedos`.
  if (activityMode === "menu") {
    return true
  } else if (activityMode === "edit") {
    if (undos.length === 0 && redos.length === 0) return true
  } else if (activityMode === "play") {
    if (currentLevelID()) return true
    if (editorUndos.length === 0 && editorRedos.length === 0) return true
  }
  return confirm("This will discard any unsaved changes. Are you sure?")
}
function loadLevelFromText(fileText: string, newMode: "edit" | "play"): boolean {
  // Load level or playthrough, and return whether it succeeded...
  // Or, may throw an error while loading a playthrough.
  if (!confirmLoseUnsavedChanges()) return false

  // TODO: handle edit mode vs. play mode undo stacks
  // This is complicated, in part due to trying to snapshot for transactional error handling.
  // The snapshot may be of either set of stacks, depending on the previous edit mode state.
  // I also want to preserve the undo history across levels,
  // and then there's playthroughs to think about, which, by the way,
  // should only save the history of one level, NOT across levels,
  // in order to store proof of playability for a level without unnecessary data.
  const before = {
    state: serialize(),
    undos: [...undos],
    redos: [...redos],
  }
  // Allow undoing/redoing across levels
  // But don't create an extraneous undo state when loading a level into level editor
  // or loading a level from the level select screen.
  if (activityMode === "play" && newMode === "play") {
    undoable()
  }
  // not allowing whitespace but this is just a temporary file format with no proper identifier, for playthroughs
  if (fileText.startsWith('[')) {
    // TODO: error handling; also, I just realized loadLevelFromText will be at
    // two places in the call stack in this case. Might be able to simplify by having
    // loadPlaythrough (or a replacement with a new name) return the GameState string to load,
    // which would be loaded subsequently in this function, but not recursively.
    loadPlaythrough(fileText)
    return true // it's not a lie because it didn't throw an error™ (if it got here)
  } else {
    try {
      deserialize(fileText)
      setBaseLevelState(fileText)
      if (!activePlayer) {
        // Ideally, levels would be saved with an active player, but currently there's nothing to activate a player in edit mode,
        // and anyway I have a bunch of levels saved at this point.
        for (const entity of entities) {
          if (entity instanceof Snake) {
            setActivePlayer(entity)
            break
          }
        }
      }
    } catch (error) {
      deserialize(before.state)
      undos.splice(0, undos.length, ...before.undos)
      redos.splice(0, redos.length, ...before.redos)
      alert(`Failed to load level. ${(error as Error).toString()}`)
      return false
    }
    setActivityMode(newMode)
    hideScreens({ except: ["level-splash"] }) // level splash is shown early to mask loading time
    return true
  }
}

export function openLevel() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'application/json'
  input.addEventListener('change', () => {
    const file = input.files?.[0]
    if (!file) return
    loadLevel(file, "edit")
  })
  input.click()
}

