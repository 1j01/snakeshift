import { Block } from "./block"
import { Collectable } from "./collectable"
import Entity from "./entity"
import { entities } from "./game-state"
import { CollisionLayer, HitTestResult, Move, Tile } from "./types"

interface SnakeSegment extends Tile {
  layer: CollisionLayer
}

export default class Snake extends Entity {
  public segments: SnakeSegment[] = []
  public id: string = crypto.randomUUID()
  private _highlightTime = -Infinity
  private _highlightCanvas = document.createElement('canvas')
  static readonly HIGHLIGHT_DURATION = 500
  constructor() {
    super()
    const size = Block.BASE_SIZE
    for (let i = 0; i < 10; i++) {
      this.segments.push({ x: i * size, y: 0, size, layer: CollisionLayer.White })
    }
  }
  toJSON(): object {
    // Must exclude _highlightCanvas; by default it will be serialized
    // as an empty object, and will overwrite the canvas when deserialized.
    return {
      id: this.id,
      segments: this.segments,
    }
  }
  highlight(): void {
    this._highlightTime = performance.now()
  }
  drawHighlight(ctx: CanvasRenderingContext2D): void {
    const msSinceHighlight = performance.now() - this._highlightTime
    let highlight = Math.min(1, Math.max(0, 1 - msSinceHighlight / Snake.HIGHLIGHT_DURATION))
    const nonHighlightOutline = highlight === 0
    const transform = ctx.getTransform()
    this._highlightCanvas.width = ctx.canvas.width
    this._highlightCanvas.height = ctx.canvas.height
    const highlightCtx = this._highlightCanvas.getContext('2d')!
    highlightCtx.save()
    highlightCtx.clearRect(0, 0, highlightCtx.canvas.width, highlightCtx.canvas.height)
    highlightCtx.lineJoin = "round"
    highlightCtx.lineCap = "round"
    highlightCtx.setTransform(transform)
    // Focus highlight animation
    highlightCtx.strokeStyle = `hsla(40, 100%, 50%, ${highlight})`
    highlightCtx.lineWidth = Math.min(1, Math.max(0.2, 10 / transform.a))
    this._drawPath(highlightCtx, () => {
      highlightCtx.stroke()
    })
    // Restful outlines for general clarity
    // Draw these outlines underneath the variable-opacity highlight.
    // N.B. This blend mode reverses the draw order!
    highlightCtx.globalCompositeOperation = 'destination-over'
    this._drawPath(highlightCtx, (segment) => {
      highlightCtx.strokeStyle = segment.layer === CollisionLayer.White ? '#000' : '#fff'
      highlightCtx.lineWidth = Math.min(0.6, Math.max(0.1, 2 / transform.a))
      highlightCtx.stroke()
    })
    this._drawPath(highlightCtx, (segment) => {
      highlightCtx.strokeStyle = segment.layer === CollisionLayer.White ? '#fff' : '#000'
      highlightCtx.lineWidth = Math.min(0.6, Math.max(0.1, 2 / transform.a)) * 2
      highlightCtx.stroke()
    })

    // Cut out the snake's fill, leaving a clean outline.
    highlightCtx.globalCompositeOperation = 'destination-out'
    this._drawPath(highlightCtx, () => {
      highlightCtx.fill()
    })
    highlightCtx.restore()
    ctx.resetTransform()
    ctx.drawImage(this._highlightCanvas, 0, 0)
    ctx.setTransform(transform)
  }
  draw(ctx: CanvasRenderingContext2D): void {
    // body
    this._drawPath(ctx, (segment) => {
      ctx.fillStyle = segment.layer === CollisionLayer.White ? '#fff' : '#000'
      ctx.fill()
    })

    const head = this.segments[0]
    ctx.save()
    ctx.translate(head.x + head.size / 2, head.y + head.size / 2)
    ctx.scale(head.size, head.size)
    const angle = Math.atan2(this.segments[1].y - head.y, this.segments[1].x - head.x)
    ctx.rotate(angle)

    // eye
    const eyeRadius = 1 / 7
    ctx.beginPath()
    ctx.moveTo(eyeRadius, 0)
    ctx.arc(0, 0, eyeRadius, 0, Math.PI * 2, true)
    ctx.fillStyle = head.layer === CollisionLayer.White ? '#000' : '#fff'
    ctx.fill()
    // tongue
    // TODO
    // ctx.beginPath()
    // ctx.moveTo(0, 0)
    // ctx.lineTo(-1 / 2, 0)
    // ctx.strokeStyle = '#f00'
    // ctx.lineWidth = 1 / 7
    // ctx.stroke()

    ctx.restore()
  }
  private _drawPath(ctx: CanvasRenderingContext2D, draw: (segment: SnakeSegment) => void): void {
    for (let i = 0; i < this.segments.length; i++) {
      const segment = this.segments[i]
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
        ctx.closePath()
        // eye and tongue are drawn separately
        // If the eye was rendered as a hole in the head, then
        // when two snake heads overlapped, the eye would be invisible.
      } else if (i === this.segments.length - 1) {
        // triangle tail
        // ctx.moveTo(-1 / 2, -1 / 2)
        // ctx.lineTo(1 / 2, 0)
        // ctx.lineTo(-1 / 2, 1 / 2)
        // quadratic tapered tail
        // - smoother, looks better
        // - fatter, makes it clearer what color the space counts as
        ctx.moveTo(-1 / 2, -1 / 2)
        ctx.quadraticCurveTo(1.7, 0, -1 / 2, 1 / 2)
      } else {
        ctx.rect(-1 / 2, -1 / 2, 1, 1)
      }
      draw(segment)
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
    const tail = this.segments[this.segments.length - 1]
    const deltaX = dirX * head.size
    const deltaY = dirY * head.size
    const x = head.x + deltaX
    const y = head.y + deltaY
    const ahead = this._hitTestAllEntities(x, y, false)
    const trail = this._hitTestAllEntities(tail.x, tail.y, true)
    // console.log(ahead, trail)
    // TODO: prevent overlapped snake doubling back on itself
    // I could check if entitiesThere includes this snake,
    // but I don't want to add special cases if I don't need to.
    // Also need to prevent snakes swapping depths...
    // There's also the case where the tail is "supporting/housing"
    // a snake but the tail will be filled with the head within the move;
    // should that allow the move, or should the head/tail seam act as a barrier?
    // I feel like I'd lean towards freedom of movement
    // (but I may be overdoing it on that front in this game design...)
    // Well, you can normally pass through it, so for consistency it should be allowed
    // (unless I go wholely the other way, but that's still less consistent overall, considering sideways entrance/exiting)
    return {
      valid: ahead.topLayer !== head.layer && trail.topLayer === head.layer,
      x,
      y,
      entitiesThere: ahead.entitiesThere,
      topLayer: ahead.topLayer,
    }
  }
  private _hitTestAllEntities(x: number, y: number, includeOwnTail = true): HitTestResult {
    let foremost = CollisionLayer.Black
    const entitiesThere: Entity[] = []
    for (const entity of entities) {
      if (entity instanceof Snake) {
        // This snake's tail may be leaving the space, so ignore it
        // in that case but don't ignore any other snake's tail.
        const there = entity.at(x, y, true, includeOwnTail || entity !== this)
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
      topLayer: foremost,
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
    // Eat collectables
    // Not currently collidable with at() so just checking x/y
    for (const entity of entities) {
      if (
        entity instanceof Collectable &&
        entity.x === move.x &&
        entity.y === move.y
      ) {
        entities.splice(entities.indexOf(entity), 1)
      }
    }
  }
}
