import { activePlayer } from './game-state'
import { ControlScheme, Tile } from './types'

export function handleInput(
  eventTarget: EventTarget,
) {

  // --------------------
  // Highlight management
  // --------------------

  // let hoverEffect: HTMLDivElement | undefined = undefined
  // function setHighlight(tile: Tile | undefined) {
  //   if (hoverEffect) {
  //     hoverEffect.remove()
  //     hoverEffect = undefined
  //   }
  //   if (tile) {
  //     hoverEffect = document.createElement('div')
  //     hoverEffect.classList.add('hover-effect')
  //     hoverEffect.style.left = `${tile.x}px`
  //     hoverEffect.style.top = `${tile.y}px`
  //     hoverEffect.style.width = `${tile.size}px`
  //     hoverEffect.style.height = `${tile.size}px`
  //     document.body.appendChild(hoverEffect)
  //     let pressed = false
  //     if (pointerDownCoordinates) {
  //       pressed = tile.equals(pointerDownCoordinates)
  //     }
  //     hoverEffect?.classList.toggle("active-effect", pressed)
  //     hoverEffect?.classList.toggle("valid", player.isValidMove(tile))
  //   }
  // }

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

  // let pointerDownCoordinates: TupleCoordinates | null = null
  // let mouseHoveredTile: Tile | undefined = undefined
  // eventTarget.addEventListener('pointerdown', (event: MouseEvent) => {
  //   pointerDownCoordinates = pageToWorld(event.target!)
  //   if (pointerDownCoordinates) {
  //     updateGameState({ controlScheme: ControlScheme.Pointer })
  //     setHighlight(mouseHoveredTile)
  //   }
  // })

  // eventTarget.addEventListener('pointerup', (event: MouseEvent) => {
  //   const coordinates = pageToWorld(event.target!)
  //   if (
  //     coordinates &&
  //     pointerDownCoordinates &&
  //     coordinates[0] === pointerDownCoordinates[0] &&
  //     coordinates[1] === pointerDownCoordinates[1] &&
  //     player.isValidMove(coordinates)
  //   ) {
  //     updateGameState({
  //       playerCoordinates: coordinates,
  //       playerFacing: player.directionOfMove(coordinates)!,
  //       controlScheme: ControlScheme.Pointer
  //     })
  //   }
  //   pointerDownCoordinates = null
  //   setHighlight(mouseHoveredTile)
  // })

  // eventTarget.addEventListener('pointercancel', () => {
  //   pointerDownCoordinates = null
  //   setHighlight(mouseHoveredTile)
  // })

  // eventTarget.addEventListener('mouseover', (event: MouseEvent) => {
  //   const coordinates = coordinatesFromTarget(event.target!)
  //   mouseHoveredTile = undefined
  //   if (coordinates) {
  //     mouseHoveredTile = new Tile(coordinates)
  //   }
  //   updateGameState({ controlScheme: ControlScheme.Pointer })
  //   setHighlight(mouseHoveredTile)
  // })

  // ----------------
  // Keyboard support
  // ----------------

  function move(dx: number, dy: number, controlScheme = ControlScheme.KeyboardAbsoluteDirection) {
    // TODO: maybe show highlight for invalid move even though normally absolute direction doesn't use a highlight
    if (!activePlayer.canMove(dx, dy)) return
    activePlayer.move(dx, dy)
  }

  addEventListener('keydown', (event: KeyboardEvent) => {
    // Using `event.code` instead of `event.key` since the control scheme relies on the physical key layout, not the letters.
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
  //       if (hoveredTile && justPressed(0, gamepad) && player.isValidMove([neighbor.q, neighbor.r])) {
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
