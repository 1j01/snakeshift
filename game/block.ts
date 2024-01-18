import Entity from "./entity"
import { CollisionLayer } from "./types"

export class Block extends Entity {
  static readonly BASE_SIZE = 10
  constructor(
    public x: number,
    public y: number,
    public size = Block.BASE_SIZE,
    public layer: CollisionLayer,
  ) {
    super()
  }

  at(x: number, y: number): CollisionLayer {
    if (x >= this.x && x < this.x + this.size && y >= this.y && y < this.y + this.size) {
      return this.layer
    }
    return CollisionLayer.None
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = this.layer === CollisionLayer.White ? '#fff' : '#000'
    ctx.fillRect(this.x, this.y, this.size, this.size)
  }
}
