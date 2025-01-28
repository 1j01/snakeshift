# Snakeshift Todo List

- hard to see/understand snakes' shapes when overlapping
  - outline shouldn't intersect 
  - might help to change the style back to originally intended style
  - might help to add scales
  - probably need texture-based rendering to sort this out
  - oh, could prevent key repeat on switching snakes, and make it keep the highlight as long as the key is held
- feels like you shouldn't be able to go on top of another snake's head, like you'd eat the snake
  - I have since made collectables more distinct from snake eyes by making them bigger, changing their shape to be pointy, and giving the snake two eyes; however, it could be explored for gameplay reasons (keeping head visible, etc.)

- test that when switching from play to edit mode, should always stay on the same level
- test that reset (R) should never move to a different level
- handle opening levels while in play mode or menu, and test saving as well
- prompt before discarding unsaved level
- handle escape key same as back button (maybe trigger a click; but take the best of both worlds)
- should be able to undo to hide the game win screen

- saving playthroughs:
  - limit to undos pertaining to the current level (using `levelId` which is now in the undo shape)
  - make sure playthroughs can include the final (winning) state
  - improve playthrough format
    - include inputs
      - use Move, but include the Snake's id in the Move structure

- shouldn't show tile highlight when pressing 'Y' to redo; could setControlType or whatever
- make black block behave identically with white in the editor, where you can't tell which is an entity and which is empty space (maybe even treat it as a 1bpp image, drawn with nearest neighbor interpolation)
- handle edge case of toggling edit mode while dragging something
- reign in `onUpdate` over-extension/repurposing/overuse, maybe adding an onResize in renderer or something
- key repeat, also for dpad, and (after simplifying the movement scheme) joypad
- separate highlight visuals for edit mode/play mode, maybe an arrow in play mode
- shift+tab would also be nice when there are more than two snakes (particularly if there are way too many snakes), maybe shift shouldn't act as tab
- preload levels
- gamepad support for menus etc.
- would be fun/disappointing to try and play this on a kindle (see branch `kindle-attempt-2`)

