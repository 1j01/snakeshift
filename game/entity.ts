import { Hit } from "./types"

export default class Entity {
  draw?(ctx: CanvasRenderingContext2D): void
  draw2?(ctx: CanvasRenderingContext2D): void
  draw3?(ctx: CanvasRenderingContext2D): void
  step?(time: number): void
  at?(x: number, y: number): Hit | null
  fromJSON(json: object): void {
    Object.assign(this, json)
  }
  solid = true
}
