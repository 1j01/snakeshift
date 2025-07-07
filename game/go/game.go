package main

import (
	"time"

	"github.com/nsf/termbox-go"
)

const animationSpeed = 10 * time.Millisecond

const (
	cellWidth   = 2
	cellHeight  = 1
	boardStartX = 2
	boardStartY = 4
)

type Game struct {
	level *Level
}

func NewGame() *Game {
	return &Game{
		level: GenerateLevel(),
	}
}

func move(direction Point, g *Game) {
	activeSnake := &g.level.Snakes[0] // Arbitrary for now
	move := AnalyzeMoveRelative(activeSnake, direction.X, direction.Y, g.level)
	if move.Valid {
		TakeMove(move, g.level)
	}
}

func mainGameLoop() {
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
	render(g)

	for {
		select {
		case ev := <-eventQueue:
			if ev.Type == termbox.EventKey {
				switch {
				case ev.Key == termbox.KeyArrowLeft:
					move(Point{X: -1, Y: 0}, g)
				case ev.Key == termbox.KeyArrowRight:
					move(Point{X: 1, Y: 0}, g)
				case ev.Key == termbox.KeyArrowUp:
					move(Point{X: 0, Y: -1}, g)
				case ev.Key == termbox.KeyArrowDown:
					move(Point{X: 0, Y: 1}, g)
				case ev.Ch == 'q' || ev.Key == termbox.KeyEsc || ev.Key == termbox.KeyCtrlC || ev.Key == termbox.KeyCtrlD:
					return
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
	tbPrint(1, 1, termbox.ColorBlack, termbox.ColorWhite, "Snakeshift Game")
	// tbPrint(titleStartX, titleStartY, instructionsColor, backgroundColor, title)
	for y := 0; y < g.level.Info.Height; y++ {
		for x := 0; x < g.level.Info.Width; x++ {
			cellValue := g.level.Grid[y][x]
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

	// Draw the snakes
	for _, snake := range g.level.Snakes {
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
					}

					termbox.SetCell(x+charX, y+charY, ch, fg, bg)
				}
			}
		}
	}
	termbox.Flush()
}

// Function tbPrint draws a string.
func tbPrint(x, y int, fg, bg termbox.Attribute, msg string) {
	for _, c := range msg {
		termbox.SetCell(x, y, c, fg, bg)
		x++
	}
}
