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
  private observer: ResizeObserver;
  private hintTimer = 0;
  private effects = new Map<Animation, HTMLElement>();

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
    const key = `${state.level}:${state.seed}`;
    const layoutChanged = key !== this.key;
    if (layoutChanged) {
      this.clearEffects();
      this.key = key;
      this.host.replaceChildren();
      this.tiles.clear();
      for (const tile of state.tiles) this.createTile(tile);
    }
    clearTimeout(this.hintTimer);
    for (const tile of state.tiles) {
      const button = this.tiles.get(tile.id)!;
      const image = button.querySelector("img")!;
      const source = assetUrl(
        `art/cartoon/tiles/${TILE_FILES[tile.kind]}.webp`,
      );
      if (image.getAttribute("src") !== source) image.src = source;
      const available = isAvailable(tile, state.tiles);
      const stackSize =
        1 +
        state.tiles.filter(
          (under) =>
            !under.removed &&
            under.layer < tile.layer &&
            Math.abs(under.x - tile.x) < 0.15 &&
            Math.abs(under.z - tile.z) < 0.15,
        ).length;
      const badge = button.querySelector<HTMLElement>(".tile-stack-count")!;
      badge.hidden = stackSize < 2 || !available;
      badge.textContent = String(stackSize);
      button.dataset.stackSize = String(stackSize);
      button.setAttribute(
        "aria-label",
        `Pick ${TILE_NAMES[tile.kind]}, layer ${tile.layer + 1}, tile ${tile.id + 1}${stackSize > 1 ? `, stack of ${stackSize} tiles` : ""}`,
      );
      button.hidden = tile.removed;
      button.style.zIndex = String(tile.layer * 1000 + tile.id);
      button.classList.toggle("covered", !available);
      button.disabled = !available || state.status !== "playing";
      button.classList.remove("hinted");
      delete button.dataset.hint;
    }
    if (layoutChanged) this.resize();
  }

  private createTile(tile: Tile) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "tile-button";
    button.dataset.tile = String(tile.id);
    const image = document.createElement("img");
    image.alt = "";
    image.draggable = false;
    const badge = document.createElement("span");
    badge.className = "tile-stack-count";
    badge.setAttribute("aria-hidden", "true");
    badge.hidden = true;
    button.append(image, badge);
    const activate = () => {
      if (!this.state || this.state.status !== "playing") return;
      const current = this.state.tiles[tile.id];
      if (current.removed) return;
      if (!isAvailable(current, this.state.tiles)) this.onBlocked();
      else this.onPick(tile.id);
    };
    // Pointer input commits on contact. Its later click must not pick a second tile.
    button.addEventListener("pointerdown", (event) => {
      if (event.button !== 0) return;
      event.preventDefault();
      activate();
    });
    button.addEventListener("click", (event) => {
      // Keyboard and assistive-technology activation has no pointer click count.
      if (event.detail === 0) activate();
    });
    this.tiles.set(tile.id, button);
    this.host.append(button);
  }

  private resize() {
    if (!this.state) return;
    const width = this.host.clientWidth,
      height = this.host.clientHeight;
    if (!width || !height) return;
    // A small diagonal offset exposes the actual lower tiles, even in aligned stacks.
    // Keep the total offset inside the gap between neighboring tile columns/rows.
    const lift =
      0.075 / Math.max(1, ...this.state.tiles.map((tile) => tile.layer));
    const xs = this.state.tiles.map((t) => t.x - t.layer * lift),
      ys = this.state.tiles.map((t) => t.z - t.layer * lift);
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
      button.style.left = `${left + (tile.x - tile.layer * lift - minX) * unit}px`;
      button.style.top = `${top + (tile.z - tile.layer * lift - minY) * unit}px`;
      button.style.setProperty("--tile-size", `${unit}px`);
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

  fly(id: number, trayIndex: number, reduced = false) {
    const button = this.tiles.get(id);
    if (!button || reduced) return;
    const source = button.getBoundingClientRect();
    const slots = [...document.querySelectorAll<HTMLElement>(".tray-slot")];
    const target = slots[Math.min(trayIndex, 6)]?.getBoundingClientRect();
    const dx = target
      ? target.x + target.width / 2 - source.x - source.width / 2
      : 0;
    const dy = target
      ? target.y + target.height / 2 - source.y - source.height / 2
      : 45;
    const flight = document.createElement("div");
    flight.className = "tile-button tile-flight";
    flight.setAttribute("aria-hidden", "true");
    flight.style.cssText = `left:${source.x}px;top:${source.y}px;width:${source.width}px;height:${source.height}px;--tile-size:${source.width}px`;
    flight.append(button.querySelector("img")!.cloneNode(true));
    document.body.append(flight);
    const animation = flight.animate(
      [
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
        duration: 210,
        easing: "cubic-bezier(.25,.7,.35,1)",
        fill: "forwards",
      },
    );
    this.trackEffect(animation, flight);
  }

  match(kind: number, reduced = false) {
    if (reduced) return;
    const tray = document.querySelector("#tray")!.getBoundingClientRect();
    const burst = document.createElement("div");
    burst.className = "match-burst";
    burst.setAttribute("aria-hidden", "true");
    burst.style.left = `${tray.x + (tray.width - 166) / 2}px`;
    burst.style.top = `${tray.y - 38}px`;
    for (let i = 0; i < 3; i++) {
      const image = document.createElement("img");
      image.src = assetUrl(`art/cartoon/tiles/${TILE_FILES[kind]}.webp`);
      image.alt = "";
      burst.append(image);
    }
    const label = document.createElement("strong");
    label.textContent = "Match!";
    burst.append(label);
    document.body.append(burst);
    const animation = burst.animate(
      [
        { transform: "translateY(8px) scale(.8)", opacity: 0 },
        { transform: "translateY(-3px) scale(1.06)", opacity: 1, offset: 0.25 },
        { transform: "translateY(-18px) scale(1)", opacity: 0 },
      ],
      { duration: 480, easing: "ease-out" },
    );
    this.trackEffect(animation, burst);
  }

  private trackEffect(animation: Animation, element: HTMLElement) {
    this.effects.set(animation, element);
    void animation.finished
      .catch(() => {})
      .then(() => {
        element.remove();
        this.effects.delete(animation);
      });
  }

  clearEffects() {
    for (const [animation, element] of this.effects) {
      animation.cancel();
      element.remove();
    }
    this.effects.clear();
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
      this.trackEffect(animation, confetti);
    }
  }

  dispose() {
    this.observer.disconnect();
    clearTimeout(this.hintTimer);
    this.clearEffects();
    this.host.replaceChildren();
  }
}
