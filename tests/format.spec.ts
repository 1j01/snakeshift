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

test('should save a playthrough file from play mode', async ({ page }) => {
  const originalContent = await readFile('game/public/levels/tests/3x3-with-1x1-snake-in-middle.json', 'utf8')
  await setLevelContent(page, originalContent, "play")
  await page.keyboard.press('ArrowRight')
  await page.keyboard.press('ArrowRight')
  await page.keyboard.press('ArrowLeft')
  await page.keyboard.press('ArrowLeft')
  await page.keyboard.press('ArrowLeft')
  await page.keyboard.press('ArrowRight')
  await page.keyboard.press('ArrowUp')
  await page.keyboard.press('ArrowUp')
  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('ArrowUp')
  const playthrough = await getPlaythroughContent(page)
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  expect(JSON.parse(playthrough).deltas).toHaveLength(8)
  expect(playthrough).toMatchSnapshot()
})

test('should save a playthrough file from play mode after winning and undoing winning a level', async ({ page }) => {
  const originalContent = await readFile('game/public/levels/tests/move-right-to-win.json', 'utf8')
  await setLevelContent(page, originalContent, "play")
  // await setLevelContent(page, originalContent, "edit")
  // await page.getByRole('button', { name: 'Play/Edit' }).click()
  await page.keyboard.press('ArrowUp')
  await page.keyboard.press('ArrowRight')
  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('Control+KeyZ')
  const playthrough = await getPlaythroughContent(page)
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  expect(JSON.parse(playthrough).deltas).toHaveLength(2)
  expect(playthrough).toMatchSnapshot()
})
