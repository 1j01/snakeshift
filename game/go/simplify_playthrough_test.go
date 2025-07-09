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

	moves := []MoveInput{
		up, down, right,
	}

	simplified := simplifyPlaythrough(moves, level)

	expected := []MoveInput{
		right,
	}

	if !reflect.DeepEqual(simplified, expected) {
		t.Errorf("Expected %v, but got %v", expected, simplified)
	}
}
