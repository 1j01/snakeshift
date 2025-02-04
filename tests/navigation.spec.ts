import { expect, test } from '@playwright/test';
import { dragAndDropFile, saveLevelFileAndCompareContent } from './test-helpers';

declare global {
  interface Window {
    playedSounds: string[]
  }
}


test.beforeEach(async ({ page }) => {
  await page.goto('http://localhost:5569/?fast-splash-screens');

  // Fail test on any page error
  page.on('pageerror', (error) => {
    throw new Error(`Uncaught exception: ${error.stack}`);
  });
});

test('basic navigation', async ({ page }) => {
  await expect(page).toHaveTitle(/Snakeshift/);
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await page.keyboard.press('ArrowRight');
  await page.getByRole('button', { name: 'Back' }).click();
  await expect(page).toHaveTitle(/^Snakeshift$/);
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await page.getByRole('button', { name: 'Back' }).click();
  await page.getByRole('button', { name: 'Level Select' }).click();
  await expect(page).toHaveTitle(/^Snakeshift$/);
  await page.getByRole('button', { name: 'Security by Obscurity' }).click();
  await expect(page).toHaveTitle(/^Snakeshift - Security by Obscurity$/);
  await page.getByRole('button', { name: 'Back' }).click();
  await page.getByRole('button', { name: 'Level Editor' }).click();
  await expect(page).toHaveTitle(/^Snakeshift - Level Editor$/);
  await page.getByRole('button', { name: 'Snake (White)' }).click();
  await page.locator('.editing > canvas').click({
    position: {
      x: 341,
      y: 317
    }
  });
  await page.locator('.editing > canvas').click({
    position: {
      x: 398,
      y: 345
    }
  });
  await page.locator('.editing > canvas').click({
    position: {
      x: 583,
      y: 218
    }
  });
  await page.getByRole('button', { name: 'Snake (White)' }).press('ControlOrMeta+z');
  // TODO: test that snake was added and then removed
  // and split this into multiple tests, probably multiple files since this is navigation.spec.ts
});

test('undoing should go back a level without immediately winning it (and it should still be winnable)', async ({ page }) => {
  await page.getByRole('button', { name: 'Level Select' }).click();
  await page.getByRole('button', { name: 'Test Level 001 (Just move right to win)' }).click();
  await expect(page).toHaveTitle(/^Snakeshift - Test Level 001 \(Just move right to win\)$/);
  await expect(page.locator('#level-splash-title')).toBeVisible();
  await expect(page.locator('#level-splash-title')).not.toBeVisible();
  await page.keyboard.press('ArrowRight');
  await expect(page).toHaveTitle(/^Snakeshift - Test Level 002 \(Just move left to win\)$/);
  await expect(page.locator('#level-splash-title')).toBeVisible();
  await expect(page.locator('#level-splash-title')).not.toBeVisible();
  await page.keyboard.press('ControlOrMeta+z');
  await expect(page).toHaveTitle(/^Snakeshift - Test Level 001 \(Just move right to win\)$/);
  await page.keyboard.press('ArrowRight');
  await expect(page).toHaveTitle(/^Snakeshift - Test Level 002 \(Just move left to win\)$/);
  await expect(page.locator('#level-splash-title')).toBeVisible();
  await expect(page.locator('#level-splash-title')).not.toBeVisible();
});

test('you should be able to win the last level twice in a row, after returning to it via level select', async ({ page }) => {
  // The win condition should trigger if you win the last level, then go back to the menu and go to the same last level from the level select and win it again
  // This doesn't work if the level that was won is stored in order to prevent spamming the level win sound effect / splash screen animation.
  await page.getByRole('button', { name: 'Level Select' }).click();
  await page.getByRole('button', { name: 'Test Level 999 (Just move right to win)' }).click();
  await expect(page).toHaveTitle(/^Snakeshift - Test Level 999 \(Just move right to win\)$/);
  await expect(page.locator('#level-splash-title')).toBeVisible();
  await expect(page.locator('#level-splash-title')).not.toBeVisible();
  await expect(page.locator('#game-win-screen')).not.toBeVisible();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#game-win-screen')).toBeVisible();
  await expect(await page.evaluate(() => window.playedSounds)).toEqual(['gong', 'move', 'gongBrilliant']);
  await page.getByRole('button', { name: 'Back' }).click();
  await page.getByRole('button', { name: 'Level Select' }).click();
  await page.getByRole('button', { name: 'Test Level 999 (Just move right to win)' }).click();
  await expect(page).toHaveTitle(/^Snakeshift - Test Level 999 \(Just move right to win\)$/);
  await expect(page.locator('#level-splash-title')).toBeVisible();
  await expect(page.locator('#level-splash-title')).not.toBeVisible();
  await expect(page.locator('#game-win-screen')).not.toBeVisible();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#game-win-screen')).toBeVisible();
});

