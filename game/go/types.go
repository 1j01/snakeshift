package main

type CollisionLayer int

const (
	Neither CollisionLayer = 0
	White   CollisionLayer = 1
	Black   CollisionLayer = 2
	Both    CollisionLayer = 3 // = White | Black
)

type Point struct {
	X int `json:"x"`
	Y int `json:"y"`
}

type Food struct {
	Position Point
	Layer    CollisionLayer
}

type Snake struct {
	ID             int
	Segments       []Point // ordered from head to tail
	GrowOnNextMove bool
	Layer          CollisionLayer
}

type LevelInfo struct {
	Width  int `json:"width"`
	Height int `json:"height"`
}

// Custom marshaling is defined for the top-level struct.
type Level struct {
	Info   LevelInfo
	Grid   [][]CollisionLayer
	Foods  []Food
	Snakes []Snake
}

type Hit struct {
	entity       Snake
	segmentIndex int
	layer        CollisionLayer
}
