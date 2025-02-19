// Helpers that are shared between the game and tests can go in here.
// This file must not import any file that depends on `window` or `document`,
// nor Node.js-only modules.

import * as jsondiffpatch from "jsondiffpatch"
import { GameState, ParsedGameState } from "./types"

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
    const newState = jsondiffpatch.patch(state, delta) as ParsedGameState
    playthrough.push(JSON.stringify(newState))
    state = newState
  }
  return playthrough
}
