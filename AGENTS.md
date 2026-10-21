# App releases

- Keep the version visible next to the hamburger menu and in About. Read it from `release.json` through `src/app-meta.ts`; never duplicate a version string in UI code.
- Each completed app change must increment the final revision by one and use the current date in America/Edmonton: `YYYY.MM.DD.NN`. Keep the revision increasing across day changes. The first version using this scheme is `2026.10.20.03`.
- Run `npm run release` after finishing app edits and before the final build/publication. This hashes the app sources, updates the date/revision only when app inputs changed, and is idempotent for unchanged builds. Commit `release.json` with the change. The Pages workflow also runs this automatically and records a missing version bump.
- Keep `version.json` outside the offline cache. New releases must prompt before reloading the player's page and preserve the version 3 game save.
