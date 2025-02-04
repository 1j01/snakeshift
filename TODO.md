# Snakeshift Todo List

- hard to see/understand snakes' shapes when overlapping
  - outline shouldn't intersect 
  - might help to change the style back to originally intended style (i.e. rounded corners, instead of boxy creases)
  - might help to add scales
  - probably need texture-based rendering to sort this out
  - oh, could prevent key repeat on switching snakes, and make it keep the highlight as long as the key is held
- feels like you shouldn't be able to go on top of another snake's head, like you'd eat the snake
  - I have since made collectables more distinct from snake eyes by making them bigger, changing their shape to be pointy, and giving the snake two eyes; however, it could be explored for gameplay reasons (keeping head visible, etc.)

- detect immobile state and show a message about restarting/undoing
- handle escape key same as back button (maybe trigger a click; but take the best of both worlds)
- skip/merge extra undo steps for switching snakes
- readme image
- weird four-eyed appearance when three snake heads are on top of each other and perpendicular (where the middle snake's eyes don't cover up the bottom snake's eyes); see level `four-eyes.json`
- clarify which snake in a snake stack (snack) is selected, possibly with a minimalist popup bubble listing the overlapping snakes

- par system:
  - keep track of the fewest number of moves and best solution for each level
  - show the number of moves in the level select
  - define a par for each level
  - maybe allow viewing your best solution
  - stretch goal: submit solutions to a server for verification and compare with others

- saving playthroughs:
  - limit to undos pertaining to the current level (using `levelId` which is now in the undo shape)
  - make sure playthroughs can include the final (winning) state
  - improve playthrough format
    - include inputs
      - use Move, but include the Snake's id in the Move structure

- controls:
  - gamepad: use joystick directly instead of requiring a button press to move each tile (this should also do away with the highlight visual which is the only thing not black and white during gameplay)
  - gamepad: key repeat
  - keyboard: key repeat
  - keyboard: cycling backwards with shift+tab would be nice when there are more than two snakes (particularly if there are way too many snakes), maybe shift shouldn't act as tab; could also use Q and E
  - touch: moving finger in the direction of an invalid move shouldn't make it harder to move in a different direction; right now it doesn't reset the reference point for an invalid move, so you have to move vertically more than you've moved horizontally to trigger a vertical move if the horizontal movement was invalid
  - touch: could try a virtual joystick/dpad as an alternative to gliding anywhere on the screen
  - gamepad/touch support for level editor (currently requires keyboard/mouse)
  - would be fun/disappointing to try and play this on a kindle (see branch `kindle-attempt-2`)

level editor:
  - auto-save and/or onbeforeunload
  - bug: selection box from editor isn't cleared when switching levels or returning to menu, and even shows up during gameplay if you click
  - should be easier to deselect (escape, ctrl+d, enter?)
  - rotate/flip?
  - prompt to clear entities outside level bounds when saving

- less important:
  - more appropriate undo/redo sfx
  - shouldn't show tile highlight when pressing 'Y' to redo; could setControlType or whatever
  - make black block behave identically with white in the editor, where you can't tell which is an entity and which is empty space (maybe even treat it as a 1bpp image, drawn with nearest neighbor interpolation)
    - "erase" on black to add white
    - selection tool should be able to drag black onto white even if it's not formed from entities
  - handle edge case of toggling edit mode while dragging something
  - reign in `onUpdate` over-extension/repurposing/overuse, maybe adding an onResize in renderer or something
  - preload levels
  - would be nice to preview levels in the level select (prerequisite: preload levels in a caching way)
  - enlarge level border

puzzles:
- see `game/public/levels/sketches` folder for some ideas
- lock levels are cheese-able; you can bridge the left and middle vertical lanes with the black snake; the intentionally cheese-able "security by obscurity" version can also be solved in two different ways, bridging it vertically (intended) or horizontally (in the same way as the prior level); I've got a more solid version in `proper-lock-v2` but want to consider if it makes the difference between the two levels too obvious, and maybe adjust the latter level as well (but it might be fine)

mechanics:
- a wall tile that is impassable to snakes of either color (checkered?)
- a ground/floor tile that allows either color of snake to pass through (grass pattern?)
- crates
  - could be fun if collectables on top of crates are pushed along with the crate
- slicing snakes
  - like the ghost peppers in [Ssspicy!](https://torcado.itch.io/ssspicy) but without awkward turn counter timing, it will slice your body into live and dead parts, and the dead parts will retain their shapes will be able to be pushed around like arbitrarily shaped crates
  - generalizes crates, so could do away with crates
  - cutting blade and cut button combo?
  - shown as a scythe perhaps, as a way to visually indicate a specific side of a tile that will be cut (and cut button as a skull and crossbones? or skull by itself? or skull in a hood? or crossed scythes / otherwise "contained" looking scythe(s)?)
- portals
  - entrance and exit of different sizes changing your snake's size, like in [PortalSnake](https://bcat112a.itch.io/portalsnake)
- snake color changer
  - shown as hourglass-like twist with particles of light/dark going in/out
- generalization of color changer and portals
  - shown as conic (hourglass-like when 1 cell) twist with black/white braided wormhole leading to other portal (which can be the same cell) and which can be the same or a different color and the same or a different size and the same or a different orientation
  - what if it could act as the slicer too, with razor-sharp sections of the wormhole aligned to grid edges? you would go through the wormhole with a snake to slice a snake crossing the wormhole blades
- striped snakes
  - only makes sense if there is neutral ground; otherwise the snake wouldn't be able to move
  - needs extra game logic
  - needs extra rendering logic
  - if you can move onto black/white ground partially (i.e. just the snake's head, assuming every segment alternates color), then
- neutral-colored snake
  - diamondback pattern?
  - can move anywhere!? and let snakes pass through any barriers!? like a dang ghost

animation:
- turning into a wall: move the snake forwards slightly along the snake's body path and into the wall
- moving backwards into a wall: squash? first idea was alternate left/right
- when snake is encumbered by another snake (or crate): wriggle + x eyes?
- pushing crates (or snakes?) into a wall: push crash slightly through wall? or squash it? I think it shouldn't look too weird with the monochrome aesthetic masking the overlap in silhouette  
- moving normally: animate snake along path

