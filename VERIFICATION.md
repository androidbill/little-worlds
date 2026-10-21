# Cartoon 2D version — verified October 20, 2026

The TypeScript/Vite production build passes. The application bundle is approximately 26.8 kB before compression. Workbox precaches 29 game, cartoon artwork, icon, and font resources totaling approximately 1.05 MiB. The runtime contains no Three.js, WebGL, camera, or canvas renderer.

## Automated gameplay checks

All eight automated tests pass, including 240 complete board solutions: twelve layouts over twenty seeds each. Additional cases cover blocked selections, same-layer tile spacing, atomic undo after clearing a triple, a match made in the seventh tray slot, loss and recovery, exact serialization/resume, deterministic boards, and solvable remix after arbitrary choices.

## Browser checks for the 2D rebuild

Checked in the desktop app’s Chromium browser at desktop and 390 × 844 phone layouts:

- Actual flat HTML tile buttons with original transparent cartoon art, correct overlap order, and shaded covered tiles.
- Clicking three matching oranges clears the tray and updates the score.
- Undo restores the previous two tray tiles, score, and third tile on the board.
- Reload with a partly filled tray preserves the exact board and current progress.
- A complete 36-tile garden clears through native tile clicks and hints, shows victory, and unlocks the next 48-tile garden.
- The prior version’s completed-garden progress carries into the cartoon version on the existing game origin.

## Offline check

Loaded a separate production preview at `http://127.0.0.1:43872`, then stopped that server. A direct request confirmed the server was unavailable. The browser reloaded the new 2D game from its service-worker cache, displayed the cartoon artwork and bundled fonts, accepted a tile click, updated the tray and score, and saved progress. The verification tab was separate from the user’s game at port 43871.

The user-facing game remains at `http://127.0.0.1:43871`. Physical iOS/Android installation has not been tested. Hosting on another device requires HTTPS; localhost supports desktop preview and installation. Saves remain local to each origin and device.