test('you should be able to hide the game win screen by undoing, and then win again', async ({ page }) => {
  await page.getByRole('button', { name: 'Level Select' }).click();
  await page.getByRole('button', { name: 'Test Level 999 (Just move right to win)' }).click();
  await expect(page).toHaveTitle(/^Snakeshift - Test Level 999 \(Just move right to win\)$/);
  await expect(page.locator('#level-splash-title')).toBeVisible();
  await expect(page.locator('#level-splash-title')).not.toBeVisible();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#game-win-screen')).toBeVisible();
  await page.keyboard.press('ControlOrMeta+z');
  await expect(page.locator('#game-win-screen')).not.toBeVisible();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#game-win-screen')).toBeVisible();
});


test('should open a level for editing with drag and drop, while in level editor', async ({ page }) => {
  await page.getByRole('button', { name: 'Level Editor' }).click();

  const filePath = 'game/public/levels/tests/move-left-to-win.json';
  await dragAndDropFile(page, 'body', filePath, 'move-left-to-win.json');
  await expect(page).toHaveTitle(/^Snakeshift - Level Editor$/);
  await saveLevelFileAndCompareContent(page, filePath);
});

test('should open a level for editing with drag and drop, while in play mode', async ({ page }) => {
  await page.getByRole('button', { name: 'Level Select' }).click();
  await page.getByRole('button', { name: 'Test Level 999 (Just move right to win)' }).click();
  await expect(page).toHaveTitle(/^Snakeshift - Test Level 999 \(Just move right to win\)$/);

  const filePath = 'game/public/levels/tests/move-left-to-win.json';
  await dragAndDropFile(page, 'body', filePath, 'move-left-to-win.json');
  await expect(page).toHaveTitle(/^Snakeshift - Level Editor$/);
  await saveLevelFileAndCompareContent(page, filePath);
});

test('should open a level for editing with drag and drop, while in a menu', async ({ page }) => {
  const filePath = 'game/public/levels/tests/move-left-to-win.json';
  await dragAndDropFile(page, 'body', filePath, 'move-left-to-win.json');
  await expect(page).toHaveTitle(/^Snakeshift - Level Editor$/);
  await saveLevelFileAndCompareContent(page, filePath);
});

test('should stay on the same level when switching to edit mode after winning a prior level', async ({ page }) => {
  await page.getByRole('button', { name: 'Level Select' }).click();
  await page.getByRole('button', { name: 'Test Level 001 (Just move right to win)' }).click();
  await expect(page).toHaveTitle(/^Snakeshift - Test Level 001 \(Just move right to win\)$/);
  await expect(page.locator('#level-splash-title')).toBeVisible();
  await expect(page.locator('#level-splash-title')).not.toBeVisible();
  await page.keyboard.press('ArrowRight');
  await expect(page).toHaveTitle(/^Snakeshift - Test Level 002 \(Just move left to win\)$/);
  await expect(page.locator('#level-splash-title')).toBeVisible();
  await expect(page.locator('#level-splash-title')).not.toBeVisible();
  await page.keyboard.press('Backquote');
  await expect(page).toHaveTitle(/^Snakeshift - Level Editor$/);
  await page.keyboard.press('Backquote');
  // Might change the title in the future to say the level name + " (Edited)" or something
  await expect(page).toHaveTitle(/^Snakeshift - Custom Level$/);
  // await expect(page).toHaveTitle(/^Snakeshift - Test Level 002 \(Just move left to win\)$/);
  // We can compare the file content instead.
  await saveLevelFileAndCompareContent(page, 'game/public/levels/tests/move-left-to-win.json');
});

test('should stay on the same level when pressing R', async ({ page }) => {
  await page.getByRole('button', { name: 'Level Select' }).click();
  await page.getByRole('button', { name: 'Test Level 001 (Just move right to win)' }).click();
  await expect(page).toHaveTitle(/^Snakeshift - Test Level 001 \(Just move right to win\)$/);
  await page.keyboard.press('r');
  await expect(page).toHaveTitle(/^Snakeshift - Test Level 001 \(Just move right to win\)$/);
  // TODO: also test that it restarts the level
});

