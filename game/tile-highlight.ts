import { activityMode } from "./game"
import { activePlayer } from "./game-state"
import { tileOnPage } from "./rendering"
import { Tile } from "./types"

let hoverEffect: HTMLDivElement | undefined = undefined
let levelBorder: HTMLDivElement | undefined = undefined

interface HighlightOptions {
  pressed: boolean
  valid: boolean
  isSelection: boolean
}

export function setHighlight(tile: Tile | undefined, options: Partial<HighlightOptions> = {}) {
  if (hoverEffect) {
    hoverEffect.remove()
    hoverEffect = undefined
  }
  if (tile && (!!activePlayer || activityMode === "edit")) {
    hoverEffect = document.createElement('div')
    hoverEffect.classList.add('hover-effect')
    document.body.appendChild(hoverEffect)
    hoverEffect?.classList.toggle("active-effect", options.pressed ?? false)
    hoverEffect?.classList.toggle("valid", options.valid ?? true)
    hoverEffect?.classList.toggle("selection", options.isSelection ?? false)
    positionElement(hoverEffect, tileOnPage(tile))
  }
}

export function setLevelBorder(levelInfo: { width: number, height: number }) {
  // This isn't related to "tile highlighting"; should I fold this module into rendering.ts?
  // Or should I rename this module, or move just the unrelated code, or is it fine?
  if (!levelBorder) {
    levelBorder = document.createElement('div')
    levelBorder.classList.add('level-border')
    document.body.appendChild(levelBorder)
  }
  positionElement(levelBorder, tileOnPage({ x: 0, y: 0, width: levelInfo.width, height: levelInfo.height }))
}

export function positionElement(element: HTMLElement, rect: Tile) {
  element.style.left = `${rect.x}px`
  element.style.top = `${rect.y}px`
  element.style.width = `${rect.width}px`
  element.style.height = `${rect.height}px`
}

// Arguably it would've been simpler to just support valid as an option and && the validity,
// which could theoretically have utility. But I did the typescript thing. It is done. Look how type-safe it is.
export function highlightMove(tile: Tile | undefined, options: Partial<Omit<HighlightOptions, 'valid'>> = {}) {
  const valid = tile ? activePlayer?.analyzeMoveAbsolute(tile).valid : false
  setHighlight(tile, { valid, ...options })
}
