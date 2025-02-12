import { playedSounds, type SoundID } from "./audio"
import { tileOnPage } from "./rendering"
import type { Tile } from "./types"

window._forTesting = { tileOnPage, playedSounds }

declare global {
  interface Window {
    _forTesting: {
      tileOnPage: (tile: Tile) => Tile
      playedSounds: SoundID[]
    }
  }
}
