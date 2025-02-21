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
  // FIXME: this is flaking, especially when running from a cold state (no browser opened, running this test specifically)
  // It seems to be caused by the level select screen rendering level previews
  // Of course, when introducing the level previews, I made sure to try to synchronously restore the level content
  // after the level preview is rendered, to a snapshot taken synchronously immediately before changing the level content to render the preview
  // (NOT before loading the level file), but it was still a hack, and I knew it could cause problems like this.
  // When this test flakes, the baseState is empty and the next delta includes the entire level state. (Not sure if it's the first or second state. Doesn't matter.)
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
