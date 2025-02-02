import { playSound } from "./audio"
import { Collectable } from "./collectable"
import Entity from "./entity"
import { checkLevelWon, entities, levelInfo, undoable } from "./game-state"
import { hitTestAllEntities, topLayer } from "./helpers"
import { selectedEntities } from "./level-editor"
import { CollisionLayer, Hit, Move, Tile } from "./types"

export interface SnakeSegment extends Tile {
  layer: CollisionLayer
}

export default class Snake extends Entity {
  // When adding new properties, remember to update toJSON()!
  public segments: SnakeSegment[] = []
  public id: string = crypto.randomUUID()
  public growOnNextMove = false

  private _highlightTime = -Infinity
  private _highlightCanvas = document.createElement('canvas')
  private _melodyIndex = 0
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
    ctx.rotate(angle)

    // eyes
    ctx.beginPath()
    // const eyeRadius = 1 / 7  // for single eye
    // ctx.arc(0, 0, eyeRadius, 0, Math.PI * 2, true)  // single eye
    const eyeRadius = 1 / 8
    const eyeDistance = 0.45
    ctx.arc(0, eyeDistance / 2, eyeRadius, 0, Math.PI * 2, true)
    ctx.arc(0, -eyeDistance / 2, eyeRadius, 0, Math.PI * 2, true)
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
      ctx.translate(segment.x + segment.width / 2, segment.y + segment.height / 2)
      const backAngle = Math.atan2(this.segments[i + 1]?.y - segment.y, this.segments[i + 1]?.x - segment.x)
      const foreAngle = Math.atan2(segment.y - this.segments[i - 1]?.y, segment.x - this.segments[i - 1]?.x)

      if (i === 0) {
        if (this.segments.length === 1) {
          // head circle
          ctx.arc(0, 0, 1 / 2, 0, Math.PI * 2)
        } else {
          // head
          ctx.rotate(backAngle)
          ctx.scale(1, 0.9)
          mirrored(() => ctx.lineTo(1 / 2, 1 / 2))
          ctx.arc(0, 0, 1 / 2, Math.PI / 2, -Math.PI / 2)
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
    const deltaX = dirX * head.width
    const deltaY = dirY * head.height
    const x = head.x + deltaX
    const y = head.y + deltaY
    const hitsAhead = hitTestAllEntities(x, y, { ignoreTailOfSnake: this.growOnNextMove ? undefined : this })
    const hitsAtTail = hitTestAllEntities(tail.x, tail.y)
    const hitsAllAlong = this.segments.flatMap(segment => hitTestAllEntities(segment.x, segment.y))
    // Note: snakesOnTop may include duplicates
    const snakesOnTop = hitsAllAlong.filter(hit => hit.entity instanceof Snake && hit.entity !== this && entities.indexOf(hit.entity) > entities.indexOf(this))

    // Prevent moving backwards when two segments long
    // (When one segment long, you can plausibly move in any direction,
    // and when more than two segments long, a body segment will be in the way,
    // but when two segments, normally the tail is excluded from hit testing,
    // so you would be allowed to double back, but it feels weird to do a 180° turn.)
    // This also prevents an overlapped snake from doubling back on itself,
    // by moving into a tile occupied by a snake which is on top of this snake.
    // (But that is just a special case of the rule that you shouldn't
    // be able to move into a tile occupied by a snake which is on top of this snake.)
    const movingBackwards =
      this.segments.length > 1 &&
      dirX === Math.sign(this.segments[1].x - head.x) &&
      dirY === Math.sign(this.segments[1].y - head.y)

    // I think I will need to move to a system where the move is simulated and then checked for validity,
    // to avoid the complexity of adding exceptions to game state access, when answering hypotheticals.
    // This could also help with animating undo/redo, which currently replaces all the entities, resetting animation timers,
    // and for the level editor, where I'd like to check for collisions to show warnings,
    // (but allow the collisions to happen so that editing isn't its own puzzle.)
    // If moves are analyzed by checking for collisions within a whole game board,
    // it could share some code. Theoretically.

    return {
      valid:
        (dirX === 0 || dirY === 0) &&
        (Math.abs(dirX) === 1 || Math.abs(dirY) === 1) &&
        x >= 0 && y >= 0 &&
        x + head.width <= levelInfo.width && y + head.height <= levelInfo.height &&
        !movingBackwards &&
        snakesOnTop.length === 0 &&
        topLayer(hitsAhead) !== head.layer &&
        topLayer(hitsAtTail) === head.layer,
      to: { x, y, width: head.width, height: head.height },
      entitiesThere: hitsAhead.map(hit => hit.entity),
    }
  }
  takeMove(move: Move): void {
    undoable()
    playSound('move')
    if (this.growOnNextMove) {
      this._grow()
      this.growOnNextMove = false
    }
    const head = this.segments[0]
    for (let i = this.segments.length - 1; i > 0; i--) {
      const segment = this.segments[i]
      const prev = this.segments[i - 1]
      segment.x = prev.x
      segment.y = prev.y
    }
    head.x = move.to.x
    head.y = move.to.y
    head.width = move.to.width
    head.height = move.to.height
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
        // const eatPlaybackRate = Math.pow(2, this.segments.length / 10) / 10
        // const eatPlaybackRate = [1, 2, 3, 4, 5, 6, 4, 3, 2][this.segments.length % 8] * 10
        // const scale = [1, 9 / 8, 5 / 4, 4 / 3, 3 / 2, 5 / 3, 15 / 8, 2]
        // const eatPlaybackRate = scale[this.segments.length % scale.length]

        const midiToFreq = (midiNote: number) => 440 * Math.pow(2, (midiNote - 69) / 12)
        const songABC = `
X:231
T:The Snake Charmer Song
T:The Streets of Cairo
Z:Jack Campin, http://www.campin.me.uk/
F:Jack Campin's Nine-Note Tunebook
% last edit 03-02-2013
C:Sol Bloom and James Thornton, 1893 
H:see http://www.shira.net/streets-of-cairo.htm
M:4/4
L:1/8
Q:1/4=120
K:DMin
DE| F2 E2 D2 DE|FA  EF  D2   :|\
z2| AA AB AG EF|
                GG  GA  GF     \
DE| FF FG FE DE|F2  EE  D2 z2||
K:F
  |:A4    A3  F|G>A G>F D2 C2 |\
[1  F2 A2 c2 d2|
                c2  d2  cA G2:|\
[2  F2 AF G2 A2|F4      z2   |]
`
        const melodyMidi = [...songABC.split("K:DMin")[1].matchAll(/([A-G])([,'])*/gi)].map(match => {
          const letter = match[1]
          const octaveModifier = match[2] === "'" ? 1 : match[2] === "," ? -1 : 0
          const octave = (letter === letter.toUpperCase() ? 1 : 0) + octaveModifier
          const midiNote = 12 * (octave + 6) + 'CDEFGAB'.indexOf(letter.toUpperCase())
          return midiNote
        })
        const melodyFrequencies = melodyMidi.map(midiToFreq)
        // const eatPlaybackRate = melodyFrequencies[this.segments.length % melodyFrequencies.length] / 440
        const eatPlaybackRate = melodyFrequencies[this._melodyIndex++ % melodyFrequencies.length] / 440

        if (!checkLevelWon()) {
          playSound('eat', { playbackRate: eatPlaybackRate })
        }
      }
    }
  }
  private _grow(): void {
    const tail = this.segments[this.segments.length - 1]
    // This only works because SnakeSegment is a flat object.
    const newTail = { ...tail }
    this.segments.push(newTail)
  }
}
