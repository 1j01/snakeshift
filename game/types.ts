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

export interface Point {
  x: number
  y: number
}

export interface Tile extends Point {
  size: number
}

export interface Move extends Point {
  valid: boolean
}
