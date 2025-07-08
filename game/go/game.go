package main

import (
	"fmt"
	"math"
	"os"
	"path"
	"time"

	"github.com/nsf/termbox-go"
)

// FIXME: input gets delayed if you run into a wall repeatedly (animation delay seems to get queued up)
const animationSpeed = 100 * time.Millisecond

const (
	cellWidth   = 2
	cellHeight  = 1
	boardStartX = 2
	boardStartY = 4
)

// Note: MAKE SURE TO UPDATE copyGame() IF YOU CHANGE THIS STRUCT!
type Game struct {
	level           *Level
	levelId         string
	activeSnake     *Snake
	blinkSnake      bool
	blinkEncumbered bool
}

func activateSomeSnake(game *Game) {
	// Set the first snake as the active snake
	for _, entity := range game.level.Entities {
		if snake, ok := entity.(*Snake); ok {
			game.activeSnake = snake
			break
		}
	}
}

func LoadLevel(levelId string) (*Level, error) {
	if levelId == "" {
		return nil, fmt.Errorf("levelId cannot be empty")
	}
	levelJSON, err := os.ReadFile(path.Join("..", "public", levelId))
	if err != nil {
		return nil, fmt.Errorf("failed to read level file %s: %w", levelId, err)
	}
	level, err := DeserializeLevel(levelJSON)
	if err != nil {
		return nil, fmt.Errorf("failed to load level %s: %w", levelId, err)
	}
	if len(level.Entities) == 0 {
		return nil, fmt.Errorf("level %s has no entities", levelId)
	}
	return level, nil
}

func loadNextLevel(g *Game) {
	levelIds, err := getLevels()
	if err != nil {
		panic(err)
	}
	for i, id := range levelIds {
		if id == g.levelId {
			if i+1 < len(levelIds) {
				g.levelId = levelIds[i+1]
				break
			} else {
				fmt.Println("Congratulations! You've completed all levels!")
				termbox.Close()
				os.Exit(0)
			}
		}
	}
	level, err := LoadLevel(g.levelId)
	if err != nil {
		panic(err)
	}
	g.level = level
	activateSomeSnake(g)
}

func NewGame() *Game {
	// game := &Game{
	// 	level: GenerateLevel(),
	// }

	levelIds, err := getLevels()
	if err != nil {
		panic(err)
	}
	levelId := levelIds[0]
	level, err := LoadLevel(levelId)
	if err != nil {
		panic(err)
	}

	game := &Game{
		level:   level,
		levelId: levelId,
	}
	activateSomeSnake(game)

	return game
}

func undoable(g *Game, undos *[]*Game, redos *[]*Game) {
	*redos = []*Game{}
	*undos = append(*undos, copyGame(g))
}

func levelIsWon(level *Level) bool {
	for _, entity := range level.Entities {
		_, isFood := entity.(*Food)
		if isFood {
			return false // If there's any food left, the level is not won
		}
	}
	return true // All food has been eaten, level is won
}

func move(direction Point, g *Game, undos *[]*Game, redos *[]*Game) {
	move := AnalyzeMoveRelative(g.activeSnake, direction.X, direction.Y, g.level)
	if move.Valid {
		undoable(g, undos, redos)
		TakeMove(move, g.level)
		if levelIsWon(g.level) {
			loadNextLevel(g)
		}
		// TODO: detect when there are no more possible moves, and show a message
	} else {
		g.blinkSnake = true
		g.blinkEncumbered = move.Encumbered
	}
}

func cycleActiveSnake(g *Game) {
	if g.activeSnake == nil {
		return
	}
	snakes := []*Snake{}
	for _, entity := range g.level.Entities {
		if snake, ok := entity.(*Snake); ok {
			snakes = append(snakes, snake)
		}
	}
	// snakes := filter(g.level.Entities, func(entity Entity) bool {
	// 	_, isSnake := entity.(*Snake)
	// 	return isSnake
	// })//.([]*Snake)
	for i := 0; i < len(snakes); i++ {
		if snakes[i].ID == g.activeSnake.ID {
			if snakes[i] != g.activeSnake {
				panic("Snake with ID " + fmt.Sprint(snakes[i].ID) + " does not equal active snake with ID " + fmt.Sprint(g.activeSnake.ID))
			}
			g.activeSnake = snakes[(i+1)%len(snakes)]
			return
		}
	}
}

