// Helpers that are shared between the game and tests can go in here.
// This file must not import any file that depends on `window` or `document`,
// nor Node.js-only modules.

import * as jsondiffpatch from "jsondiffpatch"
import type Entity from "./entity"
import type { Food } from "./food"
import type Snake from "./snake"
import type { GameState, MoveInput, ParsedGameState } from "./types"

export const FORMAT_VERSION = 5
export const PLAYTHROUGH_FORMAT_VERSION = 2

export function isPlaythrough(fileContent: string) {
  const testString = fileContent.slice(0, 1000)
  // Old playthrough format: a JSON array of JSON strings containing snakeshift level file data
  // Only format identifier is inside the level data strings
  if (testString.match(/^\s*\[.*snakeshift/s)) {
    return true
  }
  // New playthrough format, with a proper format identifier
  if (testString.match(/^\s*\{.*"snakeshift-playthrough"/s)) {
    return true
  }
  return false
}

export function parsePlaythrough(json: string): GameState[] {
  let parsed = JSON.parse(json) as object
  if (Array.isArray(parsed)) {
    // V1 -> V2
    // First version of playthrough format was just an array of JSON strings
    // containing snakeshift level file data. Very inefficient.
    const stateStrings = parsed as string[]
    const baseState = JSON.parse(stateStrings[0]) as ParsedGameState
    const deltas: jsondiffpatch.Delta[] = []
    let prevState = baseState
    const diffPatcher = jsondiffpatch.create({
      objectHash: (obj: object, index?: number): string | undefined => {
        // try to find an id property, otherwise just use the index in the array
        return 'id' in obj ? (obj as { id: string }).id : '$$index:' + index
      },
    })
    for (let i = 1; i < stateStrings.length; i++) {
      const state = JSON.parse(stateStrings[i]) as ParsedGameState
      const delta = diffPatcher.diff(prevState, state)
      deltas.push(delta)
      prevState = state
    }
    parsed = {
      format: "snakeshift-playthrough",
      formatVersion: 2,
      baseState,
      deltas,
    }
  }
  if (!('format' in parsed)) throw new Error('Invalid format. Missing "format" property.')
  if (!('formatVersion' in parsed)) throw new Error('Invalid format. Missing "formatVersion" property.')
  if (parsed.format !== "snakeshift-playthrough") throw new Error(`Invalid format. Expected "snakeshift-playthrough", got ${JSON.stringify(parsed.format)}`)
  if (typeof parsed.formatVersion !== "number") throw new Error(`Invalid format. Expected "number", got ${JSON.stringify(parsed.formatVersion)} for "formatVersion" property.`)
  if (parsed.formatVersion > PLAYTHROUGH_FORMAT_VERSION) throw new Error("Format version is too new")
  if (parsed.formatVersion !== PLAYTHROUGH_FORMAT_VERSION) throw new Error("Invalid format version")
  if (!('baseState' in parsed)) throw new Error('Invalid format. Missing "baseState" property.')
  if (!('deltas' in parsed)) throw new Error('Invalid format. Missing "deltas" property.')

  let state = parsed.baseState as ParsedGameState
  const playthrough = [JSON.stringify(state)] as GameState[]
  for (const delta of parsed.deltas as jsondiffpatch.Delta[]) {
    if (delta) {
      const newState = jsondiffpatch.patch(state, delta) as ParsedGameState
      playthrough.push(JSON.stringify(newState))
      state = newState
    } else {
      playthrough.push(JSON.stringify(state))
    }
  }
  return playthrough
}

type EntityLike = Entity & { _type: string }
function isEntityOfType(entity: EntityLike, type: "Snake"): entity is Snake & { _type: "Snake" }
function isEntityOfType(entity: EntityLike, type: "Food"): entity is Food & { _type: "Food" }
function isEntityOfType(entity: EntityLike, type: "Snake" | "Food"): boolean {
  return entity._type === type
}

export function getMovesFromPlaythrough(playthroughJSON: string): MoveInput[] {
  const moves: MoveInput[] = []
  const playthrough = (parsePlaythrough(playthroughJSON)
    .map((stateString) => {
      const parsed = JSON.parse(stateString) as ParsedGameState
      const entities: EntityLike[] = []
      for (let i = 0; i < parsed.entities.length; i++) {
        const entityData = parsed.entities[i]
        const entityType = parsed.entityTypes[i]
        entities.push({ ...entityData, _type: entityType })
      }
      return { entities, activeSnakeId: (parsed.entities[parsed.activePlayerEntityIndex] as Snake)?.id }
    })
    .filter(({ activeSnakeId }) => activeSnakeId) // needed for logic that handles missing final winning state in playthrough (it might actually include the initial state of the next level... hopefully always with `activePlayerEntityIndex` of -1 so that we can detect it...)
  ) as { entities: EntityLike[]; activeSnakeId: string }[]
  let prevState: { entities: EntityLike[]; activeSnakeId: string } | null = null
  let activeSnakeId: string | null = null
  for (const state of playthrough) {
    if (prevState) {
      // Try to figure out the move from the difference between states
      // If the active snake changed, we need to click the snake; otherwise it's an arrow key
      // (The Tab key or other controls may be used to switch snakes, but since we need to handle switching to arbitrary snakes,
      // clicking is the way to go.)
      if (state.activeSnakeId && activeSnakeId !== state.activeSnakeId) {
        const activeSnake = state.entities.find((snake) => isEntityOfType(snake, "Snake") && snake.id === state.activeSnakeId) as Snake | undefined
        if (!activeSnake) {
          throw new Error(`Could not find snake with ID ${state.activeSnakeId}`)
        }
        const head = activeSnake.segments[0]
        moves.push({ click: head })
      }
      for (const entity of state.entities) {
        for (const prevStateEntity of prevState.entities) {
          if (isEntityOfType(entity, 'Snake') &&
            isEntityOfType(prevStateEntity, 'Snake') &&
            prevStateEntity.id === entity.id) {
            let moveKey: MoveInput | null = null
            if (prevStateEntity.segments[0].x < entity.segments[0].x) {
              moveKey = 'ArrowRight'
            } else if (prevStateEntity.segments[0].x > entity.segments[0].x) {
              moveKey = 'ArrowLeft'
            } else if (prevStateEntity.segments[0].y < entity.segments[0].y) {
              moveKey = 'ArrowDown'
            } else if (prevStateEntity.segments[0].y > entity.segments[0].y) {
              moveKey = 'ArrowUp'
            }
            if (moveKey) {
              moves.push(moveKey)
              break
            }
          }
        }
      }
    }
    prevState = state
    activeSnakeId = state.activeSnakeId
  }

  // Playthrough might not contain the final state/move (awkward)
  // However, if that's the case, there should only be one Food left, so we can just compare its position to the active snake's head in the last state.
  const lastState = playthrough[playthrough.length - 1]
  const foods = lastState.entities.filter((entity) => isEntityOfType(entity, 'Food'))
  if (foods.length === 1) {
    const food = foods[0]
    const activeSnake = lastState.entities.find((snake) => isEntityOfType(snake, "Snake") && snake.id === lastState.activeSnakeId) as Snake | undefined
    if (!activeSnake) {
      throw new Error(`Could not find snake with ID ${lastState.activeSnakeId}`)
    }
    if (!isEntityOfType(food, 'Food')) {
      throw new Error(`Could not find Food in last state`)
    }
    const head = activeSnake.segments[0]
    if (head.x < food.x) {
      moves.push('ArrowRight')
    } else if (head.x > food.x) {
      moves.push('ArrowLeft')
    } else if (head.y < food.y) {
      moves.push('ArrowDown')
    } else if (head.y > food.y) {
      moves.push('ArrowUp')
    }
  }

  return moves
}

export const storageKeys = {
  muteSoundEffects: 'snakeshift:muteSoundEffects',
  volume: 'snakeshift:volume',
  bestSolution: (levelId: string) => `snakeshift:bestSolution:${levelId}`,
  bestMoveCount: (levelId: string) => `snakeshift:bestMoveCount:${levelId}`,
}

