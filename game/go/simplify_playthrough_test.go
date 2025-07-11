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
	moveInputs := []MoveInput{
		{Direction: Up, SnakeID: snakeId},
		{Direction: Down, SnakeID: snakeId},
		{Direction: Right, SnakeID: snakeId},
	}
	moves := MoveInputsToMoves(moveInputs, level)

	simplifiedMoves := simplifyPlaythrough(moves, level)

	expected := []MoveInput{
		{Direction: Right, SnakeID: snakeId},
	}
	actual := MovesToMoveInputs(simplifiedMoves)

	if !reflect.DeepEqual(actual, expected) {
		t.Errorf("Expected %v, but got %v", expected, actual)
	}
}
