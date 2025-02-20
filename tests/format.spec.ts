import { expect, test } from '@playwright/test'
import { readFile } from 'fs/promises'
import { getPlaythroughContent, setLevelContent } from './test-helpers'

test.beforeEach(async ({ page }) => {
  await page.goto('http://localhost:5569/?show-test-levels')

  // Fail test on any page error
  page.on('pageerror', (error) => {
    throw new Error(`Uncaught exception: ${error.stack}`)
  })
})

test('round-trip: should re-save playthrough file identically', async ({ page }) => {
  test.fixme(true, 'This is a false positive. `npm run update-level-format` is not being idempotent. What is different?')
  const originalContent = await readFile('game/public/levels/tests/overlapped-snake-doubling-back-bug-replay.json', 'utf8')
  await setLevelContent(page, originalContent, "replay")
  const newContent = await getPlaythroughContent(page)
  expect(newContent).toEqual(originalContent)
})
