package main

import (
	"math/rand"
)

func GenerateLevel() *Level {
	const puzzleGenerationLimit = 10000
	const targetPuzzleComplexity = 100
	const blockDensity = 0.3
	const foodChance = 0.3

	// I think smaller levels should be statistically more likely to generate
	// "puzzle"-like levels rather than meaningless traversal.
	width := rand.Intn(5) + 2
	height := rand.Intn(5) + 2

	level := &Level{
		Info:   LevelInfo{Width: width, Height: height},
		Grid:   make([][]CollisionLayer, height),
		Foods:  make([]Food, 0, 50),
		Snakes: make([]Snake, 0, 10),
	}

	// Initialize grid with random block types
	for i := range level.Grid {
		level.Grid[i] = make([]CollisionLayer, width)
		for j := range level.Grid[i] {
			if rand.Float32() < blockDensity {
				level.Grid[i][j] = White
			} else {
				level.Grid[i][j] = Black
			}
		}
	}

	// Create snakes
	numSnakes := rand.Intn(3) + 1
	for i := 0; i < numSnakes; i++ {
		x := rand.Intn(width)
		y := rand.Intn(height)
		// Get layer before appending snake so we don't retrieve the snake's own (uninitialized) layer
		layer := invertCollisionLayer(topLayerAt(x, y, level))
		// append early (before topLayerAt) so that hit tests include the snake itself
		level.Snakes = append(level.Snakes, Snake{ID: i + 1})
		snake := &level.Snakes[i]
		snake.Segments = []Point{{X: x, Y: y}}
		snake.Layer = layer
		targetSnakeEndLength := 2 + rand.Intn(10)
		for j := 1; j < targetSnakeEndLength; j++ {
			// Try to place the next segment in a random direction
			directionOrder := rand.Perm(len(CardinalDirections))
			for _, directionIndex := range directionOrder {
				direction := CardinalDirections[directionIndex]
				if !withinLevel(Point{X: x + direction.X, Y: y + direction.Y}, level) {
					continue
				}
				if !layersCollide(topLayerAt(x+direction.X, y+direction.Y, level), layer) {
					x += direction.X
					y += direction.Y
					snake.Segments = append(snake.Segments, Point{X: x, Y: y})
					break
				}
			}
		}
	}

	/*
		// Simulate in reverse, occasionally creating collectables and shrinking snakes as they move backwards
		var moves []Move
		for i := 0; i < puzzleGenerationLimit; i++ {
			snake := &level.Snakes[rand.Intn(len(level.Snakes))]
			direction := CardinalDirections[rand.Intn(len(CardinalDirections))]
			potentialBeforeTile := Point{
				X: snake.Segments[len(snake.Segments)-1].X - direction.X,
				Y: snake.Segments[len(snake.Segments)-1].Y - direction.Y,
			}
			if !withinLevel(potentialBeforeTile, level) {
				continue
			}
			// TODO: technically should ignore opposite end of the snake since moving onto your tail is valid
			// I have logic to conditionally ignore the tail, but would need to conditionally ignore the head since we're simulating backwards
			hits := hitTestAllEntities(potentialBeforeTile.X, potentialBeforeTile.Y)
			if !layersCollide(topLayer(hits, level), snake.Segments[0].Layer) {
				// I originally added undoable() here to debug the level generation,
				// then used it for the core logic of level generation, for backtracking.
				// However, it's inefficient, ESPECIALLY if we're also calling serialize()
				// and I was getting lots of browser tab crashes, so I optimized it to
				// use deserialize() instead, and restore the `growOnNextMove` property
				// which is the only thing changed before the snapshot.
				// Still getting browser tab crashes, though,
				// so it'd be better to avoid serialization altogether.
				// Or reimplement this in C or something. [Note: WIP porting TS to Go]
				// undoable()
				prevGrowOnNextMove := snake.GrowOnNextMove
				// const eat = Math.random() < foodChance && snake.segments.length > 1
				eat := rand.Float32() < foodChance && len(snake.Segments) > 1
				// `growOnNextMove` is supposed to be set after eating,
				// so we have to do it before the reverse move, and before the `expected` snapshot,
				// because
				snake.GrowOnNextMove = eat
				expected := serialize()
				previousHead := snake.Segments[0]
				// FIXME: it's not validating in the case that it generates a collectable
				if eat {
					food := Food{}
					food.Position = previousHead
					entities = append(entities, food)
				}
				dragSnake(snake, len(snake.Segments)-1, potentialBeforeTile)
				if eat {
					snake.Segments = snake.Segments[:len(snake.Segments)-1] // shrink the snake, TODO: is this the right end?
					// snake.segments.shift()
				}
				move := analyzeMoveAbsolute(snake, previousHead)
				if !move.valid {
					// console.log("Undoing generated invalid move:", move)
					// backtrack if the move is invalid
					deserialize(expected)
					snake.GrowOnNextMove = prevGrowOnNextMove
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
				actual := serialize()
				undo() // always undo takeMove done just for validation
				if actual != expected {
					// console.log("Undoing generated move which gave an inconsistent game state:", {
					//   expected,
					//   actual,
					//   move,
					// })
					// backtrack if validation failed
					deserialize(expected)
					snake.GrowOnNextMove = prevGrowOnNextMove
					continue
				}
				moves = append(moves, move)
				if len(moves) >= targetPuzzleComplexity {
					break
				}
			}
		}
	*/

	return level
}
