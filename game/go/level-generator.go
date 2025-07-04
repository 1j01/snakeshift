package main

import (
	"fmt"
	"math/rand"
)

func GenerateLevel() Level {
	const puzzleGenerationLimit = 10000
	const targetPuzzleComplexity = 100
	const blockDensity = 0.3
	const foodChance = 0.3

	// I think smaller levels should be statistically more likely to generate
	// "puzzle"-like levels rather than meaningless traversal.
	width := rand.Intn(5) + 2
	height := rand.Intn(5) + 2

	withinLevel := func(point Point) bool {
		return point.X >= 0 && point.X < width && point.Y >= 0 && point.Y < height
	}

	level := Level{
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

	// // Randomly place foods
	// for i := 0; i < numFoods; i++ {
	// 	x := rand.Intn(width)
	// 	y := rand.Intn(height)
	// 	layer := CollisionLayer(rand.Intn(3)) // 0, 1, or 2
	// 	level.Foods = append(level.Foods, Food{Position: Point{X: x, Y: y}, Layer: layer})
	// }

	// // Randomly place snakes
	// for i := 0; i < numSnakes; i++ {
	// 	snake := Snake{ID: i + 1}
	// 	snake.Segments = append(snake.Segments, Point{X: rand.Intn(width), Y: rand.Intn(height)})
	// 	level.Snakes = append(level.Snakes, snake)
	// }

	// Create snakes
	numSnakes := rand.Intn(3) + 1
	for i := 0; i < numSnakes; i++ {
		snake := Snake{ID: i + 1}
		x := rand.Intn(width)
		y := rand.Intn(height)
		snake.Segments = []Point{{X: x, Y: y}}
		hits := hitTestAllEntities(x, y)
		layer := White
		if len(hits) > 0 {
			layer = invertCollisionLayer(hits[0].layer)
		}
		snake.Segments = append(snake.Segments, Point{X: x, Y: y})
		targetSnakeEndLength := 2 + rand.Intn(10)
		for j := 1; j < targetSnakeEndLength; j++ {
			// Try to place the next segment in a random direction
			directionOrder := rand.Perm(len(CardinalDirections))
			for _, directionIndex := range directionOrder {
				direction := CardinalDirections[directionIndex]
				if !withinLevel(Point{X: x + direction.X, Y: y + direction.Y}) {
					continue
				}
				hits := hitTestAllEntities(x+direction.X, y+direction.Y)
				if !layersCollide(topLayer(hits), layer) {
					x += direction.X
					y += direction.Y
					snake.Segments = append(snake.Segments, Point{X: x, Y: y})
					break
				}
			}
		}
	}

	return level
}

func main() {
	level := GenerateLevel()
	serialized, err := SerializeLevel(level)
	if err != nil {
		fmt.Println("Error serializing level:", err)
		return
	}
	// fmt.Println("Serialized Level:", serialized)
	fmt.Println(string(serialized))
}
