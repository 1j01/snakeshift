import Entity from './entity'
import { entities, onUpdate, postUpdate, undoable } from './game-state'
import { hitTestAllEntities, makeEntity, sameTile, sortEntities } from './helpers'
import { RectangularEntity } from './rectangular-entity'
import { drawEntities, pageToWorldTile } from './rendering'
import Snake from './snake'
import { setHighlight } from './tile-highlight'
import { CollisionLayer, Tile } from './types'

let dragging: Entity | undefined = undefined

export function initLevelEditorGUI() {

  const entitiesBar = document.getElementById('entities-bar')!
  const entityButtons = entitiesBar.querySelectorAll('.entity-button')
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
    function startPlacing() {
      if (dragging) {
        return // avoid doubly adding from click after pointerdown
      }
      undoable()
      const entityInstance = makeColoredEntity()
      entities.push(entityInstance)
      sortEntities()
      dragging = entityInstance
      postUpdate()
    }
    button.addEventListener('click', startPlacing) // allow for click to work for keyboard/other accessibility
    button.addEventListener('pointerdown', startPlacing) // allow dragging from button, to place in one gesture
    const canvas = document.createElement('canvas')
    canvas.width = 48
    canvas.height = 48
    const ctx = canvas.getContext('2d')!
    button.prepend(canvas)
    const entityForButton = makeColoredEntity()
    ctx.translate(8, 8)
    ctx.scale(32, 32)
    drawEntities(ctx, [entityForButton])
  }

}

export function handleInputForLevelEditing(
  eventTarget: HTMLElement,
) {

  // TODO: DRY/simplify event handling
  const listenerCleanupFunctions: (() => void)[] = []
  function on<K extends keyof HTMLElementEventMap>(eventTarget: HTMLElement, type: K, listener: (this: HTMLElement, ev: HTMLElementEventMap[K]) => void, options?: boolean | AddEventListenerOptions): void;
  function on<K extends keyof WindowEventMap>(eventTarget: Window, type: K, listener: (this: Window, ev: WindowEventMap[K]) => void, options?: boolean | AddEventListenerOptions): void;
  function on(eventTarget: HTMLElement | Window, type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void {
    eventTarget.addEventListener(type, listener, options)
    listenerCleanupFunctions.push(() => eventTarget.removeEventListener(type, listener, options))
  }

  function removeEventListeners() {
    for (const cleanup of listenerCleanupFunctions) {
      cleanup()
    }
  }

  // ------------
  // Highlighting
  // ------------

  // TODO: negotiate highlighting with input.ts
  // maybe add/remove listeners for editor mode vs. play mode

  function updateHighlight() {
    let pressed = false
    if (pointerDownTile && mouseHoveredTile) {
      pressed = sameTile(mouseHoveredTile, pointerDownTile)
    }
    setHighlight(mouseHoveredTile, { pressed, valid: mouseHoveredTile ? hitTestAllEntities(mouseHoveredTile.x, mouseHoveredTile.y).entitiesThere.length > 0 : false })
  }

  // Handles viewport resize... sorta letting this get repurposed. `onUpdate` isn't a good name, it kinda invites over-extension.
  onUpdate(updateHighlight)

  // -----------------------
  // Mouse/pen/touch support
  // -----------------------

  let pointerDownTile: Tile | undefined = undefined
  let mouseHoveredTile: Tile | undefined = undefined
  on(eventTarget, 'pointerdown', (event: PointerEvent) => {
    pointerDownTile = pageToWorldTile(event)
    if (pointerDownTile && !dragging) {
      // TODO: consider reversing the array to be topmost first
      const hit = hitTestAllEntities(pointerDownTile.x, pointerDownTile.y)
      dragging = hit.entitiesThere[hit.entitiesThere.length - 1]
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
    }
    pointerDownTile = undefined
    updateHighlight()
  })

  on(eventTarget, 'pointercancel', () => {
    // TODO: undo and delete undoable?
    pointerDownTile = undefined
    dragging = undefined
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
          if (
            dragging.segments[0].x !== mouseHoveredTile.x ||
            dragging.segments[0].y !== mouseHoveredTile.y
          ) {
            for (let i = dragging.segments.length - 1; i > 0; i--) {
              const follower = dragging.segments[i]
              const leader = dragging.segments[i - 1]
              follower.x = leader.x
              follower.y = leader.y
            }
            dragging.segments[0].x = mouseHoveredTile.x
            dragging.segments[0].y = mouseHoveredTile.y
          }
        }
      }
    }
    // TODO: only with significant movement, such as moving to a new tile
    updateHighlight()
  })

  // ------------
  return removeEventListeners
}
