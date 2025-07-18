package main

import "slices"

func AnalyzeMoveAbsolute(snake *Snake, targetTile Point, level *Level) Move {
	deltaGridX := int(targetTile.X - snake.Segments[0].X)
	deltaGridY := int(targetTile.Y - snake.Segments[0].Y)
	return AnalyzeMoveRelative(snake, deltaGridX, deltaGridY, level)
}

func AnalyzeMoveRelative(snake *Snake, deltaX, deltaY int, level *Level) Move {
	head := snake.Segments[0]
	x := head.X + deltaX
	y := head.Y + deltaY

	ignoreTailOfSnake := snake
	if snake.GrowOnNextMove {
		ignoreTailOfSnake = nil
	}
	hitsAhead := hitTestAllEntities(x, y, level, HitTestOptions{
		IgnoreTailOfSnake: ignoreTailOfSnake,
	})

	hitsAllAlong := []Hit{}
	for _, seg := range snake.Segments {
		hitsAllAlong = append(hitsAllAlong, hitTestAllEntities(seg.X, seg.Y, level, HitTestOptions{})...)
	}

	encumbered := false
	for _, hit := range hitsAllAlong {
		// if hit.Entity.Solid() &&
		// 	hit.Entity != snake &&
		// 	indexOfEntity(hit, level.Entity) > indexOfEntity(snake, level) &&
		// 	!(hit.EntityIsSnake() && snake.FusedSnakeIds.Contains(hit.EntityID())) {
		encumbered = hit.Entity != nil &&
			hit.Entity.IsSolid() &&
			hit.Entity != snake &&
			indexOfEntity(hit.Entity, level) > indexOfEntity(snake, level)
		if encumbered {
			break
		}
	}

	// Prevent moving backwards when two segments long
	// (When one segment long, you can plausibly move in any direction,
	// and when more than two segments long, a body segment will be in the way,
	// but when two segments, normally the tail is excluded from hit testing,
	// so you would be allowed to double back, but it feels weird to do a 180° turn.)
	// This also prevents an overlapped snake from doubling back on itself,
	// by moving into a tile occupied by a snake which is on top of this snake.
	// (But that is just a special case of the rule that you shouldn't
	// be able to move into a tile occupied by a snake which is on top of this snake.)
	movingBackwards := len(snake.Segments) > 1 &&
		deltaX == sign(snake.Segments[1].X-head.X) &&
		deltaY == sign(snake.Segments[1].Y-head.Y)

		// I think I will need to move to a system where the move is simulated and then checked for validity,
		// to avoid the complexity of adding exceptions to game state access, when answering hypotheticals.
		// This could also help with animating undo/redo, which currently replaces all the entities, resetting animation timers,
		// and for the level editor, where I'd like to check for collisions to show warnings,
		// (but allow the collisions to happen so that editing isn't its own puzzle.)
		// If moves are analyzed by checking for collisions within a whole game board,
		// it could share some code. Theoretically.

	// // Push objects
	// var entitiesToPush []entity.Entity
	// {
	// 	hit := FindFirstSolidEntity(hitsAhead)
	// 	// TODO: try pushing other snakes too (or save that for when splitting snakes; only push the tail / "dead" half)
	// 	// TODO: recursively push crates
	// 	if crateEntity, ok := hit.(*crate.Crate); ok {
	// 		newTile := Point{
	// 			X:      crateEntity.X + deltaX,
	// 			Y:      crateEntity.Y + deltaY,
	// 			Width:  crateEntity.Width,
	// 			Height: crateEntity.Height,
	// 		}
	// 		hitsAheadCrate := HitTestAllEntities(newTile.X, newTile.Y, HitTestOptions{IgnoreTailOfSnake: snake})
	// 		if WithinLevel(newTile) &&
	// 			LayersCollide(crateEntity.Layer, head.Layer) &&
	// 			!LayersCollide(TopLayer(hitsAheadCrate), crateEntity.Layer) {
	// 			entitiesToPush = append(entitiesToPush, crateEntity)
	// 			for _, h := range hitsAhead {
	// 				if _, ok := h.Entity.(*collectable.Collectable); ok {
	// 					entitiesToPush = append(entitiesToPush, h.Entity)
	// 					break
	// 				}
	// 			}
	// 		}
	// 	}
	// }

	// Ignore pushed objects as obstacles
	// hitsAhead = FilterHitsExcludingEntities(hitsAhead, entitiesToPush)

	return Move{
		// SnakeId:   s.ID,
		Snake: snake,
		Valid: (deltaX == 0 || deltaY == 0) &&
			(abs(deltaX) == 1 || abs(deltaY) == 1) &&
			withinLevel(Point{X: x, Y: y}, level) &&
			!movingBackwards &&
			!encumbered &&
			!layersCollide(topLayer(hitsAhead), snake.Layer),
		Encumbered:    encumbered,
		To:            Point{X: x, Y: y},
		Delta:         Point{X: deltaX, Y: deltaY},
		EntitiesThere: hitsToEntities(hitsAhead),
		// EntitiesToPush: entitiesToPush,
	}
}

