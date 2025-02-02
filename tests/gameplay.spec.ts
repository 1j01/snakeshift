import { test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('http://localhost:5569/');

  // Fail test on any page error
  page.on('pageerror', (error) => {
    throw new Error(`Page error: ${error.stack}`);
  });
});

test.skip('snake should not move past level boundaries')
test.skip('snake should not move through walls')
test.skip('snake should not move through itself')
test.skip('snake should be able to move to its tail location, since its tail will move')
test.skip('snake should not move through other snakes of the same color')
test.skip('snake should not move if another snake is on top')
// test.skip('if we WERE supporting snakes moving while another snake is on top, the snake should not be able to swap depths with the above snake by moving onto it')
// test.skip('if we WERE supporting snakes moving while another snake is on top, the snake should not be able to move out from under the other snake, since it would be providing the ground for it')
// test.skip('if we WERE supporting snakes moving while another snake is on top, the snake should be able to move out from under the other snake if its tail will fill the gap immediately')
test.skip('game should be beatable (using recorded playthroughs)')
test.skip('should detect immobile state and show a message about restarting/undoing')
test.skip('extra undo states should be skipped or merged when switching snakes multiple times')
test.skip('gamepad controls should be supported')
test.skip('touch controls should be supported')

