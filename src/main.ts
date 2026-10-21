import "@fontsource/outfit/400.css";
import "@fontsource/outfit/500.css";
import "@fontsource/outfit/600.css";
import "@fontsource/outfit/700.css";
import "./game.css";
import { shell } from "./shell";
import { Board } from "./board";
import { assetUrl } from "./paths";
import { APP_NAME, APP_VERSION, SHARE_URL } from "./app-meta";
import { setupMenu } from "./menu";
import { setupUpdates } from "./updates";
import {
  Game,
  createState,
  LEVELS,
  TILE_NAMES,
  TILE_FILES,
  TILE_COLORS,
  validState,
} from "./game";
import type { State } from "./game";

const paths: Record<string, string> = {
  spark: "m12 3 2.7 6.3L21 12l-6.3 2.7L12 21l-2.7-6.3L3 12l6.3-2.7Z",
  sound: "m11 5-6 4H2v6h3l6 4z M15 8a6 6 0 0 1 0 8 M18 5a10 10 0 0 1 0 14",
  mute: "m11 5-6 4H2v6h3l6 4z M17 9l5 6m0-6-5 6",
  help: "M9.1 8a3 3 0 0 1 5.8 1c0 2-3 2-3 4m0 4h.01 M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0",
  undo: "M9 4 4 9l5 5 M4 9h10a6 6 0 0 1 0 12h-3",
  remix: "m18 3 3 3-3 3 M3 18l5-5m6-2 7-5H17 M18 15l3 3-3 3 M3 6l5 5 6 7h7",
  hint: "M9 19h6m-5 3h4 M9 16c0-3-4-4-4-8a7 7 0 0 1 14 0c0 4-4 5-4 8Z",
  reset: "M3 10a9 9 0 1 1 1 7 M3 3v7h7",
  rotate: "m7 7-4 4 4 4 M3 11h10 M17 17l4-4-4-4 M21 13H11",
  plus: "M12 5v14 M5 12h14",
  minus: "M5 12h14",
  grid: "M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z",
  arrow: "M5 12h14m-6-6 6 6-6 6",
  close: "m6 6 12 12 M18 6 6 18",
  check: "m5 12 4 4L19 6",
  lock: "M6 10h12v11H6z M8 10V6a4 4 0 0 1 8 0v4",
  download: "M12 3v12m-5-5 5 5 5-5 M4 16v5h16v-5",
  star: "m12 2 3 6.1 6.7 1-4.9 4.8 1.2 6.7-6-3.2-6 3.2 1.2-6.7-4.9-4.8 6.7-1Z",
  menu: "M4 6h16 M4 12h16 M4 18h16",
  about: "M12 11v6m0-10h.01 M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0",
  share:
    "M18 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z M6 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z M18 22a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z M8.6 10.5l6.8-4 M8.6 13.5l6.8 4",
};
const icon = (name: string, cls = "") =>
  `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[name] || paths.spark}"/></svg>`;
const portrait = (kind: number) =>
  `<img class="jewel-portrait" src="${assetUrl(`art/cartoon/tiles/${TILE_FILES[kind]}.webp`)}" alt="${TILE_NAMES[kind]}" draggable="false">`;
type Saved = {
  version: 3;
  state: State;
  history: State[];
  unlocked: number;
  best: Record<number, { score: number; stars: number }>;
  sound: boolean;
  motion: boolean;
};
const STORAGE = "little-worlds:v3";
let saved: Saved | null = null;
try {
  const raw = JSON.parse(localStorage.getItem(STORAGE) || "null");
  if (raw?.version === 3 && validState(raw.state)) {
    saved = {
      ...raw,
      history: Array.isArray(raw.history) ? raw.history : [],
      unlocked: Number.isInteger(raw.unlocked) ? raw.unlocked : 1,
      best: Object.fromEntries(
        Object.entries(raw.best ?? {}).filter(([key, value]) => {
          const item = value as { score: number; stars: number };
          return (
            Number(key) >= 1 &&
            Number(key) <= 12 &&
            item &&
            Number.isFinite(item.score) &&
            Number.isInteger(item.stars) &&
            item.stars >= 1 &&
            item.stars <= 3
          );
        }),
      ),
      sound: typeof raw.sound === "boolean" ? raw.sound : true,
      motion:
        typeof raw.motion === "boolean"
          ? raw.motion
          : !matchMedia("(prefers-reduced-motion: reduce)").matches,
    };
  }
} catch {
  /* A damaged save starts a new puzzle. */
}
let game = new Game(saved?.state ?? createState(), saved?.history ?? []);
let unlocked = Math.max(1, Math.min(12, saved?.unlocked || 1)),
  best: Saved["best"] = saved?.best || {},
  sound = saved?.sound ?? true,
  motion =
    saved?.motion ?? !matchMedia("(prefers-reduced-motion: reduce)").matches;
