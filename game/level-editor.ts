import { Block } from './block'
import Entity from './entity'
import { activePlayer, deserialize, entities, onResize, onUpdate, postUpdate, serialize, setActivePlayer, undoable } from './game-state'
import { hitTestAllEntities, makeEntity, makeEventListenerGroup, sameTile, sortEntities, topLayer } from './helpers'
import { RectangularEntity } from './rectangular-entity'
import { drawEntities, pageToWorldTile } from './rendering'
import Snake, { SnakeSegment } from './snake'
import { setHighlight } from './tile-highlight'
import { CollisionLayer, Tile } from './types'

enum Tool {
  Brush = "Brush",
  Eraser = "Eraser",
  Move = "Move",
}
let tool = Tool.Brush
let brushEntityClass: typeof Entity = Block
let brushColor = CollisionLayer.White
let dragging: Entity | undefined = undefined
let draggingSegmentIndex = 0

export function initLevelEditorGUI() {

  const entitiesBar = document.getElementById('entities-bar')!
  const entityButtons = entitiesBar.querySelectorAll('.entity-button')
  const toolButtons = entitiesBar.querySelectorAll('.tool-button') // includes entity buttons

  function selectButton(button: Element) {
    for (const button of toolButtons) {
      button.classList.remove('selected')
    }
    button.classList.add('selected')
  }

  const eraserButton = document.querySelector(".tool-button[data-tool='Eraser'")!
  const moveButton = document.querySelector(".tool-button[data-tool='Move'")!
  eraserButton.addEventListener('click', () => {
    tool = Tool.Eraser
    selectButton(eraserButton)
  })
  moveButton.addEventListener('click', () => {
    tool = Tool.Move
    selectButton(moveButton)
  })

  for (const button of entityButtons) {
    makeEntityButton(button)
  }

  function makeEntityButton(button: Element) {
    const entityName = button.getAttribute('data-entity')!
    const entityColor = button.getAttribute('data-color')!
    const layer = entityColor === "White" ? CollisionLayer.White : entityColor === "Black" ? CollisionLayer.Black : CollisionLayer.None
    function makeColoredEntity() {
      const entityInstance = makeEntity(entityName)
      if (entityInstance instanceof Snake) {
        for (const segment of entityInstance.segments) {
          segment.layer = layer
        }
      } else if (entityInstance instanceof RectangularEntity) {
        entityInstance.layer = layer
      }
      return entityInstance
    }
    /*
    function startPlacing() {
      if (dragging) {
        return // avoid doubly adding from click after pointerdown
      }
      undoable()
      const entityInstance = makeColoredEntity()
      entities.push(entityInstance)
      sortEntities()
      dragging = entityInstance
      draggingSegmentIndex = 0
      postUpdate()
    }
    button.addEventListener('click', startPlacing) // allow for click to work for keyboard/other accessibility
    button.addEventListener('pointerdown', startPlacing) // allow dragging from button, to place in one gesture
    */
    button.addEventListener('click', () => {
      // TODO: XXX: bad code, constructing to get constructor
      brushEntityClass = makeEntity(entityName).constructor as typeof Entity
      brushColor = layer
      tool = Tool.Brush
      selectButton(button)
    })
    button.classList.toggle('selected', entityName === brushEntityClass.name && layer === brushColor)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    button.prepend(canvas)
    const styleWidth = 48
    const styleHeight = 48
    function renderIcon() {
      canvas.style.width = `${styleWidth}px`
      canvas.style.height = `${styleHeight}px`
      canvas.width = styleWidth * devicePixelRatio
      canvas.height = styleHeight * devicePixelRatio
      const entityForButton = makeColoredEntity()
      ctx.scale(devicePixelRatio, devicePixelRatio)
      ctx.translate(8, 8)
      ctx.scale(32, 32)
      drawEntities(ctx, [entityForButton])
    }
    renderIcon()
    addEventListener('resize', renderIcon)
  }

}

