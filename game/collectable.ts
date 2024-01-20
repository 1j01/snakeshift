import Entity from "./entity"
import { CollisionLayer } from "./types"

export class Collectable extends Entity {
  static readonly SIZE = 0.2
  solid = false

  constructor(
    public x = 0,
    public y = 0,
    public size = 1,
    public layer = CollisionLayer.White,
  ) {
    super()
  }

  // TODO: DRY with Block, such as with a base class BoxyEntity
  at(x: number, y: number): CollisionLayer {
    if (x >= this.x && x < this.x + this.size && y >= this.y && y < this.y + this.size) {
      return this.layer
    }
    return CollisionLayer.None
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save()
    ctx.lineWidth = 0.1
    ctx.strokeStyle = this.layer === CollisionLayer.White ? '#000' : '#fff'
    ctx.fillStyle = this.layer === CollisionLayer.White ? '#fff' : '#000'
    ctx.translate(this.x, this.y)
    ctx.scale(this.size, this.size)
    ctx.translate(1 / 2, 1 / 2)
    ctx.rotate(Math.PI / 4)
    ctx.beginPath()
    ctx.rect(-Collectable.SIZE / 2, -Collectable.SIZE / 2, Collectable.SIZE, Collectable.SIZE)
    ctx.stroke()
    ctx.fill()
    ctx.restore()
  }
}
