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
  const originalContent = await readFile('game/public/levels/tests/overlapped-snake-doubling-back-bug-replay.json', 'utf8')
  await setLevelContent(page, originalContent, "replay")
  const newContent = await getPlaythroughContent(page)
  expect(newContent).toEqual(originalContent)

  // Load a second file to ensure they're not concatenated, which was a previous bug
  // This test should fail if you revert commit 101ea449cb30fddab122d8067e070c00fff9b1a2
  const originalContent2 = await readFile('game/public/levels/tests/overlapped-snake-looping-back-bug-replay.json', 'utf8')
  await setLevelContent(page, originalContent2, "replay")
  const newContent2 = await getPlaythroughContent(page)
  expect(newContent2).toEqual(originalContent2)
})
