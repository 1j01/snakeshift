import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import Entity from '../game/entity.ts';
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
  const levels = await page.$$eval('.level-button', (buttons) => buttons.map((button) => {
    return { levelId: button.getAttribute('data-level'), levelName: button.textContent! };
  }));
  for (let i = 0; i < levels.length; i++) {
    const { levelId, levelName } = levels[i];
    if (!levelId) {
      throw new Error('Could not get level ID');
    }

    // Make sure we're on the right level
    await expect(page).toHaveTitle(`Snakeshift - ${levelName}`);

    const levelPath = `game/public/${levelId}`;

    // Make sure the level file exists
    await readFile(levelPath, 'utf8');

    const playthroughPath = levelPath.replace(/\.json$/, '-playthrough.json');
    let playthroughJSON: string;
    try {
      playthroughJSON = await readFile(playthroughPath, 'utf8')
    } catch (e) {
      console.warn(`Could not read playthrough file ${playthroughPath}, skipping level ${levelId}`);
      // await page.evaluate(() => document.querySelectorAll('.level-button')[i + 1].click());
      await page.getByRole('button', { name: 'Back' }).click();
      await page.getByRole('button', { name: 'Level select' }).click();
      await page.getByRole('button', { name: levels[i + 1].levelName }).click();

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
    // Could simplify this by checking if it's the last iteration (last level)
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
      const entities: Entity[] = [];
      for (let i = 0; i < parsed.entities.length; i++) {
        const entityData = parsed.entities[i]
        const entityType = parsed.entityTypes[i]
        // const instance = makeEntity(entityType)
        // Object.assign(instance, entityData)
        // entities.push(instance)
        // @ts-ignore
        entityData._type = entityType;
        entities.push(entityData);
      }
      return { entities, activeSnakeId: (parsed.entities[parsed.activePlayerEntityIndex] as Snake)?.id };
    })
    .filter(({ activeSnakeId }) => activeSnakeId) // needed for logic that handles missing final winning state in playthrough (it might actually include the initial state of the next level... hopefully always with `activePlayerEntityIndex` of -1 so that we can detect it...)
  ) as { entities: Entity[], activeSnakeId: string }[];
  let prevState: { entities: Entity[], activeSnakeId: string } | null = null;
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
          if (
            // @ts-ignore
            entity._type === 'Snake' &&
            prevStateEntity.id === entity.id
          ) {
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

  // Playthrough might not contain the final state/move (awkward)
  // However, if that's the case, there should only be one Collectable left, so we can just compare its position to the active snake's head in the last state.
  const lastState = playthrough[playthrough.length - 1];
  // @ts-ignore
  const collectables = lastState.entities.filter((entity) => entity._type === 'Collectable');
  if (collectables.length === 1) {
    const collectable = collectables[0];
    const activeSnake = lastState.entities.find((snake) => snake.id === lastState.activeSnakeId);
    if (!activeSnake) {
      throw new Error(`Could not find snake with ID ${lastState.activeSnakeId}`);
    }
    const head = activeSnake.segments[0];
    if (head.x < collectable.x) {
      moves.push('ArrowRight');
    } else if (head.x > collectable.x) {
      moves.push('ArrowLeft');
    } else if (head.y < collectable.y) {
      moves.push('ArrowDown');
    } else if (head.y > collectable.y) {
      moves.push('ArrowUp');
    }
  }

  return moves;
}
