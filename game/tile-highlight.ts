import { activePlayer } from "./game-state"
import { rectOnPage, tileOnPage } from "./rendering"
import { Tile } from "./types"

let hoverEffect: HTMLDivElement | undefined = undefined
let levelBorder: HTMLDivElement | undefined = undefined

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

export function setLevelBorder(levelInfo: { width: number, height: number }) {
  // TODO: DRY, I'm feeling SO LAZY right now
  // also this isn't related to "tile highlighting"
  // also I figure I should probably replace Tile with a Box or Rect type with width/height
  if (!levelBorder) {
    levelBorder = document.createElement('div')
    levelBorder.classList.add('level-border')
    document.body.appendChild(levelBorder)
  }
  const onPage = rectOnPage({ x: 0, y: 0, width: levelInfo.width, height: levelInfo.height })
  levelBorder.style.left = `${onPage.x}px`
  levelBorder.style.top = `${onPage.y}px`
  levelBorder.style.width = `${onPage.width}px`
  levelBorder.style.height = `${onPage.height}px`
}

// Arguably it would've been simpler to just support valid as an option and && the validity,
// which could theoretically have utility. But I did the typescript thing. It is done. Look how type-safe it is.
export function highlightMove(tile: Tile | undefined, options: Partial<Omit<HighlightOptions, 'valid'>> = {}) {
  const valid = tile ? activePlayer?.analyzeMoveAbsolute(tile).valid : false
  setHighlight(tile, { valid, ...options })
}