let board: Board,
  saveTimer = 0,
  savePending = false,
  toastTimer = 0,
  audio: AudioContext | undefined,
  installPrompt: any,
  lastFocus: HTMLElement | null = null;

document.querySelector("#app")!.innerHTML = shell(icon);
const $ = <T extends HTMLElement = HTMLElement>(selector: string) =>
  document.querySelector<T>(selector)!;
const appMenu = setupMenu();
let refreshing = false;
let availableVersion = "";
let dismissedVersion = "";
function notify(message: string) {
  $("#toast").textContent = message;
  $("#toast").classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(
    () => $("#toast").classList.remove("visible"),
    2600,
  );
}
function persist() {
  clearTimeout(saveTimer);
  try {
    localStorage.setItem(
      STORAGE,
      JSON.stringify({
        version: 3,
        state: game.state,
        history: game.history,
        unlocked,
        best,
        sound,
        motion,
      } satisfies Saved),
    );
    savePending = false;
    $("#save-state").innerHTML =
      icon("check") +
      (navigator.onLine
        ? " Saved on your device"
        : " Offline · progress saved");
  } catch {
    $("#save-state").textContent = "Device storage unavailable";
    notify("Your browser is preventing progress from being saved.");
  }
}
function scheduleSave() {
  savePending = true;
  clearTimeout(saveTimer);
  // Serialize the undo history once tapping pauses, outside the input handler.
  saveTimer = window.setTimeout(persist, 180);
}
function tone(kind: "pick" | "match" | "win" | "tap", tile = 0) {
  if (!sound) return;
  try {
    audio ??= new AudioContext();
    void audio.resume();
    const frequencies =
      kind === "win"
        ? [523.25, 659.25, 783.99, 1046.5]
        : kind === "match"
          ? [523.25, 659.25, 783.99]
          : [
              kind === "pick"
                ? [392, 440, 493.88, 523.25, 587.33, 659.25, 698.46, 783.99][
                    tile
                  ]
                : 330,
            ];
    frequencies.forEach((f, i) => {
      const oscillator = audio!.createOscillator(),
        gain = audio!.createGain(),
        at = audio!.currentTime + i * 0.065;
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(f, at);
      gain.gain.setValueAtTime(0, at);
      gain.gain.linearRampToValueAtTime(
        kind === "pick" ? 0.055 : 0.035,
        at + 0.008,
      );
      gain.gain.exponentialRampToValueAtTime(0.001, at + 0.38);
      oscillator.connect(gain);
      gain.connect(audio!.destination);
      oscillator.start(at);
      oscillator.stop(at + 0.4);
    });
  } catch {
    /* Audio is optional on devices without a sound output. */
  }
}
function starsFor(s: State) {
  return s.assists === 0 ? 3 : s.assists < 4 ? 2 : 1;
}
function recordWin() {
  if (game.state.status !== "won") return;
  unlocked = Math.max(unlocked, Math.min(12, game.state.level + 1));
  const record = best[game.state.level];
  best[game.state.level] = {
    score: Math.max(record?.score || 0, game.state.score),
    stars: Math.max(record?.stars || 0, starsFor(game.state)),
  };
}
function stars(n: number) {
  return `<div class="stars">${[0, 1, 2].map((i) => icon("star", i < n ? "earned" : "")).join("")}</div>`;
}
function renderTray() {
  const ids = game.state.tray;
  $("#tray").innerHTML = Array.from({ length: 7 }, (_, i) => {
    const id = ids[i],
      t = id === undefined ? null : game.state.tiles[id];
    return `<div class="tray-slot ${t ? "filled" : ""}" ${t ? `style="--jewel:${TILE_COLORS[t.kind]}"` : ""}>${t ? portrait(t.kind) : "<span></span>"}</div>`;
  }).join("");
  $("#tray-count").textContent = String(ids.length);
  $("#tray").classList.toggle("danger", ids.length >= 5);
  $("#tray-status").textContent =
    game.state.status === "lost"
      ? "Tray full. Undo or remix to keep playing."
      : ids.length >= 5
        ? "A little crowded. Look for a pair you can complete."
        : "Pick any uncovered tile. Three of a kind clear together.";
}
function render() {
  const s = game.state,
    def = LEVELS[s.level - 1];
  $("#level-number").textContent = `LEVEL ${String(s.level).padStart(2, "0")}`;
  $("#level-title").textContent = def.name;
  $("#level-subtitle").textContent = def.subtitle;
  $("#difficulty").textContent = def.difficulty;
  $("#score").textContent = s.score.toLocaleString();
  $("#remaining").textContent = String(
    s.tiles.filter((t) => !t.removed).length,
  );
  $("#match-count").textContent = String(s.matches);
  $("#match-total").textContent = `of ${s.tiles.length / 3}`;
  $("#completed").textContent = `${Object.keys(best).length} / 12`;
  $("#chapter-progress").style.width =
    `${(Object.keys(best).length / 12) * 100}%`;
  $("#star-total").textContent =
    `${Object.values(best).reduce((sum, v) => sum + (v.stars || 0), 0)} stars collected`;
  $("#best-score").textContent = best[s.level]
    ? best[s.level].score.toLocaleString() + " points"
    : "A fresh beginning";
  $("#palette").innerHTML = [...new Set(s.tiles.map((t) => t.kind))]
    .map((kind) => portrait(kind))
    .join("");
  $("#undo").toggleAttribute("disabled", !game.history.length);
  $("#hint").toggleAttribute("disabled", s.status !== "playing");
  $("#remix").toggleAttribute("disabled", s.status === "won");
  $("#sound-icon").innerHTML = icon(sound ? "sound" : "mute");
  $("#sound-state").textContent = sound ? "On" : "Off";
  $("#sound").setAttribute("aria-checked", String(sound));
  document.body.classList.toggle("reduced-motion", !motion);
  renderTray();
  scheduleSave();
}
function closeModal() {
  $("#modal").classList.add("hidden");
  lastFocus?.focus();
}
function modal(html: string, closable = true) {
  appMenu.close();
  lastFocus = document.activeElement as HTMLElement;
  $("#modal-content").innerHTML = html;
  $("#modal-close").hidden = !closable;
  $("#modal").classList.remove("hidden");
  requestAnimationFrame(() =>
    $("#modal-content").querySelector<HTMLElement>("button")?.focus(),
  );
}
function resultModal() {
  const s = game.state;
  if (s.status === "won") {
    modal(
      `<div class="result-emblem"><img src="${assetUrl("art/cartoon/brand.webp")}" alt="Cartoon strawberry"></div><div class="eyebrow">BEAUTIFULLY DONE</div><h2 id="modal-title">A world of possibility.</h2><p>You cleared ${LEVELS[s.level - 1].name}. Take a moment. You earned it.</p>${stars(starsFor(s))}<div class="result-score"><strong>${s.score.toLocaleString()}</strong><span>POINTS</span></div><button class="primary-button" id="next-level">${s.level < 12 ? "Next garden" : "Play paradise again"} ${icon("arrow")}</button><button class="text-button" id="result-journey">View your journey</button>`,
      false,
    );
    $("#next-level").onclick = () =>
      start(s.level < 12 ? s.level + 1 : s.level);
    $("#result-journey").onclick = showLevels;
  } else if (s.status === "lost") {
    modal(
      `<div class="modal-symbol">${icon("remix")}</div><div class="eyebrow">THERE’S ALWAYS ANOTHER WAY</div><h2 id="modal-title">Room for a comeback.</h2><p>Your seven spaces are full. Undo your last move, or return the tray to the board and remix the remaining tiles. All help is free.</p><button class="primary-button" id="rescue">Remix & keep playing ${icon("remix")}</button><button class="secondary-button" id="rescue-undo">Undo last move ${icon("undo")}</button>`,
    );
    $("#rescue").onclick = remix;
    $("#rescue-undo").onclick = undo;
  }
}
function showLevels() {
  modal(
    `<div class="eyebrow">SUNNY ORCHARD</div><h2 id="modal-title">Your colorful little journey.</h2><p>Twelve gardens. A new perspective in every one.</p><div class="level-grid">${LEVELS.map((l, i) => `<button class="level-option ${i + 1 === game.state.level ? "current" : ""}" data-level="${i + 1}" ${i + 1 > unlocked ? "disabled" : ""}><span class="level-option-number" style="--accent:${l.color}">${i + 1 > unlocked ? icon("lock") : String(i + 1).padStart(2, "0")}</span><span>${l.name}<small>${l.difficulty}</small></span>${best[i + 1] ? stars(best[i + 1].stars) : i + 1 === game.state.level ? '<span class="playing-label">PLAYING</span>' : ""}</button>`).join("")}</div>`,
  );
  document.querySelectorAll<HTMLButtonElement>("[data-level]").forEach(
    (b) =>
      (b.onclick = () => {
        const level = Number(b.dataset.level);
        if (level === game.state.level) closeModal();
        else start(level);
      }),
  );
}
function start(level: number, seed = Date.now()) {
  board.clearEffects();
  game = new Game(createState(level, seed));
  closeModal();
  board.sync(game.state);
  render();
}
function pick(id: number) {
  const previous = [...game.state.tray],
    event = game.pick(id);
  if (!event) return;
  const last = previous.findLastIndex(
    (other) => game.state.tiles[other].kind === event.kind,
  );
  // Capture a visual copy before the real tile disappears. Effects never own game state.
  board.fly(id, last >= 0 ? last + 1 : previous.length, !motion);
  board.sync(game.state);
  recordWin();
  render();
  tone(event.matched.length ? "match" : "pick", event.kind);
  if (event.matched.length) board.match(event.kind, !motion);
  if (event.status === "won") {
    board.celebrate();
    tone("win");
  }
  if (event.status !== "playing") resultModal();
}
function undo() {
  if (game.undo()) {
    board.clearEffects();
    closeModal();
    board.sync(game.state);
    render();
    tone("tap");
    notify("Your last move, restored.");
  } else notify("Pick a tile first. Your last move will be saved here.");
}
function remix() {
  if (!game.remix()) return;
  board.clearEffects();
  closeModal();
  board.sync(game.state);
  render();
  tone("tap");
  notify("Fresh possibilities. Every remaining tile can be matched.");
}
board = new Board($("#board"), pick, () =>
  notify("That tile is covered. Pick a tile with nothing above it."),
);
board.sync(game.state);
$("#undo").onclick = undo;
$("#remix").onclick = remix;
$("#hint").onclick = () => {
  if (game.state.status !== "playing") return;
  const ids = game.hint();
  board.highlight(ids);
  if (ids.length)
    notify(
      `Look for the highlighted ${TILE_NAMES[game.state.tiles[ids[0]].kind].toLowerCase()}.`,
    );
  tone("tap");
};
$("#restart").onclick = () => {
  modal(
    `<div class="modal-symbol">${icon("reset")}</div><h2 id="modal-title">A fresh perspective?</h2><p>Restart this garden with its original tile arrangement. Your completed gardens stay saved.</p><button class="primary-button" id="confirm-restart">Restart this garden ${icon("reset")}</button><button class="text-button" id="keep-playing">Keep playing</button>`,
  );
  $("#confirm-restart").onclick = () =>
    start(game.state.level, game.state.seed);
  $("#keep-playing").onclick = closeModal;
};
$("#levels").onclick = showLevels;
$("#explore").onclick = showLevels;
$("#sound").onclick = () => {
  sound = !sound;
  render();
  if (sound) tone("match");
};
$("#about").onclick = () => {
  modal(
    `<div class="about-app"><img class="about-icon" src="${assetUrl("app-192.png")}" alt="Little Worlds app icon"><div class="eyebrow">HAPPY TILE GARDENS</div><h2 id="modal-title">${APP_NAME}</h2><span class="about-version">Version ${APP_VERSION}</span><p class="about-credit">Created by: <strong>Bill Parsons</strong></p><p>Little matches. Big smiles.<br>Free to play, with no ads or purchases.</p><button class="primary-button" id="about-done">Back to the garden ${icon("arrow")}</button></div>`,
  );
  $("#about-done").onclick = closeModal;
};

