import { expect, test } from '@playwright/test'
import { readFile } from 'fs/promises'
import { getCurrentLevelContent, getPlaythroughContent, setLevelContent } from './test-helpers'

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
  expect(JSON.parse(newContent)).toEqual(JSON.parse(originalContent))

  // Load a second file to ensure they're not concatenated, which was a previous bug
  // This test should fail if you revert commit 101ea449cb30fddab122d8067e070c00fff9b1a2
  const originalContent2 = await readFile('game/public/levels/tests/overlapped-snake-looping-back-bug-replay.json', 'utf8')
  await setLevelContent(page, originalContent2, "replay")
  const newContent2 = await getPlaythroughContent(page)
  expect(JSON.parse(newContent2)).toEqual(JSON.parse(originalContent2))
})

test('round-trip: should re-save level file identically', async ({ page }) => {
  const originalContent = await readFile('game/public/levels/tests/3x3-with-1x1-snake-in-middle.json', 'utf8')
  await setLevelContent(page, originalContent, "edit")
  const newContent = await getCurrentLevelContent(page)
  expect(JSON.parse(newContent)).toEqual(JSON.parse(originalContent))

  const originalContent2 = await readFile('game/public/levels/tests/snake-should-be-able-to-move-down-to-its-tail.json', 'utf8')
  await setLevelContent(page, originalContent2, "edit")
  const newContent2 = await getCurrentLevelContent(page)
  expect(JSON.parse(newContent2)).toEqual(JSON.parse(originalContent2))
})
