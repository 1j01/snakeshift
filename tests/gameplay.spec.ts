import { Page, expect, test } from '@playwright/test'
import { access, readFile } from 'node:fs/promises'
import { Collectable } from '../game/collectable.ts'
import Entity from '../game/entity.ts'
import Snake from '../game/snake.ts'
import { GameState, ParsedGameState, Tile } from '../game/types.ts'
import { getCurrentLevelContent, loadLevelToPlay } from './test-helpers.ts'

test.beforeEach(async ({ page }) => {
  await page.goto('http://localhost:5569/?fast-splash-screens')

  // Fail test on any page error
  page.on('pageerror', (error) => {
    throw new Error(`Uncaught exception: ${error.stack}`)
  })
})

async function snakeShouldBeTrappedIn3x3Area(page: Page) {
  const originalContent = await getCurrentLevelContent(page)
  await test.step('snake should not move past right boundary', async () => {
    // Move once to right
    await page.keyboard.press('ArrowRight')
    const snakeToTheRight = await getCurrentLevelContent(page)
    expect(snakeToTheRight).not.toEqual(originalContent)
    // Move again should do nothing
    await page.keyboard.press('ArrowRight')
    expect(await getCurrentLevelContent(page)).toEqual(snakeToTheRight)
    // Recenter
    await page.keyboard.press('ArrowLeft')
    expect(await getCurrentLevelContent(page)).toEqual(originalContent)
  })
  await test.step('snake should not move past left boundary', async () => {
    // Move once to left
    await page.keyboard.press('ArrowLeft')
    const snakeToTheLeft = await getCurrentLevelContent(page)
    expect(snakeToTheLeft).not.toEqual(originalContent)
    // Move again should do nothing
    await page.keyboard.press('ArrowLeft')
    expect(await getCurrentLevelContent(page)).toEqual(snakeToTheLeft)
    // Recenter
    await page.keyboard.press('ArrowRight')
    expect(await getCurrentLevelContent(page)).toEqual(originalContent)
  })
  await test.step('snake should not move past top boundary', async () => {
    // Move once upwards
    await page.keyboard.press('ArrowUp')
    const snakeAtTop = await getCurrentLevelContent(page)
    expect(snakeAtTop).not.toEqual(originalContent)
    // Move again should do nothing
    await page.keyboard.press('ArrowUp')
    expect(await getCurrentLevelContent(page)).toEqual(snakeAtTop)
    // Recenter
    await page.keyboard.press('ArrowDown')
    expect(await getCurrentLevelContent(page)).toEqual(originalContent)
  })
  await test.step('snake should not move past bottom boundary', async () => {
    // Move once downwards
    await page.keyboard.press('ArrowDown')
    const snakeAtBottom = await getCurrentLevelContent(page)
    expect(snakeAtBottom).not.toEqual(originalContent)
    // Move again should do nothing
    await page.keyboard.press('ArrowDown')
    expect(await getCurrentLevelContent(page)).toEqual(snakeAtBottom)
    // Recenter
    await page.keyboard.press('ArrowUp')
    expect(await getCurrentLevelContent(page)).toEqual(originalContent)
  })
}

// TODO: make sure both colors of snakes are tested adequately
// and bicolor blocks, in combination

