import { activePlayer } from "./game-state"
import { tileOnPage } from "./rendering"
import { Tile } from "./types"

let hoverEffect: HTMLDivElement | undefined = undefined

interface HighlightOptions {
  pressed: boolean
  valid: boolean
}

export function setHighlight(tile: Tile | undefined, options: Partial<HighlightOptions> = {}) {
  if (hoverEffect) {
    hoverEffect.remove()
    hoverEffect = undefined
  }
  if (tile && activePlayer) {
    const onPage = tileOnPage(tile)
    hoverEffect = document.createElement('div')
    hoverEffect.classList.add('hover-effect')
    hoverEffect.style.left = `${onPage.x}px`
    hoverEffect.style.top = `${onPage.y}px`
    hoverEffect.style.width = `${onPage.size}px`
    hoverEffect.style.height = `${onPage.size}px`
    document.body.appendChild(hoverEffect)
    hoverEffect?.classList.toggle("active-effect", options.pressed ?? false)
    hoverEffect?.classList.toggle("valid", options.valid ?? true)
  }
}

// Arguably it would've been simpler to just support valid as an option and && the validity,
// which could theoretically have utility. But I did the typescript thing. It is done. Look how type-safe it is.
export function highlightMove(tile: Tile | undefined, options: Partial<Omit<HighlightOptions, 'valid'>> = {}) {
  const valid = tile ? activePlayer?.analyzeMoveAbsolute(tile).valid : false
  setHighlight(tile, { valid, ...options })
}
