# <img src="./game/public/yin-yang-larger-sneks-180px.png" height="60"> Snakeshift

A cross between Snake and Shift.

An inverse space puzzle game.

Shapeshift in makeshift ways. Shift snakes into lakes. Snake wakes into shapes.

Skin and fang. Yin and yang. Snakes shelter sneks like sheds, then shed kin like skin.

## Controls

### Mouse/Pen/Touch

Drag anywhere to move the snake in the direction of the drag.

Click on a snake to switch to it.

### Gamepad

Use the left stick to point in the direction you want to move, and then press A to move to the highlighted cell.
Or use the D-pad to move.

Shoulder buttons switch snakes.

Press ⓧ to undo, Ⓑ to redo.  
Press Ⓨ to restart the level.

You may need to press a button to activate the gamepad, before the web page can see it.

NOTE: The level editor currently requires a keyboard and mouse.

### Keyboard

You can use the arrow keys, WASD, HJKL, or the number pad to move.

<kbd>Tab</kbd> switches between snakes.

Press <kbd>Z</kbd> to undo, <kbd>Y</kbd> to redo.

Press <kbd>R</kbd> to restart the level. This is undoable.

Press <kbd>`</kbd> to toggle the level editor.

Press <kbd>Ctrl+S</kbd> to save the level, and <kbd>Ctrl+O</kbd> to open a level.

## Project Structure

This project uses [Vite](https://vitejs.dev/) and [TypeScript](https://www.typescriptlang.org/).

- `/game/` — the source code.
- `/dist/` — the built files, which could be deployed to a static web server.
- Files in `/public/` will be copied to the `/dist/` directory when building. These are referenced as absolute paths, without the `/public` prefix, since they're copied to the root of the `/dist/` directory.
- `/tsconfig.json` — Typescript settings.
- `/eslintrc.cjs` — ESLint settings.
- `/package.json` — dependencies and scripts.
  - `/package-lock.json` — generated file, used for reproducible builds.
- `/cspell.json` — spell check settings and dictionary.

## Development

Install dependencies and run the dev server:

```sh
npm install
npm run dev
```

### Quality Control

This command runs the spell checker, the typescript compiler, and eslint:

```sh
npm run lint
```

There are also tests written using Playwright:

```sh
npm run test
```

### File Format Versioning

When the file format changes, increment `FORMAT_VERSION` and add an upgrade step for backwards compatibility in `game-state.ts`.

To update all levels to the new format, run:

```sh
node update-level-format.js
```

### Deployment

To build for production and push to GitHub Pages:
```sh
npm run deploy
```

### Ideas and TODOs

See [TODO.md](./TODO.md).

## License

This project is licensed under the MIT License. See the [LICENSE.txt](./LICENSE.txt) file for details.

