import { activePlayer, controlScheme, cyclePlayerControl, onUpdate, setControlScheme, undoable } from './game-state'
import { neighborOf, sameTile } from './helpers'
import { pageToWorldTile } from './rendering'
import { highlightMove } from './tile-highlight'
import { ControlScheme, DIRECTIONS, Tile } from './types'

export function handleInput(
  eventTarget: HTMLElement,
) {

  // TODO: DRY/simplify event handling
  const listenerCleanupFunctions: (() => void)[] = []
  function on<K extends keyof HTMLElementEventMap>(eventTarget: HTMLElement, type: K, listener: (this: HTMLElement, ev: HTMLElementEventMap[K]) => void, options?: boolean | AddEventListenerOptions): void;
  function on<K extends keyof WindowEventMap>(eventTarget: Window, type: K, listener: (this: Window, ev: WindowEventMap[K]) => void, options?: boolean | AddEventListenerOptions): void;
  function on(eventTarget: HTMLElement | Window, type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void {
    eventTarget.addEventListener(type, listener, options)
    listenerCleanupFunctions.push(() => eventTarget.removeEventListener(type, listener, options))
  }

  function removeEventListeners() {
    for (const cleanup of listenerCleanupFunctions) {
      cleanup()
    }
  }

  // ---------------------
  // Reactive highlighting
  // ---------------------

  onUpdate(() => {
    if (controlScheme === ControlScheme.KeyboardFacingRelative) {
      // highlightMove(activePlayer.aheadTile())
    } else if (controlScheme === ControlScheme.KeyboardAbsoluteDirection) {
      highlightMove(undefined)
    } else if (controlScheme === ControlScheme.Pointer) {
      let pressed = false
      if (pointerDownTile && mouseHoveredTile) {
        pressed = sameTile(mouseHoveredTile, pointerDownTile)
      }
      highlightMove(mouseHoveredTile, { pressed })
    }
  })

  // -----------------------
  // Mouse/pen/touch support
  // -----------------------

  let pointerDownTile: Tile | undefined = undefined
  let mouseHoveredTile: Tile | undefined = undefined
  on(eventTarget, 'pointerdown', (event: PointerEvent) => {
    pointerDownTile = pageToWorldTile(event)
    if (pointerDownTile) {
      setControlScheme(ControlScheme.Pointer) // sets highlight
    }
  })
  on(eventTarget, 'pointerup', (event: PointerEvent) => {
    const pointerUpTile = pageToWorldTile(event)
    if (
      activePlayer &&
      pointerUpTile &&
      pointerDownTile &&
      sameTile(pointerUpTile, pointerDownTile)
    ) {
      const deltaGridX = Math.round(pointerUpTile.x - activePlayer.segments[0].x)
      const deltaGridY = Math.round(pointerUpTile.y - activePlayer.segments[0].y)
      const move = activePlayer.analyzeMoveRelative(deltaGridX, deltaGridY)
      if (move.valid) {
        undoable()
        activePlayer.takeMove(move)
        setControlScheme(ControlScheme.Pointer) // sets highlight redundantly
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

  on(eventTarget, 'pointercancel', () => {
    pointerDownTile = undefined
    highlightMove(mouseHoveredTile)
  })

  on(eventTarget, 'pointermove', (event: PointerEvent) => {
    const coordinates = pageToWorldTile(event)
    mouseHoveredTile = undefined
    if (coordinates) {
      mouseHoveredTile = coordinates
    }
    // TODO: only with significant movement, such as moving to a new tile
    setControlScheme(ControlScheme.Pointer) // sets highlight
  })

  // ----------------
  // Keyboard support
  // ----------------

  function move(dx: number, dy: number, controlScheme = ControlScheme.KeyboardAbsoluteDirection) {
    // TODO: maybe show highlight for invalid move even though normally absolute direction doesn't use a highlight
    if (!activePlayer) return
    const move = activePlayer.analyzeMoveRelative(dx, dy)
    setControlScheme(controlScheme)
    if (!move.valid) return
    undoable()
    activePlayer.takeMove(move)
  }

  on(window, 'keydown', (event: KeyboardEvent) => {
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

  const buttonsLast = new Map<number, Map<number, boolean>>()
  function justPressed(button: number, gamepad: Gamepad) {
    const last = buttonsLast.get(gamepad.index)?.get(button)
    return gamepad.buttons[button].pressed && !last
  }
  const minDistance = 0.5
  function pollGamepads() {
    if (!activePlayer) return
    const gamepads = navigator.getGamepads()
    let hoveredTile: Tile | undefined = undefined
    for (const gamepad of gamepads) {
      if (!gamepad) continue
      const [leftStickX, leftStickY] = gamepad.axes.slice(0, 2)
      const playerTile = activePlayer.segments[0]
      const dist = Math.hypot(leftStickX, leftStickY)
      const angle = Math.atan2(leftStickY, leftStickX)
      let directionIndex = Math.round(angle / (Math.PI / 2))
      directionIndex = ((directionIndex % DIRECTIONS.length) + DIRECTIONS.length) % DIRECTIONS.length
      const direction = DIRECTIONS[directionIndex]
      let usingGamepad = false
      // Joystick
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
          setControlScheme(ControlScheme.Gamepad)
          undoable()
          activePlayer.takeMove(move)
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

      buttonsLast.set(gamepad.index, new Map(gamepad.buttons.map((button, index) => [index, button.pressed])))
      for (const button of gamepad.buttons) {
        if (button.pressed) {
          usingGamepad = true
        }
      }
      if (usingGamepad) {
        setControlScheme(ControlScheme.Gamepad)
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
