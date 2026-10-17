import { describe, expect, it } from "vitest";
import { newEncounter, reducer, isEmptyRow } from "./encounterReducer";
import type { Action } from "./encounterReducer";
import type { Combatant, Encounter } from "../../shared/types";

const row = (id: string, name: string, initiative: number | null): Combatant => ({
  id, name, initiative, classIcon: "monster", conditions: [], ac: null, hp: null,
});
const enc = (rows: Combatant[], extra: Partial<Encounter> = {}): Encounter => ({ ...newEncounter(), rows, ...extra });
const run = (s: Encounter, ...as: Action[]) => as.reduce(reducer, s);

describe("new encounter and title", () => {
  it("starts with 6 empty rows", () => {
    const e = newEncounter();
    expect(e.rows).toHaveLength(6);
    expect(e.rows.every(isEmptyRow)).toBe(true);
    expect(e.round).toBe(1);
    expect(e.activeId).toBeNull();
  });
  it("falls back to Default Encounter for an empty name", () => {
    expect(reducer(newEncounter(), { type: "setName", name: "   " }).name).toBe("Default Encounter");
    expect(reducer(newEncounter(), { type: "setName", name: "Ambush" }).name).toBe("Ambush");
  });
});

describe("rows", () => {
  it("adds and removes", () => {
    const s = run(newEncounter(), { type: "addRow" });
    expect(s.rows).toHaveLength(7);
    expect(run(s, { type: "removeRow", rowId: s.rows[0].id }).rows).toHaveLength(6);
  });
  it("removing the active row activates the next one", () => {
    const s = enc([row("a", "A", 10), row("b", "B", 8), row("c", "C", 5)], { activeId: "b" });
    expect(run(s, { type: "removeRow", rowId: "b" }).activeId).toBe("c");
    const t = enc([row("a", "A", 10), row("b", "B", 8)], { activeId: "b" });
    expect(run(t, { type: "removeRow", rowId: "b" }).activeId).toBe("a");
    const u = enc([row("a", "A", 10)], { activeId: "a" });
    expect(run(u, { type: "removeRow", rowId: "a" }).activeId).toBeNull();
  });
});

describe("sort", () => {
  it("sorts high to low, keeps ties stable, empty rows sink", () => {
    const s = enc([row("e", "", null), row("a", "A", 10), row("n", "NoInit", null), row("b", "B", 15), row("c", "C", 10)], { activeId: "c" });
    const t = reducer(s, { type: "sort" });
    expect(t.rows.map((r) => r.id)).toEqual(["b", "a", "c", "n", "e"]);
    expect(t.activeId).toBe("c");
  });
});

describe("turns", () => {
  const base = () => enc([row("a", "A", 15), row("b", "B", 10), row("e", "", null), row("c", "C", 5), row("e2", "", null)]);
  it("first Next activates the first non-empty row, round stays 1", () => {
    const s = reducer(base(), { type: "next" });
    expect(s.activeId).toBe("a");
    expect(s.round).toBe(1);
  });
  it("skips empty rows and wraps with round increment", () => {
    const seq: [string, number][] = [];
    let s = base();
    for (let i = 0; i < 7; i++) {
      s = reducer(s, { type: "next" });
      seq.push([s.activeId!, s.round]);
    }
    expect(seq).toEqual([["a", 1], ["b", 1], ["c", 1], ["a", 2], ["b", 2], ["c", 2], ["a", 3]]);
  });
  it("prev wraps backwards and never goes below round 1", () => {
    let s = run(base(), { type: "next" });
    s = reducer(s, { type: "prev" });
    expect(s.round).toBe(1);
    expect(s.activeId).toBe("c");
    s = run(base(), { type: "next" }, { type: "next" }, { type: "next" }, { type: "next" });
    expect([s.activeId, s.round]).toEqual(["a", 2]);
    s = reducer(s, { type: "prev" }); // wraps backwards: round 2 -> 1
    expect([s.activeId, s.round]).toEqual(["c", 1]);
    s = run(s, { type: "prev" }, { type: "prev" }, { type: "prev" });
    expect([s.activeId, s.round]).toEqual(["c", 1]); // b, a, then wrap but clamped at 1
  });
  it("does nothing with all-empty rows", () => {
    const s = newEncounter();
    expect(reducer(s, { type: "next" })).toBe(s);
  });
  it("reset combat keeps durations", () => {
    let s = run(base(), { type: "addCondition", rowId: "a", condition: "prone", rounds: 3 }, { type: "next" }, { type: "next" });
    s = reducer(s, { type: "resetCombat" });
    expect([s.round, s.activeId]).toEqual([1, null]);
    expect(s.rows[0].conditions).toEqual([{ id: "prone", roundsLeft: 2 }]); // ticked once when A became active
  });
});

