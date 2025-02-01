import { Block } from './block'
import { Collectable } from './collectable'
import Entity from './entity'
import { activePlayer, clearLevel, entities, levelInfo, onResize, onUpdate, postUpdate, setActivePlayer, undoable } from './game-state'
import { bresenham, clampToLevel, hitTestAllEntities, lineNoDiagonals, makeEntity, makeEventListenerGroup, sameTile, sortEntities, topLayer, within, withinLevel } from './helpers'
import { RectangularEntity } from './rectangular-entity'
import { addProblem, clearProblems, draw, drawEntities, pageToWorldTile } from './rendering'
import Snake, { SnakeSegment } from './snake'
import { setHighlight } from './tile-highlight'
import { CollisionLayer, Tile } from './types'

enum Tool {
  Brush = "Brush",
  Eraser = "Eraser",
  Move = "Move",
  Select = "Select",
}
let tool = Tool.Brush
let brushEntityClass: typeof Entity = Block
let brushColor = CollisionLayer.White
let draggingEntities: Entity[] = []
let dragGestureLastTile: Tile | undefined = undefined
let draggingSegmentIndex = 0
let defining: Entity | undefined = undefined
let createdUndoState = false
let selectionRange: { startTile: Tile, endTile: Tile, defining: boolean } | undefined = undefined
export let selectedEntities: Entity[] = []

function getSelectionBox(): Tile | undefined {
  if (selectionRange) {
    return {
      x: Math.min(selectionRange.startTile.x, selectionRange.endTile.x),
      y: Math.min(selectionRange.startTile.y, selectionRange.endTile.y),
      width: Math.abs(selectionRange.startTile.x - selectionRange.endTile.x) + 1,
      height: Math.abs(selectionRange.startTile.y - selectionRange.endTile.y) + 1,
    }
  }
}

