# Snakeshift

A cross between Snake and Shift.

An inverse space puzzle game.

## Controls

### Mouse/Pen/Touch

Click on a cell to move to it.

### Gamepad

Use the left stick to point in the direction you want to move, and then press A to move to the highlighted cell.
Or use the D-pad to move.

You may need to press a button to activate the gamepad, before the web page can see it.

### Keyboard

Use the arrow keys or WASD to move.

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
