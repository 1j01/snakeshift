import { Block } from "./block"
import Entity from "./entity"
import { entities } from "./game-state"
import { CollisionLayer, Move, Tile } from "./types"

interface SnakeSegment extends Tile {
  layer: CollisionLayer
}

export default class Snake extends Entity {
  public segments: SnakeSegment[] = []
  private _highlightTime = -Infinity
  static readonly HIGHLIGHT_DURATION = 500
  constructor() {
    super()
    const size = Block.BASE_SIZE
    for (let i = 0; i < 10; i++) {
      this.segments.push({ x: i * size, y: 0, size, layer: CollisionLayer.White })
    }
  }
  highlight(): void {
    this._highlightTime = performance.now()
  }
  draw(ctx: CanvasRenderingContext2D): void {
    const msSinceHighlight = performance.now() - this._highlightTime
    const highlight = Math.min(1, Math.max(0, 1 - msSinceHighlight / Snake.HIGHLIGHT_DURATION))
    for (let i = 0; i < this.segments.length; i++) {
      const segment = this.segments[i]
      // ctx.fillStyle = 'hsl(' + (i / this.segments.length * 360) + ', 100%, 50%)'
      ctx.fillStyle = segment.layer === CollisionLayer.White ? '#fff' : '#000'
      ctx.strokeStyle = "hsla(40, 100%, 50%, " + (highlight * 0.5) + ")"
      ctx.lineWidth = 1
      ctx.lineJoin = "round"
      ctx.lineCap = "round"
      ctx.save()
      ctx.translate(segment.x + segment.size / 2, segment.y + segment.size / 2)
      ctx.scale(segment.size, segment.size)
      const angle = i === 0 ?
        Math.atan2(this.segments[1].y - segment.y, this.segments[1].x - segment.x) :
        Math.atan2(segment.y - this.segments[i - 1].y, segment.x - this.segments[i - 1].x)
      ctx.rotate(angle)
      ctx.beginPath()
      if (i === 0) {
        // round head
        ctx.arc(0, 0, 1 / 2, Math.PI / 2, -Math.PI / 2)
        ctx.lineTo(1 / 2, -1 / 2)
        ctx.lineTo(1 / 2, 1 / 2)
        // eye
        const eyeRadius = 1 / 7
        ctx.moveTo(eyeRadius, 0)
        ctx.arc(0, 0, eyeRadius, 0, Math.PI * 2, true)
      } else if (i === this.segments.length - 1) {
        // triangle tail
        ctx.moveTo(-1 / 2, -1 / 2)
        ctx.lineTo(1 / 2, 0)
        ctx.lineTo(-1 / 2, 1 / 2)
      } else {
        ctx.rect(-1 / 2, -1 / 2, 1, 1)
      }
      ctx.fill()
      ctx.stroke()
      ctx.restore()
    }
  }
  at(x: number, y: number, includeHead = true, includeTail = true): CollisionLayer {
    for (let i = (includeHead ? 0 : 1); i < this.segments.length - (includeTail ? 0 : 1); i++) {
      const segment = this.segments[i]
      if (x === segment.x && y === segment.y) {
        return segment.layer
      }
    }
    return CollisionLayer.None
  }
  analyzeMove(dirX: number, dirY: number): Move {
    const head = this.segments[0]
    const deltaX = dirX * head.size
    const deltaY = dirY * head.size
    const x = head.x + deltaX
    const y = head.y + deltaY
    let foremost = CollisionLayer.Black
    const entitiesThere: Entity[] = []
    for (const entity of entities) {
      if (entity instanceof Snake) {
        // This snake's tail will be leaving the space, so ignore it
        // but don't ignore any other snake's tail.
        const there = entity.at(x, y, true, entity !== this)
        if (there) {
          foremost = there
          entitiesThere.push(entity)
        }
      } else if (entity.at) {
        const there = entity.at(x, y)
        if (there) {
          foremost = there
          entitiesThere.push(entity)
        }
      }
    }
    return {
      x,
      y,
      entitiesThere,
      valid: foremost !== head.layer
    }
  }
  takeMove(move: Move): void {
    const head = this.segments[0]
    for (let i = this.segments.length - 1; i > 0; i--) {
      const segment = this.segments[i]
      const prev = this.segments[i - 1]
      segment.x = prev.x
      segment.y = prev.y
    }
    head.x = move.x
    head.y = move.y
    // Sort entities so this is on top of anything it's moving onto.
    // This handles the visual as well as making it so
    // you can't double back while inside an inverse snake.
    const ontoIndices = move.entitiesThere.map(e => entities.indexOf(e))
    const maxIndex = Math.max(...ontoIndices)
    const thisIndex = entities.indexOf(this)
    if (thisIndex < maxIndex) {
      // Add before removing so relevant indices
      // stay valid for both splice calls.
      entities.splice(maxIndex + 1, 0, this)
      entities.splice(thisIndex, 1)
    }
  }
}
