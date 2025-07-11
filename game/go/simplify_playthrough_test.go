package main

import (
	"reflect"
	"testing"
)

func TestSimplifyPlaythrough(t *testing.T) {
	level, err := LoadLevel("levels/tests/move-right-to-win.json")
	if err != nil {
		t.Fatalf("Failed to load level: %v", err)
	}

	snakeId := "04f13bbb-2635-4470-9849-eaaecc079201"

	// | state index | move index | state    | direction     |
	// | ----------- | ---------- | -------- | ------------- |
	// | 0           |            | ( 0,  0) | initial state |
	// | 1           | 0          | ( 0, -1) | Up            |
	// | 2           | 1          | (-1, -1) | Left          |
	// | 3           | 2          | (-2, -1) | Left          |
	// | 4           | 3          | (-3, -1) | Left          |
	// | 5           | 4          | (-3,  0) | Down          |
	// | 6           | 5          | (-2,  0) | Right         |
	// | 7           | 6          | (-1,  0) | Right         |
	// | 8           | 7          | ( 0,  0) | Right         |
	// | 9           | 8          | ( 1,  0) | Right         |
	moveInputs := []MoveInput{
		{Direction: Up, SnakeID: snakeId},
		{Direction: Left, SnakeID: snakeId},
		{Direction: Left, SnakeID: snakeId},
		{Direction: Left, SnakeID: snakeId},
		{Direction: Down, SnakeID: snakeId},
		{Direction: Right, SnakeID: snakeId},
		{Direction: Right, SnakeID: snakeId},
		{Direction: Right, SnakeID: snakeId},
		{Direction: Right, SnakeID: snakeId},
	}

	actual := simplifyPlaythrough(moveInputs, level)

	expected := []MoveInput{
		{Direction: Right, SnakeID: snakeId},
	}

	if !reflect.DeepEqual(actual, expected) {
		t.Errorf("Expected %v, but got %v", expected, actual)
	}
}

func TestSimplifyPlaythrough2(t *testing.T) {
	level, err := LoadLevel("levels/tests/copy-of-001-movement.json")
	if err != nil {
		t.Fatalf("Failed to load level: %v", err)
	}

	snakeId := "4c031c36-36d7-4190-91af-e4c0f1d1de5b"

	moveInputs := []MoveInput{
		{Direction: Right, SnakeID: snakeId}, // lines up with optimal playthrough
		{Direction: Up, SnakeID: snakeId},    // suboptimal
		{Direction: Right, SnakeID: snakeId}, // suboptimal
		{Direction: Right, SnakeID: snakeId}, // suboptimal
		{Direction: Right, SnakeID: snakeId}, // suboptimal
		{Direction: Down, SnakeID: snakeId},  // suboptimal
		{Direction: Right, SnakeID: snakeId}, // suboptimal
		{Direction: Right, SnakeID: snakeId}, // suboptimal
		{Direction: Right, SnakeID: snakeId}, // suboptimal
		{Direction: Right, SnakeID: snakeId}, // lines up with optimal playthrough
		{Direction: Up, SnakeID: snakeId},    // suboptimal
		{Direction: Right, SnakeID: snakeId}, // suboptimal
		{Direction: Right, SnakeID: snakeId}, // suboptimal
		{Direction: Right, SnakeID: snakeId}, // suboptimal
		{Direction: Down, SnakeID: snakeId},  // suboptimal
		{Direction: Down, SnakeID: snakeId},  // suboptimal
		{Direction: Down, SnakeID: snakeId},  // suboptimal
		{Direction: Down, SnakeID: snakeId},  // suboptimal
		{Direction: Down, SnakeID: snakeId},  // suboptimal
		{Direction: Down, SnakeID: snakeId},  // suboptimal
		{Direction: Down, SnakeID: snakeId},  // suboptimal
		{Direction: Left, SnakeID: snakeId},  // suboptimal
		{Direction: Left, SnakeID: snakeId},  // suboptimal
		{Direction: Left, SnakeID: snakeId},  // suboptimal
		{Direction: Left, SnakeID: snakeId},  // lines up with optimal playthrough
		{Direction: Left, SnakeID: snakeId},  // lines up with AN optimal playthrough
		{Direction: Up, SnakeID: snakeId},    // lines up with AN optimal playthrough
		{Direction: Up, SnakeID: snakeId},    // lines up with AN optimal playthrough
	}

	actual := simplifyPlaythrough(moveInputs, level)

	expected := []MoveInput{
		{Direction: Right, SnakeID: snakeId},
		{Direction: Right, SnakeID: snakeId},
		{Direction: Right, SnakeID: snakeId},
		{Direction: Right, SnakeID: snakeId},
		{Direction: Right, SnakeID: snakeId},
		{Direction: Right, SnakeID: snakeId},
		{Direction: Right, SnakeID: snakeId},
		{Direction: Right, SnakeID: snakeId},
		{Direction: Right, SnakeID: snakeId},
		{Direction: Right, SnakeID: snakeId},
		{Direction: Down, SnakeID: snakeId},
		{Direction: Down, SnakeID: snakeId},
		{Direction: Down, SnakeID: snakeId},
		{Direction: Down, SnakeID: snakeId},
		{Direction: Down, SnakeID: snakeId},
		{Direction: Down, SnakeID: snakeId},
		{Direction: Left, SnakeID: snakeId},
		{Direction: Left, SnakeID: snakeId},
		{Direction: Left, SnakeID: snakeId},
		{Direction: Left, SnakeID: snakeId}, // not the only optimal path
		{Direction: Up, SnakeID: snakeId},   // not the only optimal path
		{Direction: Up, SnakeID: snakeId},   // not the only optimal path
	}

	if !reflect.DeepEqual(actual, expected) {
		t.Errorf("Playthrough didn't match.\nExpected:\n  %v\nActual:\n  %v\nOriginal:\n  %v", String(expected), String(actual), String(moveInputs))
	}
}
