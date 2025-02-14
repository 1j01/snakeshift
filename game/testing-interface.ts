import { playedSounds, type SoundID } from "./audio"
import { deserialize, serialize } from "./game-state"
import { tileOnPage } from "./rendering"
import type { Tile } from "./types"

window._forTesting = { tileOnPage, playedSounds, serialize, deserialize }

declare global {
  interface Window {
    _forTesting: {
      tileOnPage: (tile: Tile) => Tile
      playedSounds: SoundID[]
      serialize: () => string
      deserialize: (serialized: string) => void
    }
  }
}
