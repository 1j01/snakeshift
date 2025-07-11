package main

import "fmt"

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
		isPartialSolution := func(l *Level) bool {
			// Check if the level is won OR matches a later state in the playthrough.
			if levelIsWon(l) {
				return true
			}
			for j := i + 1; j < len(states); j++ {
				if Equal(l, states[j]) {
					return true
				}
			}
			return false
		}
		// Hmmm, TODO: this can't work as intended.
		// If it returns only the shortest subsequence,
		// it will always return a single move.
		// We need to look at ALL subsequences up to a certain length,
		// and find ones that are shorter than equivalent subsequences.
		// I thought I could be cute by making it a "solvePuzzle" function
		// with a special condition, but I may need to make it more of a "visitPuzzleStates"
		// We also want to keep track of the specific end state that matched,
		// in order to do the replacement, which a boolean isSolved function wouldn't provide for.
		// (We could find the matching state afterwards, but that would be inefficient.)
		newSubsequence := solvePuzzle(states[i], isPartialSolution, 6)
		if newSubsequence != nil {

		}
	}

	return moveInputs

}

func solvePuzzle(level *Level, isSolved func(*Level) bool, depth int) []MoveInput {
	// Use BFS to find the shortest path to a solution.

	possibleMoves := getAllPossibleMoves(level)
	for _, move := range possibleMoves {
		newLevel := copyLevel(level)
		TakeMove(move, newLevel)
		if isSolved(newLevel) {
			return MovesToMoveInputs([]Move{move}) // Found a solution.
		}
		if depth > 0 {
			subsequentMoves := solvePuzzle(newLevel, isSolved, depth-1)
			if subsequentMoves != nil {
				return append(MovesToMoveInputs([]Move{move}), subsequentMoves...)
			}
		}
	}
	return nil
}
