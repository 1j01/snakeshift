import { activityMode, restartLevel } from './game'
import { activePlayer, controlScheme, cyclePlayerControl, onResize, onUpdate, redo, setControlScheme, undo } from './game-state'
import { makeEventListenerGroup, neighborOf, sameTile } from './helpers'
import { showMainMenu } from './menus'
import { pageToWorldTile } from './rendering'
import { highlightMove } from './tile-highlight'
import { ControlScheme, DIRECTIONS, Tile } from './types'

export function handleInput(
  eventTarget: HTMLElement,
) {

  const { on, removeEventListeners } = makeEventListenerGroup()

  // ---------------------
  // Reactive highlighting
  // ---------------------

  function updateHighlight() {
    if (controlScheme === ControlScheme.KeyboardFacingRelative) {
      // highlightMove(activePlayer.aheadTile())
    } else if (controlScheme === ControlScheme.KeyboardAbsoluteDirection) {
      highlightMove(undefined)
    } else if (controlScheme === ControlScheme.Pointer) {
      const pressed = pointerDownTile && sameTile(mouseHoveredTile, pointerDownTile)
      highlightMove(mouseHoveredTile, { pressed })
    }
  }
  onUpdate(updateHighlight)
  onResize(updateHighlight)

  // -----------------------
  // Mouse/pen/touch support
  // -----------------------

  let pointerDownTile: Tile | undefined = undefined
  let mouseHoveredTile: Tile | undefined = undefined
  if (activityMode !== "menu") {
    on(eventTarget, 'pointerdown', (event) => {
      pointerDownTile = pageToWorldTile(event)
      if (pointerDownTile) {
        setControlScheme(ControlScheme.Pointer) // sets highlight; signals level update uselessly
      }
    })
    on(window, 'pointerup', (event) => {
      const pointerUpTile = pageToWorldTile(event)
      if (
        activePlayer &&
        pointerUpTile &&
        sameTile(pointerUpTile, pointerDownTile)
      ) {
        const deltaGridX = Math.round(pointerUpTile.x - activePlayer.segments[0].x)
        const deltaGridY = Math.round(pointerUpTile.y - activePlayer.segments[0].y)
        const move = activePlayer.analyzeMoveRelative(deltaGridX, deltaGridY)
        if (move.valid) {
          activePlayer.takeMove(move)
          setControlScheme(ControlScheme.Pointer) // signals level update; sets highlight redundantly
        }
        // updateGameState({
        //   playerCoordinates: pointerUpTile,
        //   playerFacing: activePlayer.directionOfMove(pointerUpTile)!,
        //   controlScheme: ControlScheme.Pointer
        // })
      }
      pointerDownTile = undefined
      highlightMove(mouseHoveredTile)
    })

    on(window, 'pointercancel', () => {
      pointerDownTile = undefined
      highlightMove(mouseHoveredTile)
    })

    on(window, 'pointermove', (event) => {
      const lastTile = mouseHoveredTile
      mouseHoveredTile = pageToWorldTile(event)
      // only with significant movement (moving to a new tile),
      // because this replaces the highlight used by gamepad controls
      // and you don't want it flickering from mouse jitter while using a gamepad
      if (!sameTile(lastTile, mouseHoveredTile)) {
        setControlScheme(ControlScheme.Pointer) // sets highlight; signals level update uselessly
      }
    })
  }

  // ----------------
  // Shared between keyboard and gamepad
  // ----------------

  function move(dx: number, dy: number, controlScheme = ControlScheme.KeyboardAbsoluteDirection) {
    // TODO: maybe show highlight for invalid move even though normally absolute direction doesn't use a highlight
    if (!activePlayer) {
      // TODO: if no focus or focus is on body, focus via DOM order instead of from center of page
      // Could alternatively leave this with mildly weird behavior as a fallback,
      // and try to always explicitly focus something on a given screen.

      // DOM structure could also be used to improve this generally, navigating by rows/columns.
      // Could also benefit from storing "original x/y", updated only when moving in that axis,
      // similar to how a text editor will store the original x position of the cursor
      // and move as close as possible to it when moving up/down, only updating the stored x when moving left/right explicitly.

      const currentFocus = document.activeElement ?? document.body
      const currentRect = currentFocus.getBoundingClientRect()
      const currentCenter = { x: currentRect.x + currentRect.width / 2, y: currentRect.y + currentRect.height / 2 }
      const normalizedInput = { x: dx / Math.hypot(dx, dy), y: dy / Math.hypot(dx, dy) }
      const directionalScore = (element: Element) => {
        const rect = element.getBoundingClientRect()
        const center = { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 }
        const distanceX = center.x - currentCenter.x
        const distanceY = center.y - currentCenter.y
        const vector = { x: distanceX / Math.hypot(distanceX, distanceY), y: distanceY / Math.hypot(distanceX, distanceY) }
        return normalizedInput.x * vector.x + normalizedInput.y * vector.y
      }
      const distanceScore = (element: Element) => {
        const rect = element.getBoundingClientRect()
        const center = { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 }
        const distanceX = center.x - currentCenter.x
        const distanceY = center.y - currentCenter.y
        return Math.hypot(distanceX, distanceY)
      }
      const combinedScore = (element: Element) => {
        // This could use some finessing.
        // Should the distance factor have an exponent?
        return distanceScore(element) / directionalScore(element)
      }
      const isVisibleAndOnTop = (element: Element) => {
        const rect = element.getBoundingClientRect()
        const center = { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 }
        return document.elementFromPoint(center.x, center.y) === element
      }
      // TODO: consider other focusable elements
      const focusableElements = [...document.querySelectorAll<HTMLElement>('button, a')]
        .filter((element) =>
          element !== currentFocus &&
          isVisibleAndOnTop(element) &&
          directionalScore(element) > 0
        )

      // for (const element of focusableElements) {
      // element.style.outline = `2px solid hsl(${score(element) * 50 + 180}, 100%, 50%)`
      // element.style.boxShadow = `0 0 0 2px hsl(${directionalScore(element) * 50 + 180}, 100%, 50%)`
      // element.dataset.score = String(directionalScore(element))
      // }
      // focusableElements.sort((a, b) => directionalScore(a) - directionalScore(b))
      // focusableElements.sort((a, b) => distanceScore(a) - distanceScore(b))
      focusableElements.sort((a, b) => combinedScore(a) - combinedScore(b))

      if (focusableElements.length) {
        console.log('focusing', focusableElements[0])
        focusableElements[0].focus()
      }
      return
    }
    const move = activePlayer.analyzeMoveRelative(dx, dy)
    if (!move.valid) {
      setControlScheme(controlScheme) // signals level update uselessly
      return
    }
    activePlayer.takeMove(move)
    setControlScheme(controlScheme) // signals level update
  }

  // ----------------
  // Keyboard support
  // ----------------

  on(window, 'keydown', (event) => {
    // Using `event.code` instead of `event.key` since the control scheme relies on the physical key layout, not the letters.
    // Undo/redo is handled separately.
    // Don't prevent default behavior with modifier keys held,
    // as there are many useful shortcuts that would block, like Ctrl+L to focus the address bar.
    if (event.ctrlKey || event.metaKey || event.altKey) {
      return
    }
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
      case 'Tab':
      case 'ShiftLeft':
      case 'ShiftRight':
        if (activityMode === "play") {
          cyclePlayerControl()
        } else {
          handling = false
        }
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

  const buttonsLast = new Map<number, Map<number, boolean>>()
  function justPressed(button: number, gamepad: Gamepad) {
    const last = buttonsLast.get(gamepad.index)?.get(button)
    return gamepad.buttons[button].pressed && !last
  }
  const minDistance = 0.5
  function pollGamepads() {
    const gamepads = navigator.getGamepads()
    let hoveredTile: Tile | undefined = undefined
    for (const gamepad of gamepads) {
      if (!gamepad) continue
      let usingGamepad = false
      if (activePlayer) {
        // Joystick
        const [leftStickX, leftStickY] = gamepad.axes.slice(0, 2)
        const playerTile = activePlayer.segments[0]
        const dist = Math.hypot(leftStickX, leftStickY)
        const angle = Math.atan2(leftStickY, leftStickX)
        let directionIndex = Math.round(angle / (Math.PI / 2))
        directionIndex = ((directionIndex % DIRECTIONS.length) + DIRECTIONS.length) % DIRECTIONS.length
        const direction = DIRECTIONS[directionIndex]
        if (dist > minDistance) {
          usingGamepad = true
          const neighbor = neighborOf(playerTile, direction)
          hoveredTile = neighbor
          const move = activePlayer.analyzeMoveRelative(direction.x, direction.y)
          if (hoveredTile && justPressed(0, gamepad) && move.valid) {
            // updateGameState({
            //   playerCoordinates: [hoveredTile.x, hoveredTile.y],
            //   playerFacing: direction,
            //   controlScheme: ControlScheme.Gamepad,
            // })
            activePlayer.takeMove(move)
            setControlScheme(ControlScheme.Gamepad) // signals level update
            hoveredTile = undefined
            // break // need to update buttonsLast!
          } else {
            // updateGameState({
            //   playerFacing: direction,
            //   controlScheme: ControlScheme.Gamepad,
            // })
            setControlScheme(ControlScheme.Gamepad)
          }
        }
      }
      // D-pad
      if (justPressed(12, gamepad)) {
        move(0, -1, ControlScheme.Gamepad)
      } else if (justPressed(13, gamepad)) {
        move(0, 1, ControlScheme.Gamepad)
      } else if (justPressed(14, gamepad)) {
        move(-1, 0, ControlScheme.Gamepad)
      } else if (justPressed(15, gamepad)) {
        move(1, 0, ControlScheme.Gamepad)
      }
      // Bumpers
      if (justPressed(4, gamepad)) {
        cyclePlayerControl()
      } else if (justPressed(5, gamepad)) {
        cyclePlayerControl(true)
      }
      // Face buttons
      // (Should undo/redo be moved to the bumpers?)
      if (justPressed(0, gamepad)) {
        if (!activePlayer) {
          if (document.activeElement instanceof HTMLElement) {
            document.activeElement.click()
          }
        }
      } else if (justPressed(2, gamepad)) {
        undo()
      } else if (justPressed(1, gamepad)) {
        redo()
      } else if (justPressed(3, gamepad)) {
        restartLevel()
      }
      // Back/select button
      // TODO: allow getting out of level editor; currently this function isn't used there
      if (justPressed(8, gamepad)) {
        showMainMenu()
      }

      buttonsLast.set(gamepad.index, new Map(gamepad.buttons.map((button, index) => [index, button.pressed])))
      for (const button of gamepad.buttons) {
        if (button.pressed) {
          usingGamepad = true
        }
      }
      if (usingGamepad) {
        setControlScheme(ControlScheme.Gamepad) // may be redundant depending on the above conditions
      }
    }
    if (controlScheme === ControlScheme.Gamepad) {
      highlightMove(hoveredTile)
    }
  }
  const intervalID = setInterval(pollGamepads, 1000 / 60)

  // ---------------
  return () => {
    removeEventListeners()
    clearInterval(intervalID)
  }
}
