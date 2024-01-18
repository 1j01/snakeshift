import Entity from "./entity"

export enum ControlScheme {
  KeyboardAbsoluteDirection,
  KeyboardFacingRelative,
  Gamepad,
  Pointer, // mouse/pen/touch
}

export interface GameState {
  controlScheme: ControlScheme
  entities: Entity[]
}

export interface Point {
  x: number
  y: number
}

export interface Tile extends Point {
  size: number
}
