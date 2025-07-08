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

// func DeserializeLevel(data []byte) (*Level, error) {
// 	var gameState SnakeshiftLevelFormat
// 	if err := json.Unmarshal(data, &gameState); err != nil {
// 		return nil, err
// 	}

// 	level := &Level{
// 		Info:     gameState.LevelInfo,
// 		Grid:     make([][]CollisionLayer, gameState.LevelInfo.Height),
// 		Entities: make([]Entity, 0, len(gameState.Entities)),
// 	}

// 	for i := range level.Grid {
// 		level.Grid[i] = make([]CollisionLayer, gameState.LevelInfo.Width)
// 	}

// 	for i, entity := range gameState.Entities {
// 		switch et := gameState.EntityTypes[i]; et {
// 		case "Block":
// 			block := entity.(map[string]interface{})
// 			x := int(block["X"].(float64))
// 			y := int(block["Y"].(float64))
// 			layer := CollisionLayer(block["Layer"].(string))
// 			level.Grid[y][x] = layer
// 		case "Food":
// 			food := entity.(map[string]interface{})
// 			x := int(food["X"].(float64))
// 			y := int(food["Y"].(float64))
// 			layer := CollisionLayer(food["Layer"].(string))
// 			level.Entities = append(level.Entities, &Food{
// 				Position: Point{X: x, Y: y},
// 				Layer:    layer,
// 			})
// 		case "Snake":
// 			snakeData := entity.(map[string]interface{})
// 			id := int(snakeData["ID"].(float64))
// 			growOnNextMove := snakeData["GrowOnNextMove"].(bool)
// 			var segments []Point
// 			for _, segData := range snakeData["Segments"].([]interface{}) {
// 				segMap := segData.(map[string]interface{})
// 				x := int(segMap["X"].(float64))
// 				y := int(segMap["Y"].(float64))
// 				segments = append(segments, Point{X: x, Y: y})
// 			}
// 			layer := invertCollisionLayer(topLayerAt(segments[0].X, segments[0].Y, level))
// 			level.Entities = append(level.Entities, &Snake{
// 				ID:             id,
// 				Segments:       segments,
// 				GrowOnNextMove: growOnNextMove,
// 				Layer:          layer,
// 			})
// 		default:
// 			return nil, json.UnmarshalTypeError{Value: et}
// 		}
// 	}

// 	return level, nil
// }
func DeserializeLevel(data []byte) (*Level, error) {
	var levelFormat SnakeshiftLevelFormat
	if err := json.Unmarshal(data, &levelFormat); err != nil {
		return nil, err
	}

	level := &Level{
		Info:     levelFormat.LevelInfo,
		Entities: []Entity{},
	}

	// Determine grid size by scanning for max X and Y
	var maxX, maxY int
	for i, typ := range levelFormat.EntityTypes {
		if typ != "Block" {
			continue
		}
		raw := levelFormat.Entities[i]
		var block EntityBlock
		mapped, err := json.Marshal(raw)
		if err != nil {
			return nil, err
		}
		if err := json.Unmarshal(mapped, &block); err != nil {
			return nil, err
		}
		if block.X > maxX {
			maxX = block.X
		}
		if block.Y > maxY {
			maxY = block.Y
		}
	}

	// Initialize grid
	grid := make([][]CollisionLayer, maxY+1)
	for y := range grid {
		grid[y] = make([]CollisionLayer, maxX+1)
	}

	// Process entities
	for i, typ := range levelFormat.EntityTypes {
		raw := levelFormat.Entities[i]
		mapped, err := json.Marshal(raw)
		if err != nil {
			return nil, err
		}

		switch typ {
		case "Block":
			var block EntityBlock
			if err := json.Unmarshal(mapped, &block); err != nil {
				return nil, err
			}
			grid[block.Y][block.X] = block.Layer

		case "Food":
			var food EntityFood
			if err := json.Unmarshal(mapped, &food); err != nil {
				return nil, err
			}
			level.Entities = append(level.Entities, &Food{
				Position: Point{X: food.X, Y: food.Y},
				Layer:    food.Layer,
			})

		case "Snake":
			var snake EntitySnake
			if err := json.Unmarshal(mapped, &snake); err != nil {
				return nil, err
			}
			points := make([]Point, len(snake.Segments))
			for j, seg := range snake.Segments {
				points[j] = Point{X: seg.X, Y: seg.Y}
			}
			var layer CollisionLayer
			if len(snake.Segments) > 0 {
				layer = snake.Segments[0].Layer
			}
			level.Entities = append(level.Entities, &Snake{
				ID:             snake.ID,
				Segments:       points,
				Layer:          layer,
				GrowOnNextMove: snake.GrowOnNextMove,
			})
		}
	}

	level.Grid = grid
	return level, nil
}
