import Entity from "./entity"
import { entities } from "./game-state"
import { selectedEntities } from "./level-editor"
import { CollisionLayer, Hit, Move, Point, Tile } from "./types"

export interface SnakeSegment extends Tile {
  layer: CollisionLayer
}

export default class Snake extends Entity {
  // When adding new properties, remember to update toJSON()!
  public segments: SnakeSegment[] = []
  public facing: Point = { x: 1, y: 0 }
  public fusedSnakeIds = new Set<string>()
  public id: string = crypto.randomUUID()
  public growOnNextMove = false

  private _highlightTime = -Infinity
  private _melodyIndex = 0
  private _movementPreview: { x: number, y: number } = { x: 0, y: 0 }
  private _movementAnimation: { x: number, y: number } = { x: 0, y: 0 }
  private _headRelativeOffset: { x: number, y: number } = { x: 0, y: 0 }
  private _headAngularOffset = 0
  private _tailTravelOffset = 0
  private _tailAnimStartPos: Tile | null = null
  private _tailAnimFactor = 0
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
    const fusedSnakeIds = Array.from(this.fusedSnakeIds).filter(id => id !== this.id && entities.some(e => e instanceof Snake && e.id === id))
    return {
      id: this.id,
      segments: this.segments,
      facing: this.segments.length === 1 ? this.facing : undefined,
      growOnNextMove: this.growOnNextMove,
      fusedSnakeIds: fusedSnakeIds.length ? fusedSnakeIds : undefined, // too weird of a feature to include in all level files
    }
  }
  fromJSON(data: object): void {
    const { id, segments, facing, growOnNextMove, fusedSnakeIds } = data as Snake
    this.id = id
    this.segments = segments
    this.facing = facing ?? (segments.length > 1 ? { x: segments[1].x - segments[0].x, y: segments[1].y - segments[0].y } : { x: 0, y: -1 })
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
    // - animate the whole body path, not just the head/tail
    //   (if the snake had scales, this would have a greater visual impact)
    // - springiness

    this._movementPreview.x = deltaX
    this._movementPreview.y = deltaY
    this.updateVisualOffsets()
  }
  private setMovementAnimation(deltaX: number, deltaY: number): void {
    this._movementAnimation.x = deltaX
    this._movementAnimation.y = deltaY
    this.updateVisualOffsets()
  }
  private updateVisualOffsets(): void {
    const offset = { x: this._movementAnimation.x + this._movementPreview.x, y: this._movementAnimation.y + this._movementPreview.y }
    const movementPreviewAngle = Math.atan2(offset.y, offset.x)
    const movementPreviewDistance = Math.hypot(offset.y, offset.x)
    const headAngle = this.segments.length > 1 ? Math.atan2(this.segments[1].y - this.segments[0].y, this.segments[1].x - this.segments[0].x) : (this.facing ? Math.atan2(-this.facing.y, -this.facing.x) : Math.PI / 2)
    this._headRelativeOffset = {
      x: Math.cos(movementPreviewAngle - headAngle) * movementPreviewDistance,
      y: Math.sin(movementPreviewAngle - headAngle) * movementPreviewDistance,
    }
    this._headAngularOffset = this._headRelativeOffset.y * -1
    this._tailTravelOffset = this._tailAnimFactor * movementPreviewDistance
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
    this._drawBodyOutline(ctx, () => {
      // if (selectedInLevelEditor) {
      //   ctx.setLineDash([0.1, 0.2])
      // }
      ctx.strokeStyle = this.segments[0].layer === CollisionLayer.White ? '#fff' : '#000'
      ctx.lineWidth = Math.min(0.6, Math.max(0.1, 2 / ctx.getTransform().a)) * 2
      ctx.stroke()
    })
    this._drawBodyOutline(ctx, () => {
      if (selectedInLevelEditor) {
        ctx.setLineDash([0.1, 0.2])
      }
      ctx.strokeStyle = this.segments[0].layer === CollisionLayer.White ? '#000' : '#fff'
      ctx.lineWidth = Math.min(0.6, Math.max(0.1, 2 / ctx.getTransform().a))
      ctx.stroke()
    })
  }
  draw3(ctx: CanvasRenderingContext2D): void {
    // control switching highlight
    const msSinceHighlight = performance.now() - this._highlightTime
    const highlight = Math.min(1, Math.max(0, 1 - msSinceHighlight / Snake.HIGHLIGHT_DURATION))
    if (highlight > 0) {
      this._drawBodyOutline(ctx, () => {
        ctx.strokeStyle = `hsla(40, 100%, 50%, ${highlight})`
        ctx.lineWidth = Math.min(1, Math.max(0.2, 10 / ctx.getTransform().a))
        ctx.stroke()
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
    draw: () => void,
  ): void {
    ctx.save()

    // clip() does the inverse of what I want
    // so create a combined clip path with the body path and the canvas bounds
    // have to save/restore for the transform reset
    ctx.save()
    this._bodyPath(ctx)
    ctx.resetTransform()
    ctx.rect(0, 0, ctx.canvas.width, ctx.canvas.height)
    ctx.restore()

    ctx.clip("evenodd")
    this._bodyPath(ctx)
    draw()

    ctx.restore()
  }
  private _drawHeadDetails(ctx: CanvasRenderingContext2D): void {
    const head = this.segments[0]
    ctx.save()
    ctx.translate(head.x + head.width / 2, head.y + head.height / 2)
    ctx.scale(head.width, head.height)
    const angle = this.segments[1] ? Math.atan2(this.segments[1].y - head.y, this.segments[1].x - head.x) : (this.facing ? Math.atan2(-this.facing.y, -this.facing.x) : Math.PI / 2)
    ctx.rotate(angle + this._headAngularOffset)
    const movementPreviewFactor = this.segments[1] ? 1 : 2 // Exaggerate eye movement for 1-long snakes since they're like spheres, and it gives it a 3D appearance
    // TODO: only exaggerate movement PREVIEW, not movement animation
    ctx.translate(this._headRelativeOffset.x * movementPreviewFactor, this._headRelativeOffset.y * movementPreviewFactor)

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
          ctx.rotate(this.facing ? Math.atan2(-this.facing.y, -this.facing.x) : Math.PI / 2) // only matters for offset, for movement preview
          ctx.arc(this._headRelativeOffset.x, this._headRelativeOffset.y, 1 / 2, 0, Math.PI * 2)
        } else {
          // head
          ctx.rotate(backAngle)
          ctx.scale(1, 0.9)
          // mirrored(() => ctx.lineTo(1 / 2, 1 / 2))
          ctx.arc(this._headRelativeOffset.x, this._headRelativeOffset.y, 1 / 2, Math.PI / 2, -Math.PI / 2)
          // ctx.lineTo(1 / 2, -1 / 2)
          // ctx.lineTo(1 / 2, 1 / 2)
        }
        // eye and tongue are drawn separately
        // If the eye was rendered as a hole in the head, then
        // when two snake heads overlapped, the eye would be invisible.
      } else if (i === this.segments.length - 1) {
        // tail
        ctx.rotate(foreAngle)
        ctx.scale(1, 0.9)
        mirrored(() => ctx.lineTo(-1 / 2, -1 / 2)) // only needed during animation

        if (this._tailAnimStartPos) {
          // interpolate tail position
          const tailPos: Point = {
            x: this._tailAnimStartPos.x + (segment.x - this._tailAnimStartPos.x) * (1 - this._tailTravelOffset),
            y: this._tailAnimStartPos.y + (segment.y - this._tailAnimStartPos.y) * (1 - this._tailTravelOffset),
          }
          // interpolate the adjacent body segment position in order to rotate the tail correctly
          const hipBonePos: Point = {
            x: segment.x + (this.segments[i - 1]!.x - segment.x) * (1 - this._tailTravelOffset),
            y: segment.y + (this.segments[i - 1]!.y - segment.y) * (1 - this._tailTravelOffset),
          }
          // undo and recalculate transformations with interpolated positions
          ctx.restore()
          ctx.save()
          ctx.translate(tailPos.x + segment.width / 2, tailPos.y + segment.height / 2)
          // const backAngle = Math.atan2(this.segments[i + 1]?.y - segment.y, this.segments[i + 1]?.x - segment.x)
          const foreAngle = Math.atan2(tailPos.y - hipBonePos.y, tailPos.x - hipBonePos.x)
          ctx.rotate(foreAngle)
          ctx.scale(1, 0.9)
        }

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
  // TODO: DRY animating valid and invalid moves
  animateMove(move: Move, originalTailPosition: Tile): void {
    // TODO: handle canceling animations
    // (it's not a big deal because 1. the animation is short, 2. the same animation will "win" each frame when there are multiple simultaneous animations, so it won't really jitter)
    const startTime = performance.now()
    const duration = 60
    const animate = () => {
      const elapsed = performance.now() - startTime

      if (elapsed > duration) {
        this._tailAnimFactor = 0
        this.setMovementAnimation(0, 0)
        return
      }

      const progress = Math.min(1, elapsed / duration)
      // const pos = -1 - (Math.cos(progress * Math.PI) * 0.5)
      // const pos = progress - 1 // linear
      // linear, skipping the first half of the animation, where the center of the head would be within the previous cell
      // because it's not handled by the rendering code at the moment
      const pos = (1 + progress) / 2 - 1

      this._tailAnimFactor = 1
      this._tailAnimStartPos = originalTailPosition
      this.setMovementAnimation(move.delta.x * pos, move.delta.y * pos)

      requestAnimationFrame(animate)
    }
    animate()
  }
  animateInvalidMove(move: Move): void {
    // TODO: handle canceling animations
    // (it's not a big deal because 1. the animation is short, 2. the same animation will "win" each frame when there are multiple simultaneous animations, so it won't really jitter)
    // TODO: maybe don't animate tail? even a subtle animation is kinda weird
    // feels like it distracts from the reason the move is invalid, which has to do with the front of the snake
    const startTime = performance.now()
    const duration = move.encumbered ? 230 : 120
    const animate = () => {
      const elapsed = performance.now() - startTime

      if (elapsed > duration) {
        this._tailAnimFactor = 0
        this._xEyes = false
        this.setMovementAnimation(0, 0)
        return
      }

      const progress = Math.min(1, elapsed / duration)
      const pos = Math.sin(progress * Math.PI) * 0.08

      this._xEyes = move.encumbered
      this._tailAnimFactor = !move.encumbered && this.segments.length > 1 && (move.to.x !== this.segments[1].x || move.to.y !== this.segments[1].y) ? -0.3 : 0
      // Extrapolate the tail animation start position from the current tail position.
      // In this case it may not actually be the previous tail position; we don't want to animate rotation
      // just because the last move had the tail turn a corner. That's not relevant once the move is over.
      if (this.segments.length > 1) {
        this._tailAnimStartPos = {
          x: this.segments[this.segments.length - 1].x + (this.segments[this.segments.length - 1].x - this.segments[this.segments.length - 2].x),
          y: this.segments[this.segments.length - 1].y + (this.segments[this.segments.length - 1].y - this.segments[this.segments.length - 2].y),
          width: this.segments[this.segments.length - 1].width,
          height: this.segments[this.segments.length - 1].height,
        }
      } else {
        this._tailAnimStartPos = null
      }
      // this._tailAnimFactor = 0
      this.setMovementAnimation(move.delta.x * pos, move.delta.y * pos)

      requestAnimationFrame(animate)
    }
    animate()
  }
  getNextMelodyIndex(): number {
    return this._melodyIndex++
  }
}
