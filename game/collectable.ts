import { RectangularEntity } from "./rectangular-entity"
import { CollisionLayer } from "./types"

export class Collectable extends RectangularEntity {
  static readonly VISUAL_SIZE = 0.8

  solid = false

  #time = 0

  step(time: number): void { // weird that this isn't a delta
    this.#time = time
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save()
    ctx.lineWidth = 0.1
    ctx.strokeStyle = this.layer === CollisionLayer.White ? '#000' : '#fff'
    ctx.fillStyle = this.layer === CollisionLayer.White ? '#fff' : '#000'
    ctx.translate(this.x, this.y)
    ctx.scale(this.width, this.height)
    ctx.translate(1 / 2, 1 / 2)
    ctx.rotate(Math.sin(this.#time / 1000 + this.x / 10 + this.y / 10) * Math.PI / 12)
    ctx.beginPath()
    ctx.moveTo(0, -Collectable.VISUAL_SIZE / 2)
    for (let i = 0; i < 4; i++) {
      ctx.rotate(Math.PI / 2)
      ctx.quadraticCurveTo(0, 0, 0, -Collectable.VISUAL_SIZE / 2)
    }
    ctx.stroke()
    ctx.fill()
    ctx.restore()
  }
}
