import { test } from "node:test";
import assert from "node:assert/strict";
import {
  Game,
  createState,
  validState,
  layout,
  LEVELS,
  rng,
} from "../src/game.ts";

test("all twelve layouts have whole triples, no intersections on the same layer, and a winning path across 20 seeds", () => {
  for (let level = 1; level <= LEVELS.length; level++)
    for (let seed = 1; seed <= 20; seed++) {
      const game = new Game(createState(level, seed)),
        tiles = game.state.tiles;
      assert.equal(tiles.length % 3, 0);
      for (const a of tiles)
        for (const b of tiles)
          if (a.id < b.id && a.layer === b.layer)
            assert.ok(
              Math.abs(a.x - b.x) >= 1 || Math.abs(a.z - b.z) >= 1.1,
              `intersecting tiles in level ${level}`,
            );
      for (const id of game.state.solution) {
        assert.ok(game.pick(id), `unreachable tile ${id} in level ${level}`);
        assert.notEqual(game.state.status, "lost");
        assert.ok(validState(game.state));
      }
      assert.equal(game.state.status, "won");
      assert.equal(game.state.tray.length, 0);
      assert.equal(game.state.matches, tiles.length / 3);
    }
});
test("covered tiles cannot be picked and do not create history", () => {
  const g = new Game(createState(1, 4));
  const available = new Set(g.available().map((t) => t.id));
  const blocked = g.state.tiles.find((t) => !available.has(t.id))!;
  assert.equal(g.pick(blocked.id), null);
  assert.equal(g.history.length, 0);
  assert.equal(g.state.moves, 0);
});
test("undo restores the full pre-match state, including cleared tray tiles and score", () => {
  const g = new Game(createState(1, 23));
  const ids = [...g.state.solution];
  g.pick(ids[0]);
  g.pick(ids[1]);
  const before = structuredClone(g.state);
  const result = g.pick(ids[2]);
  assert.equal(result?.matched.length, 3);
  assert.equal(g.state.tray.length, 0);
  assert.ok(g.undo());
  assert.deepEqual(g.state, before);
  assert.equal(g.state.tray.length, 2);
});
test("a triple in the seventh space is resolved before checking for a loss", () => {
  const s = createState(3, 8);
  s.tiles.forEach((t, i) => {
    t.x = i * 1.08;
    t.z = 0;
    t.layer = 0;
    t.kind = Math.floor(i / 3) % 8;
  });
  const g = new Game(s);
  [0, 1, 3, 4, 6, 7].forEach((id) => assert.ok(g.pick(id)));
  assert.equal(g.state.tray.length, 6);
  const result = g.pick(2);
  assert.equal(result?.matched.length, 3);
  assert.equal(g.state.tray.length, 4);
  assert.equal(g.state.status, "playing");
});
test("a full tray loses gracefully; undo and remix can both rescue it", () => {
  const s = createState(3, 8);
  s.tiles.forEach((t, i) => {
    t.x = i * 1.08;
    t.z = 0;
    t.layer = 0;
    t.kind = Math.floor(i / 3) % 8;
  });
  const g = new Game(s);
  [0, 3, 6, 9, 12, 15, 18].forEach((id) => g.pick(id));
  assert.equal(g.state.status, "lost");
  assert.equal(g.pick(21), null);
  const full = structuredClone(g.state);
  assert.ok(g.undo());
  assert.equal(g.state.status, "playing");
  assert.equal(g.state.tray.length, 6);
  const rescue = new Game(full);
  assert.ok(rescue.remix());
  assert.equal(rescue.state.tray.length, 0);
  assert.equal(rescue.state.status, "playing");
  for (const id of rescue.state.solution) assert.ok(rescue.pick(id));
  assert.equal(rescue.state.status, "won");
});
test("save and resume preserve exact tile identity, positions, tray, history, and a working undo", () => {
  const g = new Game(createState(4, 881));
  for (const id of g.state.solution.slice(0, 8)) g.pick(id);
  const decoded = JSON.parse(
    JSON.stringify({ state: g.state, history: g.history }),
  );
  assert.ok(validState(decoded.state));
  const resumed = new Game(decoded.state, decoded.history);
  assert.deepEqual(resumed.state, g.state);
  assert.deepEqual(resumed.history, g.history);
  const reference = structuredClone(g.history.at(-1));
  assert.ok(resumed.undo());
  assert.deepEqual(resumed.state, reference);
});
test("remix conserves remaining matches and makes a solvable arrangement after arbitrary choices", () => {
  for (let level = 1; level <= 12; level++) {
    const g = new Game(createState(level, 150)),
      random = rng(level);
    for (let step = 0; step < 13 && g.state.status === "playing"; step++) {
      const free = g.available();
      g.pick(free[Math.floor(random() * free.length)].id);
    }
    const count = g.state.tiles.filter(
      (t) => !t.removed || g.state.tray.includes(t.id),
    ).length;
    g.remix();
    assert.ok(validState(g.state));
    assert.equal(g.state.tiles.filter((t) => !t.removed).length, count);
    for (const id of g.state.solution) {
      assert.ok(g.pick(id));
      assert.notEqual(g.state.status, "lost");
    }
    assert.equal(g.state.status, "won");
  }
});
test("seeds are repeatable; each level has a distinct footprint; invalid saves are rejected", () => {
  assert.deepEqual(createState(2, 5), createState(2, 5));
  assert.notDeepEqual(createState(2, 5).solution, createState(2, 6).solution);
  assert.equal(
    new Set(LEVELS.map((_, i) => JSON.stringify(layout(i + 1)))).size,
    12,
  );
  assert.equal(validState(null), false);
  assert.equal(validState({ version: 1 }), false);
  const broken = createState();
  broken.tray = [999];
  assert.equal(validState(broken), false);
});
