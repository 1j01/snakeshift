import { RectangularEntity } from "./rectangular-entity"
import { CollisionLayer } from "./types"

export class Collectable extends RectangularEntity {
  static readonly VISUAL_SIZE = 0.2

  solid = false

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
    // Don't use scale() as it will scale the stroke width
    ctx.rect(-Collectable.VISUAL_SIZE / 2, -Collectable.VISUAL_SIZE / 2, Collectable.VISUAL_SIZE, Collectable.VISUAL_SIZE)
    ctx.stroke()
    ctx.fill()
    ctx.restore()
  }
}
