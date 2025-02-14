# Snakeshift Todo List

- bug: can select tutorial text just after loading a level, while the splash screen is still fading out
- handle escape key same as back button (maybe trigger a click; but take the best of both worlds)
- skip/merge extra undo steps for switching snakes
- readme image
- clarify which snake in a snake stack (snack) is selected, possibly with a minimalist popup bubble listing the overlapping snakes
- should probably disallow pushing stars on top of other stars with crates
- bug: ctrl+o isn't always loading a level, sometimes it just switches to edit mode for the current level
- bug: can't move after restarting level from level editor play test

## Mobile viewport issues
- the whole page can be scrolled if zoomed in; it can be unclear what's happening, and hard to zoom out since pinching on the canvas doesn't work
- on mobile, viewport has an unintended sort of animation when resizing the view (i.e. by rotating the device), and the viewport can end up cut off 

## Par system
- keep track of the fewest number of moves and best solution for each level
- show the number of moves in the level select
- define a par for each level
- store hash of the level content; if it differs, test the stored solution against the new level; if it works, keep it; if it doesn't, discard it
- maybe allow viewing your best solution
- stretch goal: submit solutions to a server for verification and compare with others

## Saving playthroughs
- limit to undos pertaining to the current level (using `levelId` which is now in the undo shape)
- make sure playthroughs can include the final (winning) state
- improve playthrough format
  - include inputs
    - possibly using `Move` type, but changing it to be more standalone? right now it includes entity references... maybe I want separate types for moves and move analyses

## Controls
- gamepad: use joystick directly instead of requiring a button press to move each tile (this should also do away with the highlight visual which is the only thing not black and white during gameplay)
  - although perhaps the current behavior should be left in as an option, but the tile highlight should be changed to a black and white arrow of some kind
- gamepad: key repeat
- keyboard: key repeat
- keyboard: cycling backwards with shift+tab would be nice when there are more than two snakes (particularly if there are way too many snakes), maybe shift shouldn't act as tab; could also use Q and E
- touch: could try a virtual joystick/dpad as an alternative to gliding anywhere on the screen
- touch: when tapping to switch snakes, search for closest snake within a radius of the tap
- gamepad/touch support for level editor (currently requires keyboard/mouse)
- would be fun/disappointing to try and play this on a kindle (see branch `kindle-attempt-2`)

## Level Editor
- clear shouldn't reset level size
- shouldn't place Grass or Wall (Both) on top of snakes
- auto-save and/or onbeforeunload
- bug: selection box from editor isn't cleared when switching levels or returning to menu, and even shows up during gameplay if you click
- should be easier to deselect (escape, ctrl+d, enter?)
  - undo should clear selection
- rotate/flip?
- prompt to clear entities outside level bounds when saving
- bug: outdated tile highlight after closing level info dialog can be confusing, with the old tile size implying the dimensions aren't changed
- handle edge case of toggling edit mode while dragging something
- restart button doesn't make sense in level editor; clear is the closest, could replace it, and move other action buttons in the level editor into the game options bar
- make black and white behave symmetrically, where you can't tell which is an entity and which is empty space
  - "erase" on black to add white
  - selection tool should be able to drag black onto white even if it's not formed from entities
  - maybe change it to store background tiles as a grid instead of walls being part of the list of entities

