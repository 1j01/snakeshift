import { Block } from "./block"
import { Collectable } from "./collectable"
import Entity from "./entity"
import { entities } from "./game-state"
import { CollisionLayer, HitTestResult, Move, Tile } from "./types"

interface SnakeSegment extends Tile {
  layer: CollisionLayer
}

export default class Snake extends Entity {
  // When adding new properties, remember to update toJSON()!
  public segments: SnakeSegment[] = []
  public id: string = crypto.randomUUID()
  public growOnNextMove = false

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
      growOnNextMove: this.growOnNextMove,
    }
  }
  highlight(): void {
    this._highlightTime = performance.now()
  }
  draw(ctx: CanvasRenderingContext2D): void {
    // body
    this._drawBodyPath(ctx, (segment) => {
      ctx.fillStyle = segment.layer === CollisionLayer.White ? '#fff' : '#000'
      ctx.fill()
    })
  }
  draw2(ctx: CanvasRenderingContext2D): void {
    // eye and tongue
    // Tongue should always go on top of other snakes.
    this._drawHeadDetails(ctx)
    // Restful outlines for general clarity
    this._drawBodyOutline(ctx, (highlightCtx, segment, transform) => {
      // highlightCtx.setLineDash([0.1, 0.2])
      highlightCtx.strokeStyle = segment.layer === CollisionLayer.White ? '#fff' : '#000'
      highlightCtx.lineWidth = Math.min(0.6, Math.max(0.1, 2 / transform.a)) * 2
      highlightCtx.stroke()
    })
    this._drawBodyOutline(ctx, (highlightCtx, segment, transform) => {
      // highlightCtx.setLineDash([0.1, 0.2])
      highlightCtx.strokeStyle = segment.layer === CollisionLayer.White ? '#000' : '#fff'
      highlightCtx.lineWidth = Math.min(0.6, Math.max(0.1, 2 / transform.a))
      highlightCtx.stroke()
    })
  }
  draw3(ctx: CanvasRenderingContext2D): void {
    // control switching highlight
    const msSinceHighlight = performance.now() - this._highlightTime
    const highlight = Math.min(1, Math.max(0, 1 - msSinceHighlight / Snake.HIGHLIGHT_DURATION))
    if (highlight > 0) {
      this._drawBodyOutline(ctx, (highlightCtx, segment, transform) => {
        highlightCtx.strokeStyle = `hsl(40, 100%, 50%)`
        highlightCtx.lineWidth = Math.min(1, Math.max(0.2, 10 / transform.a))
        highlightCtx.stroke()
      }, (highlightCtx, transform) => {
        // Reduce opacity as highlight fades
        // This is a separate step in order to avoid greater opacity where the highlight overlaps itself.
        highlightCtx.resetTransform()
        highlightCtx.globalCompositeOperation = 'destination-out'
        highlightCtx.globalAlpha = 1 - highlight
        highlightCtx.fillStyle = "#fff"
        highlightCtx.fillRect(0, 0, highlightCtx.canvas.width, highlightCtx.canvas.height)
        highlightCtx.setTransform(transform)
        highlightCtx.globalAlpha = 1
      })
    }
  }
  private _drawBodyOutline(
    ctx: CanvasRenderingContext2D,
    drawSegment: (ctx: CanvasRenderingContext2D, segment: SnakeSegment, transform: DOMMatrix) => void,
    postDraw?: (ctx: CanvasRenderingContext2D, transform: DOMMatrix) => void,
  ): void {
    const transform = ctx.getTransform()
    this._highlightCanvas.width = ctx.canvas.width
    this._highlightCanvas.height = ctx.canvas.height
    const highlightCtx = this._highlightCanvas.getContext('2d')!
    highlightCtx.save()
    highlightCtx.clearRect(0, 0, highlightCtx.canvas.width, highlightCtx.canvas.height)
    highlightCtx.lineJoin = "round"
    highlightCtx.lineCap = "round"
    highlightCtx.setTransform(transform)
    this._drawBodyPath(highlightCtx, (segment) => {
      drawSegment(highlightCtx, segment, transform)
    })
    postDraw?.(highlightCtx, transform)

    // Cut out the snake's fill, leaving a clean outline.
    highlightCtx.globalCompositeOperation = 'destination-out'
    this._drawBodyPath(highlightCtx, () => {
      highlightCtx.fill()
    })
    highlightCtx.restore()
    ctx.resetTransform()
    ctx.drawImage(this._highlightCanvas, 0, 0)
    ctx.setTransform(transform)

  }
  private _drawHeadDetails(ctx: CanvasRenderingContext2D): void {
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
    const msSinceHighlight = performance.now() - this._highlightTime
    const highlight = Math.min(1, Math.max(0, 1 - msSinceHighlight / Snake.HIGHLIGHT_DURATION))
    ctx.beginPath()
    ctx.translate(-1 / 2, 0)
    ctx.scale(Math.pow(Math.sin(highlight), 0.2), 1)
    ctx.rotate(Math.sin(performance.now() / 50) * Math.PI / 8)
    ctx.moveTo(0, 0)
    ctx.translate(-0.5, 0)
    ctx.lineTo(0, 0)
    ctx.rotate(Math.sin(performance.now() / 50 - 1.5) * Math.PI / 8)
    ctx.lineTo(-0.4, -0.2)
    ctx.lineTo(0, 0)
    ctx.lineTo(-0.4, 0.2)
    ctx.strokeStyle = '#fff'
    ctx.globalCompositeOperation = 'exclusion'
    ctx.lineWidth = 1 / 12
    ctx.stroke()

    ctx.restore()
  }
  private _drawBodyPath(ctx: CanvasRenderingContext2D, draw: (segment: SnakeSegment) => void): void {
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
        // ctx.moveTo(-1 / 2, -1 / 2)
        // ctx.quadraticCurveTo(1.7, 0, -1 / 2, 1 / 2)
        // double quadratic tapered tail
        // - smooth join to body
        // - adjustable to be fatter for logical clarity or pointier for aesthetics
        ctx.moveTo(-1 / 2, -1 / 2)
        const extent = .5
        const pointiness = 0
        ctx.quadraticCurveTo(extent * (1 - pointiness), -1 / 2, extent, 0)
        ctx.quadraticCurveTo(extent * (1 - pointiness), 1 / 2, -1 / 2, 1 / 2)
        ctx.closePath()
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
    const ahead = this._hitTestAllEntities(x, y, this.growOnNextMove)
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
    if (this.growOnNextMove) {
      this.grow()
      this.growOnNextMove = false
    }
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
        this.growOnNextMove = true
      }
    }
  }
  grow(): void {
    const tail = this.segments[this.segments.length - 1]
    // This only works because SnakeSegment is a flat object.
    const newTail = { ...tail }
    this.segments.push(newTail)
  }
}