function shareLink() {
  modal(
    `<div class="modal-symbol">${icon("share")}</div><div class="eyebrow">GOOD THINGS ARE BETTER SHARED</div><h2 id="modal-title">Share a little happiness.</h2><p>Send this link to a friend and invite them to the garden.</p><label class="share-link-label" for="share-link">Game link</label><input class="share-link" id="share-link" type="url" value="${SHARE_URL}" readonly><button class="primary-button" id="copy-link">Copy game link ${icon("share")}</button><button class="text-button" id="share-done">Back to the game</button>`,
  );
  $("#copy-link").onclick = async () => {
    try {
      await navigator.clipboard.writeText(SHARE_URL);
      notify("Game link copied. Share a little happiness!");
      closeModal();
    } catch {
      const field = $<HTMLInputElement>("#share-link");
      field.focus();
      field.select();
      notify("Select and copy the game link to share it.");
    }
  };
  $("#share-done").onclick = closeModal;
}
$("#share").onclick = async () => {
  if (!navigator.share) {
    shareLink();
    return;
  }
  try {
    await navigator.share({
      title: `${APP_NAME} — Happy Tile Gardens`,
      text: "A happy little tile adventure. Free, with no ads or purchases!",
      url: SHARE_URL,
    });
  } catch (error) {
    if ((error as { name?: string } | null)?.name !== "AbortError") shareLink();
  }
};

