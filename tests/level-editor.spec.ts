import { test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('http://localhost:5569/?fast-splash-screens');
  await page.getByRole('button', { name: 'Level Editor' }).click();

  // Fail test on any page error
  page.on('pageerror', (error) => {
    throw new Error(`Uncaught exception: ${error.stack}`);
  });
});

test.describe('level editor', () => {
  test.describe('entity placement', () => {
    test.skip('should define a whole snake by dragging in a winding path')
    test.skip('should place collectables on opposite color of wall or snake')
    test.skip('should not place collectables on the same color of wall or snake')
    test.skip('should not place collectables on top of other collectables')
    test.skip('should not place entities outside level boundaries (including snakes)')
  })
  test.describe('move tool', () => {
    test.skip('move tool should let you move rectangular entities')
    test.skip('move tool should let you drag snakes by the head')
    test.skip('move tool should let you drag snakes by the tail')
  })
  test.describe('select tool', () => {
    test.skip('select tool should let you delete entities')
    test.skip('select tool should let you move entities')
    test.skip('an empty selection should still be movable and deletable')
    test.skip('copy/paste')
    test.skip('cut/paste')
    test.skip('arrow keys should translate selection')
    test.skip('clicking should create a 1x1 selection and immediately select entities (no drag required)')
    test.skip('1x1 selection should translate like normal (must not use equal references for start/end positions)')
    test.skip('right click should not erase entities while there is a selection')
    test.skip('undo/redo should hide the selection box')
    test.skip('resizing the level should update the selection box position visually')
  })
  test.describe('eraser tool', () => {
    test.skip('eraser tool should let you delete entities')
    test.skip('eraser tool should partially delete snakes, and split them if necessary')
    test.skip('right click should also erase entities, without eraser tool selected')
  })
  test.describe('clear button', () => {
    test.skip('clear button should clear the level if there is no selection (undoable)')
    test.skip('clear button should delete the selected entities (undoable)')
    test.skip('clear button should just hide the selection box if the selection is empty (without creating an undo state)')
  })
  test.describe('level info panel', () => {
    test.skip('level info panel should start with the first field selected, not just focused')
    test.skip('level info panel should show the existing level details')
    test.skip('level info panel should let you change the dimensions of the level (undoable)')
    test.skip('level info panel should let you change other metadata of the level')
    test.skip('cancel button should leave level unchanged')
  })
  test.describe('save button', () => {
    test.skip('save button should save the level')
  })
  test.describe('open button', () => {
    test.skip('open button should open a level')
  })
  test.describe('undo button', () => {
    test.skip('undo button should undo the last action')
    test.skip('undo button should be disabled when there are no actions to undo')
  })
  test.describe('redo button', () => {
    test.skip('redo button should redo the last action')
    test.skip('redo button should be disabled when there are no actions to redo')
  })
  test.describe('play testing the level', () => {
    // This sort of thing may be tested by navigation.spec.ts, but there's no play button yet, only a keyboard shortcut.
    test.skip('play button should start the level')
  })
  test.describe('ui', () => {
    test.skip('tool bar should scroll if space is limited, and should not go behind the back button')
    test.skip('tool bar should be centered if there is enough space')
  })
  test.describe('inapplicable actions', () => {
    test.skip('restart level should not do anything, and button should be hidden')
  })
  test.skip('gamepad controls should be supported')
  test.skip('touch controls should be supported')
})
