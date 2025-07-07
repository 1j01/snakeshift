package main

import (
	"reflect"
	"testing"
)

func moveEntityForward(entities []string, thisIndex, targetIndex int) []string {
	for thisIndex < targetIndex {
		entities[thisIndex], entities[thisIndex+1] = entities[thisIndex+1], entities[thisIndex]
		thisIndex++
	}
	return entities
}

func TestMoveEntityForward(t *testing.T) {
	tests := []struct {
		name        string
		entities    []string
		thisIndex   int
		targetIndex int
		expected    []string
	}{
		{
			name:        "simple move forward",
			entities:    []string{"A", "B", "C", "D"},
			thisIndex:   1,
			targetIndex: 3,
			expected:    []string{"A", "C", "D", "B"},
		},
		{
			name:        "no move needed",
			entities:    []string{"X", "Y", "Z"},
			thisIndex:   2,
			targetIndex: 2,
			expected:    []string{"X", "Y", "Z"},
		},
		{
			name:        "move to adjacent",
			entities:    []string{"1", "2", "3"},
			thisIndex:   0,
			targetIndex: 1,
			expected:    []string{"2", "1", "3"},
		},
		{
			name:        "entire end move",
			entities:    []string{"E1", "E2", "E3", "E4", "E5"},
			thisIndex:   0,
			targetIndex: 4,
			expected:    []string{"E2", "E3", "E4", "E5", "E1"},
		},
		{
			name:        "backwards move",
			entities:    []string{"E1", "E2", "E3", "E4", "E5"},
			thisIndex:   4,
			targetIndex: 1,
			expected:    []string{"E1", "E5", "E2", "E3", "E4"},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := moveEntityForward(append([]string(nil), tt.entities...), tt.thisIndex, tt.targetIndex)
			if !reflect.DeepEqual(result, tt.expected) {
				t.Errorf("got %v, want %v", result, tt.expected)
			}
		})
	}
}
