package main

import (
	"context"
	"fmt"
	"log"
	"os"

	"github.com/urfave/cli/v3"
)

func main() {
	cmd := &cli.Command{
		Name:  "snakeshift",
		Usage: "Play Snakeshift or generate levels",
		Flags: []cli.Flag{
			&cli.BoolFlag{
				Name:  "generate",
				Value: false,
				Usage: "generate a random level",
			},
			&cli.BoolFlag{
				Name:  "list",
				Value: false,
				Usage: "list all available levels",
			},
			// &cli.StringFlag{
			// 	Name:  "level",
			// 	Value: "",
			// 	Usage: "specify a level to play",
			// },
		},
		Action: func(ctx context.Context, cmd *cli.Command) error {
			if cmd.Bool("generate") {
				level, err := GenerateLevel()
				if err != nil {
					return fmt.Errorf("failed to generate level: %w", err)
				}
				serialized, err := SerializeLevel(level)
				if err != nil {
					return fmt.Errorf("failed to serialize level: %w", err)
				}
				fmt.Println(string(serialized))
				return nil
			}
			if cmd.Bool("list") {
				levels, err := getLevels()
				if err != nil {
					return fmt.Errorf("failed to list levels: %w", err)
				}
				for _, level := range levels {
					// fmt.Printf("%s:\n  %s\n", level.LevelId, level.Title)
					fmt.Println(level.Title)
					// Hide test levels
					if level.Title == "The Finish Line" {
						break
					}
				}
				return nil
			}
			mainGameLoop()
			return nil
		},
	}

	if err := cmd.Run(context.Background(), os.Args); err != nil {
		log.Fatal(err)
	}

}
