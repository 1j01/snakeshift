import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('http://localhost:5569/?show-test-levels')

  // Fail test on any page error
  page.on('pageerror', (error) => {
    throw new Error(`Uncaught exception: ${error.stack}`)
  })
})

test.skip('all buttons should have accessible names', async ({ page }) => {
  // This is stupid. I don't want to test that they have aria-label attributes,
  // I want to test that screen readers can read them even when the labels are hidden.
  const buttons = page.locator('button')
  const count = await buttons.count()
  for (let i = 0; i < count; i++) {
    const button = buttons.nth(i)
    const name = await button.getAttribute('aria-label')
    if (!name) {
      throw new Error(`button has no accessible name: ${await button.evaluate(node => node.outerHTML)}`)
    }
  }
})

// TODO: test mute button and play/edit toggle buttons
// since their text should change along with their accessibility names

test('all buttons in toolbars should have .button-text spans', async ({ page }) => {
  for (const toolbar of ['#game-options-bar', '#entities-bar']) {
    const buttons = page.locator(`${toolbar} button`)
    const count = await buttons.count()
    expect(count).toBeGreaterThan(0)
    for (let i = 0; i < count; i++) {
      const button = buttons.nth(i)
      const buttonTextSpan = button.locator('.button-text')
      if (await buttonTextSpan.count() === 0) {
        throw new Error(`button in toolbar has no .button-text: ${await button.evaluate(node => node.outerHTML)}`)
      }
    }
  }
})

test('most buttons in toolbars should have aria-keyshortcuts', async ({ page }) => {
  for (const toolbar of ['#game-options-bar', '#entities-bar']) {
    const buttons = page.locator(`${toolbar} button:not([data-entity]):not([data-tool])`)
    const count = await buttons.count()
    expect(count).toBeGreaterThan(0)
    for (let i = 0; i < count; i++) {
      const button = buttons.nth(i)
      const keyshortcuts = await button.getAttribute('aria-keyshortcuts')
      if (!keyshortcuts) {
        throw new Error(`button in toolbar has no aria-keyshortcuts: ${await button.evaluate(node => node.outerHTML)}`)
      }
    }
  }
})