test('should stay on the same level when pressing R after winning a prior level', async ({ page }) => {
  await page.getByRole('button', { name: 'Level Select' }).click();
  await page.getByRole('button', { name: 'Test Level 001 (Just move right to win)' }).click();
  await expect(page).toHaveTitle(/^Snakeshift - Test Level 001 \(Just move right to win\)$/);
  await expect(page.locator('#level-splash-title')).toBeVisible();
  await expect(page.locator('#level-splash-title')).not.toBeVisible();
  await page.keyboard.press('ArrowRight');
  await expect(page).toHaveTitle(/^Snakeshift - Test Level 002 \(Just move left to win\)$/);
  await expect(page.locator('#level-splash-title')).toBeVisible();
  await expect(page.locator('#level-splash-title')).not.toBeVisible();
  await page.keyboard.press('r');
  await expect(page).toHaveTitle(/^Snakeshift - Test Level 002 \(Just move left to win\)$/);
  // TODO: also test that it restarts the level
});

test('should stay on the same level when pressing R after winning a level and undoing back to the previous level', async ({ page }) => {
  await page.getByRole('button', { name: 'Level Select' }).click();
  await page.getByRole('button', { name: 'Test Level 001 (Just move right to win)' }).click();
  await expect(page).toHaveTitle(/^Snakeshift - Test Level 001 \(Just move right to win\)$/);
  await expect(page.locator('#level-splash-title')).toBeVisible();
  await expect(page.locator('#level-splash-title')).not.toBeVisible();
  await page.keyboard.press('ArrowRight');
  await expect(page).toHaveTitle(/^Snakeshift - Test Level 002 \(Just move left to win\)$/);
  await page.keyboard.press('ControlOrMeta+z');
  await expect(page).toHaveTitle(/^Snakeshift - Test Level 001 \(Just move right to win\)$/);
  await page.keyboard.press('r');
  await expect(page).toHaveTitle(/^Snakeshift - Test Level 001 \(Just move right to win\)$/);
  // TODO: also test that it restarts the level
});

test('should show "Level Complete" when finishing a custom level (via level editor)', async ({ page }) => {
  await page.getByRole('button', { name: 'Level Select' }).click();
  await page.getByRole('button', { name: 'Test Level 001 (Just move right to win)' }).click();
  await expect(page).toHaveTitle(/^Snakeshift - Test Level 001 \(Just move right to win\)$/);
  await expect(page.locator('#level-splash-title')).toBeVisible();
  await expect(page.locator('#level-splash-title')).not.toBeVisible();
  await page.keyboard.press('Backquote');
  await expect(page).toHaveTitle(/^Snakeshift - Level Editor$/);
  await page.keyboard.press('Backquote');
  await expect(page.getByText('Level Complete')).not.toBeVisible();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByText('Level Complete')).toBeVisible();
  // it should then automatically hide
  await expect(page.getByText('Level Complete')).not.toBeVisible();
  // The level should be restarted.
  // Undoing should let you go back before the level was won.
  await page.keyboard.press('ControlOrMeta+z');
  await expect(page.getByText('Level Complete')).not.toBeVisible();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByText('Level Complete')).toBeVisible();
});

test('should not show "Level Complete" when a custom level has no goal', async ({ page }) => {
  await page.getByRole('button', { name: 'Level Select' }).click();
  await page.getByRole('button', { name: 'Test Level With No Goal' }).click();
  await expect(page).toHaveTitle(/^Snakeshift - Test Level With No Goal$/);
  await page.keyboard.press('Backquote');
  await expect(page).toHaveTitle(/^Snakeshift - Level Editor$/);
  await page.keyboard.press('Backquote');
  await expect(page).toHaveTitle(/^Snakeshift - Custom Level$/);
  await expect(page.getByText('Level Complete')).not.toBeVisible();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByText('Level Complete')).not.toBeVisible();
  await page.keyboard.press('ControlOrMeta+z');
  await expect(page.getByText('Level Complete')).not.toBeVisible();
  await page.keyboard.press('ArrowUp');
  await expect(page.getByText('Level Complete')).not.toBeVisible();
});