func CanMove(snake *Snake, level *Level) bool {
	return AnalyzeMoveRelative(snake, 1, 0, level).Valid ||
		AnalyzeMoveRelative(snake, 0, 1, level).Valid ||
		AnalyzeMoveRelative(snake, -1, 0, level).Valid ||
		AnalyzeMoveRelative(snake, 0, -1, level).Valid
}

func TakeMove(m Move, level *Level) {
	s := m.Snake
	// originalTailPos := s.Segments[len(s.Segments)-1]

	// undoable() // handled externally
	// audio.PlaySound("move")

	if s.GrowOnNextMove {
		// Duplicate the tail segment
		tail := s.Segments[len(s.Segments)-1]
		s.Segments = append(s.Segments, tail)
		s.GrowOnNextMove = false
	}

	moveSnakeByHead(s, m.To)

	// s.Facing = m.Delta

	// Sort entities
	// Could probably just unconditionally sort the moved snake to the top.
	maxIndex := -1
	for _, e := range m.EntitiesThere {
		if e.IsSolid() {
			maxIndex = max(maxIndex, indexOfEntity(e, level))
		}
	}
	if maxIndex > -1 {
		thisIndex := indexOfEntity(s, level)
		for thisIndex < maxIndex {
			level.Entities[thisIndex], level.Entities[thisIndex+1] = level.Entities[thisIndex+1], level.Entities[thisIndex]
			thisIndex++
		}
	}

	// if len(m.EntitiesToPush) > 0 {
	// 	audio.PlaySound("pushCrate", audio.Options{
	// 		PlaybackRate: rand.Float64()*0.1 + 0.95,
	// 		Volume:       0.3,
	// 	})
	// }

	// for _, e := range m.EntitiesToPush {
	// 	TranslateEntity(e, m.Delta.X, m.Delta.Y)
	// 	game.RemoveEntity(e)
	// 	game.AddEntityToTop(e)
	// }

	// if len(m.EntitiesToPush) > 0 {
	// 	game.SortEntities()
	// }

	for _, e := range m.EntitiesThere {
		if c, ok := e.(*Food); ok { // TODO: collectables in general
			if layersCollide(c.Layer, s.Layer) { // TODO: && !entityInSlice(c, m.EntitiesToPush) {
				index := indexOfEntity(c, level)
				if index < 0 {
					continue // maybe
				}
				level.Entities = slices.Delete(level.Entities, index, index+1)
				// if _, isFood := c.(*food.Food); isFood {
				s.GrowOnNextMove = true
				// if !game.CheckLevelWon() {
				// 	audio.PlayMelodicSound("eat", s.NextMelodyIndex())
				// }
				// } else if _, isInverter := c.(*inverter.Inverter); isInverter {
				// 	InvertSnake(s)
				// }
			}
		}
	}

	// for id := range s.FusedSnakeIds {
	// 	if fs, ok := game.FindSnakeByID(id); ok {
	// 		DragSnake(fs, len(fs.Segments)-1, s.Segments[len(s.Segments)-1])
	// 	}
	// }

	// UpdateCellularAutomata()
	// s.AnimateMove(m, originalTailPos)
}

// // TODO: DRY, copied from function `drag` in level-editor.ts
// func DragSnake(dragging *Snake, index int, to Point) {
// 	segment := dragging.Segments[index]
// 	if segment.X != to.X || segment.Y != to.Y {
// 		from := Point{X: segment.X, Y: segment.Y}
// 		points := LineNoDiagonals(from, to)
// 		for _, point := range points[1:] {
// 			for i := len(dragging.Segments) - 1; i > index; i-- {
// 				lead(dragging.Segments[i-1], dragging.Segments[i])
// 			}
// 			for i := 0; i < index; i++ {
// 				lead(dragging.Segments[i+1], dragging.Segments[i])
// 			}
// 			segment.X = point.X
// 			segment.Y = point.Y
// 			// if snake.DEBUG_SNAKE_DRAGGING {
// 			//   draw()
// 			// }
// 		}
// 	}
// }

