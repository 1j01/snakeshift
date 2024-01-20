import { Block } from './block'
import { Collectable } from './collectable'
import Entity from './entity'
import { entities, postUpdate, undoable } from './game-state'
import { hitTestAllEntities, makeEntity, sameTile } from './helpers'
import { pageToWorldTile } from './rendering'
import Snake from './snake'
import { setHighlight } from './tile-highlight'
import { CollisionLayer, Tile } from './types'

export function handleInputForLevelEditing(
  eventTarget: HTMLElement,
) {

  let placing: Entity | undefined = undefined

  // ------------
  // Entities bar
  // ------------

  const entitiesBar = document.getElementById('entities-bar')!
  const entityButtons = entitiesBar.querySelectorAll('.entity-button')
  for (const button of entityButtons) {
    button.addEventListener('click', () => {
      const entityName = button.getAttribute('data-entity')!
      const entityColor = button.getAttribute('data-color')!
      const entityInstance = makeEntity(entityName)
      const layer = entityColor === "White" ? CollisionLayer.White : entityColor === "Black" ? CollisionLayer.Black : CollisionLayer.None
      if (entityInstance instanceof Snake) {
        for (const segment of entityInstance.segments) {
          segment.layer = layer
        }
      } else if (entityInstance instanceof Block || entityInstance instanceof Collectable) {
        entityInstance.layer = layer
      }
      undoable()
      entities.push(entityInstance)
      placing = entityInstance
      postUpdate()
    })
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
    setHighlight(mouseHoveredTile, pressed)
  }

  // -----------------------
  // Mouse/pen/touch support
  // -----------------------

  let pointerDownTile: Tile | undefined = undefined
  let mouseHoveredTile: Tile | undefined = undefined
  eventTarget.addEventListener('pointerdown', (event: MouseEvent) => {
    pointerDownTile = pageToWorldTile(event)
    if (pointerDownTile && !placing) {
      // TODO: consider reversing the array to be topmost first
      const hit = hitTestAllEntities(pointerDownTile.x, pointerDownTile.y)
      placing = hit.entitiesThere[hit.entitiesThere.length - 1]
      if (placing) {
        undoable()
      }
      updateHighlight()
    }
  })

  eventTarget.addEventListener('pointerup', (event: MouseEvent) => {
    const pointerUpTile = pageToWorldTile(event)
    if (
      pointerUpTile
      // pointerUpTile &&
      // pointerDownTile &&
      // sameTile(pointerUpTile, pointerDownTile)
    ) {
      // undoable is covered at start of drag or addition of a new entity
      placing = undefined
    }
    pointerDownTile = undefined
    updateHighlight()
  })

  eventTarget.addEventListener('pointercancel', () => {
    // TODO: undo and delete undoable?
    pointerDownTile = undefined
    placing = undefined
    updateHighlight()
  })

  eventTarget.addEventListener('pointermove', (event: MouseEvent) => {
    const coordinates = pageToWorldTile(event)
    mouseHoveredTile = undefined
    if (coordinates) {
      mouseHoveredTile = coordinates
      if (placing) {
        if (placing instanceof Block || placing instanceof Collectable) {
          placing.x = mouseHoveredTile.x
          placing.y = mouseHoveredTile.y
        } else if (placing instanceof Snake) {
          placing.segments[0].x = mouseHoveredTile.x
          placing.segments[0].y = mouseHoveredTile.y
          for (let i = placing.segments.length - 1; i > 0; i--) {
            // TODO: work good
            const segment = placing.segments[i]
            const previousSegment = placing.segments[i - 1]
            segment.x = previousSegment.x
            segment.y = previousSegment.y
          }
        }
      }
    }
    // TODO: only with significant movement, such as moving to a new tile
    updateHighlight()
  })

}
