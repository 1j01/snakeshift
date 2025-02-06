import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import Snake from '../game/snake.ts';
import { ParsedGameState } from '../game/types.ts';

test.beforeEach(async ({ page }) => {
  await page.goto('http://localhost:5569/');

  // Fail test on any page error
  page.on('pageerror', (error) => {
    throw new Error(`Uncaught exception: ${error.stack}`);
  });
});

test.skip('snake should not move past level boundaries', () => { });
test.skip('snake should not move through walls', () => { });
test.skip('snake should not move through itself', () => { });
test.skip('snake should be able to move to its tail location, since its tail will move', () => { });
test.skip('snake should not move through other snakes of the same color', () => { });
test.skip('snake should not move if another snake is on top', () => { });
// test.skip('if we WERE supporting snakes moving while another snake is on top, the snake should not be able to swap depths with the above snake by moving onto it', ()=>{ });
// test.skip('if we WERE supporting snakes moving while another snake is on top, the snake should not be able to move out from under the other snake, since it would be providing the ground for it', ()=>{ });
// test.skip('if we WERE supporting snakes moving while another snake is on top, the snake should be able to move out from under the other snake if its tail will fill the gap immediately', ()=>{ });
test.skip('should detect immobile state and show a message about restarting/undoing', () => { });
test.skip('extra undo states should be skipped or merged when switching snakes multiple times', () => { });
test.skip('gamepad controls should be supported', () => { });
test.skip('touch controls should be supported', () => { });

test('game should be beatable (using recorded playthroughs)', async ({ page }) => {
  test.setTimeout(1000 * 60 * 60); // 1 hour
  await page.getByRole('button', { name: 'Play' }).click();
  await expect(page.locator('#level-splash')).toBeVisible();
  await expect(page.locator('#level-splash')).not.toBeVisible();
  for (let i = 0; i < 1000; i++) {
    const levelId = await page.getAttribute(`.level-button:nth-of-type(${i + 1})`, 'data-level');
    if (!levelId) {
      throw new Error('Could not get level ID');
    }
    const levelPath = `game/public/${levelId}`;
    // Make sure the level file exists
    await readFile(levelPath, 'utf8');
    const playthroughPath = levelPath.replace(/\.json$/, '-playthrough.json');
    let playthroughJSON: string;
    try {
      playthroughJSON = await readFile(playthroughPath, 'utf8')
    } catch (e) {
      console.warn(`Could not read playthrough file ${playthroughPath}, skipping level ${levelId}`);
      await page.$eval(`.level-button:nth-of-type(${i + 2})`, (el: HTMLElement) => el.click());
      await expect(page.locator('#level-splash')).toBeVisible();
      await expect(page.locator('#level-splash')).not.toBeVisible();
      continue;
    }
    const moves = getMovesFromPlaythrough(playthroughJSON);
    console.log(`Playing level ${levelId} with ${moves.length} moves: ${moves.join(', ')}`);
    for (const move of moves) {
      if (move) {
        if (move.startsWith('Click:')) {
          // TODO: avoid parsing, just store the SnakeSegment (which satisfies Tile interface); using its width/height would be more appropriate
          const [_, xy] = move.split(':');
          const [x, y] = xy.split(',').map(Number);
          const rect = await page.evaluate(({ x, y }) => {
            // @ts-ignore
            return _forTesting.tileOnPage({ x, y, width: 1, height: 1 });
          }, { x, y });
          const rectCenter = { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
          // console.log(`Clicking at ${rectCenter.x}, ${rectCenter.y} (world: ${x}, ${y})`);
          await page.mouse.click(rectCenter.x, rectCenter.y);
        } else {
          await page.keyboard.press(move);
        }
        await page.waitForTimeout(100);
      }
    }
    if (await page.locator('#game-win-screen').isVisible()) {
      break;
    }
    // await expect(page.locator('#level-splash')).toBeVisible();
    // await expect(page.locator('#level-splash')).not.toBeVisible();

    // Playthrough might not contain the final state/move (awkward)
    // so try all four directions to see if it wins
    if (await page.locator('#level-splash').isVisible()) {
      // wait for the level splash to disappear
      await expect(page.locator('#level-splash')).not.toBeVisible();
      continue;
    }
    console.warn(`Level ${levelId} did not win with the recorded playthrough, trying all cardinal directions in case it's missing the final move`);
    // TODO: include the move in getMovesFromPlaythrough (there should only be one Collectable left, so we can just compare its position to the active snake's head in the last state)
    for (const move of ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp']) {
      await page.keyboard.press(move);
      await page.waitForTimeout(100);
      if (await page.locator('#level-splash').isVisible()) {
        break;
      }
      // this might not even make sense as a strategy if it doesn't create an undo state for invalid moves
      await page.keyboard.press('Control+Z');
      await page.waitForTimeout(100);
    }
    // wait for the level splash to disappear
    await expect(page.locator('#level-splash')).not.toBeVisible();
  }
  await expect(page.locator('#game-win-screen')).toBeVisible();
})


function getMovesFromPlaythrough(playthroughJSON: string): (string | null)[] {
  let moves: (string | null)[] = [];
  const playthrough = (JSON.parse(playthroughJSON)
    .map((stateString) => {
      const parsed = JSON.parse(stateString) as ParsedGameState;
      const snakes: Snake[] = [];
      for (let i = 0; i < parsed.entities.length; i++) {
        const entityData = parsed.entities[i]
        const entityType = parsed.entityTypes[i]
        if (entityType === 'Snake') {
          snakes.push(entityData as Snake);
        }
      }
      return { entities: snakes, activeSnakeId: (parsed.entities[parsed.activePlayerEntityIndex] as Snake)?.id };
    })
  ) as { entities: Snake[], activeSnakeId: string }[];
  let prevState: { entities: Snake[], activeSnakeId: string } | null = null;
  let activeSnakeId: string | null = null;
  for (const state of playthrough) {
    if (prevState) {
      // Try to figure out the move from the difference between states
      // If the active snake changed, it's Tab; otherwise an arrow key
      if (state.activeSnakeId && activeSnakeId !== state.activeSnakeId) {
        // moves.push('Tab');
        // It could need multiple tabs, or to click to switch to a snake directly
        // moves.push(`SwitchSnake:${state.activeSnakeId}`);
        const activeSnake = state.entities.find((snake) => snake.id === state.activeSnakeId);
        if (!activeSnake) {
          throw new Error(`Could not find snake with ID ${state.activeSnakeId}`);
        }
        const head = activeSnake.segments[0];
        moves.push(`Click:${head.x},${head.y}`);
      }
      for (const entity of state.entities) {
        for (const prevStateEntity of prevState.entities) {
          // Assuming entities are all snakes, with filtering above
          if (prevStateEntity.id === entity.id) {
            let moveKey: string | null = null;
            if (prevStateEntity.segments[0].x < entity.segments[0].x) {
              moveKey = 'ArrowRight';
            } else if (prevStateEntity.segments[0].x > entity.segments[0].x) {
              moveKey = 'ArrowLeft';
            } else if (prevStateEntity.segments[0].y < entity.segments[0].y) {
              moveKey = 'ArrowDown';
            } else if (prevStateEntity.segments[0].y > entity.segments[0].y) {
              moveKey = 'ArrowUp';
            }
            if (moveKey) {
              moves.push(moveKey);
              break;
            }
          }
        }
      }
    }
    prevState = state;
    activeSnakeId = state.activeSnakeId;
  }
  return moves;
}
