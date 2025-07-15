package main

import (
	"math"
	"time"

	"github.com/nsf/termbox-go"
)

var (
	unicode     = true
	cellWidth   = 3
	cellHeight  = 1
	boardStartX = 1
	boardStartY = 2
)

func setUnicodeEnabled(enabled bool) {
	unicode = enabled
	if unicode {
		cellWidth = 3
	} else {
		cellWidth = 2
	}
}

func init() {
	setUnicodeEnabled(unicode)
}

func render(g *Game) {
	termbox.Clear(termbox.ColorBlack, termbox.ColorBlack)
	// Title
	tbPrint(0, 0, termbox.ColorWhite, termbox.ColorBlack, "Snake")
	tbPrint(5, 0, termbox.ColorBlack, termbox.ColorWhite, "Shift")
	tbPrint(11, 0, termbox.ColorWhite, termbox.ColorBlack, "- "+g.levelName)
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

	// Show level stuck hint
	if len(getAllPossibleMoves(g.level)) == 0 {
		tbPrint(0, boardStartY+g.level.Info.Height*cellHeight+1, termbox.ColorWhite, termbox.ColorBlack, "Press 'Z' to undo or 'R' to restart the level.")
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
			if unicode {
				if charX == 1 {
					colorUnder := termbox.GetCell(x+charX, y+charY).Bg
					invColor := termbox.ColorWhite
					if colorUnder == termbox.ColorWhite {
						invColor = termbox.ColorBlack
					}
					ch := '◆'
					if (colorUnder == termbox.ColorBlack) != (food.Layer == White) {
						ch = '◇'
					}
					termbox.SetCell(x+charX, y+charY, ch, invColor, colorUnder)
				}
			} else {
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
				if unicode {
					ch = '•'
				}
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
				} else {
					if snake.GrowOnNextMove {
						ch = '~' // In the original game, this was more like ^^ eyes but ^ is used on the body here as arrows; ~ conveys happy eyes pretty well here.
						if unicode {
							ch = 'ᵔ'
						}
					}
					if charX == 1 && cellWidth == 3 {
						ch = 'ᴗ'
					}
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
