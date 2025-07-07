package main

import "math/rand"

func shuffle[T any](slice []T) {
	for i := range slice {
		j := rand.Intn(i + 1)
		slice[i], slice[j] = slice[j], slice[i]
	}
}

func sign(x int) int {
	// Alternatively:
	// return int(math.Copysign(1, float64(x)))
	if x > 0 {
		return 1
	} else if x < 0 {
		return -1
	}
	return 0
}

func abs(x int) int {
	// Alternatively:
	// return int(math.Abs(float64(x)))
	if x < 0 {
		return -x
	}
	return x
}

func invertCollisionLayer(layer CollisionLayer) CollisionLayer {
	switch layer {
	case White:
		return Black
	case Black:
		return White
	default:
		return layer
	}
}

func layersCollide(a CollisionLayer, b CollisionLayer) bool {
	return (a & b) != 0
}

func withinLevel(point Point, level *Level) bool {
	return point.X >= 0 && point.X < level.Info.Width && point.Y >= 0 && point.Y < level.Info.Height
}

func topLayerAt(x, y int, level *Level) CollisionLayer {
	if !withinLevel(Point{X: x, Y: y}, level) {
		return Both
	}
	// Snakes are in draw order, so we must iterate in reverse to look at topmost snakes first.
	for i := len(level.Snakes) - 1; i >= 0; i-- {
		snake := level.Snakes[i]
		for _, segment := range snake.Segments {
			if segment.X == x && segment.Y == y {
				return snake.Layer
			}
		}
	}
	return level.Grid[y][x]
}

func copyLevel(level *Level) *Level {
	newGrid := make([][]CollisionLayer, len(level.Grid))
	for i := range level.Grid {
		newGrid[i] = make([]CollisionLayer, len(level.Grid[i]))
		copy(newGrid[i], level.Grid[i])
	}

	newFoods := make([]Food, len(level.Foods))
	copy(newFoods, level.Foods)

	newSnakes := make([]Snake, len(level.Snakes))
	for i, snake := range level.Snakes {
		newSnakes[i] = Snake{
			ID:             snake.ID,
			Segments:       append([]Point(nil), snake.Segments...),
			GrowOnNextMove: snake.GrowOnNextMove,
			Layer:          snake.Layer,
		}
	}

	return &Level{
		Info:   level.Info,
		Grid:   newGrid,
		Foods:  newFoods,
		Snakes: newSnakes,
	}
}

func copyGame(g *Game) *Game {
	game := &Game{
		level: copyLevel(g.level),
	}
	for i, snake := range g.level.Snakes {
		if snake.ID == g.activeSnake.ID {
			game.activeSnake = &game.level.Snakes[i]
		}
	}
	return game
}

var CardinalDirections = []Point{
	{X: 1, Y: 0},
	{X: 0, Y: 1},
	{X: -1, Y: 0},
	{X: 0, Y: -1},
}