func mainGameLoop() {
	// TODO: menu system
	// - main menu
	// - level select
	// - credits

	err := termbox.Init()
	if err != nil {
		panic(err)
	}
	defer termbox.Close()

	eventQueue := make(chan termbox.Event)
	go func() {
		for {
			eventQueue <- termbox.PollEvent()
		}
	}()

	g := NewGame()
	initialGame := copyGame(g)
	undos := make([]*Game, 0, 10)
	redos := make([]*Game, 0, 10)

	render(g)

	for {
		select {
		case ev := <-eventQueue:
			if ev.Type == termbox.EventKey {
				switch {
				case ev.Key == termbox.KeyArrowLeft || ev.Ch == 'h' || ev.Ch == 'a':
					move(Point{X: -1, Y: 0}, g, &undos, &redos)
				case ev.Key == termbox.KeyArrowRight || ev.Ch == 'l' || ev.Ch == 'd':
					move(Point{X: 1, Y: 0}, g, &undos, &redos)
				case ev.Key == termbox.KeyArrowUp || ev.Ch == 'k' || ev.Ch == 'w':
					move(Point{X: 0, Y: -1}, g, &undos, &redos)
				case ev.Key == termbox.KeyArrowDown || ev.Ch == 'j' || ev.Ch == 's':
					move(Point{X: 0, Y: 1}, g, &undos, &redos)
				case ev.Key == termbox.KeyTab:
					cycleActiveSnake(g)
					g.blinkSnake = true
				case ev.Ch == 'q' || ev.Key == termbox.KeyEsc || ev.Key == termbox.KeyCtrlC || ev.Key == termbox.KeyCtrlD:
					return
				case ev.Ch == 'r':
					// FIXME: handle level progression (either look at levelId or set initialGame when moving between levels)
					undoable(g, &undos, &redos)
					g = copyGame(initialGame)
					render(g)
				case ev.Ch == 'n':
					undoable(g, &undos, &redos)
					g = NewGame()
					initialGame = copyGame(g)
					render(g)
				case ev.Ch == 'z':
					if len(undos) > 0 {
						redos = append(redos, g)
						g = undos[len(undos)-1]
						undos = undos[:len(undos)-1]
						render(g)
					}
				case ev.Ch == 'y':
					if len(redos) > 0 {
						undos = append(undos, g)
						g = redos[len(redos)-1]
						redos = redos[:len(redos)-1]
						render(g)
					}
				}
			}
		default:
			render(g)
			time.Sleep(animationSpeed)
		}
	}
}

func render(g *Game) {
	termbox.Clear(termbox.ColorBlack, termbox.ColorBlack)
	// Title
	// TODO: display level name instead of just "Snakeshift Game"
	tbPrint(1, 1, termbox.ColorBlack, termbox.ColorWhite, "Snakeshift Game")
	// Draw the game board
	for y := 0; y < g.level.Info.Height; y++ {
		for x := 0; x < g.level.Info.Width; x++ {
			cellValue := Neither
			if y >= 0 && y < len(g.level.Grid) && x >= 0 && x < len(g.level.Grid[y]) {
				cellValue = g.level.Grid[y][x]
			} else {
				cellValue = Invalid
			}
			for charY := 0; charY < cellHeight; charY++ {
				for charX := 0; charX < cellWidth; charX++ {
					cellColor := termbox.ColorRed
					switch cellValue {
					case White:
						cellColor = termbox.ColorWhite
					case Black:
						cellColor = termbox.ColorBlack
					case Both:
						cellColor = termbox.ColorLightGray
					case Neither:
						cellColor = termbox.ColorDarkGray
					case Invalid:
						cellColor = termbox.ColorRed
					}
					termbox.SetCell(boardStartX+cellWidth*x+charX, boardStartY+y, ' ', cellColor, cellColor)
				}
			}
		}
	}
	// Draw border with # in the corners and | and - for the sides
	for charX := -1; charX <= g.level.Info.Width*cellWidth; charX++ {
		if charX == -1 || charX == g.level.Info.Width*cellWidth {
			termbox.SetCell(boardStartX+charX, boardStartY-1, '#', termbox.ColorWhite, termbox.ColorBlack)
			termbox.SetCell(boardStartX+charX, boardStartY+g.level.Info.Height*cellHeight, '#', termbox.ColorWhite, termbox.ColorBlack)
		} else {
			termbox.SetCell(boardStartX+charX, boardStartY-1, '-', termbox.ColorWhite, termbox.ColorBlack)
			termbox.SetCell(boardStartX+charX, boardStartY+g.level.Info.Height*cellHeight, '-', termbox.ColorWhite, termbox.ColorBlack)
		}
	}
	for charY := -1; charY <= g.level.Info.Height*cellHeight; charY++ {
		if charY == -1 || charY == g.level.Info.Height*cellHeight {
			termbox.SetCell(boardStartX-1, boardStartY+charY, '#', termbox.ColorWhite, termbox.ColorBlack)
			termbox.SetCell(boardStartX+g.level.Info.Width*cellWidth, boardStartY+charY, '#', termbox.ColorWhite, termbox.ColorBlack)
		} else {
			termbox.SetCell(boardStartX-1, boardStartY+charY, '|', termbox.ColorWhite, termbox.ColorBlack)
			termbox.SetCell(boardStartX+g.level.Info.Width*cellWidth, boardStartY+charY, '|', termbox.ColorWhite, termbox.ColorBlack)
		}
	}

	// Draw the entities
	for _, entity := range g.level.Entities {
		entity.Draw(g)
	}

	termbox.Flush()
	g.blinkSnake = false
	g.blinkEncumbered = false
}

