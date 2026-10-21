import { assetUrl, baseUrl } from "./paths";
import { APP_VERSION } from "./app-meta";

export function shell(icon: (name: string, cls?: string) => string) {
  return `
<div class="app-shell">
  <header class="app-header">
    <a class="brand" href="${baseUrl}" aria-label="Little Worlds home"><img src="${assetUrl("art/cartoon/brand.webp")}" alt=""><span>little<span class="brand-heavy">worlds</span><small>A HAPPY LITTLE TILE ADVENTURE</small></span></a>
    <div class="header-mode"><span class="live-dot"></span> MATCH · RELAX · SMILE</div>
    <nav class="header-actions" aria-label="App menu">
      <span class="free-label">Free forever ${icon("check")}</span>
      <span class="app-version" id="app-version" aria-label="Version ${APP_VERSION}" title="Version ${APP_VERSION}">${APP_VERSION}</span>
      <button class="icon-btn menu-toggle" id="menu-toggle" aria-label="Open menu" aria-haspopup="menu" aria-expanded="false" aria-controls="app-menu">${icon("menu")}</button>
      <div class="app-menu" id="app-menu" role="menu" aria-label="App actions" hidden>
        <button class="menu-item" id="refresh" role="menuitem" tabindex="-1">${icon("reset")}<span>Refresh</span></button>
        <button class="menu-item" id="share" role="menuitem" tabindex="-1">${icon("share")}<span>Share</span></button>
        <button class="menu-item" id="about" role="menuitem" tabindex="-1">${icon("about")}<span>About</span></button>
        <div class="menu-divider" role="separator"></div>
        <button class="menu-item" id="sound" role="menuitemcheckbox" aria-checked="true" tabindex="-1"><span class="menu-icon" id="sound-icon">${icon("sound")}</span><span>Sound</span><span class="menu-state" id="sound-state">On</span></button>
        <button class="menu-item" id="help" role="menuitem" tabindex="-1">${icon("help")}<span>How to play</span></button>
        <button class="menu-item" id="install" role="menuitem" tabindex="-1">${icon("download")}<span>Install</span></button>
      </div>
    </nav>
  </header>
  <main class="game-layout">
    <section class="game-card" aria-label="Tile matching game">
      <div class="garden-backdrop"></div>
      <div class="game-heading"><div><div class="eyebrow"><span id="level-number">LEVEL 01</span><span class="difficulty" id="difficulty">GENTLE</span></div><h1 id="level-title">Berry Meadow</h1><p class="level-subtitle" id="level-subtitle"></p></div><button class="chapter-button" id="levels" aria-label="Choose a level">${icon("grid")}<span>Your adventure</span></button></div>
      <div class="board-hud"><div class="score-label">${icon("star")}<span><small>SCORE</small><strong id="score">0</strong></span></div><div class="remaining"><span class="remaining-dot"></span><strong id="remaining">36</strong><span>tiles left</span></div></div>
      <div id="board" class="board" role="group" aria-label="2D layered tile board. Pick an uncovered tile to collect it."></div>
      <div class="board-caption">${icon("spark")} Match three · Small numbers show stacked tiles</div>
      <div class="collection"><div class="collection-heading"><span>THREE’S A MATCH!</span><span><b id="tray-count">0</b> / 7 spaces</span></div><div class="tray" id="tray" aria-label="Collection tray"></div><div class="tray-status" id="tray-status" role="status">Pick any uncovered tile. Three of a kind clear together.</div></div>
      <div class="tools"><button id="undo" class="tool-button">${icon("undo")}<span>Undo<small>Last move</small></span></button><button id="hint" class="tool-button">${icon("hint")}<span>Hint<small>A little help</small></span></button><button id="remix" class="tool-button">${icon("remix")}<span>Remix<small>Mix it up</small></span></button><span class="tool-divider"></span><button id="restart" class="restart-button" aria-label="Restart level">${icon("reset")}</button></div>
    </section>
    <aside class="journey-panel">
      <div class="world-card"><div class="world-art"></div><div class="world-content"><span class="world-label">WORLD 01</span><h2>Sunny<br>Orchard</h2><p>A fresh little adventure awaits.</p><button id="explore">Explore the gardens ${icon("arrow")}</button></div></div>
      <div class="chapter-progress"><div><span>Your adventure</span><strong id="completed">0 / 12</strong></div><div class="chapter-track"><i id="chapter-progress"></i></div><span id="star-total">0 stars collected</span></div>
      <div class="objective"><span class="eyebrow">TODAY’S LITTLE ESCAPE</span><div class="objective-title"><h3>One happy match at a time.</h3>${icon("spark")}</div><p>Pick, match, and make room for more. Clear the board to open your next garden.</p><div class="match-progress"><strong id="match-count">0</strong><span>matches made</span><span class="match-total" id="match-total">of 12</span></div><div class="palette" id="palette"></div></div>
      <div class="personal-best"><span>${icon("star")} YOUR BEST</span><strong id="best-score">A fresh beginning</strong></div>
      <div class="save-state" id="save-state">${icon("check")} Saved on your device</div><p class="free-note">No ads. No purchases. All the fun.</p>
    </aside>
  </main>
  <footer class="page-footer"><span>Little matches. Big smiles.</span><span>A happy little escape ${icon("spark")}</span></footer>
</div>
<aside class="update-notice" id="update-notice" aria-labelledby="update-heading" hidden>
  <span class="update-icon">${icon("download")}</span>
  <div class="update-copy" role="status"><strong id="update-heading">A fresh little update!</strong><span id="update-message">A newer version is ready. Refresh to update. Your progress stays saved.</span></div>
  <button class="update-refresh" id="update-refresh">Refresh now</button>
  <button class="update-later" id="update-later" aria-label="Remind me next time">Later</button>
</aside>
<div class="toast" id="toast" role="status"></div>
<div class="modal-backdrop hidden" id="modal"><section class="modal-card" role="dialog" aria-modal="true" aria-labelledby="modal-title"><button class="modal-close icon-btn" id="modal-close" aria-label="Close dialog">${icon("close")}</button><div id="modal-content"></div></section></div>
`;
}