test('snake should not move past level boundaries', async ({ page }) => {
  await loadLevelToPlay(page, 'game/public/levels/tests/3x3-with-1x1-snake-in-middle.json')
  await snakeShouldBeTrappedIn3x3Area(page)
})
test('snake should not move through walls', async ({ page }) => {
  await loadLevelToPlay(page, 'game/public/levels/tests/5x5-ring-of-walls-with-1x1-snake-in-middle.json')
  await snakeShouldBeTrappedIn3x3Area(page)
})
test('snake should not push crates past level boundaries', async ({ page }) => {
  await loadLevelToPlay(page, 'game/public/levels/tests/5x5-ring-of-crates-with-1x1-snake-in-middle.json')
  await snakeShouldBeTrappedIn3x3Area(page)
})
test('snake should not move through other snakes of the same color, or push snakes past level boundaries', async ({ page }) => {
  await loadLevelToPlay(page, 'game/public/levels/tests/5x5-ring-of-snake-with-1x1-snake-in-middle.json')
  await page.keyboard.press('Tab') // TODO: set default snake to the one in the middle
  await snakeShouldBeTrappedIn3x3Area(page)
})
test('snake should not move through itself', async ({ page }) => {
  await loadLevelToPlay(page, 'game/public/levels/tests/snake-should-not-move-through-itself-left-or-down.json')
  // const originalContent = await saveLevelFileAndGetContent(page)
  await page.keyboard.press('ArrowLeft')
  // expect(await saveLevelFileAndGetContent(page)).toEqual(originalContent)
  await page.keyboard.press('ArrowDown')
  // expect(await saveLevelFileAndGetContent(page)).toEqual(originalContent)
  // Maybe snapshots are better, since they won't falsely pass if the level simply isn't loaded...
  // Oh yeah, the other way I was doing this was loading the file from the test's side for comparison,
  // using saveLevelFileAndCompareContent, but that assumes the file serializes the same.
  expect(await getCurrentLevelContent(page)).toMatchSnapshot()
})
test('snake should be able to move to its tail location, since its tail will move', async ({ page }) => {
  // This is really covered by playthrough tests, but it's fine to have a simple test for it.
  // But invalid move tests are more important, since they're not covered by playthroughs.
  await loadLevelToPlay(page, 'game/public/levels/tests/snake-should-be-able-to-move-down-to-its-tail.json')
  await page.keyboard.press('ArrowDown')
  expect(await getCurrentLevelContent(page)).toMatchSnapshot()
})
test('snake should be able to push a crate to its tail location, since its tail will move', async ({ page }) => {
  // This test also includes a collectable that should be pushed along with the crate.
  await loadLevelToPlay(page, 'game/public/levels/tests/snake-should-be-able-to-push-crate-down-to-its-tail.json')
  await page.keyboard.press('ArrowDown')
  expect(await getCurrentLevelContent(page)).toMatchSnapshot()
})
test('boxing collectables: crates should be pushed to be underneath collectables', async ({ page }) => {
  await loadLevelToPlay(page, 'game/public/levels/tests/boxing-collectables.json')
  for (let i = 0; i < 10; i++) {
    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('ArrowLeft')
    await page.keyboard.press('ArrowDown')
  }
  expect(await getCurrentLevelContent(page)).toMatchSnapshot()
})
test('snake should not move if another snake is on top', async ({ page }) => {
  await loadLevelToPlay(page, 'game/public/levels/tests/snake-on-top-should-immobilize-snake.json')
  const originalContent = await getCurrentLevelContent(page)
  await page.keyboard.press('ArrowRight')
  await page.keyboard.press('Tab') // switch to the other snake to make sure NEITHER can move
  await page.keyboard.press('ArrowRight')
  await page.keyboard.press('Tab') // to restore focus to the original from the snapshot
  expect(await getCurrentLevelContent(page)).toEqual(originalContent)
})
test('snake should not move if a crate is on top', async ({ page }) => {
  await loadLevelToPlay(page, 'game/public/levels/tests/crate-on-top-should-immobilize-snake.json')
  const originalContent = await getCurrentLevelContent(page)
  await page.keyboard.press('ArrowRight')
  expect(await getCurrentLevelContent(page)).toEqual(originalContent)
})
test('snake should not push a crate below another snake', async ({ page }) => {
  await loadLevelToPlay(page, 'game/public/levels/tests/move-right-should-not-push-crate.json')
  await page.keyboard.press('ArrowRight')
  expect(await getCurrentLevelContent(page)).toMatchSnapshot()
})
// test.skip('if we WERE supporting snakes moving while another snake is on top, the snake should not be able to swap depths with the above snake by moving onto it', ()=>{ });
// test.skip('if we WERE supporting snakes moving while another snake is on top, the snake should not be able to move out from under the other snake, since it would be providing the ground for it', ()=>{ });
// test.skip('if we WERE supporting snakes moving while another snake is on top, the snake should be able to move out from under the other snake if its tail will fill the gap immediately', ()=>{ });
test.skip('extra undo states should be skipped or merged when switching snakes multiple times', () => { /* TODO */ })
test.skip('gamepad controls should be supported', () => { /* TODO */ })
test.skip('touch controls should be supported', () => { /* TODO */ })

