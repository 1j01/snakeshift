import { expect, test } from '@playwright/test'
import { clickTile, saveLevelFileAndGetContent } from './test-helpers'


test.beforeEach(async ({ page }) => {

  // Snapshot testing doesn't work if IDs change.
  // I could normalize them by find and replace, but that would be brittle/complex.
  // Better to mock the function used to generate the IDs.
  await page.addInitScript({
    content: `let id=1; window.crypto.randomUUID = () => \`mocked randomUUID: \${(id++).toString()}\`;`
  })

  await page.goto('http://localhost:5569/?fast-splash-screens')

  // Fail test on any page error
  // TODO: move this earlier, also in other tests
  page.on('pageerror', (error) => {
    throw new Error(`Uncaught exception: ${error.stack}`)
  })

  await page.getByRole('button', { name: 'Level Editor' }).click()
})

test.describe('level editor', () => {
  test.describe('entity placement', () => {
    test.skip('should define a whole snake by dragging in a winding path', () => { /* TODO */ })
    test.skip('should place collectables on opposite color of wall or snake', () => { /* TODO */ })
    test.skip('should not place collectables on the same color of wall or snake', () => { /* TODO */ })
    test.skip('should not place collectables on top of other collectables', () => { /* TODO */ })
    test.skip('should not place entities outside level boundaries (including snakes)', () => { /* TODO */ })
  })
  test.describe('default snake focus', () => {
    test.fail('should focus first movable snake', async ({ page }) => {
      const snakePos1 = { x: 1, y: 1 }
      const snakePos2 = { x: 5, y: 1 }
      // Place snakes
      await page.getByRole('button', { name: 'Snake (White)' }).click()
      await clickTile(page, snakePos1.x, snakePos1.y)
      await clickTile(page, snakePos2.x, snakePos2.y)
      // Surround the first snake with walls
      await page.getByRole('button', { name: 'Wall (White)' }).click()
      for (const dir of [{ x: -1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 0 }, { x: 0, y: -1 }]) {
        await clickTile(page, snakePos1.x + dir.x, snakePos1.y + dir.y)
      }
      // Place goal next to second snake
      await page.getByRole('button', { name: 'Food (White)' }).click()
      await clickTile(page, snakePos2.x + 1, snakePos2.y)
      // Play
      await page.getByRole('button', { name: 'Play/Edit' }).click()
      await expect(page).toHaveTitle('Snakeshift - Custom Level')
      await expect(page.locator('#level-splash-title')).not.toBeVisible()
      await page.keyboard.press('ArrowRight')
      await expect(page.getByText('Level Complete')).toBeVisible()
    })
    test.fail('should focus first snake if none can move', async ({ page }) => {
      const snakePos1 = { x: 1, y: 1 }
      const snakePos2 = { x: 5, y: 1 }
      // Place snakes
      await page.getByRole('button', { name: 'Snake (White)' }).click()
      await clickTile(page, snakePos1.x, snakePos1.y)
      await clickTile(page, snakePos2.x, snakePos2.y)
      // Surround both snakes with walls
      await page.getByRole('button', { name: 'Wall (White)' }).click()
      for (const snakePos of [snakePos1, snakePos2]) {
        for (const dir of [{ x: -1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 0 }, { x: 0, y: -1 }]) {
          await clickTile(page, snakePos.x + dir.x, snakePos.y + dir.y)
        }
      }
      // Play
      await page.getByRole('button', { name: 'Play/Edit' }).click()
      await expect(page).toHaveTitle('Snakeshift - Custom Level')
      await expect(page.locator('#level-splash-title')).not.toBeVisible()
      await page.keyboard.press('ArrowRight')
      // TODO: expect invalid move sound (none yet)
      expect(await page.evaluate(() => window._forTesting.playedSounds)).not.toContain(['move'])
      // A snapshot test doesn't test much here...
      // The level shouldn't be changed by moving invalidly.
      // I know what we can do. If we press tab twice, it should end up on the same snake.
      // If it hadn't focused a snake by default, it will end up on the first snake.
      const snapshot1 = await saveLevelFileAndGetContent(page)
      await page.keyboard.press('Tab')
      await page.keyboard.press('Tab')
      const snapshot2 = await saveLevelFileAndGetContent(page)
      expect(snapshot1).toEqual(snapshot2)
      expect(snapshot1).toMatchSnapshot()
    })
  })
  test.describe('move tool', () => {
    test.skip('move tool should let you move rectangular entities', () => { /* TODO */ })
    test.skip('move tool should let you drag snakes by the head', () => { /* TODO */ })
    test.skip('move tool should let you drag snakes by the tail', () => { /* TODO */ })
  })
  test.describe('select tool', () => {
    test.skip('select tool should let you delete entities', () => { /* TODO */ })
    test.skip('select tool should let you move entities', () => { /* TODO */ })
    test.skip('an empty selection should still be movable and deletable', () => { /* TODO */ })
    test.skip('copy/paste', () => { /* TODO */ })
    test.skip('cut/paste', () => { /* TODO */ })
    test.skip('arrow keys should translate selection', () => { /* TODO */ })
    test.skip('clicking should create a 1x1 selection and immediately select entities (no drag required)', () => { /* TODO */ })
    test.skip('1x1 selection should translate like normal (must not use equal references for start/end positions)', () => { /* TODO */ })
    test.skip('right click should not erase entities while there is a selection', () => { /* TODO */ })
    test.skip('undo/redo should hide the selection box', () => { /* TODO */ })
    test.skip('resizing the level should update the selection box position visually', () => { /* TODO */ })
  })
  test.describe('eraser tool', () => {
    test.skip('eraser tool should let you delete entities', () => { /* TODO */ })
    test.skip('eraser tool should partially delete snakes, and split them if necessary', () => { /* TODO */ })
    test.skip('right click should also erase entities, without eraser tool selected', () => { /* TODO */ })
  })
  test.describe('clear button', () => {
    test.skip('clear button should clear the level if there is no selection (undoable)', () => { /* TODO */ })
    test.skip('clear button should delete the selected entities (undoable)', () => { /* TODO */ })
    test.skip('clear button should just hide the selection box if the selection is empty (without creating an undo state)', () => { /* TODO */ })
  })
  test.describe('level info panel', () => {
    test.skip('level info panel should start with the first field selected, not just focused', () => { /* TODO */ })
    test.skip('level info panel should show the existing level details', () => { /* TODO */ })
    test.skip('level info panel should let you change the dimensions of the level (undoable)', () => { /* TODO */ })
    test.skip('level info panel should let you change other metadata of the level', () => { /* TODO */ })
    test.skip('cancel button should leave level unchanged', () => { /* TODO */ })
  })
  test.describe('save button', () => {
    test.skip('save button should save the level', () => { /* TODO */ })
  })
  test.describe('open button', () => {
    test.skip('open button should open a level', () => { /* TODO */ })
  })
  test.describe('undo button', () => {
    test.skip('undo button should undo the last action', () => { /* TODO */ })
    test.skip('undo button should be disabled when there are no actions to undo', () => { /* TODO */ })
  })
  test.describe('redo button', () => {
    test.skip('redo button should redo the last action', () => { /* TODO */ })
    test.skip('redo button should be disabled when there are no actions to redo', () => { /* TODO */ })
  })
  test.describe('play testing the level', () => {
    // This sort of thing may be tested by navigation.spec.ts, but there's no play button yet, only a keyboard shortcut.
    test.skip('play button should start the level', () => { /* TODO */ })
  })
  test.describe('ui', () => {
    test.skip('tool bar should scroll if space is limited, and should not go behind the back button', () => { /* TODO */ })
    test.skip('tool bar should be centered if there is enough space', () => { /* TODO */ })
  })
  test.describe('inapplicable actions', () => {
    test.skip('restart level should not do anything, and button should be hidden', () => { /* TODO */ })
  })
  test.skip('gamepad controls should be supported', () => { /* TODO */ })
  test.skip('touch controls should be supported', () => { /* TODO */ })
})
