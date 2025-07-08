package main

type CollisionLayer int

const (
	Neither CollisionLayer = 0
	White   CollisionLayer = 1
	Black   CollisionLayer = 2
	Both    CollisionLayer = 3 // = White | Black
	Invalid CollisionLayer = 4
)

type Point struct {
	X int `json:"x"`
	Y int `json:"y"`
}

type Entity interface {
	IsSolid() bool
	GetLayer() CollisionLayer
	At(x, y int, options HitTestOptions) *Hit
	Draw(g *Game)
}

type Food struct {
	Position Point
	Layer    CollisionLayer
}

func (food *Food) IsSolid() bool            { return false }
func (food *Food) GetLayer() CollisionLayer { return food.Layer }
func (food *Food) At(x, y int, options HitTestOptions) *Hit {
	if food.Position.X == x && food.Position.Y == y {
		return &Hit{
			Entity:       food,
			SegmentIndex: -1, // Not applicable for Food
			Layer:        food.Layer,
		}
	}
	return nil
}

type Snake struct {
	ID             string
	Segments       []Point // ordered from head to tail
	GrowOnNextMove bool
	Layer          CollisionLayer
}

func (snake *Snake) IsSolid() bool            { return true }
func (snake *Snake) GetLayer() CollisionLayer { return snake.Layer }
func (snake *Snake) At(x, y int, options HitTestOptions) *Hit {
	for segmentIndex, segment := range snake.Segments {
		if segment.X == x &&
			segment.Y == y &&
			(options.IgnoreTailOfSnake == nil ||
				(snake.ID != options.IgnoreTailOfSnake.ID || segmentIndex != len(snake.Segments)-1)) {
			return &Hit{
				Entity:       snake,
				SegmentIndex: segmentIndex,
				Layer:        snake.Layer,
			}
		}
	}
	return nil
}

type LevelInfo struct {
	Width  int `json:"width"`
	Height int `json:"height"`
}

// Note: Custom marshaling is defined elsewhere for the Level struct.
// Note: MAKE SURE TO UPDATE copyLevel() IF YOU CHANGE THIS STRUCT!
type Level struct {
	Info     LevelInfo
	Grid     [][]CollisionLayer
	Entities []Entity
}

type Hit struct {
	Entity       Entity // may be nil if it's a block
	SegmentIndex int
	Layer        CollisionLayer
}

type HitTestOptions struct {
	IgnoreTailOfSnake *Snake
}

type Move struct {
	Snake         *Snake
	To            Point
	Delta         Point
	Valid         bool
	Encumbered    bool
	EntitiesThere []Entity
	// EntitiesToPush []Entity
}
