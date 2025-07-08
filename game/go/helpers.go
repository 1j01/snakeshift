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

func getSnakes(level *Level) []*Snake {
	// snakes := filter(level.Entities, func(entity Entity) bool {
	// 	_, isSnake := entity.(*Snake)
	// 	return isSnake
	// })//.([]*Snake)
	snakes := []*Snake{}
	for _, entity := range level.Entities {
		if snake, ok := entity.(*Snake); ok {
			snakes = append(snakes, snake)
		}
	}
	return snakes
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

func topLayer(hits []Hit) CollisionLayer {
	for _, hit := range hits {
		if hit.Entity != nil && !hit.Entity.IsSolid() {
			continue // Skip non-solid entities
		}
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

	newEntities := make([]Entity, len(level.Entities))
	for i, entity := range level.Entities {
		switch e := entity.(type) {
		case *Food:
			newEntities[i] = &Food{
				Position: Point{X: e.Position.X, Y: e.Position.Y},
				Layer:    e.Layer,
			}
		case *Snake:
			newEntities[i] = &Snake{
				ID:             e.ID,
				Segments:       slices.Clone(e.Segments),
				GrowOnNextMove: e.GrowOnNextMove,
				Layer:          e.Layer,
			}
		default:
			panic("Unknown entity type during level copy")
		}
	}

	return &Level{
		Info:     level.Info,
		Grid:     newGrid,
		Entities: newEntities, // slices.Clone(level.Entities), wouldn't that be nice?
	}
}

func copyGame(g *Game) *Game {
	game := &Game{
		level:     copyLevel(g.level),
		levelId:   g.levelId,
		levelName: g.levelName,
	}
	for _, entity := range game.level.Entities {
		if snake, ok := entity.(*Snake); ok {
			if snake.ID == g.activeSnake.ID {
				game.activeSnake = snake
			}
		}
	}
	return game
}

func hitsToEntities(hitsAhead []Hit) []Entity {
	entities := make([]Entity, 0, len(hitsAhead))
	for _, hit := range hitsAhead {
		if hit.Entity != nil {
			entities = append(entities, hit.Entity)
		}
	}
	return entities
}

func moveSnakeByHead(snake *Snake, to Point) {
	head := &snake.Segments[0]
	for i := len(snake.Segments) - 1; i > 0; i-- {
		snake.Segments[i].X = snake.Segments[i-1].X
		snake.Segments[i].Y = snake.Segments[i-1].Y
	}
	head.X, head.Y = to.X, to.Y
}

func moveSnakeByTail(snake *Snake, to Point) {
	tail := &snake.Segments[len(snake.Segments)-1]
	for i := 0; i < len(snake.Segments)-1; i++ {
		snake.Segments[i].X = snake.Segments[i+1].X
		snake.Segments[i].Y = snake.Segments[i+1].Y
	}
	tail.X, tail.Y = to.X, to.Y
}

var CardinalDirections = []Point{
	{X: 1, Y: 0},
	{X: 0, Y: 1},
	{X: -1, Y: 0},
	{X: 0, Y: -1},
}
