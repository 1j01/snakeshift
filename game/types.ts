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
  topLayer: CollisionLayer
}

export interface Move extends HitTestResult {
  valid: boolean
}
