import { RectangularEntity } from "./rectangular-entity"
import { CollisionLayer } from "./types"

export class CellularAutomata extends RectangularEntity {
  draw(ctx: CanvasRenderingContext2D) {
    ctx.save()
    ctx.translate(this.x + this.width / 2, this.y + this.height / 2)
    ctx.scale(this.width, this.height)
    ctx.fillStyle = this.layer === CollisionLayer.White ? '#fff' : '#000'
    ctx.strokeStyle = this.layer === CollisionLayer.White ? '#fff' : '#000'
    ctx.lineWidth = 0.2
    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'
    ctx.beginPath()
    const t = performance.now() / 1000 + this.x * 0.3 + this.y * 0.3
    const n = 8
    for (let i = 0; i < n; i++) {
      const isCorner = i % 2 === 0
      const out = Math.sin(t) * (isCorner ? 0.1 : 0.02) + 0.6
      // const out = Math.sin(t + Math.PI * i / n) * 0.1 + 0.6
      const along = Math.cos(t) * 0.05 + 0.2
      const lobeThickness = Math.sin(t + Math.PI * i / n) * 0.1 + 0.5
      ctx.rotate(Math.PI * 2 / n)
      ctx.moveTo(0, 0)
      ctx.bezierCurveTo(
        out, 0,
        out + lobeThickness, along,
        out, along
      )
      ctx.bezierCurveTo(
        out, along,
        out, along + lobeThickness,
        0, along
      )
    }
    ctx.closePath()
    ctx.fill()
    // ctx.stroke()
    ctx.restore()
  }
}
