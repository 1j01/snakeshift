import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('http://localhost:5569/');
});

test('has title', async ({ page }) => {
  await expect(page).toHaveTitle(/Snakeshift/);
});

test('test', async ({ page }) => {
  await page.getByRole('button', { name: 'Play' }).click();
  await page.keyboard.press('ArrowRight');
  await page.getByRole('button', { name: '← Back' }).click();
  await page.getByRole('button', { name: 'Play' }).click();
  await page.getByRole('button', { name: '← Back' }).click();
  await page.getByRole('button', { name: 'Level Select' }).click();
  await page.getByRole('button', { name: 'Security by Obscurity' }).click();
  await page.getByRole('button', { name: '← Back' }).click();
  await page.getByRole('button', { name: 'Level Editor' }).click();
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

test('undoing should go back a level without immediately winning it', async ({ page }) => {
  await page.getByRole('button', { name: 'Level Select' }).click();
  await page.getByRole('button', { name: 'Test Level 001 (Just move right to win)' }).click();
  await expect(page).toHaveTitle(/^Snakeshift - Test Level 001 \(Just move right to win\)$/);
  await page.keyboard.press('ArrowRight');
  await expect(page).toHaveTitle(/^Snakeshift - Test Level 002 \(Just move right to win\)$/);
  await page.keyboard.press('ControlOrMeta+z');
  await expect(page).toHaveTitle(/^Snakeshift - Test Level 001 \(Just move right to win\)$/);
});
