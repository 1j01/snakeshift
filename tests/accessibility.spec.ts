import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('http://localhost:5569/');

  // Fail test on any page error
  page.on('pageerror', (error) => {
    throw new Error(`Uncaught exception: ${error.stack}`);
  });
});

test.skip('all buttons should have accessible names', async ({ page }) => {
  // This is stupid. I don't want to test that they have aria-label attributes,
  // I want to test that screen readers can read them even when the labels are hidden.
  const buttons = await page.$$('button');
  for (const button of buttons) {
    const name = await button.getAttribute('aria-label');
    if (!name) {
      throw new Error(`button has no accessible name: ${button}`);
    }
  }
});

// TODO: test mute button and play/edit toggle buttons
// since their text should change along with their accessibility names

test('all buttons in toolbars should have .button-text spans', async ({ page }) => {
  for (const toolbar of ['#game-options-bar', '#entities-bar']) {
    const buttons = await page.$$(toolbar + ' button');
    expect(buttons.length).toBeGreaterThan(0);
    for (const button of buttons) {
      const buttonText = await button.$('.button-text');
      if (!buttonText) {
        throw new Error(`button in toolbar has no .button-text: ${button}`);
      }
    }
  }
});

test('most buttons in toolbars should have aria-keyshortcuts', async ({ page }) => {
  for (const toolbar of ['#game-options-bar', '#entities-bar']) {
    const buttons = await page.$$(toolbar + ' button:not([data-entity]):not([data-tool])');
    expect(buttons.length).toBeGreaterThan(0);
    for (const button of buttons) {
      const keyshortcuts = await button.getAttribute('aria-keyshortcuts');
      if (!keyshortcuts) {
        throw new Error(`button in toolbar has no aria-keyshortcuts: ${button}`);
      }
    }
  }
});

