package game

import (
	"./audio"
	"./block"
	"./cellularautomata"
	"./collectable"
	"./crate"
	"./entity"
	"./food"
	"./game"
	"./gamestate"
	"./helpers"
	"./inverter"
	"./rectangularentity"
	"./snake"
	"./types"
)

func AnalyzeMoveAbsolute(s *snake.Snake, t types.Tile) types.Move {
	// Using helpers.Sign() here would lead to checking if moving to an adjacent tile is valid,
	// even when a further tile is in question.
	// dirX := helpers.Sign(t.X - s.Segments[0].X)
	// dirY := helpers.Sign(t.Y - s.Segments[0].Y)
	// + 0.5 is probably unnecessary; I happened to use Math.round() in the JS version,
	// but could have used Math.floor(), right? ChatGPT added + 0.5, but it also 
	// replaced Math.sign() with math.Signbit(), which is not equivalent.
	deltaGridX := int(t.X - s.Segments[0].X + 0.5)
	deltaGridY := int(t.Y - s.Segments[0].Y + 0.5)
	return AnalyzeMoveRelative(s, deltaGridX, deltaGridY)
}

func AnalyzeMoveRelative(s *snake.Snake, dirX, dirY int) types.Move {
	head := s.Segments[0]
	deltaX := dirX * head.Width
	deltaY := dirY * head.Height
	x := head.X + deltaX
	y := head.Y + deltaY

	ignoreTailOfSnake := s
	if s.GrowOnNextMove {
		ignoreTailOfSnake = nil
	}
	hitsAhead := helpers.HitTestAllEntities(x, y, helpers.HitTestOptions{
		IgnoreTailOfSnake: ignoreTailOfSnake,
	})

	hitsAllAlong := []helpers.Hit{}
	for _, seg := range s.Segments {
		hitsAllAlong = append(hitsAllAlong, helpers.HitTestAllEntities(seg.X, seg.Y)...)
	}

	encumbered := false
	for _, hit := range hitsAllAlong {
		if hit.Entity.Solid() &&
			hit.Entity != s &&
			game.EntitiesIndex(hit.Entity) > game.EntitiesIndex(s) &&
			!(hit.EntityIsSnake() && s.FusedSnakeIds.Contains(hit.EntityID())) {
			encumbered = true
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
	movingBackwards := len(s.Segments) > 1 &&
		dirX == sign(s.Segments[1].X-head.X) &&
		dirY == sign(s.Segments[1].Y-head.Y)

  // I think I will need to move to a system where the move is simulated and then checked for validity,
  // to avoid the complexity of adding exceptions to game state access, when answering hypotheticals.
  // This could also help with animating undo/redo, which currently replaces all the entities, resetting animation timers,
  // and for the level editor, where I'd like to check for collisions to show warnings,
  // (but allow the collisions to happen so that editing isn't its own puzzle.)
  // If moves are analyzed by checking for collisions within a whole game board,
  // it could share some code. Theoretically.

	// Push objects
	var entitiesToPush []entity.Entity
	{
		hit := helpers.FindFirstSolidEntity(hitsAhead)
    // TODO: try pushing other snakes too (or save that for when splitting snakes; only push the tail / "dead" half)
    // TODO: recursively push crates
		if crateEntity, ok := hit.(*crate.Crate); ok {
			newTile := types.Tile{
				X:      crateEntity.X + deltaX,
				Y:      crateEntity.Y + deltaY,
				Width:  crateEntity.Width,
				Height: crateEntity.Height,
			}
			hitsAheadCrate := helpers.HitTestAllEntities(newTile.X, newTile.Y, helpers.HitTestOptions{IgnoreTailOfSnake: s})
			if helpers.WithinLevel(newTile) &&
				helpers.LayersCollide(crateEntity.Layer, head.Layer) &&
				!helpers.LayersCollide(helpers.TopLayer(hitsAheadCrate), crateEntity.Layer) {
				entitiesToPush = append(entitiesToPush, crateEntity)
				for _, h := range hitsAhead {
					if _, ok := h.Entity.(*collectable.Collectable); ok {
						entitiesToPush = append(entitiesToPush, h.Entity)
						break
					}
				}
			}
		}
	}

	// Ignore pushed objects as obstacles
	hitsAhead = helpers.FilterHitsExcludingEntities(hitsAhead, entitiesToPush)

	return types.Move{
		// SnakeId:   s.ID,
		Snake:         s,
		Valid:         (dirX == 0 || dirY == 0) &&
			(helpers.Abs(dirX) == 1 || helpers.Abs(dirY) == 1) &&
			helpers.WithinLevel(types.Tile{X: x, Y: y, Width: head.Width, Height: head.Height}) &&
			!movingBackwards &&
			!encumbered &&
			!helpers.LayersCollide(helpers.TopLayer(hitsAhead), head.Layer),
		Encumbered:     encumbered,
		To:             types.Tile{X: x, Y: y, Width: head.Width, Height: head.Height},
		Delta:          types.Vector{X: deltaX, Y: deltaY},
		EntitiesThere:  helpers.HitsToEntities(hitsAhead),
		EntitiesToPush: entitiesToPush,
	}
}

func CanMove(s *snake.Snake) bool {
	return AnalyzeMoveRelative(s, 1, 0).Valid ||
		AnalyzeMoveRelative(s, 0, 1).Valid ||
		AnalyzeMoveRelative(s, -1, 0).Valid ||
		AnalyzeMoveRelative(s, 0, -1).Valid
}

func TakeMove(m types.Move) {
	s := m.Snake
	originalTail := s.Segments[len(s.Segments)-1].Copy()

	gamestate.Undoable()
	audio.PlaySound("move")

	if s.GrowOnNextMove {
		GrowSnake(s)
		s.GrowOnNextMove = false
	}

	head := s.Segments[0]
	for i := len(s.Segments) - 1; i > 0; i-- {
		s.Segments[i].SetTo(s.Segments[i-1])
	}
	head.X, head.Y = m.To.X, m.To.Y
	head.Width, head.Height = m.To.Width, m.To.Height
	s.Facing = m.Delta

	// Sort entities
	ontoIndices := game.GetIndicesOfSolids(m.EntitiesThere)
	maxIndex := max(ontoIndices...)
	thisIndex := game.EntitiesIndex(s)
	if thisIndex < maxIndex {
		game.EntitiesInsert(maxIndex+1, s)
		game.EntitiesRemoveAt(thisIndex)
	}

	if len(m.EntitiesToPush) > 0 {
		audio.PlaySound("pushCrate", audio.Options{
			PlaybackRate: rand.Float64()*0.1 + 0.95,
			Volume:       0.3,
		})
	}

	for _, e := range m.EntitiesToPush {
		helpers.TranslateEntity(e, m.Delta.X, m.Delta.Y)
		game.RemoveEntity(e)
		game.AddEntityToTop(e)
	}

	if len(m.EntitiesToPush) > 0 {
		game.SortEntities()
	}

	for _, e := range m.EntitiesThere {
		if c, ok := e.(*collectable.Collectable); ok {
			if helpers.LayersCollide(c.Layer, head.Layer) && !entityInSlice(c, m.EntitiesToPush) {
				game.RemoveEntity(c)
				if _, isFood := c.(*food.Food); isFood {
					s.GrowOnNextMove = true
					if !game.CheckLevelWon() {
						audio.PlayMelodicSound("eat", s.NextMelodyIndex())
					}
				} else if _, isInverter := c.(*inverter.Inverter); isInverter {
					InvertSnake(s)
				}
			}
		}
	}

	for id := range s.FusedSnakeIds {
		if fs, ok := game.FindSnakeByID(id); ok {
			DragSnake(fs, len(fs.Segments)-1, s.Segments[len(s.Segments)-1])
		}
	}

	UpdateCellularAutomata()
	s.AnimateMove(m, originalTail)
}

// TODO: DRY, copied from function `drag` in level-editor.ts
func DragSnake(dragging *snake.Snake, index int, to types.Tile) {
	segment := dragging.Segments[index]
	if segment.X != to.X || segment.Y != to.Y {
		from := types.Vector{X: segment.X, Y: segment.Y}
		points := helpers.LineNoDiagonals(from, to)
		for _, point := range points[1:] {
			for i := len(dragging.Segments) - 1; i > index; i-- {
				lead(dragging.Segments[i-1], dragging.Segments[i])
			}
			for i := 0; i < index; i++ {
				lead(dragging.Segments[i+1], dragging.Segments[i])
			}
			segment.X = point.X
			segment.Y = point.Y
			// if snake.DEBUG_SNAKE_DRAGGING {
			//   draw()
			// }
		}
	}
}

// TODO: DRY, copied from function `lead` in level-editor.ts
func lead(leader, follower *snake.Segment) {
	follower.X = leader.X
	follower.Y = leader.Y
	follower.Width = leader.Width
	follower.Height = leader.Height
	// if snake.DEBUG_SNAKE_DRAGGING {
	//   draw()
	// }
}

func GrowSnake(s *snake.Snake) {
	tail := s.Segments[len(s.Segments)-1]
	newTail := tail.Copy()
	s.Segments = append(s.Segments, newTail)
}

func InvertSnake(s *snake.Snake) {
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
			re.Layer = helpers.InvertCollisionLayer(re.Layer)
		} else if snk, ok := e.(*snake.Snake); ok {
			for _, seg := range snk.Segments {
				handlePosition(seg.X, seg.Y)
				seg.Layer = helpers.InvertCollisionLayer(seg.Layer)
			}
		}
	}

	handlePosition = func(x, y int) {
		key := fmt.Sprintf("%d,%d", x, y)
		if handledPositions[key] {
			return
		}
		handledPositions[key] = true
		for _, hit := range helpers.HitTestAllEntities(x, y) {
			handleEntity(hit.Entity)
		}
	}

	handleEntity(s)

	for pos := range handledPositions {
		var x, y int
		fmt.Sscanf(pos, "%d,%d", &x, &y)
		hits := helpers.HitTestAllEntities(x, y)
		if !helpers.AnyBlock(hits) {
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
					layer := helpers.TopLayer(helpers.FilterHitsExcludingType(helpers.HitTestAllEntities(x, y), &cellularautomata.CellularAutomata{}))
					if occupied[n].Layer == helpers.InvertCollisionLayer(layer) {
						count++
					}
				}
			}

			if count >= 1 || occupied[key] != nil {
				if helpers.AllEntitiesAreBlocksOrCA(helpers.HitTestAllEntities(x, y)) {
					newOccupied[key] = true
				}
			}
		}
	}

	for i := len(game.Entities) - 1; i >= 0; i-- {
		if ca, ok := game.Entities[i].(*cellularautomata.CellularAutomata); ok {
			key := fmt.Sprintf("%d,%d", ca.X, ca.Y)
			if !newOccupied[key] && helpers.AllEntitiesAreBlocksOrCA(helpers.HitTestAllEntities(ca.X, ca.Y)) {
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
				Layer: helpers.InvertCollisionLayer(helpers.TopLayer(helpers.HitTestAllEntities(x, y))),
			}
			game.Entities = append(game.Entities, cell)
		}
	}
}
