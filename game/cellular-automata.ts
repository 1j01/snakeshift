import { RectangularEntity } from "./rectangular-entity"
import { CollisionLayer } from "./types"

const basePoints = [
  { x: 0, y: 0 },
  { x: 1, y: 0 },
  { x: 1, y: 1 },
  { x: 0, y: 1 },
]
const basePoints2 = subdivide(basePoints).map((point, index, array) => lerpPoints(
  point,
  {
    x: Math.sin((index + 3) * -Math.PI * 2 / array.length) * 0.5 + 0.5,
    y: Math.cos((index + 3) * -Math.PI * 2 / array.length) * 0.5 + 0.5,
  },
  0.5
))

function lerpPoints(pointA: { x: number, y: number }, pointB: { x: number, y: number }, t: number) {
  return {
    x: pointA.x + (pointB.x - pointA.x) * t,
    y: pointA.y + (pointB.y - pointA.y) * t,
  }
}

function subdivide(points: { x: number, y: number }[]): { x: number, y: number }[] {
  const newPoints = []
  for (let i = 0; i < points.length; i++) {
    const point = points[i]
    const nextPoint = points[(i + 1) % points.length]
    newPoints.push(point)
    newPoints.push({ x: (point.x + nextPoint.x) / 2, y: (point.y + nextPoint.y) / 2 })
  }
  return newPoints
}

export class CellularAutomata extends RectangularEntity {
  draw(ctx: CanvasRenderingContext2D) {
    ctx.save()
    ctx.translate(this.x, this.y)
    ctx.scale(this.width, this.height)
    ctx.fillStyle = this.layer === CollisionLayer.White ? '#fff' : '#000'
    ctx.beginPath()
    const t = performance.now() / 1000 + this.x * 0.3 + this.y * 0.3
    for (let i = 0; i < basePoints2.length; i++) {
      const out = Math.sin(t) * 0.3
      // const out = Math.sin(t + Math.PI * i / basePoints2.length) * 0.1
      const along = Math.cos(t) * 0.1
      const point = basePoints2[i]
      const nextPoint = basePoints2[(i + 1) % basePoints2.length]
      // Difference vector
      const dx = nextPoint.x - point.x
      const dy = nextPoint.y - point.y
      // Normal (perpendicular vector)
      const len = Math.sqrt(dx * dx + dy * dy)
      const nx = -dy / len
      const ny = dx / len

      ctx.lineTo(point.x, point.y)
      // ctx.lineTo(
      //   point.x + dx * along + nx * out,
      //   point.y + dy * along + ny * out,
      // )
      // ctx.lineTo(point.x + nx * out, point.y + ny * out)
      ctx.bezierCurveTo(
        point.x + dx * along + nx * out,
        point.y + dy * along + ny * out,
        nextPoint.x - dx * along - nx * out,
        nextPoint.y - dy * along - ny * out,
        nextPoint.x,
        nextPoint.y
      )
    }
    ctx.closePath()
    ctx.fill()
    ctx.restore()
  }
}
