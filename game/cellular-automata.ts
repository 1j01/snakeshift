import { RectangularEntity } from "./rectangular-entity"
import { CollisionLayer } from "./types"

export class CellularAutomata extends RectangularEntity {
  draw(ctx: CanvasRenderingContext2D) {
    const pixel = 1 / ctx.getTransform().a
    ctx.save()
    ctx.lineWidth = 0.2
    ctx.strokeStyle = this.layer === CollisionLayer.White ? '#fff' : '#000'
    ctx.fillStyle = this.layer === CollisionLayer.White ? '#fff' : '#000'
    ctx.beginPath()
    const inset = 0.1
    const radius = 0.2
    ctx.roundRect(this.x + inset, this.y + inset, this.width - inset * 2 + pixel, this.height - inset * 2 + pixel, radius)
    ctx.fill()
    ctx.stroke()
    ctx.stroke()
    ctx.restore()
  }
}