## Aesthetics:
- visuals:
  - there's a slight bug where Block is not always sorted to bottom, which I can see when dragging with the pointer control scheme, which animates the snake slightly beyond its cell, in the level Ferry
  - enlarge level border
  - 1x1 snake should change direction when moving
    - need to store heading in a different way, to work with a single segment
  - do something about weird four-eyed appearance when three snake heads are on top of each other and perpendicular (where the middle snake's eyes don't cover up the bottom snake's eyes); see level `four-eyes.json`
  - grass should have more natural edges
  - possibly obsolete feedback:
    - hard to see/understand snakes' shapes when overlapping
      - outline shouldn't intersect 
      - might help to change the style back to originally intended style (i.e. rounded corners, instead of boxy creases)
      - might help to add scales
      - probably need texture-based rendering to sort this out
      - oh, could prevent key repeat on switching snakes, and make it keep the highlight as long as the key is held
    - feels like you shouldn't be able to go on top of another snake's head, like you'd eat the snake
      - I have since made food more distinct from snake eyes by making them bigger, changing their shape to be pointy, and giving the snake two eyes; however, it could be explored for gameplay reasons (keeping head visible, etc.)
- animation:
  - when snake is encumbered by another snake (or crate): wriggle whole snake? so far I've implemented x eyes, but you can't always see the head
  - pushing crates (or snakes?) into a wall: push crash slightly through wall? or squash it? I think it shouldn't look too weird with the monochrome aesthetic masking the overlap in silhouette  
  - moving normally: animate snake along path
- audio:
  - sound effect for restart level
  - more appropriate undo/redo sfx
  - invalid move sfx
  - invert sfx (for both editor and gameplay)
  - clear sfx (for editor)

## Less important
- shouldn't show tile highlight when pressing 'Y' to redo; could setControlType or whatever
- reign in `onUpdate` over-extension/repurposing/overuse, maybe adding an onResize in renderer or something
- preload levels, and share cache between level select's level previews and level loading
- bug: undoing isn't hiding game win screen... right away, consistently? test might not catch this if it's a delay; not sure if it was a delay or it required hitting undo multiple times
- update tutorial text to recommend numpad 5 instead of numpad 2?
- configure eslint rules
- ensure accessible name for buttons when labels are hidden (include aria-label or hide label spans visually instead of using `display: none`)
  - tooltips would also be nice... including keyboard shortcut hints
- hide things properly instead of relying on z-index
  - simplify tests (remove `exact`)
  - fix aria-keyshortcuts semantics (the attribute shouldn't be present on things that won't activate, such as some hidden buttons)
  - fix flash of in-game controls before main menu is shown while page is loading
  - see `/* TODO: hide back button properly, for (in)accessibility */`


## Tests
- game playthrough test:
  - upgrade the playthrough format to include inputs instead of inferring them
  - ensure that it's finding some levels; don't want to find out that "whoops, it's not testing anything" for such an important test
- flakiness:
  - tests should be more in control of splash screens timing/hiding
    - maybe instead of `?fast-splash-screens`, have the tests dismiss the splash screens early with a keypress, like Esc, which could be a feature available to users as well
  - levels can take some time to load after the page title is set, apparently
- Node.js 23 breaks Playwright tests:
  - How does Playwright normally load typescript files, that the new Node.js built-in support is able to interfere with?
  - What am I supposed to do as a user?

## Puzzles
- see `game/public/levels/sketches` folder for some ideas
- lock levels are cheese-able; you can bridge the left and middle vertical lanes with the black snake; the intentionally cheese-able "security by obscurity" version can also be solved in two different ways, bridging it vertically (intended) or horizontally (in the same way as the prior level); I've got a more solid version in `proper-lock-v2` but want to consider if it makes the difference between the two levels too obvious, and maybe adjust the latter level as well (but it might be fine)

## Mechanics

These are just ideas, not necessarily planned features.

- slicing snakes
  - like the ghost peppers in [Ssspicy!](https://torcado.itch.io/ssspicy) but without awkward turn counter timing, it will slice your body into live and dead parts, and the dead parts will retain their shapes will be able to be pushed around like arbitrarily shaped crates
  - generalizes crates, so could do away with crates
  - cutting blade and cut button combo?
  - shown as a scythe perhaps, as a way to visually indicate a specific side of a tile that will be cut (and cut button as a skull and crossbones? or skull by itself? or skull in a hood? or crossed scythes / otherwise "contained" looking scythe(s)?)
- portals
  - entrance and exit of different sizes changing your snake's size, like in [PortalSnake](https://bcat112a.itch.io/portalsnake)
- snake color changer
  - shown as hourglass-like twist with particles of light/dark going in/out
  - changes segments one at a time as the snake moves through it
  - interaction with grass tiles could be interesting: you could enter the color changer with either color of snake, but come out with the same color
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
- two-headed snake
  - can move in both directions
  - would require two focus stops, one for each head
  - would probably look silly and not be worth it
- super-food pickup that makes you grow 3 or something, maybe indefinitely
  - appearance: star like normal food except with alternating black and white concentric scaled copies zooming like a fractal, possibly rotated for a spiral effect
    - implies it can be eaten by any snake, which is fine

