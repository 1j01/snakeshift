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
  width: number
  height: number
}

export interface Move {
  to: Tile
  valid: boolean
  entitiesThere: Entity[]
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