describe("conditions", () => {
  it("ticks at the start of that combatant's turn and removes at 0", () => {
    let s = enc([row("a", "A", 15), row("b", "B", 10)]);
    s = run(s,
      { type: "addCondition", rowId: "b", condition: "poisoned", rounds: 2 },
      { type: "addCondition", rowId: "b", condition: "prone", rounds: null });
    s = run(s, { type: "next" }); // a
    expect(s.rows[1].conditions.find((c) => c.id === "poisoned")?.roundsLeft).toBe(2);
    s = run(s, { type: "next" }); // b, round 1: 2 -> 1
    expect(s.rows[1].conditions.find((c) => c.id === "poisoned")?.roundsLeft).toBe(1);
    s = run(s, { type: "next" }, { type: "next" }); // a, then b round 2: 1 -> 0 removed
    expect(s.rows[1].conditions.map((c) => c.id)).toEqual(["prone"]);
  });
  it("replaces an existing condition rather than duplicating it", () => {
    const s = run(enc([row("a", "A", 1)]),
      { type: "addCondition", rowId: "a", condition: "stunned", rounds: 1 },
      { type: "addCondition", rowId: "a", condition: "stunned", rounds: 4 });
    expect(s.rows[0].conditions).toEqual([{ id: "stunned", roundsLeft: 4 }]);
  });
  it("exhaustion stacks as a level up to 6 and is never timed", () => {
    let s = enc([row("a", "A", 1)]);
    for (let i = 0; i < 8; i++) s = reducer(s, { type: "addCondition", rowId: "a", condition: "exhaustion", rounds: 3 });
    expect(s.rows[0].conditions).toEqual([{ id: "exhaustion", roundsLeft: null, level: 6 }]);
    s = reducer(s, { type: "setCondition", rowId: "a", condition: "exhaustion", rounds: null, level: 2 });
    expect(s.rows[0].conditions[0].level).toBe(2);
  });
  it("removes a condition", () => {
    const s = run(enc([row("a", "A", 1)]),
      { type: "addCondition", rowId: "a", condition: "blinded", rounds: null },
      { type: "removeCondition", rowId: "a", condition: "blinded" });
    expect(s.rows[0].conditions).toEqual([]);
  });
});

describe("a 3 round mock combat", () => {
  it("behaves as described", () => {
    let s = enc([row("g", "Goblin", 12), row("t", "Thorin", 18), row("m", "Mira", 15), row("e", "", null)]);
    s = run(s, { type: "sort" }, { type: "addCondition", rowId: "g", condition: "frightened", rounds: 3 });
    expect(s.rows.map((r) => r.id)).toEqual(["t", "m", "g", "e"]);
    const order: string[] = [];
    for (let i = 0; i < 9; i++) { s = reducer(s, { type: "next" }); order.push(s.activeId!); }
    expect(order).toEqual(["t", "m", "g", "t", "m", "g", "t", "m", "g"]);
    expect(s.round).toBe(3);
    // frightened: 3 -> 2 (round1) -> 1 (round2) -> removed (round3)
    expect(s.rows[2].conditions).toEqual([]);
  });
});

describe("custom icons and conditions", () => {
  const PNG = "data:image/png;base64,iVBORw0KGgo=";
  it("sets and clears a custom row icon; picking a class drops it", () => {
    let s = reducer(enc([row("a", "A", 1)]), { type: "setCustomIcon", rowId: "a", icon: PNG });
    expect(s.rows[0].customIcon).toBe(PNG);
    s = reducer(s, { type: "setCustomIcon", rowId: "a", icon: null });
    expect(s.rows[0].customIcon).toBeUndefined();
    s = reducer(s, { type: "setCustomIcon", rowId: "a", icon: PNG });
    s = reducer(s, { type: "setClass", rowId: "a", classIcon: "wizard" });
    expect(s.rows[0].customIcon).toBeUndefined();
    expect(s.rows[0].classIcon).toBe("wizard");
  });
  it("adds a custom condition with name, description and icon", () => {
    const s = reducer(enc([row("a", "A", 1)]), {
      type: "addCondition", rowId: "a", condition: "custom:x1", rounds: 3,
      custom: { name: " Hexed ", description: "Disadvantage on checks", icon: PNG },
    });
    expect(s.rows[0].conditions).toEqual([{ id: "custom:x1", roundsLeft: 3, name: "Hexed", description: "Disadvantage on checks", icon: PNG }]);
  });
  it("edits and clears overrides on a standard condition", () => {
    let s = reducer(enc([row("a", "A", 1)]), { type: "addCondition", rowId: "a", condition: "prone", rounds: 2 });
    s = reducer(s, { type: "setCondition", rowId: "a", condition: "prone", rounds: 2, patch: { name: "Knocked down", description: "Crawling" } });
    expect(s.rows[0].conditions[0]).toMatchObject({ name: "Knocked down", description: "Crawling", roundsLeft: 2 });
    s = reducer(s, { type: "setCondition", rowId: "a", condition: "prone", rounds: 2, patch: { name: "", description: null } });
    expect(s.rows[0].conditions[0]).toEqual({ id: "prone", roundsLeft: 2 });
  });
  it("keeps overrides when exhaustion stacks and when ticking", () => {
    let s = reducer(enc([row("a", "A", 5), row("b", "B", 4)]), { type: "addCondition", rowId: "a", condition: "exhaustion", rounds: null, custom: { name: "Weary" } });
    s = reducer(s, { type: "addCondition", rowId: "a", condition: "exhaustion", rounds: null });
    expect(s.rows[0].conditions[0]).toEqual({ id: "exhaustion", roundsLeft: null, level: 2, name: "Weary" });
    s = reducer(s, { type: "addCondition", rowId: "b", condition: "custom:c", rounds: 1, custom: { name: "Cursed" } });
    s = run(s, { type: "next" }, { type: "next" }); // b's turn: 1 -> 0, removed
    expect(s.rows[1].conditions).toEqual([]);
  });
});
