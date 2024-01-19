import { activePlayer, cyclePlayerControl, redo, undo, undoable } from './game-state'
import { pageToWorldTile, tileOnPage } from './rendering'
import { ControlScheme, Tile } from './types'

function sameTile(a: Tile, b: Tile) {
  return a.x === b.x && a.y === b.y && a.size === b.size
}

// function updateGameState(update: any) {
// }

export function handleInput(
  eventTarget: HTMLElement,
) {

  // --------------------
  // Highlight management
  // --------------------

  let hoverEffect: HTMLDivElement | undefined = undefined
  function setHighlight(tile: Tile | undefined) {
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
      let pressed = false
      if (pointerDownTile) {
        pressed = sameTile(tile, pointerDownTile)
      }
      hoverEffect?.classList.toggle("active-effect", pressed)
      const dirX = Math.sign(tile.x - activePlayer.segments[0].x)
      const dirY = Math.sign(tile.y - activePlayer.segments[0].y)
      // TODO: handle tile size > 1?
      const adjacent = sameTile(tile, { x: activePlayer.segments[0].x + dirX, y: activePlayer.segments[0].y + dirY, size: 1 })
      const move = activePlayer.analyzeMove(dirX, dirY)
      hoverEffect?.classList.toggle("valid", move.valid && adjacent)
    }
  }

  // onUpdate(['playerCoordinates', 'playerFacing', 'controlScheme'], ({ playerCoordinates, playerFacing, controlScheme }) => {
  //   const aheadTile = neighborOf(new Tile(playerCoordinates), playerFacing)
  //   if (controlScheme === ControlScheme.KeyboardFacingRelative) {
  //     setHighlight(aheadTile)
  //   } else if (controlScheme === ControlScheme.KeyboardAbsoluteDirection) {
  //     setHighlight(undefined)
  //   }
  // })

  // -----------------------
  // Mouse/pen/touch support
  // -----------------------

  let pointerDownTile: Tile | undefined = undefined
  let mouseHoveredTile: Tile | undefined = undefined
  eventTarget.addEventListener('pointerdown', (event: MouseEvent) => {
    pointerDownTile = pageToWorldTile(event)
    if (pointerDownTile) {
      // updateGameState({ controlScheme: ControlScheme.Pointer })
      setHighlight(mouseHoveredTile)
    }
  })

  eventTarget.addEventListener('pointerup', (event: MouseEvent) => {
    const pointerUpTile = pageToWorldTile(event)
    if (
      activePlayer &&
      pointerUpTile &&
      pointerDownTile &&
      sameTile(pointerUpTile, pointerDownTile)
    ) {
      const dirX = Math.sign(pointerUpTile.x - activePlayer.segments[0].x)
      const dirY = Math.sign(pointerUpTile.y - activePlayer.segments[0].y)
      const move = activePlayer.analyzeMove(dirX, dirY)
      if (move.valid) {
        undoable()
        activePlayer.takeMove(move)
      }
      // updateGameState({
      //   playerCoordinates: pointerUpTile,
      //   playerFacing: activePlayer.directionOfMove(pointerUpTile)!,
      //   controlScheme: ControlScheme.Pointer
      // })
    }
    pointerDownTile = undefined
    setHighlight(mouseHoveredTile)
  })

  eventTarget.addEventListener('pointercancel', () => {
    pointerDownTile = undefined
    setHighlight(mouseHoveredTile)
  })

  eventTarget.addEventListener('pointermove', (event: MouseEvent) => {
    const coordinates = pageToWorldTile(event)
    mouseHoveredTile = undefined
    if (coordinates) {
      mouseHoveredTile = coordinates
    }
    // updateGameState({ controlScheme: ControlScheme.Pointer })
    setHighlight(mouseHoveredTile)
  })

  // ----------------
  // Keyboard support
  // ----------------

  function move(dx: number, dy: number, controlScheme = ControlScheme.KeyboardAbsoluteDirection) {
    // TODO: maybe show highlight for invalid move even though normally absolute direction doesn't use a highlight
    if (!activePlayer) return
    const move = activePlayer.analyzeMove(dx, dy)
    if (!move.valid) return
    undoable()
    activePlayer.takeMove(move)
  }

  addEventListener('keydown', (event: KeyboardEvent) => {
    // Using `event.code` instead of `event.key` since the control scheme relies on the physical key layout, not the letters.
    let handling = true
    switch (event.code) {
      case 'ArrowLeft': // arrow keys
      case 'KeyA': // WASD
      case 'Numpad4': // numpad
      case 'KeyH': // vi-style
        move(-1, 0)
        break
      case 'ArrowRight': // arrow keys
      case 'KeyD': // WASD
      case 'Numpad6': // numpad
      case 'KeyL': // vi-style
        move(1, 0)
        break
      case 'ArrowUp': // arrow keys
      case 'KeyW': // WASD
      case 'Numpad8': // numpad
      case 'KeyK': // vi-style
        move(0, -1)
        break
      case 'ArrowDown': // arrow keys
      case 'KeyS': // WASD
      case 'Numpad2': // numpad
      case 'KeyJ': // vi-style
        move(0, 1)
        break
      case 'KeyZ':
        // Hm, shift cycling players breaks this.
        // I could specially handle it, preserving redos in a separate stack
        // until you release shift, or I could make it not cycle players
        // until you release shift, or I could remove shift cycling players,
        // or just say you need to use Y to redo.
        if (event.shiftKey) {
          redo()
        } else {
          undo()
        }
        break
      case 'KeyY':
        redo()
        break
      case 'Tab':
      case 'ShiftLeft':
      case 'ShiftRight':
        cyclePlayerControl()
        break
      default:
        handling = false
        break
    }
    if (handling) {
      event.preventDefault()
    }
  })

  // ---------------
  // Gamepad support
  // ---------------

  // const buttonsLast = new Map<number, Map<number, boolean>>()
  // function justPressed(button: number, gamepad: Gamepad) {
  //   const last = buttonsLast.get(gamepad.index)?.get(button)
  //   return gamepad.buttons[button].pressed && !last
  // }
  // const minDistance = 0.5
  // function pollGamepads() {
  //   const gamepads = navigator.getGamepads()
  //   let hoveredTile: Tile | undefined = undefined
  //   for (const gamepad of gamepads) {
  //     if (!gamepad) continue
  //     const [leftStickX, leftStickY] = gamepad.axes.slice(0, 2)
  //     const playerTile = new Tile(currentState.playerCoordinates)
  //     const dist = Math.hypot(leftStickX, leftStickY)
  //     const angle = Math.atan2(leftStickY, leftStickX)
  //     let directionIndex = Math.round(angle / (Math.PI / 3)) + 2
  //     directionIndex = ((directionIndex % DIRECTIONS.length) + DIRECTIONS.length) % DIRECTIONS.length
  //     const direction = DIRECTIONS[directionIndex]
  //     let usingGamepad = false
  //     if (dist > minDistance) {
  //       usingGamepad = true
  //       const neighbor = neighborOf(playerTile, direction)
  //       hoveredTile = neighbor
  //       if (hoveredTile && justPressed(0, gamepad) && activePlayer.isValidMove([neighbor.q, neighbor.r])) {
  //         updateGameState({
  //           playerCoordinates: [hoveredTile.q, hoveredTile.r],
  //           playerFacing: direction,
  //           controlScheme: ControlScheme.Gamepad,
  //         })
  //         hoveredTile = undefined
  //         // break // need to update buttonsLast!
  //       } else {
  //         updateGameState({
  //           playerFacing: direction,
  //           controlScheme: ControlScheme.Gamepad,
  //         })
  //       }
  //     }
  //     buttonsLast.set(gamepad.index, new Map(gamepad.buttons.map((button, index) => [index, button.pressed])))
  //     for (const button of gamepad.buttons) {
  //       if (button.pressed) {
  //         usingGamepad = true
  //       }
  //     }
  //     if (usingGamepad) {
  //       updateGameState({ controlScheme: ControlScheme.Gamepad })
  //     }
  //   }
  //   if (currentState.controlScheme === ControlScheme.Gamepad) {
  //     setHighlight(hoveredTile)
  //   }
  // }
  // setInterval(pollGamepads, 1000 / 60)

}
