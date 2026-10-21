import { isAvailable, TILE_NAMES, TILE_FILES } from "./game";
import type { State, Tile } from "./game";
import { assetUrl } from "./paths";

/** A flat, layered tile board. Native buttons provide both touch and keyboard input. */
export class Board {
  private host: HTMLElement;
  private onPick: (id: number) => void;
  private onBlocked: () => void;
  private tiles = new Map<number, HTMLButtonElement>();
  private state: State | null = null;
  private key = "";
  private busy = false;
  private observer: ResizeObserver;
  private hintTimer = 0;
  private animations = new Set<Animation>();

  constructor(
    host: HTMLElement,
    onPick: (id: number) => void,
    onBlocked: () => void,
  ) {
    this.host = host;
    this.onPick = onPick;
    this.onBlocked = onBlocked;
    host.classList.add("board-2d");
    host.setAttribute("aria-busy", "false");
    this.observer = new ResizeObserver(() => this.resize());
    this.observer.observe(host);
  }

  sync(state: State) {
    this.state = state;
    for (const animation of this.animations) animation.cancel();
    this.animations.clear();
    const key = `${state.level}:${state.seed}`;
    if (key !== this.key) {
      this.key = key;
      this.host.replaceChildren();
      this.tiles.clear();
      for (const tile of state.tiles) this.createTile(tile);
    }
    clearTimeout(this.hintTimer);
    for (const tile of state.tiles) {
      const button = this.tiles.get(tile.id)!;
      const image = button.querySelector("img")!;
      const source = assetUrl(`art/cartoon/tiles/${TILE_FILES[tile.kind]}.webp`);
      if (image.getAttribute("src") !== source) image.src = source;
      button.setAttribute(
        "aria-label",
        `Pick ${TILE_NAMES[tile.kind]}, layer ${tile.layer + 1}, tile ${tile.id + 1}`,
      );
      button.hidden = tile.removed;
      button.style.visibility = "";
      button.style.zIndex = String(tile.layer * 1000 + tile.id);
      button.classList.toggle("covered", !isAvailable(tile, state.tiles));
      button.classList.remove("hinted");
      delete button.dataset.hint;
    }
    this.setBusy(this.busy);
    this.resize();
  }

  private createTile(tile: Tile) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "tile-button";
    button.dataset.tile = String(tile.id);
    const image = document.createElement("img");
    image.alt = "";
    image.draggable = false;
    button.append(image);
    button.addEventListener("click", () => {
      if (this.busy || !this.state) return;
      const current = this.state.tiles[tile.id];
      if (!isAvailable(current, this.state.tiles)) this.onBlocked();
      else this.onPick(tile.id);
    });
    this.tiles.set(tile.id, button);
    this.host.append(button);
  }

  private resize() {
    if (!this.state) return;
    const width = this.host.clientWidth,
      height = this.host.clientHeight;
    if (!width || !height) return;
    const xs = this.state.tiles.map((t) => t.x),
      ys = this.state.tiles.map((t) => t.z);
    const minX = Math.min(...xs),
      maxX = Math.max(...xs),
      minY = Math.min(...ys),
      maxY = Math.max(...ys);
    const gridWidth = maxX - minX + 1,
      gridHeight = maxY - minY + 1.1;
    const unit = Math.max(
      1,
      Math.min((width - 30) / gridWidth, (height - 24) / gridHeight, 88),
    );
    const left = (width - gridWidth * unit) / 2,
      top = (height - gridHeight * unit) / 2;
    for (const tile of this.state.tiles) {
      const button = this.tiles.get(tile.id)!;
      button.style.width = `${unit}px`;
      button.style.height = `${unit * 1.1}px`;
      button.style.left = `${left + (tile.x - minX) * unit}px`;
      button.style.top = `${top + (tile.z - minY) * unit}px`;
      button.style.setProperty("--tile-size", `${unit}px`);
    }
  }

  setBusy(busy: boolean) {
    this.busy = busy;
    this.host.setAttribute("aria-busy", String(busy));
    if (!this.state) return;
    for (const tile of this.state.tiles) {
      this.tiles.get(tile.id)!.disabled =
        busy ||
        !isAvailable(tile, this.state.tiles) ||
        this.state.status !== "playing";
    }
  }

  highlight(ids: number[]) {
    clearTimeout(this.hintTimer);
    for (const [id, button] of this.tiles) {
      button.classList.toggle("hinted", ids.includes(id));
      if (ids.includes(id)) button.dataset.hint = "true";
      else delete button.dataset.hint;
    }
    this.hintTimer = window.setTimeout(() => {
      for (const button of this.tiles.values()) {
        button.classList.remove("hinted");
        delete button.dataset.hint;
      }
    }, 4500);
  }

  async fly(id: number, reduced = false) {
    const button = this.tiles.get(id);
    if (!button) return;
    const source = button.getBoundingClientRect();
    const index = this.state?.tray.indexOf(id) ?? -1;
    const slots = [...document.querySelectorAll<HTMLElement>(".tray-slot")];
    const target =
      slots[
        index >= 0 ? index : Math.min(this.state?.tray.length ?? 0, 6)
      ]?.getBoundingClientRect();
    const dx = target
      ? target.x + target.width / 2 - source.x - source.width / 2
      : 0;
    const dy = target
      ? target.y + target.height / 2 - source.y - source.height / 2
      : 45;
    button.style.zIndex = "10000";
    const animation = button.animate(
      reduced
        ? [{ opacity: 1 }, { opacity: 0 }]
        : [
            { transform: "translate(0,0) scale(1)", opacity: 1 },
            {
              transform: `translate(${dx * 0.28}px,${dy * 0.25 - 24}px) scale(1.08)`,
              opacity: 1,
              offset: 0.35,
            },
            {
              transform: `translate(${dx}px,${dy}px) scale(.65)`,
              opacity: 0.25,
            },
          ],
      {
        duration: reduced ? 60 : 260,
        easing: "cubic-bezier(.25,.7,.35,1)",
        fill: "forwards",
      },
    );
    this.animations.add(animation);
    await animation.finished.catch(() => {});
    button.style.visibility = "hidden";
  }

  celebrate() {
    if (document.body.classList.contains("reduced-motion")) return;
    const colors = ["#ff679b", "#ffd348", "#55d3ff", "#9c77ef", "#64d88d"];
    for (let i = 0; i < 45; i++) {
      const confetti = document.createElement("i");
      confetti.className = "confetti";
      confetti.style.left = `${Math.random() * 100}%`;
      confetti.style.background = colors[i % colors.length];
      confetti.setAttribute("aria-hidden", "true");
      this.host.append(confetti);
      const animation = confetti.animate(
        [
          { transform: "translateY(-20px) rotate(0deg)", opacity: 1 },
          {
            transform: `translate(${(Math.random() - 0.5) * 160}px,${this.host.clientHeight + 20}px) rotate(${Math.random() * 720}deg)`,
            opacity: 0,
          },
        ],
        {
          duration: 1000 + Math.random() * 700,
          delay: Math.random() * 250,
          easing: "ease-in",
        },
      );
      void animation.finished.then(() => confetti.remove());
    }
  }

  dispose() {
    this.observer.disconnect();
    clearTimeout(this.hintTimer);
    for (const animation of this.animations) animation.cancel();
    this.host.replaceChildren();
  }
}
