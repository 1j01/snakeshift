
export default class Entity {
  draw?(ctx: CanvasRenderingContext2D): void
  step?(time: number): void
}
