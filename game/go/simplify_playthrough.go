package main

import (
	"fmt"
	"slices"
)

const maxSubsequenceLength = 10 // Maximum length of subsequences to consider for simplification.

type SubSequencePatch struct {
	moveInputs  []MoveInput
	deleteCount int // Number of moves to delete from the original playthrough.
}

func simplifyPlaythrough(moveInputs []MoveInput, level *Level) []MoveInput {
	// Simplify the playthrough by generating new subsequences to patch into the playthrough.
	// It may be too expensive to find an optimal playthrough from scratch,
	// trying every move in every state (this explodes combinatorially),
	// but assuming we have a valid playthrough,
	// we can try every combination of N moves at each step, and see if it
	// results in any later state in the playthrough (or the winning of the level).
	// If it does, and it's shorter than the original subsequence,
	// we can replace the original subsequence with the shorter one.
	// - If we ever generate a state that exists EARLIER in the playthrough,
	//   we can skip that tree of exploration, since it will be a redundant loop.
	//   Whether that helps performance overall is unclear.
	//   It probably would if we use hashes, not sure though if we're comparing every field individually.
	//   Probably still would but not as much.
	// - We could apply this process recursively, until no simplification is made.
	// - This function will not guarantee an optimal playthrough,
	//   but it will guarantee a valid playthrough that is at least as short as the original.

	fmt.Printf("Trying to simplify playthrough with %d moves (%v)...\n", len(moveInputs), String(moveInputs))

	// First, create a list of states that the playthrough goes through.
	states := make([]*Level, 0, len(moveInputs)+1)
	states = append(states, copyLevel(level))
	for i, input := range moveInputs {
		lastState := states[len(states)-1]
		newState := copyLevel(lastState)
		move := AnalyzeMoveRelative(
			getSnakeByID(input.SnakeID, newState),
			input.Direction.X,
			input.Direction.Y,
			newState,
		)
		if !move.Valid {
			panic("Invalid move input at index " + fmt.Sprint(i) + ": snake ID '" + input.SnakeID + "', direction (" + fmt.Sprint(input.Direction.X) + ", " + fmt.Sprint(input.Direction.Y) + ")")
		}
		TakeMove(move, newState)
		states = append(states, newState)
	}

	// Detect any redundant state cycles in the playthrough.
	for i := 0; i < len(states); i++ {
		for j := i + 1; j < len(states); j++ {
			// fmt.Printf("States %d and %d: %v\n", i, j, Equal(states[i], states[j]))
			if Equal(states[i], states[j]) {
				// Detected a cycle: states[i] returns to the same state as states[j].
				// Remove the cycle by skipping states[i:j] and related moves.
				// I added tests for this, but I still find this suspicious.
				// Shouldn't this be an off-by-one error?
				states = append(states[:i], states[j:]...)
				moveInputs = append(moveInputs[:i], moveInputs[j:]...)
				i-- // Adjust i to account for the removed elements.
				break
			}
		}
	}

	// Try to replace subsequences of moves with shorter ones that lead to the same state.
	for i := 0; i < len(moveInputs); i++ {
		possiblePatches := make([]SubSequencePatch, 0, 4^maxSubsequenceLength)
		visitPuzzleStates(level, func(l *Level, newSubsequence []MoveInput) bool {
			// Check if the level is won OR matches a later state in the playthrough.
			if levelIsWon(l) {
				possiblePatches = append(possiblePatches, SubSequencePatch{
					moveInputs:  newSubsequence,
					deleteCount: len(moveInputs) - i,
				})
				return true
			}
			for j := i + 1; j < len(states); j++ {
				if Equal(l, states[j]) {
					possiblePatches = append(possiblePatches, SubSequencePatch{
						moveInputs:  newSubsequence,
						deleteCount: j - i, // TODO: vet for possible off-by-one error
					})
					return true
				}
			}
			return false
		}, maxSubsequenceLength)
		fmt.Println("Starting at index", i, "possible subsequence patches:", len(possiblePatches))
		if len(possiblePatches) > 0 {
			// Sort patches by length savings
			slices.SortStableFunc(possiblePatches, func(a, b SubSequencePatch) int {
				return (b.deleteCount - len(b.moveInputs)) - (a.deleteCount - len(a.moveInputs))
			})
			// Apply the best patch if it saves any moves.
			bestPatch := possiblePatches[0]
			saved := bestPatch.deleteCount - len(bestPatch.moveInputs)
			fmt.Println("Best patch:", String(bestPatch.moveInputs), "saves", saved, "moves")
			if saved > 0 {
				// Replace the subsequence starting at i with the new subsequence.
				// TODO: vet this for off-by-one errors, etc.
				moveInputs = append(moveInputs[:i], append(bestPatch.moveInputs, moveInputs[i+bestPatch.deleteCount:]...)...)
				states = append(states[:i+1], states[i+bestPatch.deleteCount:]...)
				// Continue on to the next index as normal.
			}
		}
	}

	return moveInputs

}

func visitPuzzleStates(level *Level, handleState func(*Level, []MoveInput) bool, depth int, moveInputs ...MoveInput) {
	// Use BFS to visit all states up to a certain depth.
	possibleMoves := getAllPossibleMoves(level)
	for _, move := range possibleMoves {
		newLevel := copyLevel(level)
		TakeMove(move, newLevel)
		if handleState(newLevel, moveInputs) {
			// Allow aborting the search if a [partial] solution is found.
			return
		}
		if depth > 0 {
			visitPuzzleStates(newLevel, handleState, depth-1, append(moveInputs, MoveToMoveInput(move))...)
		}
	}
}
