import { activePlayer } from "./game-state"
import { tileOnPage } from "./rendering"
import { Tile } from "./types"

let hoverEffect: HTMLDivElement | undefined = undefined
export function setHighlight(tile: Tile | undefined, pressed = false) {
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
    hoverEffect?.classList.toggle("active-effect", pressed)
    // Using Math.sign() here would lead to checking if moving to an adjacent tile is valid,
    // even when a further tile is hovered.
    // const dirX = Math.sign(tile.x - activePlayer.segments[0].x)
    // const dirY = Math.sign(tile.y - activePlayer.segments[0].y)
    const deltaGridX = Math.round(tile.x - activePlayer.segments[0].x)
    const deltaGridY = Math.round(tile.y - activePlayer.segments[0].y)
    const move = activePlayer.analyzeMove(deltaGridX, deltaGridY)
    hoverEffect?.classList.toggle("valid", move.valid)
  }
}
