import { playedSounds, type SoundID } from "./audio"
import { loadLevelFromText, serialize } from "./game-state"
import { tileOnPage } from "./rendering"
import type { Tile } from "./types"

window._forTesting = { tileOnPage, playedSounds, serialize, loadLevelFromText }

declare global {
  interface Window {
    _forTesting: {
      tileOnPage: (tile: Tile) => Tile
      playedSounds: SoundID[]
      serialize: () => string
      serializePlaythrough: () => string
      loadLevelFromText: (fileText: string, newMode: "edit" | "play" | "replay", levelId?: string | null) => boolean
    }
  }
}
