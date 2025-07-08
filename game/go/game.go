package main

import (
	"fmt"
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
	levelName       string
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
	levelEntries, err := getLevels()
	if err != nil {
		panic(err)
	}
	// var nextEntry LevelEntry
	for i, entry := range levelEntries {
		if entry.LevelId == g.levelId {
			if i+1 < len(levelEntries) {
				g.levelId = levelEntries[i+1].LevelId
				g.levelName = levelEntries[i+1].Title
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

	levelEntries, err := getLevels()
	if err != nil {
		panic(err)
	}
	levelIndex := 0
	levelId := levelEntries[levelIndex].LevelId
	level, err := LoadLevel(levelId)
	if err != nil {
		panic(err)
	}

	game := &Game{
		level:     level,
		levelId:   levelId,
		levelName: levelEntries[levelIndex].Title,
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
	// initialGame := copyGame(g)
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
					undoable(g, &undos, &redos)
					// g = copyGame(initialGame)
					// TODO: encapsulate loading level into the active game and activating a snake
					level, err := LoadLevel(g.levelId)
					if err != nil {
						fmt.Fprintf(os.Stderr, "Failed to reload level %s: %v\n", g.levelId, err)
						// return
					} else {
						g.level = level
						activateSomeSnake(g)
						render(g)
					}
				case ev.Ch == 'n':
					undoable(g, &undos, &redos)
					g = NewGame()
					// initialGame = copyGame(g)
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
