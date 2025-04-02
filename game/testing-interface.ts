import { playedSounds, type SoundID } from "./audio"
import { deserialize, loadLevelFromText, serialize, serializePlaythrough } from "./game-state"
import { solvePuzzle, SolverMove } from "./puzzle-solver"
import { tileOnPage } from "./rendering"
import type { Tile } from "./types"

window._forTesting = {
  tileOnPage,
  playedSounds,
  serialize,
  deserialize,
  loadLevelFromText,
  serializePlaythrough,
  solvePuzzle,
}

declare global {
  interface Window {
    _forTesting: {
      tileOnPage: (tile: Tile) => Tile
      playedSounds: SoundID[]
      serialize: (forSave?: boolean) => string
      serializePlaythrough: () => string
      deserialize: (serialized: string) => void
      loadLevelFromText: (fileText: string, newMode: "edit" | "play" | "replay", levelId?: string | null) => boolean
      solvePuzzle: (depthLimit?: number) => Promise<SolverMove[] | false>
    }
  }
}
