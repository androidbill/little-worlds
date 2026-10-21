export const TILE_NAMES = [
  "Strawberry",
  "Cherries",
  "Lemon",
  "Grapes",
  "Watermelon",
  "Orange",
  "Butterfly",
  "Blossom",
] as const;
export const TILE_COLORS = [
  "#fa4972",
  "#ef4056",
  "#f4c836",
  "#a365dd",
  "#66c878",
  "#ff9f38",
  "#37baf1",
  "#fc91b0",
] as const;
export const TILE_FILES = [
  "strawberry",
  "cherries",
  "lemon",
  "grapes",
  "watermelon",
  "orange",
  "butterfly",
  "blossom",
] as const;
export type Tile = {
  id: number;
  kind: number;
  x: number;
  z: number;
  layer: number;
  removed: boolean;
};
export type State = {
  level: number;
  seed: number;
  tiles: Tile[];
  tray: number[];
  solution: number[];
  status: "playing" | "won" | "lost";
  score: number;
  matches: number;
  moves: number;
  assists: number;
};
export type Level = {
  name: string;
  subtitle: string;
  color: string;
  difficulty: string;
  specs: number[][];
};
export const LEVELS: Level[] = [
  {
    name: "Berry Meadow",
    subtitle: "Every little match is a new beginning.",
    color: "#f65ac3",
    difficulty: "Gentle",
    specs: [
      [5, 4, 0],
      [4, 3, 1],
      [2, 2, 2],
    ],
  },
  {
    name: "Lemon Lane",
    subtitle: "Find your rhythm, one layer at a time.",
    color: "#45d3ff",
    difficulty: "Gentle",
    specs: [
      [6, 5, 0],
      [4, 3, 1],
      [3, 2, 2],
    ],
  },
  {
    name: "Butterfly Grove",
    subtitle: "A little strategy. A lot of sparkle.",
    color: "#ff8a78",
    difficulty: "Balanced",
    specs: [
      [6, 5, 0],
      [5, 4, 1],
      [3, 3, 2],
      [1, 1, 3],
    ],
  },
  {
    name: "Cherry Blossoms",
    subtitle: "Two peaks. One beautiful possibility.",
    color: "#b7a0ff",
    difficulty: "Balanced",
    specs: [
      [3, 4, 0, -2.1],
      [2, 3, 1, -2.1],
      [1, 3, 2, -2.1],
      [3, 4, 0, 2.1],
      [2, 3, 1, 2.1],
      [1, 3, 2, 2.1],
    ],
  },
  {
    name: "Watermelon Woods",
    subtitle: "Let the hidden colors reveal themselves.",
    color: "#66e3ac",
    difficulty: "Balanced",
    specs: [
      [7, 6, 0],
      [5, 4, 1],
      [3, 3, 2],
      [1, 1, 3],
    ],
  },
  {
    name: "Orange Grove",
    subtitle: "There is treasure in the spaces between.",
    color: "#ffd173",
    difficulty: "Balanced",
    specs: [
      [7, 5, 0],
      [5, 3, 1],
      [3, 3, 2],
      [1, 1, 3],
    ],
  },
  {
    name: "Grape Escape",
    subtitle: "Follow the color through a deeper garden.",
    color: "#ef8aff",
    difficulty: "Intricate",
    specs: [
      [7, 6, 0],
      [6, 4, 1],
      [3, 3, 2],
    ],
  },
  {
    name: "Sunshine Steps",
    subtitle: "Climb a little higher. Shine a little brighter.",
    color: "#69dcff",
    difficulty: "Intricate",
    specs: [
      [8, 6, 0],
      [6, 4, 1],
      [3, 3, 2],
    ],
  },
  {
    name: "Picnic Patch",
    subtitle: "Beauty hides in the unexpected layers.",
    color: "#bd8cff",
    difficulty: "Intricate",
    specs: [
      [8, 6, 0],
      [6, 5, 1],
      [3, 3, 2],
    ],
  },
  {
    name: "Blossom Bay",
    subtitle: "An intricate garden, a satisfying finish.",
    color: "#ff82b9",
    difficulty: "Expert",
    specs: [
      [8, 6, 0],
      [6, 5, 1],
      [3, 4, 2],
    ],
  },
  {
    name: "Rainbow Orchard",
    subtitle: "Make a little space for something extraordinary.",
    color: "#83f1dc",
    difficulty: "Expert",
    specs: [
      [8, 7, 0],
      [6, 5, 1],
      [3, 3, 2],
      [1, 1, 3],
    ],
  },
  {
    name: "Picnic Paradise",
    subtitle: "Your whole world, in full bloom.",
    color: "#ffd37d",
    difficulty: "Expert",
    specs: [
      [9, 7, 0],
      [7, 5, 1],
      [3, 3, 2],
      [1, 1, 3],
    ],
  },
];
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function shuffle<T>(items: T[], random: () => number) {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}
export function isAvailable(tile: Tile, tiles: Tile[]) {
  return (
    !tile.removed &&
    !tiles.some(
      (t) =>
        !t.removed &&
        t.layer > tile.layer &&
        Math.abs(t.x - tile.x) < 0.99 &&
        Math.abs(t.z - tile.z) < 1.09,
    )
  );
}
export function layout(level: number): Tile[] {
  const tiles: Tile[] = [];
  const def = LEVELS[level - 1];
  for (const [cols, rows, layer, offsetX = 0, offsetZ = 0] of def.specs)
    for (let row = 0; row < rows; row++)
      for (let col = 0; col < cols; col++)
        tiles.push({
          id: tiles.length,
          kind: 0,
          x: (col - (cols - 1) / 2) * 1.08 + offsetX,
          z: (row - (rows - 1) / 2) * 1.18 + offsetZ,
          layer,
          removed: false,
        });
  if (tiles.length % 3) tiles.splice(tiles.length - (tiles.length % 3));
  return tiles;
}
function removalOrder(tiles: Tile[], random: () => number) {
  const work = structuredClone(tiles);
  const order: number[] = [];
  while (work.some((t) => !t.removed)) {
    const free = work.filter((t) => isAvailable(t, work));
    const next = free[Math.floor(random() * free.length)];
    next.removed = true;
    order.push(next.id);
  }
  return order;
}
function assignKinds(tiles: Tile[], order: number[], groups: number[]) {
  order.forEach((id, i) => {
    tiles.find((t) => t.id === id)!.kind = groups[Math.floor(i / 3)];
  });
}
export function createState(level = 1, seed = Date.now()): State {
  const tiles = layout(level),
    random = rng(seed),
    solution = removalOrder(tiles, random);
  const kinds = Math.min(8, level < 3 ? 6 : 8);
  const groups = shuffle(
    Array.from({ length: tiles.length / 3 }, (_, i) => i % kinds),
    random,
  );
  assignKinds(tiles, solution, groups);
  return {
    level,
    seed,
    tiles,
    tray: [],
    solution,
    status: "playing",
    score: 0,
    matches: 0,
    moves: 0,
    assists: 0,
  };
}
export function validState(value: unknown): value is State {
  if (!value || typeof value !== "object") return false;
  const s = value as State;
  if (
    !Number.isInteger(s.level) ||
    s.level < 1 ||
    s.level > LEVELS.length ||
    !Number.isFinite(s.seed) ||
    !Array.isArray(s.tiles) ||
    s.tiles.length !== layout(s.level).length ||
    !Array.isArray(s.tray) ||
    s.tray.length > 7 ||
    !Array.isArray(s.solution) ||
    !["playing", "won", "lost"].includes(s.status)
  )
    return false;
  if (
    ![s.score, s.matches, s.moves, s.assists].every(
      (n) => Number.isFinite(n) && n >= 0,
    )
  )
    return false;
  const ids = new Set<number>();
  for (const [index, t] of s.tiles.entries()) {
    if (
      !t ||
      typeof t !== "object" ||
      !Number.isInteger(t.id) ||
      t.id !== index ||
      ids.has(t.id) ||
      !Number.isInteger(t.kind) ||
      t.kind < 0 ||
      t.kind > 7 ||
      ![t.x, t.z, t.layer].every(Number.isFinite) ||
      typeof t.removed !== "boolean"
    )
      return false;
    ids.add(t.id);
  }
  if (
    new Set(s.tray).size !== s.tray.length ||
    s.tray.some((id) => !s.tiles.some((t) => t.id === id && t.removed))
  )
    return false;
  const remaining = s.tiles.filter((t) => !t.removed || s.tray.includes(t.id));
  if (
    Array.from(
      { length: 8 },
      (_, kind) => remaining.filter((t) => t.kind === kind).length,
    ).some((n) => n % 3)
  )
    return false;
  if (s.status === "won" && remaining.length !== 0) return false;
  if (s.solution.some((id) => !Number.isInteger(id) || !ids.has(id)))
    return false;
  if (s.status === "lost" && s.tray.length !== 7) return false;
  if (s.status === "playing" && s.tray.length >= 7) return false;
  return true;
}
export class Game {
  state: State;
  history: State[] = [];
  constructor(state: State = createState(), history: State[] = []) {
    this.state = structuredClone(state);
    this.history = (Array.isArray(history) ? history : [])
      .filter(validState)
      .map((s) => structuredClone(s))
      .slice(-100);
  }
  private remember() {
    this.history.push(structuredClone(this.state));
    if (this.history.length > 100) this.history.shift();
  }
  available() {
    return this.state.tiles.filter((t) => isAvailable(t, this.state.tiles));
  }
  pick(id: number) {
    const s = this.state,
      t = s.tiles.find((t) => t.id === id);
    if (s.status !== "playing" || !t || !isAvailable(t, s.tiles)) return null;
    this.remember();
    t.removed = true;
    s.moves++;
    const last = s.tray.findLastIndex(
      (other) => s.tiles[other].kind === t.kind,
    );
    if (last >= 0) s.tray.splice(last + 1, 0, id);
    else s.tray.push(id);
    const matched = s.tray.filter((other) => s.tiles[other].kind === t.kind);
    if (matched.length === 3) {
      s.tray = s.tray.filter((other) => !matched.includes(other));
      s.matches++;
      s.score += 150 + (s.tray.length === 0 ? 50 : 0);
    } else s.score += 10;
    if (s.tiles.every((t) => t.removed) && s.tray.length === 0)
      s.status = "won";
    else if (s.tray.length >= 7) s.status = "lost";
    return {
      id,
      kind: t.kind,
      matched: matched.length === 3 ? matched : [],
      status: s.status,
    };
  }
  undo() {
    const previous = this.history.pop();
    if (!previous) return false;
    this.state = previous;
    return true;
  }
  remix() {
    if (this.state.status === "won") return false;
    this.remember();
    const s = this.state;
    for (const id of s.tray) s.tiles[id].removed = false;
    s.tray = [];
    s.status = "playing";
    s.assists++;
    const random = rng(s.seed + s.assists * 98317 + s.moves);
    s.solution = removalOrder(s.tiles, random);
    const groups: number[] = [];
    for (let kind = 0; kind < 8; kind++)
      for (
        let i = 0;
        i < s.tiles.filter((t) => !t.removed && t.kind === kind).length / 3;
        i++
      )
        groups.push(kind);
    assignKinds(s.tiles, s.solution, shuffle(groups, random));
    return true;
  }
  hint() {
    const free = this.available();
    if (!free.length) return [];
    const counts = (kind: number) =>
      this.state.tray.filter((id) => this.state.tiles[id].kind === kind).length;
    const order = new Map(this.state.solution.map((id, i) => [id, i]));
    free.sort(
      (a, b) =>
        counts(b.kind) - counts(a.kind) ||
        (order.get(a.id) ?? 999) - (order.get(b.id) ?? 999),
    );
    const first = free[0];
    return free
      .filter((t) => t.kind === first.kind)
      .slice(0, 3 - counts(first.kind))
      .map((t) => t.id);
  }
}
