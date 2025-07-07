package main

import "encoding/json"

// Equivalent to interface ParsedGameState in types.ts
type SnakeshiftLevelFormat struct {
	Format                  string        `json:"format"`
	FormatVersion           int           `json:"formatVersion"`
	LevelInfo               LevelInfo     `json:"levelInfo"`
	Entities                []interface{} `json:"entities"`
	EntityTypes             []string      `json:"entityTypes"`
	ActivePlayerEntityIndex int           `json:"activePlayerEntityIndex"`
	LevelId                 string        `json:"levelId,omitempty"`
	LevelSessionId          int           `json:"levelSessionId,omitempty"`
}

type Tile struct {
	X      int `json:"x"`
	Y      int `json:"y"`
	Width  int `json:"width"`
	Height int `json:"height"`
}
type SnakeSegment struct {
	X      int            `json:"x"`
	Y      int            `json:"y"`
	Width  int            `json:"width"`
	Height int            `json:"height"`
	Layer  CollisionLayer `json:"layer"`
}
type EntitySnake struct {
	ID             int            `json:"id"`
	Segments       []SnakeSegment `json:"segments"`
	GrowOnNextMove bool           `json:"growOnNextMove"`
}

type EntityFood struct {
	X      int            `json:"x"`
	Y      int            `json:"y"`
	Width  int            `json:"width"`
	Height int            `json:"height"`
	Layer  CollisionLayer `json:"layer"`
}

type EntityBlock struct {
	X      int            `json:"x"`
	Y      int            `json:"y"`
	Width  int            `json:"width"`
	Height int            `json:"height"`
	Layer  CollisionLayer `json:"layer"`
}

func pointsToSnakeSegments(points []Point, layer CollisionLayer) []SnakeSegment {
	segments := make([]SnakeSegment, len(points))
	for i, p := range points {
		segments[i] = SnakeSegment{
			X:      p.X,
			Y:      p.Y,
			Width:  1,
			Height: 1,
			Layer:  layer,
		}
	}
	return segments
}

func SerializeLevel(level *Level) ([]byte, error) {
	var entities []interface{}
	var entityTypes []string

	// Convert Grid
	for y, row := range level.Grid {
		for x, layer := range row {
			ent := EntityBlock{
				X:      x,
				Y:      y,
				Width:  1,
				Height: 1,
				Layer:  layer,
			}
			entities = append(entities, ent)
			entityTypes = append(entityTypes, "Block")
		}
	}

	// Convert entities
	for _, entity := range level.Entities {
		switch e := entity.(type) {
		case *Food:
			ent := EntityFood{
				X:      e.Position.X,
				Y:      e.Position.Y,
				Width:  1,
				Height: 1,
				Layer:  e.Layer,
			}
			entities = append(entities, ent)
			entityTypes = append(entityTypes, "Food")
		case *Snake:
			ent := EntitySnake{
				ID:             e.ID,
				Segments:       pointsToSnakeSegments(e.Segments, e.Layer),
				GrowOnNextMove: e.GrowOnNextMove,
			}
			entities = append(entities, ent)
			entityTypes = append(entityTypes, "Snake")
		}
	}

	// Construct final game state
	gameState := SnakeshiftLevelFormat{
		Format:                  "snakeshift",
		FormatVersion:           6,
		LevelInfo:               level.Info,
		Entities:                entities,
		EntityTypes:             entityTypes,
		ActivePlayerEntityIndex: -1,
	}

	return json.MarshalIndent(gameState, "", "  ")
}
