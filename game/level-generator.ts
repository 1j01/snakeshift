import { Block } from "./block"
import { Food } from "./food"
import { analyzeMoveAbsolute, dragSnake, takeMove } from "./game-logic"
import { deserialize, entities, levelInfo, serialize, undo } from "./game-state"
import { hitTestAllEntities, invertCollisionLayer, layersCollide, shuffle, topLayer, withinLevel } from "./helpers"
import Snake from "./snake"
import { CollisionLayer, DIRECTIONS, Move } from "./types"

export async function generateLevel() {
  const tries = 20
  let bestComplexity = 0
  let bestLevel = null
  for (let i = 0; i < tries; i++) {
    const complexity = tryGenerateLevel().estimatedPuzzleComplexity
    await new Promise(resolve => setTimeout(resolve, 100)) // give the UI a chance to update, avoid crashing the browser
    if (complexity > bestComplexity) {
      bestComplexity = complexity
      bestLevel = serialize()
    }
  }
  console.log("Best complexity found:", bestComplexity)
  if (bestLevel) {
    deserialize(bestLevel)
  }
}

function tryGenerateLevel() {
  const puzzleGenerationLimit = 10000
  const targetPuzzleComplexity = 100
  const blockDensity = 0.3
  const foodChance = 0.3

  // I think smaller levels should be statistically more likely to generate
  // "puzzle"-like levels rather than meaningless traversal.
  levelInfo.width = 2 + Math.floor(Math.random() * 5)
  levelInfo.height = 2 + Math.floor(Math.random() * 5)
  entities.length = 0

  // Create blocks
  for (let x = 0; x < levelInfo.width; x++) {
    for (let y = 0; y < levelInfo.height; y++) {
      if (Math.random() < blockDensity) {
        const block = new Block()
        block.x = x
        block.y = y
        entities.push(block)
      }
    }
  }

  // Create snakes
  const nSnakes = 1 + Math.floor(Math.random() * 3)
  for (let i = 0; i < nSnakes; i++) {
    const snake = new Snake()
    entities.push(snake) // push early so that hitTestAllEntities includes the snake itself
    snake.segments.length = 0
    let x = Math.floor(Math.random() * levelInfo.width)
    let y = Math.floor(Math.random() * levelInfo.height)
    const hits = hitTestAllEntities(x, y)
    let layer = CollisionLayer.White
    if (hits.length > 0) {
      layer = invertCollisionLayer(hits[0].layer)
    }
    snake.segments.push({ x, y, width: 1, height: 1, layer })
    const targetSnakeEndLength = 2 + Math.floor(Math.random() * 10)
    for (let j = 1; j < targetSnakeEndLength; j++) {
      // Try to place the next segment in a random direction
      const directions = [...DIRECTIONS]
      shuffle(directions)
      for (const direction of directions) {
        if (!withinLevel({ x: x + direction.x, y: y + direction.y, width: 1, height: 1 })) {
          continue
        }
        const hits = hitTestAllEntities(x + direction.x, y + direction.y)
        if (!layersCollide(topLayer(hits), layer)) {
          x += direction.x
          y += direction.y
          snake.segments.push({ x, y, width: 1, height: 1, layer })
          break
        }
      }
    }
  }

  // Simulate in reverse, occasionally creating collectables and shrinking snakes as they move backwards
  const moves: Move[] = []
  for (let i = 0; i < puzzleGenerationLimit; i++) {

    const snakes = entities.filter(e => e instanceof Snake) as Snake[]
    const snake = snakes[Math.floor(Math.random() * snakes.length)]
    const direction = DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)]
    const potentialBeforeTile = {
      x: snake.segments[snake.segments.length - 1].x - direction.x,
      y: snake.segments[snake.segments.length - 1].y - direction.y,
      width: 1,
      height: 1,
    }
    if (!withinLevel(potentialBeforeTile)) {
      continue
    }
    // TODO: technically should ignore opposite end of the snake since moving onto your tail is valid
    // I have logic to conditionally ignore the tail, but would need to conditionally ignore the head since we're simulating backwards
    const hits = hitTestAllEntities(potentialBeforeTile.x, potentialBeforeTile.y)
    if (!layersCollide(topLayer(hits), snake.segments[0].layer)) {
      // I originally added undoable() here to debug the level generation,
      // then used it for the core logic of level generation, for backtracking.
      // However, it's inefficient, ESPECIALLY if we're also calling serialize()
      // and I was getting lots of browser tab crashes, so I optimized it to
      // use deserialize() instead, and restore the `growOnNextMove` property
      // which is the only thing changed before the snapshot.
      // Still getting browser tab crashes, though,
      // so it'd be better to avoid serialization altogether.
      // Or reimplement this in C or something.
      // undoable()
      const prevGrowOnNextMove = snake.growOnNextMove
      const eat = Math.random() < foodChance && snake.segments.length > 1
      // `growOnNextMove` is supposed to be set after eating,
      // so we have to do it before the reverse move, and before the `expected` snapshot,
      // because 
      snake.growOnNextMove = eat
      const expected = serialize()
      const previousHead = { ...snake.segments[0] }
      // FIXME: it's not validating in the case that it generates a collectable
      if (eat) {
        const food = new Food()
        food.x = snake.segments[0].x
        food.y = snake.segments[0].y
        food.layer = snake.segments[0].layer
        entities.push(food)
      }
      dragSnake(snake, snake.segments.length - 1, potentialBeforeTile)
      if (eat) {
        snake.segments.pop() // shrink the snake, TODO: is this the right end?
        // snake.segments.shift()
      }
      const move = analyzeMoveAbsolute(snake, previousHead)
      if (!move.valid) {
        // console.log("Undoing generated invalid move:", move)
        // backtrack if the move is invalid
        deserialize(expected); snake.growOnNextMove = prevGrowOnNextMove // undo()
        continue
      }
      // Also need to check that game state matches exactly if simulating forwards
      // because the move may be valid, but it won't give the expected game state.
      // Entities may be ordered differently.
      // Note: this MAY be too limiting, comparing the total entity order
      // Comparing some sort of partial order may be better, but more complex and error-prone.
      // I haven't determined that it's necessary, but this may be subtly rejecting
      // more interesting puzzles, if there's a case where the entities are
      // effectively ordered the same, but irrelevant disorder exists,
      // and this aligns with characteristics of interesting puzzles.
      takeMove(move)
      const actual = serialize()
      undo() // always undo takeMove done just for validation
      if (actual !== expected) {
        // console.log("Undoing generated move which gave an inconsistent game state:", {
        //   expected,
        //   actual,
        //   move,
        // })
        // backtrack if validation failed
        deserialize(expected); snake.growOnNextMove = prevGrowOnNextMove // undo()
        continue
      }
      moves.push(move)
      if (moves.length >= targetPuzzleComplexity) {
        break
      }
    }
  }

  // TODO: for a better complexity estimate, we could try to contract the playthrough
  // by removing moves that are not necessary to solve the puzzle.
  // (We could also crop the level afterwards, to the bounding box of moved snakes across all moves,
  // although it wouldn't affect the complexity.)
  const numFood = entities.filter(e => e instanceof Food).length
  const puzzleSteps = moves.length
  const totalMoveComplexity = moves.reduce((sum, move) => {
    return sum + 1 + (move.entitiesThere.length * 2 + move.entitiesToPush.length * 3)
  }, 0)
  const stats = {
    puzzleSteps,
    numFood,
    totalMoveComplexity,
    // totalMoveComplexity already includes puzzleSteps, numFood, effectively
    estimatedPuzzleComplexity: totalMoveComplexity
  }
  console.log("Generated a puzzle that can be solved in", puzzleSteps, "steps (likely fewer)", stats)
  return stats
}
