import { playMelodicSound, playSound } from "./audio"
import { Block } from "./block"
import { Collectable } from "./collectable"
import { Crate } from "./crate"
import Entity from "./entity"
import { Food } from "./food"
import { checkLevelWon } from "./game"
import { entities, undoable } from "./game-state"
import { hitTestAllEntities, invertCollisionLayer, layersCollide, sortEntities, topLayer, translateEntity, withinLevel } from "./helpers"
import { Inverter } from "./inverter"
import { RectangularEntity } from "./rectangular-entity"
import Snake from "./snake"
import { CollisionLayer, Move, Tile } from "./types"

export function analyzeMoveAbsolute(snake: Snake, tile: Tile): Move {
  // Using Math.sign() here would lead to checking if moving to an adjacent tile is valid,
  // even when a further tile is in question.
  // const dirX = Math.sign(tile.x - snake.segments[0].x)
  // const dirY = Math.sign(tile.y - snake.segments[0].y)
  const deltaGridX = Math.round(tile.x - snake.segments[0].x)
  const deltaGridY = Math.round(tile.y - snake.segments[0].y)
  return analyzeMoveRelative(snake, deltaGridX, deltaGridY)
}
export function analyzeMoveRelative(snake: Snake, dirX: number, dirY: number): Move {
  const head = snake.segments[0]
  const deltaX = dirX * head.width
  const deltaY = dirY * head.height
  const x = head.x + deltaX
  const y = head.y + deltaY
  const hitsAhead = hitTestAllEntities(x, y, { ignoreTailOfSnake: snake.growOnNextMove ? undefined : snake })
  const hitsAllAlong = snake.segments.flatMap(segment => hitTestAllEntities(segment.x, segment.y))
  const encumbered = hitsAllAlong.some(hit =>
    hit.entity.solid &&
    hit.entity !== snake &&
    entities.indexOf(hit.entity) > entities.indexOf(snake)
  )

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
    snake.segments.length > 1 &&
    dirX === Math.sign(snake.segments[1].x - head.x) &&
    dirY === Math.sign(snake.segments[1].y - head.y)

  // I think I will need to move to a system where the move is simulated and then checked for validity,
  // to avoid the complexity of adding exceptions to game state access, when answering hypotheticals.
  // This could also help with animating undo/redo, which currently replaces all the entities, resetting animation timers,
  // and for the level editor, where I'd like to check for collisions to show warnings,
  // (but allow the collisions to happen so that editing isn't its own puzzle.)
  // If moves are analyzed by checking for collisions within a whole game board,
  // it could share some code. Theoretically.

  // Push objects
  const entitiesToPush: Entity[] = []
  {
    const hit = hitsAhead.find(hit => hit.entity.solid)
    // TODO: try pushing other snakes too
    // TODO: recursively push crates
    if (hit?.entity instanceof Crate) {
      // Check if the crate can be pushed
      const newTile = { x: hit.entity.x + deltaX, y: hit.entity.y + deltaY, width: hit.entity.width, height: hit.entity.height }
      const hitsAheadCrate = hitTestAllEntities(newTile.x, newTile.y, { ignoreTailOfSnake: snake })
      if (
        withinLevel(newTile) &&
        layersCollide(hit.entity.layer, head.layer) &&
        !layersCollide(topLayer(hitsAheadCrate), hit.entity.layer)
      ) {
        entitiesToPush.push(hit.entity)
        const boxedCollectable = hitsAhead.find(hit => hit.entity instanceof Collectable)
        if (boxedCollectable) {
          entitiesToPush.push(boxedCollectable.entity)
        }
      }
    }
  }
  // Ignore pushed objects as obstacles
  for (const entity of entitiesToPush) {
    const index = hitsAhead.findIndex(hit => hit.entity === entity)
    if (index !== -1) {
      hitsAhead.splice(index, 1)
    }
  }

  return {
    // snakeId: snake.id,
    snake,
    valid:
      (dirX === 0 || dirY === 0) &&
      (Math.abs(dirX) === 1 || Math.abs(dirY) === 1) &&
      withinLevel({ x, y, width: head.width, height: head.height }) &&
      !movingBackwards &&
      !encumbered &&
      !layersCollide(topLayer(hitsAhead), head.layer),
    encumbered,
    to: { x, y, width: head.width, height: head.height },
    delta: { x: deltaX, y: deltaY },
    entitiesThere: hitsAhead.map(hit => hit.entity),
    entitiesToPush,
  }
}

