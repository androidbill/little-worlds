# Original cartoon asset inventory

All current illustrations were created specifically for this game with ChatGPT Images using the built-in image generation tool. Tiletopia artwork, screenshots, audio, and characters were not copied. Exact prompts are in `assets/CARTOON-PROMPTS.md`.

| Asset                       | Original                                  | Runtime use                                                                            |
| --------------------------- | ----------------------------------------- | -------------------------------------------------------------------------------------- |
| Eight cartoon icons         | `assets/originals/cartoon-tile-atlas.png` | `public/art/cartoon/tiles/*.webp`, used on the board, in the tray, palette, and help   |
| Sunny orchard scenery       | `assets/originals/cartoon-orchard.png`    | `public/art/cartoon/orchard.webp`, used in the game and adventure card                 |
| Cartoon fruit tile identity | `assets/originals/cartoon-app-icon.png`   | 192px/512px install icons, 180px Apple touch icon, and `public/art/cartoon/brand.webp` |
| Flat layered board          | `src/board.ts` and `src/game.css`         | Original HTML/CSS tile design, overlapping layers, hints, and collection animations    |
| UI symbols                  | `src/main.ts`                             | Original simple SVG paths                                                              |
| Sound                       | `src/main.ts`                             | Original Web Audio synthesized tones; no external samples                              |

The eight tile symbols are strawberry, cherries, lemon, grapes, watermelon, orange, butterfly, and blossom. Asset preparation extracts each cell and resizes it while preserving its generated alpha channel; no background is painted onto the icons. Earlier jewel-themed source images remain archived under `assets/originals/` and are not used by this version.

Outfit, Vite, Workbox, and development libraries are third-party open-source dependencies with their own licenses. They are not claimed as original artwork. Runtime fonts and game images are served locally and cached for offline play.
