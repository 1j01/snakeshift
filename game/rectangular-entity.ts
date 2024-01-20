import Entity from "./entity"
import { CollisionLayer } from "./types"

export class RectangularEntity extends Entity {
  constructor(
    public x = 0,
    public y = 0,
    public size = 1,
    public layer = CollisionLayer.White,
  ) {
    super()
  }

  at(x: number, y: number): CollisionLayer {
    if (x >= this.x && x < this.x + this.size && y >= this.y && y < this.y + this.size) {
      return this.layer
    }
    return CollisionLayer.None
  }

  // used as-is by Block, but here as a placeholder for new entities
  draw(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = this.layer === CollisionLayer.White ? '#fff' : '#000'
    ctx.fillRect(this.x, this.y, this.size, this.size)
  }
}