export function initLevelEditorGUI() {

  const entitiesBar = document.getElementById('entities-bar')!
  const entityButtons = entitiesBar.querySelectorAll('.entity-button')
  const toolButtons = entitiesBar.querySelectorAll('.tool-button') // includes entity buttons

  function setSelectedButton(button: Element) {
    selectionRange = undefined
    setHighlight(undefined) // updateHighlight()? not accessible here...
    for (const button of toolButtons) {
      button.classList.remove('selected')
    }
    button.classList.add('selected')
  }

  const eraserButton = document.querySelector(".tool-button[data-tool='Eraser'")!
  const moveButton = document.querySelector(".tool-button[data-tool='Move'")!
  const selectButton = document.querySelector(".tool-button[data-tool='Select'")!
  const clearButton = document.querySelector("#clear-button")!
  const levelInfoButton = document.querySelector<HTMLButtonElement>("#level-info-button")!
  const levelInfoEditor = document.querySelector<HTMLDialogElement>('#level-info-editor')!
  const levelInfoEditorOKButton = document.querySelector<HTMLDialogElement>('#level-info-editor-ok-button')!
  const levelInfoEditorCancelButton = document.querySelector<HTMLDialogElement>('#level-info-editor-cancel-button')!
  eraserButton.addEventListener('click', () => {
    tool = Tool.Eraser
    setSelectedButton(eraserButton)
  })
  moveButton.addEventListener('click', () => {
    tool = Tool.Move
    setSelectedButton(moveButton)
  })
  selectButton.addEventListener('click', () => {
    tool = Tool.Select
    setSelectedButton(selectButton)
  })
  clearButton.addEventListener('click', () => {
    if (selectedEntities.length || selectionRange) {
      deleteSelectedEntities()
    } else {
      clearLevel()
    }
  })
  levelInfoButton.addEventListener('click', () => {
    levelInfoEditor.showModal()
    const widthInput = levelInfoEditor.querySelector<HTMLInputElement>('#level-width')!
    const heightInput = levelInfoEditor.querySelector<HTMLInputElement>('#level-height')!
    // const nameInput = levelInfoEditor.querySelector<HTMLInputElement>('#level-name')!
    // const authorInput = levelInfoEditor.querySelector<HTMLInputElement>('#level-author')!
    // const descriptionInput = levelInfoEditor.querySelector<HTMLInputElement>('#level-description')!
    widthInput.value = levelInfo.width.toString()
    heightInput.value = levelInfo.height.toString()
  })
  levelInfoEditor.addEventListener('close', () => {
    console.log(levelInfoEditor.returnValue)
  })
  levelInfoEditorOKButton.addEventListener('click', (event) => {
    event.preventDefault()
    undoable()
    levelInfo.width = parseInt(levelInfoEditor.querySelector<HTMLInputElement>('#level-width')!.value)
    levelInfo.height = parseInt(levelInfoEditor.querySelector<HTMLInputElement>('#level-height')!.value)
    // levelInfo.name = nameInput.value
    // levelInfo.author = authorInput.value
    // levelInfo.description = descriptionInput.value
    postUpdate() // I guess.
    levelInfoEditor.close()
  })
  levelInfoEditorCancelButton.addEventListener('click', (event) => {
    event.preventDefault()
    levelInfoEditor.close()
  })

  for (const button of entityButtons) {
    makeEntityButton(button)
  }
  // This is stupid, TODO: DRY initial vs. update
  if (tool === Tool.Move) {
    setSelectedButton(moveButton)
  } else if (tool === Tool.Eraser) {
    setSelectedButton(eraserButton)
  } else if (tool === Tool.Select) {
    setSelectedButton(selectButton)
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
      setSelectedButton(button)
    })
    button.classList.toggle('selected', entityName === brushEntityClass.name && layer === brushColor && tool === Tool.Brush)
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
    const pressed = pointerDownTile && sameTile(mouseHoveredTile, pointerDownTile)
    let valid = false
    if (mouseHoveredTile) {
      if (tool === Tool.Move) {
        valid = hitTestAllEntities(mouseHoveredTile.x, mouseHoveredTile.y).length > 0
      } else if (withinLevel(mouseHoveredTile)) {
        valid = true // maybe (TODO)
      }
    }
    if (tool === Tool.Select) {
      setHighlight(getSelectionBox(), { isSelection: true, valid: true })
    } else {
      setHighlight(mouseHoveredTile, { pressed, valid })
    }

    validateLevel()
  }
  onUpdate(updateHighlight)
  onResize(updateHighlight)

  function validateLevel() {
    clearProblems()

    const entitiesByPosition = new Map<string, Entity[]>()
    for (const entity of entities) {
      // @ts-expect-error (x and y don't exist for snakes for example)
      const key = `${entity.x ?? "?"},${entity.y ?? "?"}`
      const bucket = entitiesByPosition.get(key) ?? []
      bucket.push(entity)
      entitiesByPosition.set(key, bucket)

      if (entity instanceof RectangularEntity) {
        if (!withinLevel(entity)) {
          addProblem(entity, "out-of-bounds")
        }
      } else if (entity instanceof Snake) {
        for (const segment of entity.segments) {
          if (!withinLevel(segment)) {
            addProblem(segment, "out-of-bounds")
          }
          for (const otherSegment of entity.segments) {
            if (segment !== otherSegment && sameTile(segment, otherSegment)) {
              addProblem(segment, "overlap")
            }
          }
          const hits = hitTestAllEntities(segment.x, segment.y)
          if (topLayer(hits.filter(hit => hit.entity !== entity)) === segment.layer) {
            addProblem(segment, "collision")
          }
        }
      }
    }
    for (const bucket of entitiesByPosition.values()) {
      const collectablesHere = bucket.filter(entity => entity instanceof Collectable) as Collectable[]
      if (collectablesHere.length > 1) {
        addProblem(collectablesHere[1], "overlap")
        // Automatically delete
        // quick hack, using `node update-level-format.js` script to fix all levels
        // for (let i = 1; i < collectablesHere.length; i++) {
        //   entities.splice(entities.indexOf(collectablesHere[i]), 1)
        // }
      }
    }

  }

  // -----------------------
  // Mouse/pen/touch support
  // -----------------------

  let pointerDownTile: Tile | undefined = undefined
  let mouseHoveredTile: Tile | undefined = undefined
  on(eventTarget, 'pointerdown', (event) => {
    pointerDownTile = pageToWorldTile(event)
    const selectionBox = getSelectionBox()
    const shouldDragSelection = selectionBox && pointerDownTile && within(pointerDownTile, selectionBox)
    if (!withinLevel(pointerDownTile) && tool !== Tool.Select) {
      pointerDownTile = undefined
    }
    mouseHoveredTile = pointerDownTile // for tool actions (no longer needed?)
    if (
      pointerDownTile && // maybe shouldn't require this if shouldDragSelection
      !draggingEntities.length &&
      event.button === 0 &&
      (tool === Tool.Move || shouldDragSelection)
    ) {
      if (shouldDragSelection) {
        draggingEntities = [...selectedEntities]
        draggingSegmentIndex = 0 // This doesn't apply; snakes are dragged as a whole
        dragGestureLastTile = pointerDownTile
      } else {
        // TODO: consider reversing the array to be topmost first
        const hits = hitTestAllEntities(pointerDownTile.x, pointerDownTile.y)
        const hit = hits[hits.length - 1]
        draggingEntities = [hit?.entity].filter(Boolean)
        draggingSegmentIndex = hit?.segmentIndex ?? 0
        dragGestureLastTile = undefined
      }
      if (draggingEntities.length) {
        undoable()
        // reorder so that the dragged entities are on top
        for (const entity of draggingEntities) {
          entities.splice(entities.indexOf(entity), 1)
        }
        entities.push(...draggingEntities)
        // unless some of them shouldn't be
        sortEntities()
      }
      updateHighlight()
    } else if (
      pointerDownTile &&
      event.button === 0 &&
      tool === Tool.Select
    ) {
      selectionRange = { startTile: pointerDownTile, endTile: pointerDownTile, defining: true }
      selectEntitiesInSelectionBox()
      updateHighlight()
    } else if (mouseHoveredTile) {
      handlePointerDownOrMove(event, mouseHoveredTile, mouseHoveredTile)
    }
  })

  on(window, 'pointerup', endDrag)
  on(window, 'pointercancel', endDrag)

  function endDrag(event: PointerEvent) {
    // undoable is covered at start of drag
    // TODO: undo and delete undoable for pointercancel? or just undo? could allow redoing.
    // but definitely only undo if an undo state was created for this gesture.
    pointerDownTile = undefined
    defining = undefined
    draggingEntities = []
    draggingSegmentIndex = 0
    dragGestureLastTile = undefined
    createdUndoState = false
    if (selectionRange?.defining) {
      selectionRange.defining = false
    }
    // TODO: DRY/simplify this? (could trigger pointermove handler)
    mouseHoveredTile = pageToWorldTile(event)
    if (!withinLevel(mouseHoveredTile)) {
      mouseHoveredTile = undefined
    }
    updateHighlight()
  }

  on(window, 'pointermove', (event) => {
    const lastTile = mouseHoveredTile
    mouseHoveredTile = pageToWorldTile(event)
    if (!pointerDownTile && !withinLevel(mouseHoveredTile)) {
      mouseHoveredTile = undefined
    }
    if (mouseHoveredTile) {
      if (dragGestureLastTile) {
        if (selectionRange && dragGestureLastTile) {
          const dx = mouseHoveredTile.x - dragGestureLastTile.x
          const dy = mouseHoveredTile.y - dragGestureLastTile.y
          for (const entity of draggingEntities) {
            nudge(entity, dx, dy)
          }
          selectionRange.startTile.x += dx
          selectionRange.startTile.y += dy
          selectionRange.endTile.x += dx
          selectionRange.endTile.y += dy
          dragGestureLastTile = mouseHoveredTile
        } else {
          for (const entity of draggingEntities) {
            drag(entity, mouseHoveredTile)
          }
        }
      } else if (selectionRange?.defining && pointerDownTile) {
        selectionRange.endTile = mouseHoveredTile
        selectEntitiesInSelectionBox()
      } else {
        handlePointerDownOrMove(event, lastTile, mouseHoveredTile)
      }
    }
    // only with significant movement (moving to a new tile),
    // because this replaces the highlight used by gamepad controls
    // and you don't want it flickering from mouse jitter while using a gamepad (not applicable to the editor YET)
    // and for efficiency
    if (!sameTile(lastTile, mouseHoveredTile)) {
      updateHighlight()
    }
  })

  function handlePointerDownOrMove(event: PointerEvent, from: Tile | undefined, to: Tile | undefined) {
    if (!from || !to || !pointerDownTile) return
    if (
      event.buttons === 2 ||
      (tool === Tool.Eraser && event.buttons === 1)
    ) {
      for (const point of bresenham(from, to)) {
        erase({ x: point.x, y: point.y, width: 1, height: 1 })
      }
    } else if (
      event.buttons === 1 &&
      tool === Tool.Brush
    ) {
      // Don't want diagonals for snake. Do I really want it in general though?
      const lineFn = brushEntityClass === Snake ? lineNoDiagonals : bresenham
      for (const point of lineFn(from, to)) {
        const tile = { x: point.x, y: point.y, width: 1, height: 1 }
        // Clamp to level for snake creation, which is, as of writing,
        // otherwise exempt from level bounds checking, although it may no longer need to be,
        // since it's now clamped here.
        if (brushEntityClass === Snake) {
          brush(clampToLevel(tile))
        } else {
          brush(tile)
        }
      }
    }
  }

  // ------------
  // Tool actions
  // ------------

  function brush(mouseHoveredTile: Tile) {
    // Add entities or snake segments
    // TODO: special handling for crates (define width/height via anchor point)
    // and maybe blocks (annihilate inverse color to reduce entity count and avoid anti-aliasing artifacts)
    const hits = hitTestAllEntities(mouseHoveredTile.x, mouseHoveredTile.y)
    // Allow placing snake segments in invalid locations, because it's better than jumping over tiles and creating diagonals or long segments.
    // Don't need to allow starting placement of a snake in an invalid location though.
    // TODO: allow placing food on same color (or else make it color-agnostic, able to be eaten by any snake)
    if (
      (
        withinLevel(mouseHoveredTile) &&
        // topLayer only looks at solid entities
        topLayer(hits) !== brushColor &&
        // so we need to also prevent collectables from being placed on top of each other
        // (I guess it's enough to prevent anything from being placed where there's a collectable...)
        !hits.some(hit => hit.entity instanceof Collectable)
      ) || (
        defining instanceof Snake &&
        !sameTile(mouseHoveredTile, defining.segments[0])
      )
    ) {
      if (!createdUndoState) {
        undoable()
        createdUndoState = true
      }
      const entityInstance = defining ?? new brushEntityClass()
      if (!defining) {
        if (entityInstance instanceof Snake) {
          entityInstance.segments.length = 0
          defining = entityInstance
        }
      }
      if (entityInstance instanceof Snake) {
        entityInstance.segments.unshift({
          layer: brushColor,
          x: mouseHoveredTile.x,
          y: mouseHoveredTile.y,
          width: 1,
          height: 1,
        })
      } else if (entityInstance instanceof RectangularEntity) {
        entityInstance.layer = brushColor
        entityInstance.x = mouseHoveredTile.x
        entityInstance.y = mouseHoveredTile.y
      }
      if (!entities.includes(entityInstance)) {
        entities.push(entityInstance)
      }
      sortEntities()
      postUpdate() // I don't remember why this is needed, I'm just copying tbh, feeling lazy
    }

  }

  function erase(mouseHoveredTile: Tile) {
    // Right click (or use eraser) to delete entities or snake segments
    const hits = hitTestAllEntities(mouseHoveredTile.x, mouseHoveredTile.y)
    for (const hit of hits) {
      const index = entities.indexOf(hit.entity)
      if (index >= 0) {
        if (!createdUndoState) {
          undoable()
          createdUndoState = true
        }
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
            sortEntities()
          }
        } else {
          entities.splice(index, 1)
          if (hit.entity === activePlayer) {
            setActivePlayer(undefined)
          }
        }
      }
    }
  }

  function nudge(dragging: Entity, dx: number, dy: number) {
    if (dragging instanceof RectangularEntity) {
      dragging.x += dx
      dragging.y += dy
    } else if (dragging instanceof Snake) {
      for (const segment of dragging.segments) {
        segment.x += dx
        segment.y += dy
      }
    }
  }

  function drag(dragging: Entity, to: Tile) {
    to = clampToLevel(to)
    if (dragging instanceof RectangularEntity) {
      dragging.x = to.x
      dragging.y = to.y
    } else if (dragging instanceof Snake) {
      // TODO: warn about overlap (rather than avoiding it, since avoiding collision entirely
      // would make it get stuck, and this is a level editor. You don't need the editor to be a puzzle.)
      const draggingSegment = dragging.segments[draggingSegmentIndex]
      if (
        draggingSegment.x !== to.x ||
        draggingSegment.y !== to.y
      ) {
        // Avoids diagonals and segments longer than 1 tile
        const from = { x: draggingSegment.x, y: draggingSegment.y } // needs copy since it's mutated and lineNoDiagonals is a generator, so it computes lazily
        // Skip the first point, since it's the same as the segment's current position
        for (const point of [...lineNoDiagonals(from, to)].slice(1)) {
          for (let i = dragging.segments.length - 1; i > draggingSegmentIndex; i--) {
            lead(dragging.segments[i - 1], dragging.segments[i])
          }
          for (let i = 0; i < draggingSegmentIndex; i++) {
            lead(dragging.segments[i + 1], dragging.segments[i])
          }
          draggingSegment.x = point.x
          draggingSegment.y = point.y
          if (Snake.DEBUG_SNAKE_DRAGGING) {
            draw()
          }
        }
      }
    }
  }

  function lead(leader: SnakeSegment, follower: SnakeSegment) {
    follower.x = leader.x
    follower.y = leader.y
    // Portals may be able to change the size of the snake in the future
    follower.width = leader.width
    follower.height = leader.height
    // Visualize dragging algorithm while paused in the debugger
    if (Snake.DEBUG_SNAKE_DRAGGING) {
      draw()
    }
  }

  function selectEntitiesInSelectionBox() {
    const selectionBox = getSelectionBox()
    if (!selectionBox) return
    selectedEntities = entities.filter(entity => {
      if (entity instanceof RectangularEntity) {
        return within(entity, selectionBox)
      } else if (entity instanceof Snake) {
        return entity.segments.some(segment => within(segment, selectionBox))
      }
      return false
    })
    postUpdate() // I guess?
  }

  // ------------
  return removeEventListeners
}

export function deleteSelectedEntities() {
  if (selectedEntities.length) {
    undoable()
    for (const entity of selectedEntities) {
      const index = entities.indexOf(entity)
      if (index >= 0) {
        entities.splice(index, 1)
      }
    }
    selectedEntities.length = 0
    selectionRange = undefined
    setHighlight(undefined) // updateHighlight()? not accessible out here...
    postUpdate() // I guess?
  }
}
