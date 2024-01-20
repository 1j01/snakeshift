import { RectangularEntity } from "./rectangular-entity"
import { CollisionLayer } from "./types"

export class Crate extends RectangularEntity {
  draw(ctx: CanvasRenderingContext2D) {
    ctx.save()
    ctx.lineWidth = 0.1
    ctx.strokeStyle = this.layer === CollisionLayer.White ? '#fff' : '#000'
    ctx.fillStyle = this.layer === CollisionLayer.White ? '#fff' : '#000'
    ctx.beginPath()
    ctx.rect(this.x, this.y, this.width, this.height)
    ctx.fill()
    ctx.stroke()
    ctx.lineWidth = 0.05
    ctx.strokeStyle = this.layer === CollisionLayer.White ? '#000' : '#fff'
    ctx.stroke()
    ctx.clip()
    ctx.beginPath()
    ctx.moveTo(this.x, this.y)
    ctx.lineTo(this.x + this.width, this.y + this.height)
    ctx.lineWidth = 0.2
    ctx.strokeStyle = this.layer === CollisionLayer.White ? '#000' : '#fff'
    ctx.stroke()
    ctx.lineWidth = 0.1
    ctx.strokeStyle = this.layer === CollisionLayer.White ? '#fff' : '#000'
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(this.x + this.width, this.y)
    ctx.lineTo(this.x, this.y + this.height)
    ctx.lineWidth = 0.2
    ctx.strokeStyle = this.layer === CollisionLayer.White ? '#000' : '#fff'
    ctx.stroke()
    ctx.lineWidth = 0.1
    ctx.strokeStyle = this.layer === CollisionLayer.White ? '#fff' : '#000'
    ctx.stroke()
    ctx.restore()
  }
}
