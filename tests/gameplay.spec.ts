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
      continue;
    }
    const moves = getMovesFromPlaythrough(playthroughJSON);
    for (const move of moves) {
      if (move) {
        await page.keyboard.press(move);
      }
    }
    if (await page.locator('#game-win-screen').isVisible()) {
      break;
    }
    await expect(page.locator('#level-splash')).toBeVisible();
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
        // const instance = makeEntity(entityType)
        // Object.assign(instance, entityData)
        // entities.push(instance)
        if (entityType === 'Snake') {
          snakes.push(entityData as Snake);
        }
      }
      // return parsed;
      return { entities: snakes };
    })
  ) as { entities: Snake[] }[];
  let prevState: { entities: Snake[] } | null = null;
  let prevActiveSnakeId: string | null = null;
  for (const state of playthrough) {
    let move: string | null = null;
    let activeSnakeId: string | null = null;
    if (prevState) {
      // Try to figure out the move from the difference between states
      // If the active snake changed, it's Tab; otherwise an arrow key
      // Apparently the active snake is not actually tracked in the state
      // for (const entity of state.entities) {
      //   if (entity._type === 'Snake' && entity.active) {
      //     activeSnakeId = entity.id;
      //     break;
      //   }
      // }
      if (activeSnakeId !== prevActiveSnakeId) {
        // Could also be cycling backwards or selecting a snake directly with a click...
        move = 'Tab';
      } else {
        for (const entity of state.entities) {
          for (const prevStateEntity of prevState.entities) {
            if (
              /*prevStateEntity._type === 'Snake' && entity._type === 'Snake' &&*/
              prevStateEntity.id === entity.id
            ) {
              if (prevStateEntity.segments[0].x < entity.segments[0].x) {
                move = 'ArrowRight';
              } else if (prevStateEntity.segments[0].x > entity.segments[0].x) {
                move = 'ArrowLeft';
              } else if (prevStateEntity.segments[0].y < entity.segments[0].y) {
                move = 'ArrowDown';
              } else if (prevStateEntity.segments[0].y > entity.segments[0].y) {
                move = 'ArrowUp';
              }
              break;
            }
          }
        }
      }
      moves.push(move);
    }
    prevState = state;
    // prevActiveSnakeId = activeSnake
  }
  return moves;
}
