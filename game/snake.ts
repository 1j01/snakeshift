import Entity from "./entity"
import { entities } from "./game-state"
import { selectedEntities } from "./level-editor"
import { CollisionLayer, Hit, Move, Tile } from "./types"

export interface SnakeSegment extends Tile {
  layer: CollisionLayer
}

export default class Snake extends Entity {
  // When adding new properties, remember to update toJSON()!
  public segments: SnakeSegment[] = []
  public fusedSnakeIds = new Set<string>()
  public id: string = crypto.randomUUID()
  public growOnNextMove = false

  private _highlightTime = -Infinity
  private _highlightCanvas = document.createElement('canvas')
  private _melodyIndex = 0
  private _movementPreview: { x: number, y: number } = { x: 0, y: 0 }
  private _movementPreviewHeadRelative: { x: number, y: number } = { x: 0, y: 0 }
  private _movementPreviewHeadRotation = 0
  private _xEyes = false
  static readonly HIGHLIGHT_DURATION = 500
  static DEBUG_SNAKE_DRAGGING = false

  constructor() {
    super()
    for (let i = 0; i < 10; i++) {
      this.segments.push({ x: i, y: 0, width: 1, height: 1, layer: CollisionLayer.White })
    }
  }
  toJSON(): object {
    // Must exclude _highlightCanvas; by default it will be serialized
    // as an empty object, and will overwrite the canvas when deserialized.
    const fusedSnakeIds = Array.from(this.fusedSnakeIds).filter(id => id !== this.id && entities.some(e => e instanceof Snake && e.id === id))
    return {
      id: this.id,
      segments: this.segments,
      growOnNextMove: this.growOnNextMove,
      fusedSnakeIds: fusedSnakeIds.length ? fusedSnakeIds : undefined, // too weird of a feature to include in all level files
    }
  }
  fromJSON(data: object): void {
    const { id, segments, growOnNextMove, fusedSnakeIds } = data as Snake
    this.id = id
    this.segments = segments
    this.growOnNextMove = growOnNextMove
    this.fusedSnakeIds = new Set(fusedSnakeIds ?? [])
  }
  highlight(): void {
    this._highlightTime = performance.now()
  }
  previewMovement(deltaX: number, deltaY: number): void {
    // For touch/mouse control scheme: dynamic animation of stretching the snake until it snaps forwards
    // The idea is to give confidence in when it will move, but this probably isn't enough.
    // Some improvements could be:
    // - squash/stretch
    // - preview the movement closer to being activated: horizontal or vertical, not both
    //   (although perhaps a combination when its not near the threshold where it will take a move, for some fluidity)
    // - animate the whole body path, including the tail
    //   (if the snake had scales, this would have a greater visual impact)
    // - springiness

    this._movementPreview.x = deltaX
    this._movementPreview.y = deltaY
    const movementPreviewAngle = Math.atan2(this._movementPreview.y, this._movementPreview.x)
    const movementPreviewDistance = Math.hypot(this._movementPreview.y, this._movementPreview.x)
    const headAngle = this.segments.length > 1 ? Math.atan2(this.segments[1].y - this.segments[0].y, this.segments[1].x - this.segments[0].x) : Math.PI / 2
    this._movementPreviewHeadRelative = {
      x: Math.cos(movementPreviewAngle - headAngle) * movementPreviewDistance,
      y: Math.sin(movementPreviewAngle - headAngle) * movementPreviewDistance,
    }
    this._movementPreviewHeadRotation = this._movementPreviewHeadRelative.y * -1
  }
  draw(ctx: CanvasRenderingContext2D): void {
    // body
    this._bodyPath(ctx)
    ctx.fillStyle = this.segments[0].layer === CollisionLayer.White ? '#fff' : '#000'
    ctx.fill()
  }
  draw2(ctx: CanvasRenderingContext2D): void {
    const selectedInLevelEditor = selectedEntities.includes(this)
    // eye and tongue
    // Tongue should always go on top of other snakes.
    this._drawHeadDetails(ctx)
    // Restful outlines for general clarity
    this._drawBodyOutline(ctx, (highlightCtx, transform) => {
      // if (selectedInLevelEditor) {
      //   highlightCtx.setLineDash([0.1, 0.2])
      // }
      highlightCtx.strokeStyle = this.segments[0].layer === CollisionLayer.White ? '#fff' : '#000'
      highlightCtx.lineWidth = Math.min(0.6, Math.max(0.1, 2 / transform.a)) * 2
      highlightCtx.stroke()
    })
    this._drawBodyOutline(ctx, (highlightCtx, transform) => {
      if (selectedInLevelEditor) {
        highlightCtx.setLineDash([0.1, 0.2])
      }
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
    // debug
    if (Snake.DEBUG_SNAKE_DRAGGING) {
      ctx.font = 'bold 0.5px sans-serif'
      ctx.textAlign = 'center'
      // ctx.textBaseline = 'middle' // not showing up at all with this, probably to do with the extreme scale
      ctx.textBaseline = 'alphabetic'
      for (let i = 0; i < this.segments.length; i++) {
        const segment = this.segments[i]
        ctx.fillStyle = `hsl(${i * 360 / this.segments.length}, 100%, 50%)`
        // const angleDiff = Math.PI * 2 / this.segments.length // puts near indices close together
        const angleDiff = Math.PI / 2 // puts near indices far apart, in quadrants
        ctx.fillText(
          i.toString(),
          segment.x + segment.width / 2 + Math.sin(i * angleDiff + Math.PI / 4) * 0.3,
          segment.y + segment.height * 0.7 + Math.cos(i * angleDiff + Math.PI / 4) * 0.3,
        )
      }
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
    try {
      ctx.drawImage(this._highlightCanvas, 0, 0)
    } catch (e) {
      // I'm getting "Uncaught DOMException: CanvasRenderingContext2D.drawImage: Passed-in canvas is empty"
      // and searching online for this error, there's only one result,
      // and it's in Chinese,
      // and it looks AI-generated.
      // Does this error message literally just mean the canvas is blank?
      // Who decided to make that an error!? This is in Firefox, by the way.
    }
    ctx.setTransform(transform)

  }
  private _drawHeadDetails(ctx: CanvasRenderingContext2D): void {
    const head = this.segments[0]
    ctx.save()
    ctx.translate(head.x + head.width / 2, head.y + head.height / 2)
    ctx.scale(head.width, head.height)
    const angle = this.segments[1] ? Math.atan2(this.segments[1].y - head.y, this.segments[1].x - head.x) : Math.PI / 2
    ctx.rotate(angle + this._movementPreviewHeadRotation)
    const movementPreviewFactor = this.segments[1] ? 1 : 2 // Exaggerate eye movement for 1-long snakes sine they're like spheres, and it gives it a 3D appearance
    ctx.translate(this._movementPreviewHeadRelative.x * movementPreviewFactor, this._movementPreviewHeadRelative.y * movementPreviewFactor)

    // eyes
    ctx.beginPath()
    // const eyeRadius = 1 / 7  // for single eye
    // ctx.arc(0, 0, eyeRadius, 0, Math.PI * 2, true)  // single eye
    const eyeRadius = 1 / 8
    const eyeDistance = 0.45
    if (this._xEyes) {
      ctx.lineWidth = 1 / 12
      ctx.moveTo(-eyeRadius, -eyeRadius + eyeDistance / 2)
      ctx.lineTo(eyeRadius, eyeRadius + eyeDistance / 2)
      ctx.moveTo(-eyeRadius, eyeRadius + eyeDistance / 2)
      ctx.lineTo(eyeRadius, -eyeRadius + eyeDistance / 2)
      ctx.moveTo(-eyeRadius, -eyeRadius - eyeDistance / 2)
      ctx.lineTo(eyeRadius, eyeRadius - eyeDistance / 2)
      ctx.moveTo(-eyeRadius, eyeRadius - eyeDistance / 2)
      ctx.lineTo(eyeRadius, -eyeRadius - eyeDistance / 2)
      ctx.strokeStyle = head.layer === CollisionLayer.White ? '#000' : '#fff'
      ctx.stroke()
      ctx.beginPath()
    } else if (this.growOnNextMove) {
      // ctx.save()
      // ctx.scale(0.5, 0.5)
      // Food.prototype.draw.call({ layer: CollisionLayer.White, x: 0, y: 0, width: 1, height: 1, #time: 5 }, ctx)
      // ctx.restore()
      ctx.lineWidth = 1 / 12
      ctx.arc(-eyeRadius / 3, eyeDistance / 2, eyeRadius, Math.PI / 3, -Math.PI / 3, true)
      ctx.strokeStyle = head.layer === CollisionLayer.White ? '#000' : '#fff'
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(-eyeRadius / 3, -eyeDistance / 2, eyeRadius, Math.PI / 3, -Math.PI / 3, true)
      ctx.strokeStyle = head.layer === CollisionLayer.White ? '#000' : '#fff'
      ctx.stroke()
      ctx.beginPath()
    } else {
      ctx.arc(0, eyeDistance / 2, eyeRadius, 0, Math.PI * 2, true)
      ctx.arc(0, -eyeDistance / 2, eyeRadius, 0, Math.PI * 2, true)
      ctx.fillStyle = head.layer === CollisionLayer.White ? '#000' : '#fff'
      ctx.fill()
    }

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
      ctx.translate(segment.x + segment.width / 2, segment.y + segment.height / 2)
      const backAngle = Math.atan2(this.segments[i + 1]?.y - segment.y, this.segments[i + 1]?.x - segment.x)
      const foreAngle = Math.atan2(segment.y - this.segments[i - 1]?.y, segment.x - this.segments[i - 1]?.x)

      if (i === 0) {
        if (this.segments.length === 1) {
          // head circle
          ctx.rotate(Math.PI / 2) // only matters for offset, for movement preview
          ctx.arc(this._movementPreviewHeadRelative.x, this._movementPreviewHeadRelative.y, 1 / 2, 0, Math.PI * 2)
        } else {
          // head
          ctx.rotate(backAngle)
          ctx.scale(1, 0.9)
          mirrored(() => ctx.lineTo(1 / 2, 1 / 2))
          ctx.arc(this._movementPreviewHeadRelative.x, this._movementPreviewHeadRelative.y, 1 / 2, Math.PI / 2, -Math.PI / 2)
          ctx.lineTo(1 / 2, -1 / 2)
          ctx.lineTo(1 / 2, 1 / 2)
        }
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
  animateInvalidMove(move: Move): void {
    // TODO: handle canceling animations
    // (it's not a big deal because 1. the animation is short, 2. the same animation will "win" each frame when there are multiple simultaneous animations, so it won't really jitter)
    const startTime = performance.now()
    const duration = move.encumbered ? 230 : 120
    const animate = () => {
      const elapsed = performance.now() - startTime

      if (elapsed > duration) {
        this.previewMovement(0, 0)
        this._xEyes = false
        return
      }

      const progress = Math.min(1, elapsed / duration)
      const pos = Math.sin(progress * Math.PI) * 0.08
      const deltaX = move.to.x - this.segments[0].x
      const deltaY = move.to.y - this.segments[0].y

      this._xEyes = move.encumbered
      this.previewMovement(deltaX * pos, deltaY * pos)

      requestAnimationFrame(animate)
    }
    animate()
  }
  getNextMelodyIndex(): number {
    return this._melodyIndex++
  }
}
