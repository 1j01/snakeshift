package main

import (
	"fmt"
	"math/rand"
)

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
}

type LevelInfo struct {
	Width  int `json:"width"`
	Height int `json:"height"`
}

type Level struct {
	Info   LevelInfo
	Grid   [][]CollisionLayer
	Foods  []Food
	Snakes []Snake
}

func GenerateLevel(width, height int, numFoods, numSnakes int) Level {
	const blockDensity = 0.3

	level := Level{
		Info:   LevelInfo{Width: width, Height: height},
		Grid:   make([][]CollisionLayer, height),
		Foods:  make([]Food, 0, numFoods),
		Snakes: make([]Snake, 0, numSnakes),
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

	// Randomly place foods
	for i := 0; i < numFoods; i++ {
		x := rand.Intn(width)
		y := rand.Intn(height)
		layer := CollisionLayer(rand.Intn(3)) // 0, 1, or 2
		level.Foods = append(level.Foods, Food{Position: Point{X: x, Y: y}, Layer: layer})
	}

	// Randomly place snakes
	for i := 0; i < numSnakes; i++ {
		snake := Snake{ID: i + 1}
		snake.Segments = append(snake.Segments, Point{X: rand.Intn(width), Y: rand.Intn(height)})
		level.Snakes = append(level.Snakes, snake)
	}

	return level
}

func main() {
	level := GenerateLevel(10, 10, 5, 3)
	serialized, err := SerializeLevel(level)
	if err != nil {
		fmt.Println("Error serializing level:", err)
		return
	}
	// fmt.Println("Serialized Level:", serialized)
	fmt.Println(string(serialized))
}