export function handleInputForLevelEditing(
  eventTarget: HTMLElement,
) {

  const { on, removeEventListeners } = makeEventListenerGroup()

  // ------------
  // Highlighting
  // ------------

  function updateHighlight() {
    let pressed = false
    let valid = false
    if (pointerDownTile && mouseHoveredTile) {
      pressed = sameTile(mouseHoveredTile, pointerDownTile)
    }
    if (mouseHoveredTile) {
      if (tool === Tool.Move) {
        valid = hitTestAllEntities(mouseHoveredTile.x, mouseHoveredTile.y).length > 0
      } else {
        valid = true // maybe (TODO)
      }
    }
    setHighlight(mouseHoveredTile, { pressed, valid })
  }
  onUpdate(updateHighlight)
  onResize(updateHighlight)

  // -----------------------
  // Mouse/pen/touch support
  // -----------------------

  let pointerDownTile: Tile | undefined = undefined
  let mouseHoveredTile: Tile | undefined = undefined
  on(eventTarget, 'pointerdown', (event: PointerEvent) => {
    pointerDownTile = pageToWorldTile(event)
    if (
      pointerDownTile &&
      !dragging &&
      event.button === 0 &&
      tool === Tool.Move
    ) {
      // TODO: consider reversing the array to be topmost first
      const hits = hitTestAllEntities(pointerDownTile.x, pointerDownTile.y)
      const hit = hits[hits.length - 1]
      dragging = hit?.entity
      draggingSegmentIndex = hit?.segmentIndex ?? 0
      if (dragging) {
        undoable()
        // reorder so that the entity is on top
        entities.splice(entities.indexOf(dragging), 1)
        entities.push(dragging)
        // unless it shouldn't be
        sortEntities()
      }
      updateHighlight()
    }
  })

  on(eventTarget, 'pointerup', (event: PointerEvent) => {
    const pointerUpTile = pageToWorldTile(event)
    if (
      pointerUpTile
      // pointerUpTile &&
      // pointerDownTile &&
      // sameTile(pointerUpTile, pointerDownTile)
    ) {
      // undoable is covered at start of drag or addition of a new entity
      dragging = undefined
      draggingSegmentIndex = 0
    }
    pointerDownTile = undefined
    updateHighlight()
  })

  on(eventTarget, 'pointercancel', () => {
    // TODO: undo and delete undoable?
    pointerDownTile = undefined
    dragging = undefined
    draggingSegmentIndex = 0
    updateHighlight()
  })

  on(eventTarget, 'pointermove', (event: PointerEvent) => {
    const coordinates = pageToWorldTile(event)
    mouseHoveredTile = undefined
    if (coordinates) {
      mouseHoveredTile = coordinates
      if (dragging) {
        if (dragging instanceof RectangularEntity) {
          dragging.x = mouseHoveredTile.x
          dragging.y = mouseHoveredTile.y
        } else if (dragging instanceof Snake) {
          // TODO: avoid diagonals and longer-than-1 segments,
          // and maybe warn about overlap, since avoiding collision entirely
          // would make it get stuck, and this is a level editor.
          const draggingSegment = dragging.segments[draggingSegmentIndex]
          if (
            draggingSegment.x !== mouseHoveredTile.x ||
            draggingSegment.y !== mouseHoveredTile.y
          ) {
            for (let i = dragging.segments.length - 1; i > draggingSegmentIndex; i--) {
              lead(dragging.segments[i - 1], dragging.segments[i])
            }
            for (let i = 0; i < draggingSegmentIndex; i++) {
              lead(dragging.segments[i + 1], dragging.segments[i])
            }
            draggingSegment.x = mouseHoveredTile.x
            draggingSegment.y = mouseHoveredTile.y
          }
        }
      } else if (
        event.buttons === 2 ||
        (tool === Tool.Eraser && event.buttons === 1)
      ) {
        // Right click (or use eraser) to delete entities or snake segments
        const hits = hitTestAllEntities(mouseHoveredTile.x, mouseHoveredTile.y)
        for (const hit of hits) {
          const index = entities.indexOf(hit.entity)
          if (index >= 0) {
            // TODO: limit to one undo state per gesture (but don't create one unnecessarily)
            // TODO: Bresenham's line algorithm
            undoable()
            if (hit.entity instanceof Snake && hit.entity.segments.length >= 2) {
              const before = hit.entity.segments.slice(0, hit.segmentIndex)
              const after = hit.entity.segments.slice(hit.segmentIndex! + 1)
              hit.entity.segments.length = before.length
              if (after.length > 0) {
                const newSnake = new Snake()
                newSnake.segments.length = 0
                newSnake.segments.push(...after)
                entities.push(newSnake)
                if (hit.entity.segments.length === 0) {
                  entities.splice(index, 1)
                  if (hit.entity === activePlayer) {
                    setActivePlayer(newSnake)
                  }
                }
              }
            } else {
              entities.splice(index, 1)
              if (hit.entity === activePlayer) {
                setActivePlayer(undefined)
              }
            }
          }
        }
      } else if (
        event.buttons === 1 &&
        tool === Tool.Brush
      ) {
        // Add entities
        // TODO: special handling for snakes and crates
        // TODO: limit to one undo state per gesture (but don't create one unnecessarily)
        // TODO: Bresenham's line algorithm
        const hits = hitTestAllEntities(mouseHoveredTile.x, mouseHoveredTile.y)
        if (topLayer(hits) !== brushColor) {
          undoable()
          const entityInstance = new brushEntityClass()
          if (entityInstance instanceof Snake) {
            entityInstance.segments[0].layer = brushColor
            entityInstance.segments.length = 1
            entityInstance.segments[0].x = mouseHoveredTile.x
            entityInstance.segments[0].y = mouseHoveredTile.y
          } else if (entityInstance instanceof RectangularEntity) {
            entityInstance.layer = brushColor
            entityInstance.x = mouseHoveredTile.x
            entityInstance.y = mouseHoveredTile.y
          }
          entities.push(entityInstance)
          sortEntities()
          postUpdate() // I don't remember why this is needed, I'm just copying tbh, feeling lazy
        }
      }
    }
    // TODO: only with significant movement, such as moving to a new tile
    updateHighlight()
  })

  function lead(leader: SnakeSegment, follower: SnakeSegment) {
    follower.x = leader.x
    follower.y = leader.y
  }

  // ------------
  return removeEventListeners
}

export function saveLevel() {
  const levelJSON = serialize()
  const blob = new Blob([levelJSON], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'snakeshift-level.json'
  a.click()
}

export function loadLevel(file: File) {
  // TODO: error handling
  // show message, and don't create an undo state if it can't be loaded
  // Can use Blob.text() API by the way.
  // TODO: switch to editor mode,
  // before creating an undo state, so that it uses the editor undo stack,
  // but after reading the file, to avoid a race condition
  const reader = new FileReader()
  reader.addEventListener('load', () => {
    undoable()
    const levelJSON = reader.result as string
    deserialize(levelJSON)
  })
  reader.readAsText(file)
}

export function openLevel() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'application/json'
  input.addEventListener('change', () => {
    const file = input.files?.[0]
    if (!file) return
    loadLevel(file)
  })
  input.click()
}
