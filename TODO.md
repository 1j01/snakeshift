# Snakeshift Todo List

- prevent losing level progress when hitting tilde (currently toggles level edit mode, but it's too close to Tab key)
- URL routing (see `// TODO: proper routing` in level-select.ts)
- skip/merge extra undo steps for switching snakes
- readme image
- clarify which snake in a snake stack (snack) is selected, possibly with a minimalist popup bubble listing the overlapping snakes
- should probably disallow pushing stars on top of other stars with crates
- bug: ctrl+o isn't always loading a level, sometimes it just switches to edit mode for the current level
- bug: got a "Level Complete" splash screen when dragging a level file onto the page while in the first level
- bug: drag and drop isn't clearing undo history IN SOME UNREPRODUCIBLE CASE? I've tried twice to add tests, see stashes, for some bug but no reproduction yet
- avoid `alert`/`confirm` dialogs as they cause mobile Chrome at least to exit full screen (and they're not thematic)
  - might run into async trouble with file saving though. ugh.
- ensure final state of a level is shown before the level complete screen, for satisfaction (right now it can lag before the level complete screen shows up on slow devices, making this worse)
- hitting "back" from replay should return to level select screen, not main menu, when navigated from level select screen
- bug: replays are being saved with only one step (an empty `deltas` array)
  - see test: "should save a playthrough file from play mode after winning and undoing winning a level"

## Par system
- show the number of moves in the level select
- define a par for each level
- store hash of the level content; if it differs, test the stored solution against the new level; if it works, keep it; if it doesn't, discard it
- stretch goal: submit solutions to a server for verification and compare with others

## Saving playthroughs
- make sure playthroughs can include the final (winning) state
- improve playthrough format
  - include inputs
    - possibly using `Move` type, but changing it to be more standalone? right now it includes entity references... maybe I want separate types for moves and move analyses

## Controls
- gamepad: use joystick directly instead of requiring a button press to move each tile (this should also do away with the highlight visual which is the only thing not black and white during gameplay)
  - although perhaps the current behavior should be left in as an option, but the tile highlight should be changed to a black and white arrow of some kind
- gamepad: configurable deadzone
- gamepad: sticky directionality (threshold to move from one direction to another)
- keyboard: key repeat
- keyboard: cycling backwards with shift+tab would be nice when there are more than two snakes (particularly if there are way too many snakes), maybe shift shouldn't act as tab; could also use Q and E
- touch: could try a virtual joystick/dpad as an alternative to gliding anywhere on the screen
- gamepad/touch support for level editor (currently requires keyboard/mouse)
- would be fun/disappointing to try and play this on a kindle (see branch `kindle-attempt-2`)

## Level Editor
- shouldn't place Grass or Wall (Both) on top of snakes (Grass could go under, but Wall (Both) should not be allowed (or should erase the snake segment))
- auto-save and/or onbeforeunload
- bug: selection box from editor isn't cleared when switching levels or returning to menu, and even shows up during gameplay if you click
- should be easier to deselect (escape, ctrl+d, enter?)
  - undo should clear selection
- bug: deleting entities with right click (eraser shortcut) is possible inside the selection, but entities reappear when dragging the selection
  - could disallow erasing entities inside the selection
  - could disable the eraser shortcut entirely while there's a selection
  - could meld the selection when erasing entities
  - could make it properly delete entities within the selection, but that seems unconventional and wouldn't be handled by the undo system
- bug: when playtesting a level and then returning to edit mode, the selection remains but the entities appear deselected; when dragging the selection the entities are duplicated (deserialization creates new entities when returning to edit mode; the old references are invalid)
- rotate/flip?
- bug: outdated tile highlight after closing level info dialog can be confusing, with the old tile size implying the dimensions aren't changed
- handle edge case of toggling edit mode while dragging something
- could try moving action buttons in the level editor into the game options bar (or a third bar??); clear button could replace the restart button since they're semantically similar
- make black and white behave symmetrically, where you can't tell which is an entity and which is empty space
  - "erase" on black to add white
  - selection tool should be able to drag black onto white even if it's not formed from entities
  - maybe change it to store background tiles as a grid instead of walls being part of the list of entities

## Aesthetics:
- visuals:
  - level stuck hint can be hard to read, especially on narrow level Corkscrew (it can overlap black/white level details and it currently is wrapped within the level border)
  - there's a slight bug where Block is not always sorted to bottom, which I can see when dragging with the pointer control scheme, which animates the snake slightly beyond its cell, in the level Ferry (this might just be the specific level isn't sorted because sorting logic wasn't in place when it was created; but I could add a `sortEntities` call when loading the level)
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
      - maybe inset border dynamically based on how many snakes are on top?
        - this implies a snake's border changes based on other snakes moving on/off, which is a bit weird
        - per segment or per snake?
    - feels like you shouldn't be able to go on top of another snake's head, like you'd eat the snake
      - I have since made food more distinct from snake eyes by making them bigger, changing their shape to be pointy, and giving the snake two eyes; however, it could be explored for gameplay reasons (keeping head visible, etc.)
- loading progress could be shown with a snake, eating stars :)
  - can use `previewMovement` to give finer resolution than the grid
- animation:
  - bug: 1x1 snake's eyes move outside the head when moving left/right
  - when using pointer controls, movement preview conflicts slightly with the animation; it should add the effects together, ideally, but right now the movement preview cancels out the movement animation; it's super subtle, you can just see a frame of jitter sometimes
  - animate undo/redo (implies timeline abstraction, moving animation state outside of entities)
  - animate pushing crates
    - valid move: slide (synced with snake movement)
    - invalid move: push crate slightly through wall? or squash it? I think it shouldn't look too weird with the monochrome aesthetic masking the overlap in silhouette
  - animate birth/death for cellular automata
  - when snake is encumbered by another snake (or crate): wriggle whole snake? so far I've implemented x eyes, but you can't always see the head
- audio:
  - sound effect for restart level
  - more appropriate undo/redo sfx
  - invalid move sfx
  - invert sfx (for both editor and gameplay)
  - clear sfx (for editor)
- haptics:
  - echo the gong sound with a haptic pulse!? seems weird to do a long vibration for a "good" event, but I wonder what it would feel like

## Less important
- shouldn't show tile highlight when pressing 'Y' to redo; could setControlType or whatever
- reign in `onUpdate` over-extension/repurposing/overuse, maybe adding an onResize in renderer or something
- bug: undoing isn't hiding game win screen... right away, consistently? test might not catch this if it's a delay; not sure if it was a delay or it required hitting undo multiple times
- configure eslint rules
- ensure accessible name for buttons when labels are hidden (include aria-label or hide label spans visually instead of using `display: none`)
  - tooltips would also be nice... including keyboard shortcut hints
- hide things properly instead of relying on z-index
  - simplify tests (remove `exact`)
  - fix aria-keyshortcuts semantics (the attribute shouldn't be present on things that won't activate, such as some hidden buttons)
  - see `/* TODO: hide back button properly, for (in)accessibility */`
- move `guessDefaultActivePlayer()` into `storeBaseLevelState`?
- could show a hint when there's no goal in a custom level ("Level has no goal." or "Level is unwinnable.")
- add save/open buttons in replay mode, for saving/loading replays... and make ctrl+s save the replay? idk, you COULD want to export a single state... this is very low priority
- I observed it not counting a level as won when eating the last food, after completing the level and undoing back to it...  
  oh I think it has to do with it moving to the next level being "Test Level With No Goal"  
  I think the `levelHasGoal` state is not being reset properly when undoing across level boundaries, but that's not important to the game  
  It probably can't come up in the campaign or even using the level editor and creating a level with no goal; only when visiting `?show-test-levels` where there's a level in a pseudo campaign that has no goal does it come into play.  


## Tests
- keyboard focus navigation with arrow keys (navigating to offscreen elements isn't working)
- HTML validation
- DOM structure / accessibility validation
- add tests for replay viewer:
	- toggling edit mode (what should that do?)
	- arrow keys to navigate steps (currently relies on slider focus and native arrow key handling)
	- undo/redo buttons to navigate steps (should update slider)
- move unsaved changes prompt tests to level editor spec?
- simplify game playthrough test by upgrading the playthrough format to include inputs instead of inferring them
- Node.js 23 breaks Playwright tests:
  - How does Playwright normally load typescript files, that the new Node.js built-in support is able to interfere with?
  - What am I supposed to do as a user?

## Puzzles
- Ferry level is too hard for a beginning puzzle; I liked having it follow Bridge but it should probably be later. Also, it probably doesn't need to have the goal at the end be a bunch of food that you have to be careful not to get stuck while eating. Could resize the level for balance.
- The Three Pagodas is probably easier than Corkscrew.
- convey that snakes get longer when they eat (I tried to do this with the Switching Snakes level, but it's not clear enough; it's not the focus of the level, and it's only the next level where it matters)
- Fill The Box level is basically just two similar levels in one (someone even said "I just messed up, didn't I?" after completing half of the level)
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
  - I implemented a proof of concept, see level `fused-snakes.json`
  - does more than two heads make any mechanical sense?
  - some details:
    - need to draw the fused snake's tails differently
    - need to allow it to move snakes into the space that the head of the fused snake leaves within the move (it has logic for the tail of the snake, but not the head of a conjoined snake which should act like the tail in a given move)
    - in the editor I've made it easy to create snakes joined backwards, and hard to join them correctly (you have to move them after creating and fusing them)
    - there's no way to unfuse snakes in the editor
    - existing snakes can't be fused in the editor, only new ones
    - it shows an invalid overlap/collision warning indicator where the snakes are fused
    - for more than two fused snakes to work, I need more logic for movement to avoid the snakes overlapping or colliding with the environment
    - should probably disallow fusing snakes of different colors
- super-food pickup that makes you grow 3 or something, maybe indefinitely
  - appearance: star like normal food except with alternating black and white concentric scaled copies zooming like a fractal, possibly rotated for a spiral effect
    - implies it can be eaten by any snake, which is fine
- cellular automata
  - entity that spreads to adjacent cells each turn
    - what if it duplicates food within it as it spreads?
    - can easily do puzzle where you have to block the spread quickly
      - par may be less meaningful for these sorts of levels since they may enforce completing the level in a few moves
  - could get totally crazy with different rulesets
- meme-themed sequel
  - Snekshift: Year of the Doge expansion pack edition DLC: Electric Boogaloo
  - gravity, inspired by [Growmi](https://carlospedroso.itch.io/growmi) and [Coil](https://www.nitrome.com/html5-games/coil/) (other examples: [Snakebird](https://store.steampowered.com/app/357300/Snakebird/), [Ooze Odyssey](https://poki.com/en/g/ooze-odyssey))
  - longcat/catnarok can extend upwards and retract
  - weiner dog can extend sideways and retract (inspired by but probably not like [Silly Sausage](https://www.nitrome.com/html5-games/sillysausage/))
  - nyan cat can fly, plays music while selected
  - dr. octagonapus can destroy walls
  - troll physicist, with magnets, portal gun, etc.
  - i can haz cheezburger for collectibles
  - rickroll teleporter???
  - levels with special effects, e.g.
    - item "bone hurting juice", and item "juice that makes you drink the other juice in the level" which makes you pathfind to the other juice
    - pattern replacement, indicated by https://knowyourmeme.com/memes/drakeposting/
  - can obviously include random memes for flavor
    - taunt player with https://knowyourmeme.com/memes/huh-cat or https://knowyourmeme.com/memes/polite-cat or https://knowyourmeme.com/memes/ok-smart-guy-lets-see-you-take-a-crack-at-it or https://knowyourmeme.com/memes/spongebob-reading-two-pages-at-once
    - MLG hype every time you win a level ("MOM GET THE CAMERA" etc.) with doritos and mountain dew flying everywhere, and "congratulations, you've won!" advertisement "remix" at the end of the game (Note: I've implemented this in a separate project, which I believe was called "find-it-remix")