// // TODO: DRY, copied from function `lead` in level-editor.ts
// func lead(leader, follower *snake.Segment) {
// 	follower.X = leader.X
// 	follower.Y = leader.Y
// 	follower.Width = leader.Width
// 	follower.Height = leader.Height
// 	// if snake.DEBUG_SNAKE_DRAGGING {
// 	//   draw()
// 	// }
// }

/*
func InvertSnake(s *Snake) {
  // See also: `invert` function in level-editor.ts
	handledEntities := make(map[entity.Entity]bool)
	handledPositions := make(map[string]bool)

	var handleEntity func(entity.Entity)
	var handlePosition func(int, int)

	handleEntity = func(e entity.Entity) {
		if handledEntities[e] {
			return
		}
		handledEntities[e] = true
		if re, ok := e.(*rectangularentity.RectangularEntity); ok {
			re.Layer = InvertCollisionLayer(re.Layer)
		} else if snk, ok := e.(*Snake); ok {
			for _, seg := range snk.Segments {
				handlePosition(seg.X, seg.Y)
				seg.Layer = InvertCollisionLayer(seg.Layer)
			}
		}
	}

	handlePosition = func(x, y int) {
		key := fmt.Sprintf("%d,%d", x, y)
		if handledPositions[key] {
			return
		}
		handledPositions[key] = true
		for _, hit := range HitTestAllEntities(x, y) {
			handleEntity(hit.Entity)
		}
	}

	handleEntity(s)

	for pos := range handledPositions {
		var x, y int
		fmt.Sscanf(pos, "%d,%d", &x, &y)
		hits := HitTestAllEntities(x, y)
		if !AnyBlock(hits) {
			block := &block.Block{
				X:     x,
				Y:     y,
				Layer: types.CollisionLayerWhite,
			}
			game.AddEntityToBottom(block)
		}
	}
}

func UpdateCellularAutomata() {
	occupied := map[string]*cellularautomata.CellularAutomata{}
	for _, e := range game.Entities {
		if ca, ok := e.(*cellularautomata.CellularAutomata); ok {
			key := fmt.Sprintf("%d,%d", ca.X, ca.Y)
			occupied[key] = ca
		}
	}

	newOccupied := map[string]bool{}
	for y := 0; y < game.LevelInfo.Height; y++ {
		for x := 0; x < game.LevelInfo.Width; x++ {
			key := fmt.Sprintf("%d,%d", x, y)
			neighbors := []string{
				fmt.Sprintf("%d,%d", x, y-1),
				fmt.Sprintf("%d,%d", x+1, y),
				fmt.Sprintf("%d,%d", x, y+1),
				fmt.Sprintf("%d,%d", x-1, y),
			}

			count := 0
			for _, n := range neighbors {
				if occupied[n] != nil {
					layer := TopLayer(FilterHitsExcludingType(HitTestAllEntities(x, y), &cellularautomata.CellularAutomata{}))
					if occupied[n].Layer == InvertCollisionLayer(layer) {
						count++
					}
				}
			}

			if count >= 1 || occupied[key] != nil {
				if AllEntitiesAreBlocksOrCA(HitTestAllEntities(x, y)) {
					newOccupied[key] = true
				}
			}
		}
	}

	for i := len(game.Entities) - 1; i >= 0; i-- {
		if ca, ok := game.Entities[i].(*cellularautomata.CellularAutomata); ok {
			key := fmt.Sprintf("%d,%d", ca.X, ca.Y)
			if !newOccupied[key] && AllEntitiesAreBlocksOrCA(HitTestAllEntities(ca.X, ca.Y)) {
				game.Entities = append(game.Entities[:i], game.Entities[i+1:]...)
			}
		}
	}

	for key := range newOccupied {
		if occupied[key] == nil {
			var x, y int
			fmt.Sscanf(key, "%d,%d", &x, &y)
			cell := &cellularautomata.CellularAutomata{
				X:     x,
				Y:     y,
				Layer: InvertCollisionLayer(TopLayer(HitTestAllEntities(x, y))),
			}
			game.Entities = append(game.Entities, cell)
		}
	}
}
*/
