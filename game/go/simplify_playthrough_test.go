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
