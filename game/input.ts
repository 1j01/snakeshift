import { playSound } from './audio'
import { shouldInputBeAllowed } from './game'
import { analyzeMoveRelative, takeMove } from './game-logic'
import { activePlayer, activityMode, controlScheme, cyclePlayerControl, entities, onResize, onUpdate, postUpdate, redo, restartLevel, setActivePlayer, setControlScheme, undo } from "./game-state"
import { hitTestAllEntities, makeEventListenerGroup, neighborOf } from './helpers'
import { showMainMenu } from './menus'
import { pageToWorldTile, tileOnPage } from './rendering'
import { safeStorage } from './safe-storage'
import { storageKeys } from './shared-helpers'
import Snake from './snake'
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
    }
  }
  onUpdate(updateHighlight)
  onResize(updateHighlight)

  // -----------------------
  // Mouse/pen/touch support
  // -----------------------

  let dragging = false
  let lastPointerPosition: { x: number, y: number } | undefined = undefined

  if (activityMode !== "menu") {
    let pointerDownSnake: Snake | undefined = undefined
    let movedSincePointerDown = false

    const snakeUnderPointer = (event: { clientX: number, clientY: number }): Snake | undefined => {
      // this is redundant with the below more lenient check
      // except MAYBE if the tiles are really big on the page
      // (I could increase the maxDistance to account for that, by measuring a tile on the page, and take the max)
      const mouseTile = pageToWorldTile(event)
      const hits = hitTestAllEntities(mouseTile.x, mouseTile.y)
      const snakeHit = hits.find((hit) => hit.entity instanceof Snake)
      if (snakeHit) {
        return snakeHit?.entity as Snake | undefined
      }

      // more lenient so you can fat-finger it and don't have to think as much about things irrelevant to the puzzle
      const maxDistance = 40
      let closestSnake: Snake | undefined = undefined
      let closestDistance = maxDistance
      for (const entity of entities) {
        if (entity instanceof Snake) {
          for (const segment of entity.segments) {
            const segmentOnPage = tileOnPage(segment)
            const center = { x: segmentOnPage.x + segmentOnPage.width / 2, y: segmentOnPage.y + segmentOnPage.height / 2 }
            const distance = Math.hypot(center.x - event.clientX, center.y - event.clientY)
            if (distance < closestDistance) {
              closestSnake = entity
              closestDistance = distance
            }
          }
        }
      }
      return closestSnake
    }

    on(eventTarget, "pointerdown", (event) => {
      dragging = true
      lastPointerPosition = { x: event.clientX, y: event.clientY }
      setControlScheme(ControlScheme.Pointer)
      pointerDownSnake = snakeUnderPointer(event)
      movedSincePointerDown = false
      // capture the pointer for iframe embed on itch.io or elsewhere
      // so the mouse doesn't get stuck when releasing outside the iframe
      eventTarget.setPointerCapture(event.pointerId)
    })

    on(window, "pointerup", (event) => {
      dragging = false
      lastPointerPosition = undefined
      if (pointerDownSnake && snakeUnderPointer(event) === pointerDownSnake && !movedSincePointerDown && shouldInputBeAllowed()) {
        // TODO: DRY, shouldn't the sfx and highlight be handled by setActivePlayer? maybe with a flag if needed?
        setActivePlayer(pointerDownSnake)
        playSound("switchSnakes")
        pointerDownSnake.highlight()
      }
      resetMovementPreview()
    })

    on(window, "pointercancel", () => {
      dragging = false
      lastPointerPosition = undefined
      resetMovementPreview()
    })

    on(window, "pointermove", (event) => {
      if (!dragging || !activePlayer || !lastPointerPosition || !shouldInputBeAllowed()) return
      event.preventDefault()

      const deltaX = event.clientX - lastPointerPosition.x
      const deltaY = event.clientY - lastPointerPosition.y

      // Minimum drag distance before moving.
      // Should this be based on the tile size on screen?
      // Maybe not since you need to be able to easily move one tile, even if the level is large.
      // Maybe it should be based on the screen size though. Could be nice if it was configurable as a "move sensitivity" setting.
      const moveThreshold = parseInt(safeStorage.getItem(storageKeys.pointerMoveThreshold) ?? "40")

      activePlayer.previewMovement(deltaX / moveThreshold / 10, deltaY / moveThreshold / 10)

      if (Math.abs(deltaX) < moveThreshold && Math.abs(deltaY) < moveThreshold) {
        return
      }

      let moveX = 0
      let moveY = 0
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        moveX = Math.sign(deltaX) // Move left or right
      } else {
        moveY = Math.sign(deltaY) // Move up or down
      }

      if (moveX !== 0 || moveY !== 0) { // Should always be true
        const move = analyzeMoveRelative(activePlayer, moveX, moveY)
        if (move.valid) {
          takeMove(move)
          postUpdate() // for level win condition (weirdly, this was handled via setControlScheme previously)
          movedSincePointerDown = true
          vibrate(true)
        } else {
          // for x eyes (liable to conflict with previewMovement if things are refactored)
          activePlayer.animateInvalidMove(move)
          vibrate(false)
        }
        // Update the reference point even if the move is invalid. Otherwise you have to move the pointer weirdly far in some cases,
        // specifically you'd have to move it further in a valid direction than you'd moved it in an invalid direction,
        // which can be arbitrarily far and make it hard to turn a snake around.

        // Should this update both x and y or just one coordinate of the reference point?
        // lastPointerPosition = { x: event.clientX, y: event.clientY }
        if (moveX !== 0) {
          // lastPointerPosition.x += moveX * MOVE_THRESHOLD
          lastPointerPosition.x = event.clientX
        }
        if (moveY !== 0) {
          // lastPointerPosition.y += moveY * MOVE_THRESHOLD
          lastPointerPosition.y = event.clientY
        }
      }
    })
  }

  function resetMovementPreview() {
    for (const entity of entities) {
      if (entity instanceof Snake) {
        entity.previewMovement(0, 0)
      }
    }
  }

  // ----------------
  // Shared between keyboard and gamepad
  // ----------------

  function move(dx: number, dy: number, controlScheme = ControlScheme.KeyboardAbsoluteDirection, gamepad?: Gamepad) {
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
        // `elementFromPoint` may return an icon or label inside a button.
        // `contains` is inclusive of the element itself.
        // FIXME: this doesn't allow scrolling to elements offscreen
        return element.contains(document.elementFromPoint(center.x, center.y))
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
    if (!shouldInputBeAllowed()) {
      return
    }
    const move = analyzeMoveRelative(activePlayer, dx, dy)
    if (!move.valid) {
      activePlayer.animateInvalidMove(move)
      setControlScheme(controlScheme) // signals level update uselessly
      vibrate(false, gamepad)
      return
    }
    takeMove(move)
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
      case 'Numpad2': // numpad, arrow-labeled
      case 'Numpad5': // numpad, more ergonomic
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
  const buttonRepeatTimes = new Map<number, Map<number, number>>()
  function justPressed(button: number, gamepad: Gamepad) {
    const last = buttonsLast.get(gamepad.index)?.get(button)
    return gamepad.buttons[button].pressed && !last
  }
  function justPressedOrRepeated(button: number, gamepad: Gamepad) {
    const gamepadRepeatRate = parseInt(safeStorage.getItem(storageKeys.gamepadRepeatRate) ?? '150')
    const gamepadRepeatDelay = parseInt(safeStorage.getItem(storageKeys.gamepadRepeatDelay) ?? '300')

    const now = performance.now()
    // TODO: maybe only repeat one button at a time
    // (unless pressed at almost exactly the same time? Windows seems to make this exception for arrow keys, allowing diagonals.)
    if (justPressed(button, gamepad)) {
      if (!buttonRepeatTimes.has(gamepad.index)) {
        buttonRepeatTimes.set(gamepad.index, new Map())
      }
      buttonRepeatTimes.get(gamepad.index)!.set(button, now + gamepadRepeatDelay)
      return true
    }
    if (
      gamepad.buttons[button].pressed &&
      gamepadRepeatRate !== 0 &&
      buttonRepeatTimes.has(gamepad.index) &&
      buttonRepeatTimes.get(gamepad.index)!.has(button) &&
      now >= buttonRepeatTimes.get(gamepad.index)!.get(button)!
    ) {
      // TODO: avoid dropping time on the floor by using existing timestamp instead of `now`
      // (should theoretically give a more even rhythm in the face of variable frame rates)
      // console.log(now - buttonRepeatTimes.get(gamepad.index)!.get(button)!)
      buttonRepeatTimes.get(gamepad.index)!.set(button, now + gamepadRepeatRate)
      return true
    }
    return false
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
          const move = analyzeMoveRelative(activePlayer, direction.x, direction.y)
          if (hoveredTile && justPressed(0, gamepad) && shouldInputBeAllowed()) {
            if (move.valid) {
              // updateGameState({
              //   playerCoordinates: [hoveredTile.x, hoveredTile.y],
              //   playerFacing: direction,
              //   controlScheme: ControlScheme.Gamepad,
              // })
              takeMove(move)
              setControlScheme(ControlScheme.Gamepad) // signals level update
              hoveredTile = undefined
            } else {
              activePlayer.animateInvalidMove(move)
              setControlScheme(ControlScheme.Gamepad) // not thinking about this
              hoveredTile = undefined // not thinking about this
              vibrate(false, gamepad)
            }
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
      if (justPressedOrRepeated(12, gamepad)) {
        move(0, -1, ControlScheme.Gamepad, gamepad)
      } else if (justPressedOrRepeated(13, gamepad)) {
        move(0, 1, ControlScheme.Gamepad, gamepad)
      } else if (justPressedOrRepeated(14, gamepad)) {
        move(-1, 0, ControlScheme.Gamepad, gamepad)
      } else if (justPressedOrRepeated(15, gamepad)) {
        move(1, 0, ControlScheme.Gamepad, gamepad)
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

function vibrate(valid: boolean, gamepad?: Gamepad) {
  if (safeStorage.getItem(storageKeys.hapticsEnabled) === "true") {
    const duration = parseInt(safeStorage.getItem(valid ? storageKeys.hapticsValidDuration : storageKeys.hapticsInvalidDuration) ?? (valid ? "6" : "60"))
    if (gamepad) {
      void gamepad?.vibrationActuator?.playEffect("dual-rumble", {
        duration,
        weakMagnitude: 0.5,
        strongMagnitude: 0.3,
      })
    } else {
      navigator.vibrate?.(duration)
    }
  }
}

