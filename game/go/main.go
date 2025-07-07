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
		Usage: "Generate a random level for the game Snakeshift",
		Action: func(context.Context, *cli.Command) error {
			level := GenerateLevel()
			serialized, err := SerializeLevel(level)
			if err != nil {
				return fmt.Errorf("failed to serialize level: %w", err)
			}
			fmt.Println(string(serialized))
			return nil
		},
	}

	if err := cmd.Run(context.Background(), os.Args); err != nil {
		log.Fatal(err)
	}

}
