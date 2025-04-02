import { playedSounds } from "./audio"
import { deserialize, loadLevelFromText, serialize, serializePlaythrough } from "./game-state"
import { solvePuzzle } from "./puzzle-solver"
import { tileOnPage } from "./rendering"

const _forTesting = {
  tileOnPage,
  playedSounds,
  serialize,
  deserialize,
  loadLevelFromText,
  serializePlaythrough,
  solvePuzzle,
}
window._forTesting = _forTesting

declare global {
  interface Window {
    _forTesting: typeof _forTesting
  }
}