test('inverter should cascade inversion to overlapped snakes', async ({ page }) => {
  await loadLevelToPlay(page, 'game/public/levels/tests/inverter-should-cascade-to-overlapped-snakes.json')
  await page.keyboard.press('ArrowUp')
  await page.keyboard.press('ArrowLeft')
  expect(await getCurrentLevelContent(page)).toMatchSnapshot()
})

// DRY not just to reduce repetition, but so that the negative test will always be in sync with the positive test
const stuckHint = 'Press Z to undo or R to restart'

test('should show a message about restarting/undoing if you get stuck', async ({ page }) => {
  await loadLevelToPlay(page, 'game/public/levels/tests/get-stuck-by-moving-down.json')
  await expect(page.getByText(stuckHint)).not.toBeVisible()
  await page.keyboard.press('ArrowDown')
  await expect(page.getByText(stuckHint)).toBeVisible()
})

test('should not show a message about restarting/undoing if only one snake is stuck', async ({ page }) => {
  await loadLevelToPlay(page, 'game/public/levels/tests/only-one-snake-gets-stuck-by-moving-down.json')
  await expect(page.getByText(stuckHint)).not.toBeVisible()
  await page.keyboard.press('ArrowDown')
  await expect(page.getByText(stuckHint)).not.toBeVisible()
})


type MoveInput = 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight' | { click: Tile }

test('game should be beatable (using recorded playthroughs)', async ({ page }) => {
  test.setTimeout(1000 * 60 * 60) // 1 hour
  await page.getByRole('button', { name: 'Play' }).click()
  await expect(page.locator('#level-splash')).toBeVisible()
  await expect(page.locator('#level-splash')).not.toBeVisible()
  const levels = await page.$$eval('.level-button', (buttons) => buttons.map((button) => {
    return { levelId: button.getAttribute('data-level'), levelName: button.querySelector('.button-text')!.textContent! }
  }))
  // eslint-disable-next-line @typescript-eslint/prefer-for-of
  for (let i = 0; i < levels.length; i++) {
    const { levelId, levelName } = levels[i]
    if (!levelId) {
      throw new Error('Could not get level ID')
    }

    // Make sure we're on the right level
    await expect(page).toHaveTitle(`Snakeshift - ${levelName}`)

    const levelPath = `game/public/${levelId}`

    // Make sure the level file exists
    await access(levelPath)

    const playthroughPath = levelPath.replace(/\.json$/, '-playthrough.json')
    let playthroughJSON: string
    try {
      playthroughJSON = await readFile(playthroughPath, 'utf8')
    } catch (e) {
      // console.warn(`Could not read playthrough file ${playthroughPath}, skipping level ${levelId}`)
      // await page.getByRole('button', { name: 'Back' }).click()
      // await page.getByRole('button', { name: 'Level select' }).click()
      // await page.getByRole('button', { name: levels[i + 1].levelName }).click()

      // await expect(page.locator('#level-splash')).toBeVisible()
      // await expect(page.locator('#level-splash')).not.toBeVisible()
      // continue
      throw new Error(`Could not read playthrough file ${playthroughPath}: ${String(e)}`)
    }
    const moves = getMovesFromPlaythrough(playthroughJSON)
    console.log(`Playing level ${levelId} with ${moves.length} moves: ${moves.map((move) => typeof move === 'object' ? `click(${move.click.x},${move.click.y})` : { "ArrowUp": "↑", "ArrowDown": "↓", "ArrowLeft": "←", "ArrowRight": "→" }[move]).join(' ')}`)
    for (const move of moves) {
      if (move) {
        if (typeof move === 'object' && 'click' in move) {
          const rect = await page.evaluate<Tile, Tile>((tile) => {
            return window._forTesting.tileOnPage(tile)
          }, move.click)
          const rectCenter = { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 }
          await page.mouse.click(rectCenter.x, rectCenter.y)
        } else {
          await page.keyboard.press(move)
        }
        // await page.waitForTimeout(100) // for nice viewing
      }
    }
    // Could simplify this by checking if it's the last iteration (last level)
    if (await page.locator('#game-win-screen').isVisible()) {
      break
    }
    await expect(page.locator('#level-splash')).toBeVisible()
    await expect(page.locator('#level-splash')).not.toBeVisible()
  }
  await expect(page.locator('#game-win-screen')).toBeVisible()
})