async function refreshApp() {
  if (refreshing) return;
  refreshing = true;
  $("#refresh").toggleAttribute("disabled", true);
  $("#update-refresh").toggleAttribute("disabled", true);
  $("#refresh span").textContent = "Refreshing…";
  $("#update-refresh").textContent = "Refreshing…";
  notify("Refreshing your little world…");
  try {
    await updates.refresh();
  } catch {
    notify(
      "The update could not finish downloading. Please try Refresh again.",
    );
  } finally {
    refreshing = false;
    $("#refresh").toggleAttribute("disabled", false);
    $("#update-refresh").toggleAttribute("disabled", false);
    $("#refresh span").textContent = "Refresh";
    $("#update-refresh").textContent = "Refresh now";
  }
}
$("#refresh").onclick = refreshApp;
$("#update-refresh").onclick = refreshApp;
$("#update-later").onclick = () => {
  dismissedVersion = availableVersion;
  $("#update-notice").hidden = true;
};
$("#help").onclick = () => {
  modal(
    `<div class="modal-symbol">${icon("spark")}</div><div class="eyebrow">YOUR LITTLE ESCAPE</div><h2 id="modal-title">Three is a beautiful number.</h2><div class="help-triple">${portrait(0) + portrait(0) + portrait(0)}</div><ol class="help-steps"><li><b>Pick an uncovered tile.</b><span>Raised edges show the layers. A small number counts the tiles in a directly aligned stack, including the top tile. Clear the top to reach the tiles underneath.</span></li><li><b>Make a match of three.</b><span>Three of the same symbol clear from your tray, making room for more.</span></li><li><b>Clear the whole garden.</b><span>Plan around seven tray spaces. Every level has a winning path.</span></li></ol><p class="help-extra">Tap or click an uncovered tile to pick it. Undo, hints, and remix are always free.</p><label class="motion-setting"><input type="checkbox" id="motion-setting" ${motion ? "checked" : ""}> Enable animations</label><button class="primary-button" id="help-done">Let’s play ${icon("arrow")}</button>`,
  );
  $("#help-done").onclick = closeModal;
  $("#motion-setting").onchange = (e) => {
    motion = (e.target as HTMLInputElement).checked;
    render();
  };
};
$("#modal-close").onclick = closeModal;
$("#modal").addEventListener("click", (e) => {
  if (e.target === $("#modal") && !$("#modal-close").hidden) closeModal();
});
document.addEventListener("keydown", (e) => {
  if (!$("#modal").classList.contains("hidden")) {
    if (e.key === "Escape" && !$("#modal-close").hidden) closeModal();
    if (e.key === "Tab") {
      const list = [
          ...$("#modal").querySelectorAll<HTMLElement>(
            "button:not(:disabled):not([hidden]),input",
          ),
        ],
        first = list[0],
        last = list.at(-1);
      if (e.shiftKey && document.activeElement === first) {
        last?.focus();
        e.preventDefault();
      } else if (!e.shiftKey && document.activeElement === last) {
        first?.focus();
        e.preventDefault();
      }
    }
  } else if ((e.ctrlKey || e.metaKey) && e.key === "z") {
    e.preventDefault();
    undo();
  }
});
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  installPrompt = e;
});
$("#install").onclick = async () => {
  if (installPrompt) {
    await installPrompt.prompt();
    installPrompt = null;
  } else
    modal(
      `<div class="modal-symbol">${icon("download")}</div><h2 id="modal-title">A little world, wherever you go.</h2><p>Install Little Worlds from your browser’s install menu. On iPhone or iPad, open in Safari, tap Share, then Add to Home Screen.</p><p>Visit once online to save the game and artwork. After that, you can play offline. Your progress stays on this device.</p><button class="primary-button" id="install-done">Got it ${icon("check")}</button>`,
    );
  if (document.querySelector("#install-done"))
    $("#install-done").onclick = closeModal;
};
window.addEventListener("online", persist);
window.addEventListener("offline", persist);
window.addEventListener("pagehide", () => {
  if (savePending) persist();
});
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden" && savePending) persist();
});
recordWin();
render();
if (game.state.status !== "playing") resultModal();
const updates = setupUpdates({
  beforeReload: () => {
    if (savePending) persist();
  },
  onAvailable: (version) => {
    availableVersion = version;
    $("#app-version").classList.add("has-update");
    $("#app-version").title =
      `Version ${APP_VERSION} · ${version} is available`;
    if (version === dismissedVersion) return;
    $("#update-message").textContent =
      `Version ${version} is ready. Refresh to update. Your progress stays saved.`;
    $("#update-notice").hidden = false;
  },
});
