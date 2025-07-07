package main

import (
	// "context"
	"fmt"
	// "os"
	// "github.com/urfave/cli/v3"
)

//	func main() {
//		(&cli.Command{}).Run(context.Background(), os.Args)
//	}
func main() {
	level := GenerateLevel()
	serialized, err := SerializeLevel(level)
	if err != nil {
		fmt.Println("Error serializing level:", err)
		return
	}
	fmt.Println(string(serialized))
}
