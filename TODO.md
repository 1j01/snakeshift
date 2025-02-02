# Snakeshift Todo List

- hard to see/understand snakes' shapes when overlapping
  - outline shouldn't intersect 
  - might help to change the style back to originally intended style
  - might help to add scales
  - probably need texture-based rendering to sort this out
  - oh, could prevent key repeat on switching snakes, and make it keep the highlight as long as the key is held
- feels like you shouldn't be able to go on top of another snake's head, like you'd eat the snake
  - I have since made collectables more distinct from snake eyes by making them bigger, changing their shape to be pointy, and giving the snake two eyes; however, it could be explored for gameplay reasons (keeping head visible, etc.)

- prevent snakes from swapping depths while overlapped
  - simplest but most limiting would be to prevent moving while a snake is on top; need to see if this affects any puzzles
- detect immobile state and show a message about restarting/undoing
- handle escape key same as back button (maybe trigger a click; but take the best of both worlds)
- skip/merge extra undo steps for switching snakes

- saving playthroughs:
  - limit to undos pertaining to the current level (using `levelId` which is now in the undo shape)
  - make sure playthroughs can include the final (winning) state
  - improve playthrough format
    - include inputs
      - use Move, but include the Snake's id in the Move structure

- controls:
  - separate highlight visuals for edit mode/play mode, maybe an arrow in play mode (might do away with the highlight altogether in play mode by changing the touch controls)
  - key repeat, also for dpad, and (after simplifying the gamepad movement scheme) joysticks
  - cycling backwards with shift+tab would be nice when there are more than two snakes (particularly if there are way too many snakes), maybe shift shouldn't act as tab; could also use Q and E
  - for touch, could try a virtual joystick/dpad as an alternative to gliding anywhere on the screen
  - gamepad/touch support for level editor (currently requires keyboard/mouse)
  - would be fun/disappointing to try and play this on a kindle (see branch `kindle-attempt-2`)

- less important:
  - shouldn't show tile highlight when pressing 'Y' to redo; could setControlType or whatever
  - make black block behave identically with white in the editor, where you can't tell which is an entity and which is empty space (maybe even treat it as a 1bpp image, drawn with nearest neighbor interpolation)
  - handle edge case of toggling edit mode while dragging something
  - reign in `onUpdate` over-extension/repurposing/overuse, maybe adding an onResize in renderer or something
  - preload levels
  - would be nice to preview levels in the level select (prerequisite: preload levels)

