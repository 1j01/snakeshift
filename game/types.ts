import Entity from "./entity"

export enum ControlScheme {
  KeyboardAbsoluteDirection,
  KeyboardFacingRelative,
  Gamepad,
  Pointer, // mouse/pen/touch
}

export enum CollisionLayer {
  None = 0,
  White = 1,
  Black = 2,
}

export interface ParsedGameState {
  format: string
  formatVersion: number
  entities: Entity[]
  entityTypes: string[]
  activePlayerEntityIndex: number
}
export type GameState = string

// Note: Interfaces are better than classes for serialization.
// No special constructor handling! Still need to worry about
// circular/multiple references, though.

export interface Point {
  x: number
  y: number
}

export interface Tile extends Point {
  size: number
}

export interface HitTestResult extends Point {
  entitiesThere: Entity[]
  hits: Hit[]
  topLayer: CollisionLayer
}

export interface Move extends HitTestResult {
  valid: boolean
}

// I think I've used inheritance too much here, it becomes hard to reason about.
// I should favor composition more.
// I also want to move the game logic to use a whole view of a temporary game state,
// instead of adding exceptions to the current state to account for hypothetical updates.
// I have a lot of refactoring to do.

// This is somewhat redundant with HitTestResult for now, while refactoring.
// I'm thinking of using an array of hits instead of an array of entities, maybe instead of HitTestResult,
// in order to return snake segment indices so the level editor can drag snakes by any part.
export interface Hit {
  entity: Entity
  segmentIndex?: number
  layer: CollisionLayer
}

export const DIRECTIONS = [
  { x: 1, y: 0 },
  { x: 0, y: 1 },
  { x: -1, y: 0 },
  { x: 0, y: -1 },
]
