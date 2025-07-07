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
		},
		Action: func(ctx context.Context, cmd *cli.Command) error {
			if cmd.Bool("generate") {
				level := GenerateLevel()
				serialized, err := SerializeLevel(level)
				if err != nil {
					return fmt.Errorf("failed to serialize level: %w", err)
				}
				fmt.Println(string(serialized))
				return nil
			}
			fmt.Println("Welcome to Snakeshift! Use --generate to create a random level.")
			fmt.Println("To play, you can use the web version at https://1j01.itch.io/snakeshift")
			return nil
		},
	}

	if err := cmd.Run(context.Background(), os.Args); err != nil {
		log.Fatal(err)
	}

}