export function canMove(snake: Snake): boolean {
  return analyzeMoveRelative(snake, 1, 0).valid ||
    analyzeMoveRelative(snake, 0, 1).valid ||
    analyzeMoveRelative(snake, -1, 0).valid ||
    analyzeMoveRelative(snake, 0, -1).valid
}
export function takeMove(move: Move): void {
  // const snake = entities.find(entity => entity instanceof Snake && entity.id === move.snakeId) as Snake
  const snake = move.snake
  undoable()
  playSound('move')
  if (snake.growOnNextMove) {
    growSnake(snake)
    snake.growOnNextMove = false
  }
  const head = snake.segments[0]
  for (let i = snake.segments.length - 1; i > 0; i--) {
    const segment = snake.segments[i]
    const prev = snake.segments[i - 1]
    segment.x = prev.x
    segment.y = prev.y
  }
  head.x = move.to.x
  head.y = move.to.y
  head.width = move.to.width
  head.height = move.to.height
  // Sort entities so the snake is on top of anything it's moving onto.
  // This handles the visual as well as making it so
  // you can't double back while inside an inverse snake.
  // Exclude non-solid collectables, since, if you don't eat them (because they're a different color),
  // they should stay visible.
  // (Collectables are automatically sorted on top at level design time.)
  const ontoIndices = move.entitiesThere.filter(e => e.solid).map(e => entities.indexOf(e))
  const maxIndex = Math.max(...ontoIndices)
  const thisIndex = entities.indexOf(snake)
  if (thisIndex < maxIndex) {
    // Add before removing so relevant indices
    // stay valid for both splice calls.
    entities.splice(maxIndex + 1, 0, snake)
    entities.splice(thisIndex, 1)
  }
  // Push objects
  if (move.entitiesToPush.length > 0) {
    playSound('pushCrate', { playbackRate: Math.random() * 0.1 + 0.95, volume: 0.3 })
  }
  for (const entity of move.entitiesToPush) {
    translateEntity(entity, move.delta.x, move.delta.y)
    entities.splice(entities.indexOf(entity), 1)
    entities.push(entity)
  }
  // Ensure collectables are on top of crates, so that you can scoop up collectables inside crates to push them around.
  if (move.entitiesToPush.length > 0) {
    sortEntities()
  }
  // Eat collectables
  for (const entity of move.entitiesThere) {
    if (
      entity instanceof Collectable &&
      layersCollide(entity.layer, head.layer) &&
      !move.entitiesToPush.includes(entity)
    ) {
      entities.splice(entities.indexOf(entity), 1)
      if (entity instanceof Food) {
        snake.growOnNextMove = true
        if (!checkLevelWon()) {
          playMelodicSound('eat', snake.getNextMelodyIndex())
        }
      } else if (entity instanceof Inverter) {
        invertSnake(snake)
      }
    }
  }
}
function growSnake(snake: Snake): void {
  const tail = snake.segments[snake.segments.length - 1]
  // This only works because SnakeSegment is a flat object.
  const newTail = { ...tail }
  snake.segments.push(newTail)
}
function invertSnake(snake: Snake): void {
  // See also: `invert` function in level-editor.ts
  const handledEntities = new Set<Entity>()
  const handledPositions = new Set<`${number},${number}`>()

  function handleEntity(entity: Entity) {
    if (handledEntities.has(entity)) {
      return
    }
    handledEntities.add(entity)
    if (entity instanceof RectangularEntity) {
      entity.layer = invertCollisionLayer(entity.layer)
    } else if (entity instanceof Snake) {
      for (const segment of entity.segments) {
        handlePosition(segment.x, segment.y)
        segment.layer = invertCollisionLayer(segment.layer)
      }
    }
  }

  function handlePosition(x: number, y: number) {
    if (handledPositions.has(`${x},${y}`)) {
      return
    }
    handledPositions.add(`${x},${y}`)
    const hits = hitTestAllEntities(x, y)
    for (const hit of hits) {
      handleEntity(hit.entity)
    }
  }

  handleEntity(snake)

  for (const pos of handledPositions) {
    const [x, y] = pos.split(',').map(Number)
    const hits = hitTestAllEntities(x, y)
    if (!hits.some((hit) => hit.entity instanceof Block)) {
      // add a white block where there was implicit black
      const block = new Block()
      block.layer = CollisionLayer.White
      block.x = x
      block.y = y
      entities.unshift(block)
    }
  }
}
