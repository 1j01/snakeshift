import Entity from "./entity"
import { Tile } from "./types"

export default class Snake extends Entity {
  public segments: Tile[] = []
  constructor() {
    super()
    const size = 10
    for (let i = 0; i < 10; i++) {
      this.segments.push({ x: i * size, y: 0, size })
    }
  }
  draw(ctx: CanvasRenderingContext2D): void {
    for (let i = 0; i < this.segments.length; i++) {
      const segment = this.segments[i]
      ctx.fillStyle = 'hsl(' + (i / this.segments.length * 360) + ', 100%, 50%)'
      ctx.save()
      ctx.translate(segment.x + segment.size / 2, segment.y + segment.size / 2)
      ctx.scale(segment.size, segment.size)
      const angle = i === 0 ?
        Math.atan2(this.segments[1].y - segment.y, this.segments[1].x - segment.x) :
        Math.atan2(segment.y - this.segments[i - 1].y, segment.x - this.segments[i - 1].x)
      ctx.rotate(angle)
      if (i === 0) {
        // round head
        ctx.beginPath()
        ctx.arc(0, 0, 1 / 2, Math.PI / 2, -Math.PI / 2)
        ctx.lineTo(1 / 2, -1 / 2)
        ctx.lineTo(1 / 2, 1 / 2)
        ctx.fill()
      } else if (i === this.segments.length - 1) {
        // triangle tail
        ctx.beginPath()
        ctx.moveTo(-1 / 2, -1 / 2)
        ctx.lineTo(1 / 2, 0)
        ctx.lineTo(-1 / 2, 1 / 2)
        ctx.fill()
      } else {
        ctx.fillRect(-1 / 2, -1 / 2, 1, 1)
      }
      ctx.restore()
    }
  }
  canMove(dirX: number, dirY: number): boolean {
    const deltaX = dirX * this.segments[0].size
    const deltaY = dirY * this.segments[0].size
    const head = this.segments[0]
    // skipping head, so you can move at all
    // skipping tail, so moving into it is ok
    for (let i = 1; i < this.segments.length - 1; i++) {
      const segment = this.segments[i]
      if (head.x + deltaX === segment.x && head.y + deltaY === segment.y) {
        return false
      }
    }
    return true
  }
  move(dirX: number, dirY: number): void {
    const deltaX = dirX * this.segments[0].size
    const deltaY = dirY * this.segments[0].size
    for (let i = this.segments.length - 1; i > 0; i--) {
      const segment = this.segments[i]
      const prev = this.segments[i - 1]
      segment.x = prev.x
      segment.y = prev.y
    }
    const head = this.segments[0]
    head.x += deltaX
    head.y += deltaY
  }
}
