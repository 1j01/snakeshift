import { Food } from "./food"
import { canMove } from "./game-logic"
import { entities, levelHasGoal, serializePlaythrough } from "./game-state"
import { currentLevelID } from "./level-select"
import { draw } from "./rendering"
import { safeStorage } from "./safe-storage"
import { getMovesFromPlaythrough, storageKeys } from "./shared-helpers"
import Snake from "./snake"


function step(time: number) {
  for (const entity of entities) {
    entity.step?.(time)
  }
}

export function animate(time = 0) {
  requestAnimationFrame(animate)

  step(time)
  draw()
}

export function checkLevelWon() {
  if (window._winLevelCheat) {
    window._winLevelCheat = false
    return true
  }
  if (!levelHasGoal) {
    // No goal, so don't declare victory. It's useful to be able to test incomplete levels.
    console.log("No goal; level is unwinnable.")
    return false
  }
  return entities.filter(e => e instanceof Food).length === 0
}

export function checkLevelStuck() {
  return levelHasGoal && entities.every((entity) => !(entity instanceof Snake) || !canMove(entity))
}

export function storeLevelSolution() {
  const levelId = currentLevelID()
  if (!levelId) return
  const solution = serializePlaythrough()
  const moveCount = getMovesFromPlaythrough(solution).filter(m => typeof m === "string").length
  const bestMoveCount = Number(safeStorage.getItem(storageKeys.bestMoveCount(levelId)) ?? Infinity)
  // Should it replace the solution if it's the same number of moves?
  // My gut says yes, so that if you wanted to change it for some (aesthetic?) reason, you could.
  if (isNaN(bestMoveCount) || moveCount <= bestMoveCount) {
    console.log("New best move count for level", levelId, moveCount, "previous best:", bestMoveCount)

    // Prefer storing the move count if there happens to be no space for the solution
    // (Of course, this doesn't mean much without reserving space for all move counts...
    // TODO: Hey, could do that by just storing "Infinity" for all levels on load (unless already set.))
    // (Not that that would probably be a problem. The solutions shouldn't take up that much space, but they COULD, if you did something weird.)
    // TODO: show a toast if it fails to persist to localStorage
    safeStorage.setItem(storageKeys.bestMoveCount(levelId), moveCount.toString())
    safeStorage.setItem(storageKeys.bestSolution(levelId), solution)
  } else {
    console.log("Not a new best move count for level", levelId, moveCount, "previous best:", bestMoveCount)
  }
}

/**
 * Used to prevent input from secretly affecting the game while a screen is shown over it.
 * Also used to check if a screen is shown that could be dismissed with a key press.
 * @returns true if there is NO screen blocking the game screen, false if blocked
 */
export function shouldInputBeAllowed() {
  return (
    !document.querySelector("#game-win-screen.active, #level-splash.active.active") ||
    parseFloat(
      getComputedStyle(document.querySelector("#game-win-screen.active, #level-splash.active")!)
        .opacity
    ) < 0.7
  )
}
