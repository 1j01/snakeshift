
/**
 * This is a naive depth-first search solver for the game.
 * 
 * It of course can't deal with the vast state space, but it can solve the first tutorial level. :P
 */

import { checkLevelWon } from "./game"
import { analyzeMoveRelative, takeMove } from "./game-logic"
import { entities, serialize, undo } from "./game-state"
import Snake from "./snake"
import { DIRECTIONS, Move, Point } from "./types"

// The existing Move type is not suitable for serialization.
// When deserializing with undo(), the Entity references would be invalidated.
export interface SolverMove {
  snakeId: string
  delta: Point
}

function moveToSolverMove(move: Move): SolverMove {
  return { snakeId: move.snake.id, delta: move.delta }
}
function solverMoveToMove(move: SolverMove): Move {
  const snake = entities.find(e => e instanceof Snake && e.id === move.snakeId) as Snake
  return analyzeMoveRelative(snake, move.delta.x, move.delta.y)
}


function availableMoves() {
  const moves: SolverMove[] = []
  for (const entity of entities) {
    if (entity instanceof Snake) {
      for (const direction of DIRECTIONS) {
        const move = analyzeMoveRelative(entity, direction.x, direction.y)
        if (move.valid) {
          moves.push(moveToSolverMove(move))
        }
      }
    }
  }
  return moves
}

export function solvePuzzle(depthLimit = 50): Promise<SolverMove[] | false> {

  // TODO: save/restore undo stacks / eliminate side effects

  const visited = new Set()
  const moveHistory: SolverMove[] = []

  async function dfs(depth = 0) {
    if (depth > depthLimit) return false
    const state = serialize()
    if (visited.has(state)) return false
    visited.add(state)

    if (checkLevelWon()) return moveHistory

    for (const solverMove of availableMoves()) {
      const move = solverMoveToMove(solverMove)
      takeMove(move)
      moveHistory.push(solverMove)
      await new Promise(r => setTimeout(r, 0))
      if (await dfs(depth + 1)) return moveHistory
      undo()
      moveHistory.pop()
    }

    return false
  }

  return dfs()
}
