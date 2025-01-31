import { Block } from './block'
import { Collectable } from './collectable'
import Entity from './entity'
import { setActivityMode } from './game'
import { activePlayer, clearLevel, deserialize, entities, levelInfo, onResize, onUpdate, postUpdate, redo, redos, serialize, setActivePlayer, undoable, undos } from './game-state'
import { bresenham, clampToLevel, hitTestAllEntities, lineNoDiagonals, makeEntity, makeEventListenerGroup, sameTile, sortEntities, topLayer, withinLevel } from './helpers'
import { hideScreens } from './menus'
import { RectangularEntity } from './rectangular-entity'
import { addProblem, clearProblems, draw, drawEntities, pageToWorldTile } from './rendering'
import Snake, { SnakeSegment } from './snake'
import { setHighlight } from './tile-highlight'
import { CollisionLayer, GameState, Tile } from './types'

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
let defining: Entity | undefined = undefined
let createdUndoState = false

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
  const clearButton = document.querySelector("#clear-button")!
  const levelInfoButton = document.querySelector<HTMLButtonElement>("#level-info-button")!
  const levelInfoEditor = document.querySelector<HTMLDialogElement>('#level-info-editor')!
  const levelInfoEditorOKButton = document.querySelector<HTMLDialogElement>('#level-info-editor-ok-button')!
  const levelInfoEditorCancelButton = document.querySelector<HTMLDialogElement>('#level-info-editor-cancel-button')!
  eraserButton.addEventListener('click', () => {
    tool = Tool.Eraser
    selectButton(eraserButton)
  })
  moveButton.addEventListener('click', () => {
    tool = Tool.Move
    selectButton(moveButton)
  })
  clearButton.addEventListener('click', () => {
    clearLevel()
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
    selectButton(moveButton)
  } else if (tool === Tool.Eraser) {
    selectButton(eraserButton)
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
    setHighlight(mouseHoveredTile, { pressed, valid })

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
    if (!withinLevel(pointerDownTile)) {
      pointerDownTile = undefined
    }
    mouseHoveredTile = pointerDownTile // for tool actions (no longer needed?)
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
    dragging = undefined
    draggingSegmentIndex = 0
    createdUndoState = false
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
      if (dragging) {
        drag(mouseHoveredTile)
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
        topLayer(hits) !== brushColor
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

  function drag(to: Tile) {
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

export function savePlaythrough() {
  // TODO: better playthrough format
  // Since I've already saved some playthroughs by just copying `JSON.stringify(undos)` from the console,
  // I figure I might as well make it easy to save them like this for now, as I'll have files to convert anyway.
  // This format's pretty bad though - JSON strings in JSON, and no format identifier/version.
  // BTW: this function doesn't have to do with level editing, except I suppose I MIGHT allow saving while editing,
  // but it's just similar to saveLevel.
  // New files will include the final state, but old files will be slightly unsatisfying to watch. :P
  const json = JSON.stringify([...undos, serialize()])
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'snakeshift-level-playthrough.json'
  a.click()
}

function loadPlaythrough(json: string) {

  const playthrough = JSON.parse(json) as GameState[]
  if (!Array.isArray(playthrough)) {
    throw new Error("Invalid playthrough format")
  }
  // TODO: make "replay" a separate activity mode, where you can only step through the history?
  // Not sure if I want to limit it like that, might be useful to continue playing from replay,
  // if only for testing purposes.
  loadLevelFromText(playthrough[0], "play")
  for (const state of playthrough.toReversed()) {
    redos.push(state)
  }
  redo()
  alert(`Loaded playthrough with ${playthrough.length} moves. Press 'Y' (Redo) to step through it.`)
}

// TODO: simplify with promises
export function loadLevel(file: Blob, newMode: "edit" | "play", loadedCallback?: () => void) {
  // Error Message Itself Test
  // Promise.reject(new Error("EMIT oh no!")).then((fileText) => {
  file.text().then((fileText) => {
    if (loadLevelFromText(fileText, newMode)) {
      loadedCallback?.()
    }
  }, (error) => {
    alert(`Failed to read level file. ${error}`)
  })
}

function loadLevelFromText(fileText: string, newMode: "edit" | "play"): boolean {
  // Load level or playthrough, and return whether it succeeded...
  // Or, may throw an error while loading a playthrough.

  if (!setActivityMode(newMode)) return false

  // TODO: handle edit mode vs. play mode undo stacks
  // This is complicated, in part due to trying to snapshot for transactional error handling.
  // The snapshot may be of either set of stacks, depending on the previous edit mode state.
  // I also want to preserve the undo history across levels,
  // and then there's playthroughs to think about, which, by the way,
  // should only save the history of one level, NOT across levels,
  // in order to store proof of playability for a level without unnecessary data.

  const before = {
    state: serialize(),
    undos: [...undos],
    redos: [...redos],
  }
  undoable()
  // not allowing whitespace but this is just a temporary file format with no proper identifier, for playthroughs
  if (fileText.startsWith('[')) {
    // TODO: error handling; also, I just realized loadLevelFromText will be at
    // two places in the call stack in this case. Might be able to simplify by having
    // loadPlaythrough (or a replacement with a new name) return the GameState string to load,
    // which would be loaded subsequently in this function, but not recursively.
    loadPlaythrough(fileText)
    return true // it's not a lie because it didn't throw an error™ (if it got here)
  } else {
    try {
      // TODO: set editor level state regardless of edit mode,
      // MAYBE clear editor undos/redos
      // TODO: PRESERVE undos/redos while playing, across levels
      deserialize(fileText)
      if (!activePlayer) {
        // Ideally, levels would be saved with an active player, but currently there's nothing to activate a player in edit mode,
        // and anyway I have a bunch of levels saved at this point.
        for (const entity of entities) {
          if (entity instanceof Snake) {
            setActivePlayer(entity)
            break
          }
        }
      }
    } catch (error) {
      deserialize(before.state)
      undos.splice(0, undos.length, ...before.undos)
      redos.splice(0, redos.length, ...before.redos)
      alert(`Failed to load level. ${(error as Error).toString()}`)
      return false
    }
    hideScreens({ except: ["level-splash"] }) // level splash is shown early to mask loading time
    return true
  }
}

export function openLevel() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'application/json'
  input.addEventListener('change', () => {
    const file = input.files?.[0]
    if (!file) return
    loadLevel(file, "edit")
  })
  input.click()
}