// Function tbPrint draws a string.
func tbPrint(x, y int, fg, bg termbox.Attribute, msg string) {
	for _, c := range msg {
		termbox.SetCell(x, y, c, fg, bg)
		x++
	}
}

func (food *Food) Draw(g *Game) {
	x := boardStartX + food.Position.X*cellWidth
	y := boardStartY + food.Position.Y*cellHeight
	t := float64(time.Now().UnixMilli())/1000.0 - float64(food.Position.X+food.Position.Y)/20.0
	for charY := 0; charY < cellHeight; charY++ {
		for charX := 0; charX < cellWidth; charX++ {
			bg := termbox.ColorRed
			fg := termbox.ColorRed
			switch food.Layer {
			case White:
				fg = termbox.ColorWhite
				bg = termbox.ColorBlack
			case Black:
				fg = termbox.ColorBlack
				bg = termbox.ColorWhite
			}
			ch := '+'
			if math.Mod(t, 2) < 1 {
				ch = '*'
			}
			// blink so that you can also see what's under the food, even if it's in a less-than-ideal way
			if math.Mod(t, 1) < 0.5 {
				termbox.SetCell(x+charX, y+charY, ch, fg, bg)
			}
		}
	}
}

func (snake *Snake) Draw(g *Game) {
	for i, segment := range snake.Segments {
		x := boardStartX + segment.X*cellWidth
		y := boardStartY + segment.Y*cellHeight
		for charY := 0; charY < cellHeight; charY++ {
			for charX := 0; charX < cellWidth; charX++ {
				bg := termbox.ColorRed
				fg := termbox.ColorRed
				switch snake.Layer {
				case White:
					bg = termbox.ColorWhite
					fg = termbox.ColorBlack
				case Black:
					bg = termbox.ColorBlack
					fg = termbox.ColorWhite
				case Both:
					bg = termbox.ColorLightGray
					fg = termbox.ColorBlack
				case Neither:
					bg = termbox.ColorDarkGray
					fg = termbox.ColorWhite
				}
				ch := 'o'
				dir := Point{X: 0, Y: 0}
				if i > 0 {
					prevSegment := snake.Segments[i-1]
					dir.X = prevSegment.X - segment.X
					dir.Y = prevSegment.Y - segment.Y
					if dir.X > 0 {
						ch = '>'
					} else if dir.X < 0 {
						ch = '<'
					} else if dir.Y > 0 {
						ch = 'v'
					} else if dir.Y < 0 {
						ch = '^'
					}
				} else if snake.GrowOnNextMove {
					ch = '~' // In the original game, this was more like ^^ eyes but ^ is used on the body here as arrows; ~ conveys happy eyes pretty well here.
				}

				if g.blinkSnake && snake.ID == g.activeSnake.ID {
					fg, bg = bg, fg
					if g.blinkEncumbered && i == 0 {
						ch = 'x' // X eyes for encumbered snake
					}
				}

				termbox.SetCell(x+charX, y+charY, ch, fg, bg)
			}
		}
	}
}
