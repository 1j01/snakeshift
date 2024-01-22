import { Collectable } from "./collectable"
import Entity from "./entity"
import { entities } from "./game-state"
import { hitTestAllEntities } from "./helpers"
import { CollisionLayer, Hit, Move, Tile } from "./types"

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
    for (let i = 0; i < 10; i++) {
      this.segments.push({ x: i, y: 0, size: 1, layer: CollisionLayer.White })
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
    this._bodyPath(ctx)
    ctx.fillStyle = this.segments[0].layer === CollisionLayer.White ? '#fff' : '#000'
    ctx.fill()
  }
  draw2(ctx: CanvasRenderingContext2D): void {
    // eye and tongue
    // Tongue should always go on top of other snakes.
    this._drawHeadDetails(ctx)
    // Restful outlines for general clarity
    this._drawBodyOutline(ctx, (highlightCtx, transform) => {
      // highlightCtx.setLineDash([0.1, 0.2])
      highlightCtx.strokeStyle = this.segments[0].layer === CollisionLayer.White ? '#fff' : '#000'
      highlightCtx.lineWidth = Math.min(0.6, Math.max(0.1, 2 / transform.a)) * 2
      highlightCtx.stroke()
    })
    this._drawBodyOutline(ctx, (highlightCtx, transform) => {
      // highlightCtx.setLineDash([0.1, 0.2])
      highlightCtx.strokeStyle = this.segments[0].layer === CollisionLayer.White ? '#000' : '#fff'
      highlightCtx.lineWidth = Math.min(0.6, Math.max(0.1, 2 / transform.a))
      highlightCtx.stroke()
    })
  }
  draw3(ctx: CanvasRenderingContext2D): void {
    // control switching highlight
    const msSinceHighlight = performance.now() - this._highlightTime
    const highlight = Math.min(1, Math.max(0, 1 - msSinceHighlight / Snake.HIGHLIGHT_DURATION))
    if (highlight > 0) {
      this._drawBodyOutline(ctx, (highlightCtx, transform) => {
        highlightCtx.strokeStyle = `hsl(40, 100%, 50%)`
        highlightCtx.lineWidth = Math.min(1, Math.max(0.2, 10 / transform.a))
        highlightCtx.stroke()
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
    draw: (ctx: CanvasRenderingContext2D, transform: DOMMatrix) => void,
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
    this._bodyPath(highlightCtx)
    draw(highlightCtx, transform)

    // Cut out the snake's fill, leaving a clean outline.
    highlightCtx.globalCompositeOperation = 'destination-out'
    this._bodyPath(highlightCtx)
    highlightCtx.fill()
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
    if (highlight > 0) {
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
    }

    ctx.restore()
  }
  private _bodyPath(ctx: CanvasRenderingContext2D): void {
    ctx.beginPath()
    const backtrack: ({ matrix: DOMMatrix, draw: () => void })[] = []
    function mirrored(draw: () => void) {
      draw()
      backtrack.push({
        matrix: ctx.getTransform(),
        draw() {
          ctx.scale(1, -1)
          draw()
        }
      })
    }
    for (let i = 0; i < this.segments.length; i++) {
      const segment = this.segments[i]
      ctx.save()
      ctx.translate(segment.x + segment.size / 2, segment.y + segment.size / 2)
      const backAngle = Math.atan2(this.segments[i + 1]?.y - segment.y, this.segments[i + 1]?.x - segment.x)
      const foreAngle = Math.atan2(segment.y - this.segments[i - 1]?.y, segment.x - this.segments[i - 1]?.x)

      if (i === 0) {
        // head
        ctx.rotate(backAngle)
        ctx.scale(1, 0.9)
        // ctx.moveTo(1 / 2, 1 / 2)
        mirrored(() => ctx.lineTo(1 / 2, 1 / 2))
        ctx.arc(0, 0, 1 / 2, Math.PI / 2, -Math.PI / 2)
        ctx.lineTo(1 / 2, -1 / 2)
        ctx.lineTo(1 / 2, 1 / 2)
        // eye and tongue are drawn separately
        // If the eye was rendered as a hole in the head, then
        // when two snake heads overlapped, the eye would be invisible.
      } else if (i === this.segments.length - 1) {
        // tail
        ctx.rotate(foreAngle)
        ctx.scale(1, 0.9)
        ctx.lineTo(-1 / 2, -1 / 2)
        const extent = .5
        const pointiness = 0
        ctx.quadraticCurveTo(extent * (1 - pointiness), -1 / 2, extent, 0)
        ctx.quadraticCurveTo(extent * (1 - pointiness), 1 / 2, -1 / 2, 1 / 2)
      } else {
        // body
        ctx.rotate(foreAngle)
        ctx.scale(1, 0.9)
        mirrored(() => ctx.lineTo(-1 / 2, -1 / 2))
        mirrored(() => ctx.lineTo(1 / 2, -1 / 2))
      }
      ctx.restore()
    }
    const transform = ctx.getTransform()
    for (let i = backtrack.length - 1; i >= 0; i--) {
      ctx.setTransform(backtrack[i].matrix)
      backtrack[i].draw()
    }
    ctx.closePath()
    ctx.setTransform(transform)
  }
  at(x: number, y: number, includeHead = true, includeTail = true): Hit | null {
    for (let i = (includeHead ? 0 : 1); i < this.segments.length - (includeTail ? 0 : 1); i++) {
      const segment = this.segments[i]
      if (x === segment.x && y === segment.y) {
        return { entity: this, layer: segment.layer, segmentIndex: i }
      }
    }
    return null
  }
  analyzeMoveAbsolute(tile: Tile): Move {
    // Using Math.sign() here would lead to checking if moving to an adjacent tile is valid,
    // even when a further tile is in question.
    // const dirX = Math.sign(tile.x - this.segments[0].x)
    // const dirY = Math.sign(tile.y - this.segments[0].y)
    const deltaGridX = Math.round(tile.x - this.segments[0].x)
    const deltaGridY = Math.round(tile.y - this.segments[0].y)
    return this.analyzeMoveRelative(deltaGridX, deltaGridY)
  }
  analyzeMoveRelative(dirX: number, dirY: number): Move {
    const head = this.segments[0]
    const tail = this.segments[this.segments.length - 1]
    const deltaX = dirX * head.size
    const deltaY = dirY * head.size
    const x = head.x + deltaX
    const y = head.y + deltaY
    const ahead = hitTestAllEntities(x, y, { ignoreTailOfSnake: this.growOnNextMove ? undefined : this })
    const trail = hitTestAllEntities(tail.x, tail.y)
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
      valid:
        (dirX === 0 || dirY === 0) &&
        (Math.abs(dirX) === 1 || Math.abs(dirY) === 1) &&
        ahead.topLayer !== head.layer &&
        trail.topLayer === head.layer,
      x,
      y,
      entitiesThere: ahead.entitiesThere,
      hits: ahead.hits,
      topLayer: ahead.topLayer,
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
    // Exclude non-solid collectables, since, if you don't eat them (because they're a different color),
    // they should stay visible.
    // (Collectables are automatically sorted on top at level design time.)
    const ontoIndices = move.entitiesThere.filter(e => e.solid).map(e => entities.indexOf(e))
    const maxIndex = Math.max(...ontoIndices)
    const thisIndex = entities.indexOf(this)
    if (thisIndex < maxIndex) {
      // Add before removing so relevant indices
      // stay valid for both splice calls.
      entities.splice(maxIndex + 1, 0, this)
      entities.splice(thisIndex, 1)
    }
    // Eat collectables
    for (const entity of move.entitiesThere) {
      if (entity instanceof Collectable && entity.layer === head.layer) {
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