// TODO: also test that you can't switch between snakes while a splash screen is shown
test('should not allow movement while level win splash screen is shown', async ({ page }) => {
  await page.getByRole('button', { name: 'Level Select' }).click();
  await page.getByRole('button', { name: 'Test Level 001 (Just move right to win)' }).click();
  await expect(page).toHaveTitle(/^Snakeshift - Test Level 001 \(Just move right to win\)$/);
  await expect(page.locator('#level-splash-title')).toBeVisible();
  await expect(page.locator('#level-splash-title')).not.toBeVisible();
  await page.keyboard.press('ArrowRight');
  await expect(page).toHaveTitle(/^Snakeshift - Test Level 002 \(Just move left to win\)$/);
  await expect(page.locator('#level-splash-title')).toBeVisible();
  await expect(page.locator('#level-splash-title')).toHaveText('Test Level 002 (Just move left to win)');
  // Don't wait for the next level to be ready.
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('ArrowLeft');
  // Wait for the next level to be ready.
  await expect(page.locator('#level-splash-title')).not.toBeVisible();
  // If the previous Up+Left took place, Down will win the level. But it should be the first allowed movement.
  await page.keyboard.press('ArrowDown');
  // await expect(page.locator('#level-splash-title')).not.toBeVisible(); // would wait for it to hide, not check that it was never shown
  expect(await page.locator('#level-splash-title').isVisible()).toBeFalsy();
  await expect(page).toHaveTitle(/^Snakeshift - Test Level 002 \(Just move left to win\)$/);
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowUp');
  // Don't know the third level name, but it should move to the next level at this point.
  await expect(page.locator('#level-splash-title')).toBeVisible();
  await expect(page).not.toHaveTitle(/^Snakeshift - Test Level 002 \(Just move left to win\)$/);
});

test('should not allow movement after the game is won', async ({ page }) => {
  await page.getByRole('button', { name: 'Level Select' }).click();
  await page.getByRole('button', { name: 'Test Level 999 (Just move right to win)' }).click();
  await expect(page).toHaveTitle(/^Snakeshift - Test Level 999 \(Just move right to win\)$/);
  await expect(page.locator('#level-splash-title')).toBeVisible();
  await expect(page.locator('#level-splash-title')).not.toBeVisible();
  await expect(await page.evaluate(() => window.playedSounds)).toEqual(['gong']);
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#game-win-screen')).toBeVisible();

  // First strategy was to force hide the win screen by removing .active
  // This testing strategy doesn't make sense if the code looks at the DOM state that this test manipulates to determine whether you should be able to move or not.
  // Or if it doesn't reset the same DOM state that this test manipulates when the level is won.
  // So it would only make sense if the game stores the state of the level win splash screen in a variable, and this test hides the splash screen in a way that the game will naturally reverse.
  // Not a good test.
  // await page.evaluate(() => document.querySelector('#game-win-screen')!.classList.remove('active'));
  // await expect(page.locator('#game-win-screen')).not.toBeVisible();
  // await page.keyboard.press('ArrowRight');
  // await expect(page.locator('#game-win-screen')).not.toBeVisible();
  // await page.keyboard.press('ArrowUp');
  // await expect(page.locator('#game-win-screen')).not.toBeVisible();
  // await page.keyboard.press('ArrowDown');
  // await expect(page.locator('#game-win-screen')).not.toBeVisible();

  // Instead, check that the win sound effect is not played, which is the observable thing anyways, with the splash screen in the way of the canvas.
  // The game win sound effect should have already played, but should not play again.
  await expect(await page.evaluate(() => window.playedSounds)).toEqual(['gong', 'move', 'gongBrilliant']);
  await page.keyboard.press('ArrowRight');
  await expect(await page.evaluate(() => window.playedSounds)).toEqual(['gong', 'move', 'gongBrilliant']);
  await page.keyboard.press('ArrowUp');
  await expect(await page.evaluate(() => window.playedSounds)).toEqual(['gong', 'move', 'gongBrilliant']);
  await page.keyboard.press('ArrowDown');
  await expect(await page.evaluate(() => window.playedSounds)).toEqual(['gong', 'move', 'gongBrilliant']);
  // Also test that you can't switch between snakes while the splash screen is shown
  // TODO: add a second snake to the level to make sure this is tested
  await page.keyboard.press('Tab');
  await expect(await page.evaluate(() => window.playedSounds)).toEqual(['gong', 'move', 'gongBrilliant']);
})

test('should confirm discarding unsaved changes in edit mode', async ({ page }) => {
  await page.getByRole('button', { name: 'Level Editor' }).click();
  const filePath = 'game/public/levels/tests/move-left-to-win.json';
  await dragAndDropFile(page, 'body', filePath, 'move-left-to-win.json');
  await expect(page).toHaveTitle(/^Snakeshift - Level Editor$/);

  await page.locator('.editing > canvas').click({
    position: {
      x: 341,
      y: 317
    }
  });

  // This should show a dialog which will be automatically dismissed
  await page.getByRole('button', { name: 'Back' }).click();
  await expect(page).toHaveTitle(/^Snakeshift - Level Editor$/);

  // Should still show dialog if you have no undos but you have redos
  await page.keyboard.press('ControlOrMeta+z');

  // This should show a dialog which will be automatically dismissed
  await page.getByRole('button', { name: 'Back' }).click();
  await expect(page).toHaveTitle(/^Snakeshift - Level Editor$/);

  // Should go back if you confirm
  page.on('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Back' }).click();
  await expect(page).toHaveTitle(/^Snakeshift$/);
});

