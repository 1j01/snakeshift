package main

import (
	"math/rand"
	"time"

	"github.com/nsf/termbox-go"
)

const animationSpeed = 10 * time.Millisecond

type Game struct {
	level Level
}

func NewGame() *Game {
	return &Game{
		level: GenerateLevel(),
	}
}

func move(direction Point, g *Game) {
	// TODO
}

func mainGameLoop() {
	rand.Seed(time.Now().UnixNano())

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
	// for y := 0; y < boardHeight; y++ {
	// 	for x := 0; x < boardWidth; x++ {
	// 		cellValue := g.board[y][x]
	// 		absCellValue := int(math.Abs(float64(cellValue)))
	// 		cellColor := pieceColors[absCellValue]
	// 		for i := 0; i < cellWidth; i++ {
	// 			termbox.SetCell(boardStartX+cellWidth*x+i, boardStartY+y, ' ', cellColor, cellColor)
	// 		}
	// 	}
	// }

	// tx := g.x
	// ty := g.y
	// for g.pieceFits(tx, ty) {
	// 	ty += 1
	// }
	// ty -= 1

	// for k := 0; k < numSquares; k++ {
	// 	x := tx + g.dx[k]
	// 	y := ty + g.dy[k]
	// 	origin_y := g.y + g.dy[k]
	// 	if 0 <= origin_y && origin_y < boardHeight {
	// 		if 0 <= y && y < boardHeight && 0 <= x && x < boardWidth && g.board[y][x] != -g.piece {
	// 			cellValue := g.board[origin_y][x]
	// 			absCellValue := int(math.Abs(float64(cellValue)))
	// 			cellColor := pieceColors[absCellValue]
	// 			for i := 0; i < cellWidth; i++ {
	// 				termbox.SetCell(boardStartX+cellWidth*x+i, boardStartY+y, '*', termbox.ColorBlack, cellColor)
	// 			}
	// 		}
	// 	}
	// }

	// for y, instruction := range instructions {
	// 	if strings.HasPrefix(instruction, "Level:") {
	// 		instruction = fmt.Sprintf(instruction, g.level)
	// 	} else if strings.HasPrefix(instruction, "Lines:") {
	// 		instruction = fmt.Sprintf(instruction, g.numLines)
	// 	} else if strings.HasPrefix(instruction, "GAME OVER") && g.state != gameOver {
	// 		instruction = ""
	// 	}
	// 	tbPrint(instructionsStartX, instructionsStartY+y, instructionsColor, backgroundColor, instruction)
	// }
	termbox.Flush()
}

// Function tbPrint draws a string.
func tbPrint(x, y int, fg, bg termbox.Attribute, msg string) {
	for _, c := range msg {
		termbox.SetCell(x, y, c, fg, bg)
		x++
	}
}