type EntityLike = Entity & { _type: string }
function isEntityOfType(entity: EntityLike, type: "Snake"): entity is Snake & { _type: "Snake" }
function isEntityOfType(entity: EntityLike, type: "Collectable"): entity is Collectable & { _type: "Collectable" }
function isEntityOfType(entity: EntityLike, type: "Snake" | "Collectable"): boolean {
  return entity._type === type
}

function getMovesFromPlaythrough(playthroughJSON: string): MoveInput[] {
  const moves: MoveInput[] = []
  const playthrough = ((JSON.parse(playthroughJSON) as GameState[])
    .map((stateString) => {
      const parsed = JSON.parse(stateString) as ParsedGameState
      const entities: EntityLike[] = []
      for (let i = 0; i < parsed.entities.length; i++) {
        const entityData = parsed.entities[i]
        const entityType = parsed.entityTypes[i]
        entities.push({ ...entityData, _type: entityType })
      }
      return { entities, activeSnakeId: (parsed.entities[parsed.activePlayerEntityIndex] as Snake)?.id }
    })
    .filter(({ activeSnakeId }) => activeSnakeId) // needed for logic that handles missing final winning state in playthrough (it might actually include the initial state of the next level... hopefully always with `activePlayerEntityIndex` of -1 so that we can detect it...)
  ) as { entities: EntityLike[], activeSnakeId: string }[]
  let prevState: { entities: EntityLike[], activeSnakeId: string } | null = null
  let activeSnakeId: string | null = null
  for (const state of playthrough) {
    if (prevState) {
      // Try to figure out the move from the difference between states
      // If the active snake changed, we need to click the snake; otherwise it's an arrow key
      // (The Tab key or other controls may be used to switch snakes, but since we need to handle switching to arbitrary snakes,
      // clicking is the way to go.)
      if (state.activeSnakeId && activeSnakeId !== state.activeSnakeId) {
        const activeSnake = state.entities.find((snake) => isEntityOfType(snake, "Snake") && snake.id === state.activeSnakeId) as Snake | undefined
        if (!activeSnake) {
          throw new Error(`Could not find snake with ID ${state.activeSnakeId}`)
        }
        const head = activeSnake.segments[0]
        moves.push({ click: head })
      }
      for (const entity of state.entities) {
        for (const prevStateEntity of prevState.entities) {
          if (
            isEntityOfType(entity, 'Snake') &&
            isEntityOfType(prevStateEntity, 'Snake') &&
            prevStateEntity.id === entity.id
          ) {
            let moveKey: MoveInput | null = null
            if (prevStateEntity.segments[0].x < entity.segments[0].x) {
              moveKey = 'ArrowRight'
            } else if (prevStateEntity.segments[0].x > entity.segments[0].x) {
              moveKey = 'ArrowLeft'
            } else if (prevStateEntity.segments[0].y < entity.segments[0].y) {
              moveKey = 'ArrowDown'
            } else if (prevStateEntity.segments[0].y > entity.segments[0].y) {
              moveKey = 'ArrowUp'
            }
            if (moveKey) {
              moves.push(moveKey)
              break
            }
          }
        }
      }
    }
    prevState = state
    activeSnakeId = state.activeSnakeId
  }

  // Playthrough might not contain the final state/move (awkward)
  // However, if that's the case, there should only be one Collectable left, so we can just compare its position to the active snake's head in the last state.
  const lastState = playthrough[playthrough.length - 1]
  const collectables = lastState.entities.filter((entity) => isEntityOfType(entity, 'Collectable'))
  if (collectables.length === 1) {
    const collectable = collectables[0]
    const activeSnake = lastState.entities.find((snake) => isEntityOfType(snake, "Snake") && snake.id === lastState.activeSnakeId) as Snake | undefined
    if (!activeSnake) {
      throw new Error(`Could not find snake with ID ${lastState.activeSnakeId}`)
    }
    if (!isEntityOfType(collectable, 'Collectable')) {
      throw new Error(`Could not find collectable in last state`)
    }
    const head = activeSnake.segments[0]
    if (head.x < collectable.x) {
      moves.push('ArrowRight')
    } else if (head.x > collectable.x) {
      moves.push('ArrowLeft')
    } else if (head.y < collectable.y) {
      moves.push('ArrowDown')
    } else if (head.y > collectable.y) {
      moves.push('ArrowUp')
    }
  }

  return moves
}
