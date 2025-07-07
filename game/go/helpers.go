package main

import (
	"math/rand"
	"slices"
)

func shuffle[T any](slice []T) {
	for i := range slice {
		j := rand.Intn(i + 1)
		slice[i], slice[j] = slice[j], slice[i]
	}
}

func filter[T any](ss []T, test func(T) bool) (ret []T) {
	for _, s := range ss {
		if test(s) {
			ret = append(ret, s)
		}
	}
	return
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

func indexOfEntity(entity Entity, level *Level) int {
	for i := range level.Entities {
		// if snake.ID == entity.ID {
		if level.Entities[i] == entity { // FIXME?
			return i
		}
	}
	return -1 // Not found
}

func topLayerAt(x, y int, level *Level) CollisionLayer {
	if !withinLevel(Point{X: x, Y: y}, level) {
		return Both
	}
	// Entities are in draw order, so we must iterate in reverse to look at topmost entities first.
	for i := len(level.Entities) - 1; i >= 0; i-- {
		entity := level.Entities[i]
		if entity.At(x, y, HitTestOptions{}) != nil {
			return entity.GetLayer()
		}
	}
	return level.Grid[y][x]
}

func topLayer(hits []Hit, level *Level) CollisionLayer {
	for _, hit := range hits {
		// TODO: check entity is solid
		return hit.Layer
	}
	return Both
}

// Called "hitTestAllEntities" in original TS code,
// but now should be called "hitTestAllEntitiesAndGrid" since the blocks are no longer entities.
func hitTestAllEntities(x, y int, level *Level, options HitTestOptions) []Hit {
	var hits []Hit
	if !withinLevel(Point{X: x, Y: y}, level) {
		return hits
	}
	// Entities are in draw order, so we must iterate in reverse to look at topmost entities first.
	for i := len(level.Entities) - 1; i >= 0; i-- {
		entity := level.Entities[i]
		hit := entity.At(x, y, options)
		if hit != nil && hit.Entity != nil {
			hits = append(hits, *hit)
		}
	}
	hits = append(hits, Hit{
		Entity:       nil,
		SegmentIndex: -1,
		Layer:        level.Grid[y][x],
	})

	return hits
}

func copyLevel(level *Level) *Level {
	newGrid := make([][]CollisionLayer, len(level.Grid))
	for i := range level.Grid {
		newGrid[i] = make([]CollisionLayer, len(level.Grid[i]))
		copy(newGrid[i], level.Grid[i])
	}

	// newFoods := make([]Food, len(level.Foods))
	// copy(newFoods, level.Foods)

	// newSnakes := make([]Snake, len(level.Snakes))
	// for i, snake := range level.Snakes {
	// 	newSnakes[i] = Snake{
	// 		ID:             snake.ID,
	// 		Segments:       append([]Point(nil), snake.Segments...),
	// 		GrowOnNextMove: snake.GrowOnNextMove,
	// 		Layer:          snake.Layer,
	// 	}
	// }

	return &Level{
		Info:     level.Info,
		Grid:     newGrid,
		Entities: slices.Clone(level.Entities), // FIXME? snake segments?
	}
}

func copyGame(g *Game) *Game {
	game := &Game{
		level: copyLevel(g.level),
	}
	for _, entity := range g.level.Entities {
		if snake, ok := entity.(*Snake); ok {
			if snake.ID == g.activeSnake.ID {
				// game.activeSnake = &game.level.Entities[i]
				// game.activeSnake = &game.level.Entities[i].(*Snake)
				game.activeSnake = snake
			}
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
