import Entity from "./entity"
import { entities } from "./game-state"
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
  occupying(x: number, y: number, includeHead = true, includeTail = true): boolean {
    for (let i = (includeHead ? 0 : 1); i < this.segments.length - (includeTail ? 0 : 1); i++) {
      const segment = this.segments[i]
      if (x === segment.x && y === segment.y) {
        return true
      }
    }
    return false
  }
  canMove(dirX: number, dirY: number): boolean {
    const head = this.segments[0]
    const deltaX = dirX * head.size
    const deltaY = dirY * head.size
    const x = head.x + deltaX
    const y = head.y + deltaY
    for (const entity of entities) {
      if (entity instanceof Snake) {
        // This snake's tail will be leaving the space, so ignore it
        // but don't ignore any other snake's tail.
        if (entity.occupying(x, y, true, entity !== this)) {
          return false
        }
      }
    }
    return true
  }
  move(dirX: number, dirY: number): void {
    const head = this.segments[0]
    const deltaX = dirX * head.size
    const deltaY = dirY * head.size
    for (let i = this.segments.length - 1; i > 0; i--) {
      const segment = this.segments[i]
      const prev = this.segments[i - 1]
      segment.x = prev.x
      segment.y = prev.y
    }
    head.x += deltaX
    head.y += deltaY
  }
}