test('should confirm discarding unsaved changes when play-testing a level after editing', async ({ page }) => {
  await page.getByRole('button', { name: 'Level Editor' }).click();
  const filePath = 'game/public/levels/tests/move-left-to-win.json';
  await dragAndDropFile(page, 'body', filePath, 'move-left-to-win.json');
  await expect(page).toHaveTitle(/^Snakeshift - Level Editor$/);

  await page.locator('.editing > canvas').click({
    position: {
      x: 341,
      y: 317
    }
  });

  // Start play-testing the level
  await page.keyboard.press('Backquote');

  // This should show a dialog which will be automatically dismissed
  await page.getByRole('button', { name: 'Back' }).click();
  await expect(page).toHaveTitle(/^Snakeshift - Custom Level$/);

  // Should still show dialog if you have no undos but you have redos
  await page.keyboard.press('Backquote');
  await page.keyboard.press('ControlOrMeta+z');
  await page.keyboard.press('Backquote');

  // This should show a dialog which will be automatically dismissed
  await page.getByRole('button', { name: 'Back' }).click();
  await expect(page).toHaveTitle(/^Snakeshift - Custom Level$/);

  // Should go back if you confirm
  page.on('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Back' }).click();
  await expect(page).toHaveTitle(/^Snakeshift$/);
});

test('should not show confirmation dialog if there are no unsaved changes (after drag and drop to load level)', async ({ page }) => {
  await page.getByRole('button', { name: 'Level Editor' }).click();
  const filePath = 'game/public/levels/tests/move-left-to-win.json';
  await dragAndDropFile(page, 'body', filePath, 'move-left-to-win.json');
  await expect(page).toHaveTitle(/^Snakeshift - Level Editor$/);
  await page.getByRole('button', { name: 'Back' }).click();
  await expect(page).toHaveTitle(/^Snakeshift$/);
});

test('should not show confirmation dialog if there are no unsaved changes (after switching to edit mode from a built-in level)', async ({ page }) => {
  await page.getByRole('button', { name: 'Level Select' }).click();
  await page.getByRole('button', { name: 'Test Level 002 (Just move left to win)' }).click();
  await expect(page).toHaveTitle(/^Snakeshift - Test Level 002 \(Just move left to win\)$/);
  await page.keyboard.press('Backquote');
  await expect(page).toHaveTitle(/^Snakeshift - Level Editor$/);
  await page.getByRole('button', { name: 'Back' }).click();
  await expect(page).toHaveTitle(/^Snakeshift$/);
});

test('should not show confirmation dialog if playing a built-in level', async ({ page }) => {
  // The game itself has undo/redo, but you're not editing the level.

  await page.getByRole('button', { name: 'Level Select' }).click();
  await page.getByRole('button', { name: 'Test Level 001 (Just move right to win)' }).click();
  await expect(page).toHaveTitle(/^Snakeshift - Test Level 001 \(Just move right to win\)$/);

  // Don't win the level, just move, creating an undo state.
  await page.keyboard.press('ArrowUp');
  await expect(page).toHaveTitle(/^Snakeshift - Test Level 001 \(Just move right to win\)$/);

  await page.getByRole('button', { name: 'Back' }).click();
  await expect(page).toHaveTitle(/^Snakeshift$/);
});

test('escape should close level info dialog if open, without returning to main menu', async ({ page }) => {
  await page.getByRole('button', { name: 'Level Editor' }).click();
  await expect(page).toHaveTitle(/^Snakeshift - Level Editor$/);
  await page.getByRole('button', { name: 'Level Info' }).click();
  await expect(page.getByRole('dialog').getByText("Level Info")).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog').getByText("Level Info")).not.toBeVisible();
  await expect(page).toHaveTitle(/^Snakeshift - Level Editor$/);
});

test.skip('you should be able to win a level after returning to it via undo... even if some unknown conditions occur', async ({ page }) => {
  // not sure when the problem occurs
});

test.skip('undoing/redoing across level changes should not drop or add extra history states', async ({ page }) => {
  // not sure how to test this yet
});

// TODO: test navigating menus with keyboard/gamepad
