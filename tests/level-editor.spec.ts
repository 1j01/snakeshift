import { expect, test } from '@playwright/test'
import { clickTile, getCurrentLevelContent, moveMouseToTile } from './test-helpers'


test.beforeEach(async ({ page }) => {

  // Snapshot testing doesn't work if IDs change.
  // I could normalize them by find and replace, but that would be brittle/complex.
  // Better to mock the function used to generate the IDs.
  await page.addInitScript({
    content: `
      let id = 1
      window.crypto.randomUUID = () => 'mocked randomUUID: ' + (id++).toString()
    `
  })

  await page.goto('http://localhost:5569/?fast-splash-screens&show-test-levels')

  // Fail test on any page error
  // TODO: move this earlier, also in other tests
  page.on('pageerror', (error) => {
    throw new Error(`Uncaught exception: ${error.stack}`)
  })

  await page.getByRole('button', { name: 'Level Editor' }).click()
})

test.describe('level editor', () => {
  test.describe('entity placement', () => {
    test('should define a whole snake by dragging in a winding path', async ({ page }) => {
      await page.getByRole('button', { name: 'Snake (White)' }).click()
      await moveMouseToTile(page, { x: 1, y: 1 })
      await page.mouse.down()
      await moveMouseToTile(page, { x: 5, y: 5 })
      await moveMouseToTile(page, { x: 5, y: 1 })
      await moveMouseToTile(page, { x: 3, y: 1 })
      await page.mouse.up()
      expect(await getCurrentLevelContent(page)).toMatchSnapshot()
    })
    test('should place collectables on opposite color of wall or snake', async ({ page }) => {
      await page.getByRole('button', { name: 'Wall (Black)' }).click()
      await clickTile(page, { x: 1, y: 1 })
      await page.getByRole('button', { name: 'Wall (White)' }).click()
      await clickTile(page, { x: 2, y: 1 })
      await page.getByRole('button', { name: 'Snake (Black)' }).click()
      await clickTile(page, { x: 1, y: 2 })
      await page.getByRole('button', { name: 'Snake (White)' }).click()
      await clickTile(page, { x: 2, y: 2 })
      await page.getByRole('button', { name: 'Food (White)' }).click()
      await clickTile(page, { x: 1, y: 1 })
      await clickTile(page, { x: 1, y: 2 })
      await page.getByRole('button', { name: 'Food (Black)' }).click()
      await clickTile(page, { x: 2, y: 1 })
      await clickTile(page, { x: 2, y: 2 })
      expect(await getCurrentLevelContent(page)).toMatchSnapshot()
    })
    test('should not place collectables on the same color of wall or snake', async ({ page }) => {
      // Note: I'm considering reversing this decision, because it's interesting to have food you have to go inside a snake/crate to get.
      await page.getByRole('button', { name: 'Wall (Black)' }).click()
      await clickTile(page, { x: 1, y: 1 })
      await page.getByRole('button', { name: 'Wall (White)' }).click()
      await clickTile(page, { x: 2, y: 1 })
      await page.getByRole('button', { name: 'Snake (Black)' }).click()
      await clickTile(page, { x: 1, y: 2 })
      await page.getByRole('button', { name: 'Snake (White)' }).click()
      await clickTile(page, { x: 2, y: 2 })
      await page.getByRole('button', { name: 'Food (Black)' }).click()
      await clickTile(page, { x: 1, y: 1 })
      await clickTile(page, { x: 1, y: 2 })
      await page.getByRole('button', { name: 'Food (White)' }).click()
      await clickTile(page, { x: 2, y: 1 })
      await clickTile(page, { x: 2, y: 2 })
      expect(await getCurrentLevelContent(page)).toMatchSnapshot()
    })
    test.fixme('should place grass beneath snakes (of either color)', async ({ page }) => {
      await page.getByRole('button', { name: 'Snake (Black)' }).click()
      await clickTile(page, { x: 1, y: 1 })
      await page.getByRole('button', { name: 'Snake (White)' }).click()
      await clickTile(page, { x: 2, y: 1 })
      await page.getByRole('button', { name: 'Grass' }).click()
      await clickTile(page, { x: 1, y: 1 })
      await clickTile(page, { x: 2, y: 1 })
      expect(await getCurrentLevelContent(page)).toMatchSnapshot()
    })
    test.fixme('should not place "Wall (Both)" where there are snakes', async ({ page }) => {
      await page.getByRole('button', { name: 'Snake (Black)' }).click()
      await clickTile(page, { x: 1, y: 1 })
      await page.getByRole('button', { name: 'Snake (White)' }).click()
      await clickTile(page, { x: 2, y: 1 })
      await page.getByRole('button', { name: 'Wall (Both)' }).click()
      await clickTile(page, { x: 1, y: 1 })
      await clickTile(page, { x: 2, y: 1 })
      expect(await getCurrentLevelContent(page)).toMatchSnapshot()
    })
    test('should not place collectables on top of other collectables', async ({ page }) => {
      await page.getByRole('button', { name: 'Food (White)' }).click()
      await clickTile(page, { x: 1, y: 1 })
      await clickTile(page, { x: 1, y: 1 })
      await page.getByRole('button', { name: 'Food (Black)' }).click()
      await clickTile(page, { x: 1, y: 1 })
      await page.getByRole('button', { name: 'Inverter' }).click()
      await clickTile(page, { x: 1, y: 1 })
      expect(await getCurrentLevelContent(page)).toMatchSnapshot()
    })
    test.fixme('should place walls, crates, or snakes (of opposite color) below collectables', async ({ page }) => {
      await page.getByRole('button', { name: 'Food (White)' }).click()
      await clickTile(page, { x: 1, y: 1 })
      await clickTile(page, { x: 2, y: 1 })
      await clickTile(page, { x: 3, y: 1 })
      await clickTile(page, { x: 4, y: 1 })
      await page.getByRole('button', { name: 'Wall (Black)' }).click()
      await clickTile(page, { x: 1, y: 1 })
      await page.getByRole('button', { name: 'Crate (Black)' }).click()
      await clickTile(page, { x: 2, y: 1 })
      await page.getByRole('button', { name: 'Snake (Black)' }).click()
      await clickTile(page, { x: 3, y: 1 })
      await page.getByRole('button', { name: 'Grass' }).click()
      await clickTile(page, { x: 4, y: 1 })
    })
    test.fixme('should place walls, crates, or snakes (of same color) below collectables', async ({ page }) => {
      await page.getByRole('button', { name: 'Food (White)' }).click()
      await clickTile(page, { x: 1, y: 1 })
      await clickTile(page, { x: 2, y: 1 })
      await clickTile(page, { x: 3, y: 1 })
      await clickTile(page, { x: 4, y: 1 })
      await page.getByRole('button', { name: 'Wall (White)' }).click()
      await clickTile(page, { x: 1, y: 1 })
      await page.getByRole('button', { name: 'Crate (White)' }).click()
      await clickTile(page, { x: 2, y: 1 })
      await page.getByRole('button', { name: 'Snake (White)' }).click()
      await clickTile(page, { x: 3, y: 1 })
      await page.getByRole('button', { name: 'Grass' }).click()
      await clickTile(page, { x: 4, y: 1 })
    })
    test('should not place entities outside level boundaries (including snakes)', async ({ page }) => {
      await page.getByRole('button', { name: 'Wall (White)' }).click()
      await clickTile(page, { x: -1, y: 1 })
      await page.getByRole('button', { name: 'Wall (White)' }).click() // in case another tool was selected by clicking outside the canvas
      await clickTile(page, { x: 1, y: 16 }) // assuming default level size of 16x16, this is just out of bounds
      await page.getByRole('button', { name: 'Snake (White)' }).click()

      // This path gave different results in firefox and chromium
      // probably because firefox is not allowing the mouse to go outside the page
      // await moveMouseToTile(page, { x: 5, y: 5 })
      // await page.mouse.down()
      // await moveMouseToTile(page, { x: 5 + 20, y: 5 - 20 })
      // await moveMouseToTile(page, { x: 5 + 20, y: 5 + 20 })
      // await page.mouse.up()

      // Let's try going closer to the edge
      await moveMouseToTile(page, { x: 3, y: 3 })
      await page.mouse.down()
      await moveMouseToTile(page, { x: 6, y: - 3 })
      await moveMouseToTile(page, { x: 6, y: 3 })
      await page.mouse.up()

      expect(await getCurrentLevelContent(page)).toMatchSnapshot()
    })
  })
  test.describe('default snake focus', () => {
    test('should focus first movable snake', async ({ page }) => {
      const snakePos1 = { x: 1, y: 1 }
      const snakePos2 = { x: 5, y: 1 }
      // Place snakes
      await page.getByRole('button', { name: 'Snake (White)' }).click()
      await clickTile(page, snakePos1)
      await clickTile(page, snakePos2)
      // Surround the first snake with walls
      await page.getByRole('button', { name: 'Wall (White)' }).click()
      for (const dir of [{ x: -1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 0 }, { x: 0, y: -1 }]) {
        await clickTile(page, { x: snakePos1.x + dir.x, y: snakePos1.y + dir.y })
      }
      // Place goal next to second snake
      await page.getByRole('button', { name: 'Food (White)' }).click()
      await clickTile(page, { x: snakePos2.x + 1, y: snakePos2.y })
      // Play
      await page.getByRole('button', { name: 'Play/Edit' }).click()
      await expect(page).toHaveTitle('Snakeshift - Custom Level')
      await expect(page.locator('#level-splash-title')).not.toBeVisible()
      await page.keyboard.press('ArrowRight')
      await expect(page.getByText('Level Complete')).toBeVisible()
    })
    test('should focus first snake if none can move', async ({ page }) => {
      const snakePos1 = { x: 1, y: 1 }
      const snakePos2 = { x: 5, y: 1 }
      // Place snakes
      await page.getByRole('button', { name: 'Snake (White)' }).click()
      await clickTile(page, snakePos1)
      await clickTile(page, snakePos2)
      // Surround both snakes with walls
      await page.getByRole('button', { name: 'Wall (White)' }).click()
      for (const snakePos of [snakePos1, snakePos2]) {
        for (const dir of [{ x: -1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 0 }, { x: 0, y: -1 }]) {
          await clickTile(page, { x: snakePos.x + dir.x, y: snakePos.y + dir.y })
        }
      }
      // Play
      await page.getByRole('button', { name: 'Play/Edit' }).click()
      await expect(page).toHaveTitle('Snakeshift - Custom Level')
      await expect(page.locator('#level-splash-title')).not.toBeVisible()
      await page.keyboard.press('ArrowRight')
      // TODO: expect invalid move sound (none yet)
      expect(await page.evaluate(() => window._forTesting.playedSounds)).not.toContain('move')
      // A snapshot test doesn't test much here...
      // The level shouldn't be changed by moving invalidly.
      // I know what we can do. If we press tab twice, it should end up on the same snake.
      // If it hadn't focused a snake by default, it will end up on the first snake.
      const snapshot1 = await getCurrentLevelContent(page)
      await page.keyboard.press('Tab')
      await page.keyboard.press('Tab')
      const snapshot2 = await getCurrentLevelContent(page)
      expect(snapshot1).toEqual(snapshot2)
      expect(snapshot1).toMatchSnapshot()
    })
  })
  test('should be able to move after restarting a custom level', async ({ page }) => {
    // Set up level so you can win by moving right
    await page.getByRole('button', { name: 'Snake (White)' }).click()
    await clickTile(page, { x: 1, y: 1 })
    await page.getByRole('button', { name: 'Food (White)' }).click()
    await clickTile(page, { x: 2, y: 1 })

    // Play
    await page.getByRole('button', { name: 'Play/Edit' }).click()
    await expect(page).toHaveTitle('Snakeshift - Custom Level')
    await page.getByRole('button', { name: 'Restart Level' }).click()
    await expect(page.getByText('Level Complete')).not.toBeVisible()
    await page.keyboard.press('ArrowRight')
    await expect(page.getByText('Level Complete')).toBeVisible()
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
    test('level info panel should start with the first field selected, not just focused', async ({ page }) => {
      await page.getByRole('button', { name: 'Level Info' }).click()
      await expect(page.getByLabel('Width')).toBeFocused()
      // TODO: Test that it's SELECTED, not just FOCUSED.
      // expect(await page.evaluate(() => {
      //   const input = document.activeElement as HTMLInputElement
      //   // <input type="number"> doesn't support getting/setting the selection range
      //   // A workaround is to change the type to "text"... except this seems to clear the selection range.
      //   input.type = 'text'
      //   return [input.selectionStart, input.selectionStart !== input.selectionEnd]
      // })).toEqual([0, true])
    })
    test('level info panel should show the existing level details', async ({ page }) => {
      await page.getByRole('button', { name: 'Level Info' }).click()
      await expect(page.getByLabel('Width')).toHaveValue('16')
      await expect(page.getByLabel('Height')).toHaveValue('16')
    })
    test('level info panel should let you change the dimensions of the level (undoable)', async ({ page }) => {
      await page.getByRole('button', { name: 'Level Info' }).click()
      await page.getByLabel('Width').fill('8')
      await page.getByLabel('Height').fill('10')
      await page.getByRole('button', { name: 'OK' }).click()
      await expect(page.getByRole('dialog')).not.toBeVisible()
      expect(await page.evaluate(() => window._forTesting.playedSounds)).toContain('resize')
      expect(await getCurrentLevelContent(page)).toMatchSnapshot()
      await page.keyboard.press('z')
      expect(await getCurrentLevelContent(page)).toMatchSnapshot()
    })
    test.fixme('level info panel should let you change other metadata of the level', async ({ page }) => {
      // Should this be undoable? Probably, to match, right? But it's kinda invisible as a change...
      await page.getByRole('button', { name: 'Level Info' }).click()
      await page.getByLabel('Title').fill('Test Level')
      await page.getByLabel('Author').fill('Test Author')
      await page.getByRole('button', { name: 'OK' }).click()
      await expect(page.getByRole('dialog')).not.toBeVisible()
      expect(await getCurrentLevelContent(page)).toMatchSnapshot()
    })
    test('cancel button should leave level unchanged', async ({ page }) => {
      await page.getByRole('button', { name: 'Level Info' }).click()
      await page.getByLabel('Width').fill('8')
      await page.getByLabel('Height').fill('10')
      await page.getByRole('button', { name: 'Cancel' }).click()
      await expect(page.getByRole('dialog')).not.toBeVisible()
      expect(await page.evaluate(() => window._forTesting.playedSounds)).not.toContain('resize')
      expect(await getCurrentLevelContent(page)).toMatchSnapshot()
    })
    test('escape key should leave level unchanged', async ({ page }) => {
      await page.getByRole('button', { name: 'Level Info' }).click()
      await page.getByLabel('Width').fill('8')
      await page.getByLabel('Height').fill('10')
      await page.getByRole('button', { name: 'Cancel' }).click()
      await expect(page.getByRole('dialog')).not.toBeVisible()
      expect(await page.evaluate(() => window._forTesting.playedSounds)).not.toContain('resize')
      expect(await getCurrentLevelContent(page)).toMatchSnapshot()
    })
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
  test.describe('ui', () => {
    // probably should do screenshot tests for these
    test.skip('tool bar should scroll if space is limited, and should not go behind the back button', () => { /* TODO */ })
    test.skip('tool bar should be centered if there is enough space', () => { /* TODO */ })
  })
  test.describe('inapplicable actions', () => {
    test.fail('restart level (R) should not do anything, and button should be hidden', async ({ page }) => {
      // Arguably I could make R clear the level same as N, to make it more guessable.
      // Then again, R could mean different things, so maybe clear shouldn't be "guessable".
      // Even if it's undoable, it may be upsetting and you may not consider that it could be undoable.
      await expect(page.getByText('Restart Level')).not.toBeVisible()
      await expect(page.locator('#restart-level')).not.toBeVisible()
      await clickTile(page, { x: 1, y: 1 })
      await page.keyboard.press('r')
      expect(await getCurrentLevelContent(page)).toMatchSnapshot()
    })
  })
  test.skip('gamepad controls should be supported', () => { /* TODO */ })
  test.skip('touch controls should be supported', () => { /* TODO */ })
})
