import * as jsondiffpatch from "jsondiffpatch"
import { playSound } from "./audio"
import Entity from "./entity"
import { activityMode, editorRedos, editorUndos, setActivityMode, shouldInputBeAllowed, storeBaseLevelState } from "./game"
import { canMove } from "./game-logic"
import { makeEntity } from "./helpers"
import { currentLevelID, setCurrentLevel, setStandaloneLevelMode, standaloneLevelMode, updatePageTitleAndLevelSpecificOverlays } from "./level-select"
import { hideScreens, showLevelSplash } from "./menus"
import { FORMAT_VERSION, PLAYTHROUGH_FORMAT_VERSION, isPlaythrough, parsePlaythrough } from "./shared-helpers"
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
    playSound("undo", { playbackRate: 1 / (1 + recentUndoSound / 2), cutOffEndFraction: Math.min(0.2, recentUndoSound / 5), volume: 0.2 })
    recentUndoSound += 1
    setTimeout(() => {
      recentUndoSound -= 1
    }, 400)
    // Special behavior to hide the game win screen
    document.getElementById("game-win-screen")?.classList.remove("active")
  }
}
export function redo() {
  const didSomething = stepHistory(redos, undos)
  if (didSomething) {
    playSound("redo", { playbackRate: (1 + recentRedoSound / 10), volume: 0.2 })
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
  const replaySlider = document.getElementById("replay-slider") as HTMLInputElement
  replaySlider.value = `${undos.length}`
  return true
}
export function goToHistoryIndex(index: number) {
  while (undos.length > index) {
    if (!stepHistory(undos, redos)) break
  }
  while (undos.length < index) {
    if (!stepHistory(redos, undos)) break
  }
}

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
export function deserialize(state: GameState, levelId: string | null = null, temporary = false) {
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
  if (parsed.formatVersion === 4) {
    parsed.formatVersion = 5
    // Rename "Collectable" to "Food"
    for (let i = 0; i < parsed.entityTypes.length; i++) {
      if (parsed.entityTypes[i] === "Collectable") {
        parsed.entityTypes[i] = "Food"
      }
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

  if (!temporary) {
    const whichSnakeAfter = activePlayer?.id ?? ""
    if (whichSnakeBefore !== whichSnakeAfter && (activityMode == "play" || activityMode == "replay")) {
      activePlayer?.highlight()
    }

    if (!standaloneLevelMode) {
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
      setCurrentLevel(levelId || parsed.levelId)
    }
    updatePageTitleAndLevelSpecificOverlays()

    postUpdate()
  }
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
  if (!shouldInputBeAllowed()) return
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

export function guessDefaultActivePlayer() {
  if (!activePlayer) {
    // Ideally, levels would be saved with an active player, but currently there's nothing to activate a player in edit mode,
    // and anyway I have a bunch of levels saved at this point.
    // Try to select a snake that can move, then select any snake if there are no movable snakes.
    // In REAL LEVELS there should always be a movable snake, but having only stuck snakes is very useful for TEST CASES.
    const snakes = entities.filter(e => e instanceof Snake) as Snake[]
    setActivePlayer(snakes.find(snake => canMove(snake)) ?? snakes[0])
  }
}

declare global {
  interface Window {
    _winLevelCheat?: boolean
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

export function serializePlaythrough() {
  // Include redos in order to support round-trip re-saving of playthroughs for automated upgrading of the format...
  // but maybe only in replay mode? Might be unexpected in play mode.
  const states = (activityMode === "replay" ? [...undos, serialize(), ...redos.toReversed()] : [...undos, serialize()])
    .map(s => JSON.parse(s) as ParsedGameState)
  const baseState = states[0]
  const deltas: jsondiffpatch.Delta[] = []
  let prevState = baseState
  const diffPatcher = jsondiffpatch.create({
    objectHash: (obj: object, index?: number): string | undefined => {
      // try to find an id property, otherwise just use the index in the array
      // unfortunately not all movable entities have an id property
      return 'id' in obj ? (obj as { id: string }).id : '$$index:' + index
    },
  })

  for (let i = 1; i < states.length; i++) {
    const state = states[i]
    const delta = diffPatcher.diff(prevState, state)
    // jsonpatch format is a standard and more human-readable,
    // but jsondiffpatch's native Delta format is more compact when minified (not necessarily when pretty-printed, since it uses more nesting)
    // patches.push(jsonpatchFormatter.format(delta))
    deltas.push(delta)
    prevState = state
  }
  const json = JSON.stringify({
    format: "snakeshift-playthrough",
    formatVersion: PLAYTHROUGH_FORMAT_VERSION,
    baseState,
    deltas,
  })
  return json
}
export function savePlaythrough() {
  const json = serializePlaythrough()
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  // TODO: include level ID in filename if available
  a.download = 'snakeshift-level-playthrough.json'
  a.click()
}
function loadPlaythrough(json: string) {
  const playthrough = parsePlaythrough(json)

  loadLevelFromText(playthrough[0], "replay")
  for (const state of playthrough.toReversed()) {
    // Don't just push the state; it may need upgrading between format versions.
    // Without this, the playthrough could end up with deltas on formatVersion itself, which would be a mess.
    // (Could alternatively do this with .map or otherwise modify playthrough before this loop.)
    deserialize(state)
    redos.push(serialize())
  }
  // TODO: avoid sound effect? I mean, it's not terribly inappropriate... definitely unintentional though.
  redo()
  undos.length = 0

  const replaySlider = document.getElementById("replay-slider") as HTMLInputElement
  replaySlider.max = `${playthrough.length}`
  replaySlider.value = "0"
  replaySlider.focus()
  showLevelSplash({ title: `Loaded replay with ${playthrough.length} steps` })
}

// TODO: simplify with promises
export function loadLevel(file: Blob, newMode: "edit" | "play", loadedCallback?: () => void, levelId: string | null = null) {
  // Error Message Itself Test
  // Promise.reject(new Error("EMIT oh no!")).then((fileText) => {
  file.text().then((fileText) => {
    // TODO: I noticed that without this condition, all the tests passed. Might be good to try to add a test that fails without it.
    // Also if the setStandaloneLevelMode was called before the file was loaded, that would be a race condition, right? Not caught by tests either.
    if (levelId) {
      // We're loading a campaign level
      setStandaloneLevelMode(false)
    }
    if (loadLevelFromText(fileText, newMode, levelId)) {
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
  if (activityMode === "menu" || activityMode === "replay") {
    return true
  } else if (activityMode === "edit") {
    if (undos.length === 0 && redos.length === 0) return true
  } else if (activityMode === "play") {
    if (currentLevelID()) return true
    if (editorUndos.length === 0 && editorRedos.length === 0) return true
  }
  return confirm("This will discard any unsaved changes. Are you sure?")
}
export function loadLevelFromText(fileText: string, newMode: "edit" | "play" | "replay", levelId: string | null = null): boolean {
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
  if (isPlaythrough(fileText)) {
    // NOTE: loadLevelFromText will be at two places in the call stack in this case. Might be able to simplify by having
    // loadPlaythrough (or a replacement with a new name) return the GameState string to load,
    // which would be loaded subsequently in this function, but not recursively.
    try {
      loadPlaythrough(fileText)
    } catch (error) {
      // TODO: avoid alert
      alert(`Failed to load playthrough. ${(error as Error).toString()}`)
      return false
    }
    return true
  } else {
    try {
      deserialize(fileText, levelId)
      guessDefaultActivePlayer()
      storeBaseLevelState()
    } catch (error) {
      deserialize(before.state)
      undos.splice(0, undos.length, ...before.undos)
      redos.splice(0, redos.length, ...before.redos)
      alert(`Failed to load level. ${(error as Error).toString()}`)
      return false
    }
    setActivityMode(newMode)
    hideScreens({ except: ["level-splash"] }) // level splash is shown early to mask loading time
    document.body.dataset.screen = "game"
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

