import { expect, test } from '@playwright/test';
import { dragAndDropFile, saveLevelFileAndCompareContent } from './test-helpers';

test.beforeEach(async ({ page }) => {
  await page.goto('http://localhost:5569/');
});

test('basic navigation', async ({ page }) => {
  await expect(page).toHaveTitle(/Snakeshift/);
  await page.getByRole('button', { name: 'Play' }).click();
  await page.keyboard.press('ArrowRight');
  await page.getByRole('button', { name: '← Back' }).click();
  await expect(page).toHaveTitle(/^Snakeshift$/);
  await page.getByRole('button', { name: 'Play' }).click();
  await page.getByRole('button', { name: '← Back' }).click();
  await page.getByRole('button', { name: 'Level Select' }).click();
  await expect(page).toHaveTitle(/^Snakeshift$/);
  await page.getByRole('button', { name: 'Security by Obscurity' }).click();
  await expect(page).toHaveTitle(/^Snakeshift - Security by Obscurity$/);
  await page.getByRole('button', { name: '← Back' }).click();
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
  await page.keyboard.press('ArrowRight');
  await expect(page).toHaveTitle(/^Snakeshift - Test Level 002 \(Just move left to win\)$/);
  await page.keyboard.press('ControlOrMeta+z');
  await expect(page).toHaveTitle(/^Snakeshift - Test Level 001 \(Just move right to win\)$/);
  await page.keyboard.press('ArrowRight');
  await expect(page).toHaveTitle(/^Snakeshift - Test Level 002 \(Just move left to win\)$/);
});

test.fixme('you should be able to win the last level twice in a row, after returning to it via level select', async ({ page }) => {
  // The win condition should trigger if you win the last level, then go back to the menu and go to the same last level from the level select and win it again
  // This doesn't work if the level that was won is stored in order to prevent spamming the level win sound effect / splash screen animation.
  await page.getByRole('button', { name: 'Level Select' }).click();
  await page.getByRole('button', { name: 'Test Level 999 (Just move right to win)' }).click();
  await expect(page).toHaveTitle(/^Snakeshift - Test Level 999 \(Just move right to win\)$/);
  await expect(page.locator('#game-win-screen')).not.toBeVisible();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#game-win-screen')).toBeVisible();
  await page.getByRole('button', { name: '← Back' }).click();
  await page.getByRole('button', { name: 'Level Select' }).click();
  await page.getByRole('button', { name: 'Test Level 999 (Just move right to win)' }).click();
  await expect(page).toHaveTitle(/^Snakeshift - Test Level 999 \(Just move right to win\)$/);
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

test.fixme('should open a level for editing with drag and drop, while in play mode', async ({ page }) => {
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
  await page.keyboard.press('ArrowRight');
  await expect(page).toHaveTitle(/^Snakeshift - Test Level 002 \(Just move left to win\)$/);
  await page.keyboard.press('Backquote');
  await expect(page).toHaveTitle(/^Snakeshift - Level Editor$/);
  await page.keyboard.press('Backquote');
  // It doesn't and shouldn't necessarily preserve the title because it's a potentially edited level.
  // await expect(page).toHaveTitle(/^Snakeshift - Test Level 002 \(Just move left to win\)$/);
  // We can compare the file content instead.
  await saveLevelFileAndCompareContent(page, 'game/public/levels/tests/move-left-to-win.json');
});

test('should stay on the same level when pressing R after winning a prior level', async ({ page }) => {
  await page.getByRole('button', { name: 'Level Select' }).click();
  await page.getByRole('button', { name: 'Test Level 001 (Just move right to win)' }).click();
  await expect(page).toHaveTitle(/^Snakeshift - Test Level 001 \(Just move right to win\)$/);
  await page.keyboard.press('ArrowRight');
  await expect(page).toHaveTitle(/^Snakeshift - Test Level 002 \(Just move left to win\)$/);
  await page.keyboard.press('r');
  await expect(page).toHaveTitle(/^Snakeshift - Test Level 002 \(Just move left to win\)$/);
  // TODO: also test that it restarts the level
});

test('should show "Level Complete" when finishing a custom level (via level editor)', async ({ page }) => {
  await page.getByRole('button', { name: 'Level Select' }).click();
  await page.getByRole('button', { name: 'Test Level 001 (Just move right to win)' }).click();
  await expect(page).toHaveTitle(/^Snakeshift - Test Level 001 \(Just move right to win\)$/);
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

test.skip('you should be able to win a level after returning to it via undo... even if some unknown conditions occur', async ({ page }) => {
  // not sure when the problem occurs
});

test.skip('undoing/redoing across level changes should not drop or add extra history states', async ({ page }) => {
  // not sure how to test this yet
});

// TODO: test navigating menus with keyboard/gamepad
