import type Entity from "./entity"
import type Snake from "./snake"

export enum ControlScheme {
  KeyboardAbsoluteDirection = "KeyboardAbsoluteDirection",
  KeyboardFacingRelative = "KeyboardFacingRelative",
  Gamepad = "Gamepad",
  Pointer = "Pointer", // mouse/pen/touch
}

export enum CollisionLayer {
  None = 0,
  White = 1,
  Black = 2,
  Both = 3, // = 1 | 2
}

export interface ParsedGameState {
  format: string
  formatVersion: number
  levelInfo: {
    width: number
    height: number
  }
  entities: Entity[]
  entityTypes: string[]
  activePlayerEntityIndex: number
  levelId?: string
  levelSessionId?: number
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
  width: number
  height: number
}

export type MoveInput = 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight' | { click: Tile }

export interface Move {
  // snakeId: string
  snake: Snake,
  to: Tile
  delta: Point
  valid: boolean
  encumbered: boolean
  entitiesThere: Entity[]
  entitiesToPush: Entity[]
}

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
