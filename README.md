# Little Worlds — Happy Tile Gardens

A free, installable 2D cartoon tile matching game built with Vite, TypeScript, native HTML buttons, and CSS animation. No ads, accounts, analytics, purchases, subscriptions, paid boosts, or gameplay servers.

**Play:** https://androidbill.github.io/little-worlds/

## Hosting and saves

The game is hosted as a static website on GitHub Pages. It does not use Firebase, a database, an API key, or a backend. Saves stay in local browser storage; they do not sync between devices, browsers, or website addresses. Your localhost save and the published site's save are separate.

The included GitHub Actions workflow publishes changes pushed to `main`. Pages must use **GitHub Actions** as its build source. The workflow sets `BASE_PATH` from the Pages configuration so artwork, icons, navigation, and the offline service worker use the correct repository directory. No deployment secrets are required. Local builds default to `/`; when building manually for a subdirectory, set `BASE_PATH` to that directory including its leading and trailing slashes (for example `/little-worlds/`).

## Play locally

Use Node.js 24 or later:

```sh
npm install
npm run dev
```

For the installable offline build:

```sh
npm run build
npm run preview
```

Open http://127.0.0.1:43871. Visit once online to download the game and artwork; the service worker then supports offline reloads. Installation is available in supporting browsers. Safari on iPhone/iPad uses Share → Add to Home Screen. For hosting on another device, serve `dist/` over HTTPS. Localhost is also a secure context. Opening `index.html` directly from disk does not run a PWA.

## The game

- Twelve distinct overlapping 2D layouts, from 36 to 108 tiles, with eight original cartoon symbols: strawberry, cherries, lemon, grapes, watermelon, orange, butterfly, and blossom.
- Pick any tile with no tile resting above it. Three of the same symbol clear automatically.
- Clear all tiles to win. Filling seven tray spaces without a triple pauses the game with recovery options.
- Every starting board and remix has a generated winning path. Random choices can still fill the tray.
- Undo restores the entire last move, including a cleared triple, score, and tile positions.
- Hint highlights a matching opportunity. Remix returns unmatched tray tiles to the board and creates a solvable arrangement of all remaining tiles.
- Help is unlimited and free. Completion earns three stars without a remix, two with 1–3 remixes, and one with 4 or more. Hints and undo do not cost stars.
- Progress, current board, tray, undo history, unlocks, best scores, sound, and motion preferences save on this browser and device. Clearing site data deletes local progress. There is no cloud sync.

Tap or click an uncovered tile to pick it. The flat board fits the available screen and shows covered tiles in a darker shade. Keyboard users can Tab through available tiles and press Enter/Space to pick; Ctrl/Cmd+Z undoes. Sound uses original synthesized tones and can be muted. Reduced motion is respected and can be changed in Help.

## Original cartoon art

ChatGPT Images created a new set of eight cartoon icons with transparent backgrounds, a sunny orchard environment, and a matching app identity specifically for this version. Full-resolution originals are `assets/originals/cartoon-*.png`; optimized runtime images are in `public/art/cartoon/`. `npm run assets` rebuilds the tile portraits, WebP scenery, and correctly sized install icons while preserving transparency. The exact prompts are recorded in `assets/CARTOON-PROMPTS.md`.

The board in `src/board.ts` uses flat HTML tiles, clear overlap ordering, touch/keyboard input, collection animations, and confetti. It has no 3D engine, camera, perspective, canvas, or graphics-card requirement. Tiletopia inspired the broad matching concept; no Tiletopia art was copied. See `ASSETS.md` for the asset inventory. Outfit is an open font distributed under the SIL Open Font License and bundled for offline use.

## Validation

```sh
npm test
npm run build
```

The eight automated tests cover complete solutions for all 12 levels over 20 seeds each, tile overlap and cover rules, atomic undo, triples at tray capacity, failure recovery, save/resume, remix conservation, repeatability, and invalid save rejection. Browser checks cover direct tile clicks, matching, undo, level completion, save/resume, responsive layouts, and production offline loading. See `VERIFICATION.md`.

The 2D version retains the validated version 3 save and preserves progress earned in the earlier version. This release includes the tile game and level journey; a separate world-building merge game is not part of this build.
