import { test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('http://localhost:5569/');
});

test.skip('snake should not move past level boundaries')
test.skip('snake should not move through walls')
test.skip('snake should not move through itself')
test.skip('snake should not move through other snakes of the same color')
test.skip('snake should not move on top of a snake that is also on top of it (and maybe never should move if a snake is on top of it)')
test.skip('game should be beatable (using recorded playthroughs)')
test.skip('should detect immobile state and show a message about restarting/undoing')
test.skip('extra undo states should be skipped or merged when switching snakes multiple times')
test.skip('gamepad controls should be supported')
test.skip('touch controls should be supported')

