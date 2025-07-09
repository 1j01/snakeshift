package main

import (
	"fmt"
	"math/rand"
	"os"
)

func GenerateLevel() *Level {
	const tries = 200
	var bestComplexity int
	var bestLevel *Level
	for i := 0; i < tries; i++ {
		level, complexity := tryGenerateLevel()
		// time.Sleep(100 * time.Millisecond)
		if complexity > bestComplexity {
			bestComplexity = complexity
			bestLevel = level
		}
	}
	fmt.Fprintf(os.Stderr, "Best complexity found: %d\n", bestComplexity)
	return bestLevel
}

func tryGenerateLevel() (*Level, int) {
	const puzzleGenerationLimit = 10000
	const targetPuzzleComplexity = 1000
	const blockDensity = 0.3
	const foodChance = 0.9

	// I think smaller levels should be statistically more likely to generate
	// "puzzle"-like levels rather than meaningless traversal.
	width := rand.Intn(5) + 2
	height := rand.Intn(5) + 2

	level := &Level{
		Info:     LevelInfo{Width: width, Height: height},
		Grid:     make([][]CollisionLayer, height),
		Entities: make([]Entity, 0, 100),
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
		level.Entities = append(level.Entities, &Snake{ID: fmt.Sprint(i + 1)})
		snake := level.Entities[i].(*Snake)
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

	// Simulate in reverse, occasionally creating collectables and shrinking snakes as they move backwards
	var moves []Move
	for i := 0; i < puzzleGenerationLimit; i++ {
		snakes := getSnakes(level)
		snake := snakes[rand.Intn(len(snakes))]
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
		hits := hitTestAllEntities(potentialBeforeTile.X, potentialBeforeTile.Y, level, HitTestOptions{
			// IgnoreHeadOfSnake: snake,
		})
		if !layersCollide(topLayer(hits), snake.Layer) {
			prevGrowOnNextMove := snake.GrowOnNextMove
			// const eat = Math.random() < foodChance && snake.segments.length > 1
			previousHead := snake.Segments[0]
			eat := rand.Float32() < foodChance && len(snake.Segments) > 1 &&
				// prevent generating food on top of other food
				len(filter(hitTestAllEntities(previousHead.X, previousHead.Y, level, HitTestOptions{}), func(hit Hit) bool {
					_, isFood := hit.Entity.(*Food)
					return isFood
				})) == 0
			// `GrowOnNextMove` is supposed to be set after eating,
			// so we have to do it before the reverse move, and before the `expected` snapshot
			snake.GrowOnNextMove = eat
			expected := copyLevel(level)
			// FIXME: it's not validating in the case that it generates a collectable
			if eat {
				food := &Food{}
				food.Position = previousHead
				food.Layer = snake.Layer
				level.Entities = append(level.Entities, food)
			}
			// dragSnake(snake, len(snake.Segments)-1, potentialBeforeTile)
			moveSnakeByTail(snake, potentialBeforeTile)
			if eat {
				snake.Segments = snake.Segments[:len(snake.Segments)-1] // shrink the snake, TODO: is this the right end?
			}
			move := AnalyzeMoveAbsolute(snake, previousHead, level)
			if !move.Valid {
				// fmt.Fprintf(os.Stderr, "Undoing generated invalid move:", move)
				// backtrack if the move is invalid
				level = expected
				snake.GrowOnNextMove = prevGrowOnNextMove
				continue
			}
			// Also need to check that game state matches exactly if simulating forwards
			// because the move may be valid in isolation, but not as a way to get to the expected state.
			// In other words, it can be valid move without being a valid precondition.
			// Entities may be ordered differently.
			// Note: this MAY be too limiting, comparing the total entity order
			// Comparing some sort of partial order may be better, but more complex and error-prone.
			// I haven't determined that it's necessary, but this may be subtly rejecting
			// more interesting puzzles, if there's a case where the entities are
			// effectively ordered the same, but irrelevant disorder exists,
			// and this aligns with characteristics of interesting puzzles.
			beforeMove := copyLevel(level)
			TakeMove(move, level)
			actual := copyLevel(level)
			level = beforeMove // always undo takeMove done just for validation
			// if actual != expected {
			if !Equal(expected, actual) {
				// expectedJSON, _ := SerializeLevel(expected)
				// actualJSON, _ := SerializeLevel(actual)
				// fmt.Fprint(os.Stderr, "Undoing generated move which gave an inconsistent game state:", map[string]interface{}{
				// 	"expectedJSON":               string(expectedJSON),
				// 	"actualJSON":                 string(actualJSON),
				// 	"expectedJSON == actualJSON": slices.Equal(expectedJSON, actualJSON),
				// 	"move":                       move,
				// })

				// // Save expected and actual to files for debugging
				// os.WriteFile("expected.json", expectedJSON, 0644)
				// os.WriteFile("actual.json", actualJSON, 0644)
				// os.Exit(1)

				// backtrack if validation failed
				level = expected
				snake.GrowOnNextMove = prevGrowOnNextMove
				continue
			}
			moves = append(moves, move)
			if len(moves) >= targetPuzzleComplexity {
				break
			}
		}
	}

	complexity := 0
	for _, move := range moves {
		// complexity += 1 + len(move.EntitiesThere)*2 //+ len(move.entitiesToPush) * 3
		complexity += len(move.EntitiesThere)
	}

	return level, complexity
}
