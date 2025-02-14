import { RectangularEntity } from "./rectangular-entity"
import { CollisionLayer } from "./types"

/** AKA: collectibles, pickups, pick-ups, tokens, items, perhaps power-ups */
export class Collectable extends RectangularEntity {
  static readonly VISUAL_SIZE: number = 0.5

  solid = false

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save()
    ctx.lineWidth = 0.1
    ctx.strokeStyle = this.layer === CollisionLayer.White ? '#000' : '#fff'
    ctx.fillStyle = this.layer === CollisionLayer.White ? '#fff' : '#000'
    ctx.translate(this.x, this.y)
    ctx.scale(this.width, this.height)
    ctx.translate(1 / 2, 1 / 2)
    ctx.beginPath()
    ctx.arc(0, 0, Collectable.VISUAL_SIZE / 2, 0, Math.PI * 2)
    ctx.stroke()
    ctx.fill()
    ctx.restore()
  }
}
