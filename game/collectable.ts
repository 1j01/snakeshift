import { Block } from "./block"
import Entity from "./entity"
import { CollisionLayer } from "./types"

export class Collectable extends Entity {
  static readonly SIZE = 0.2
  constructor(
    public x = 0,
    public y = 0,
    public size = Block.BASE_SIZE,
    public layer = CollisionLayer.White,
  ) {
    super()
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save()
    ctx.fillStyle = this.layer === CollisionLayer.White ? '#fff' : '#000'
    ctx.translate(this.x, this.y)
    ctx.scale(this.size, this.size)
    ctx.translate(1 / 2, 1 / 2)
    ctx.rotate(Math.PI / 4)
    ctx.fillRect(-Collectable.SIZE / 2, -Collectable.SIZE / 2, Collectable.SIZE, Collectable.SIZE)
    ctx.restore()
  }
}
