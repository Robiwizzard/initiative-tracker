import { DEFAULT_NAME } from "../../shared/types";
import type { ClassId, Combatant, ConditionId, Encounter } from "../../shared/types";
import { makeId } from "../../shared/ids";

export const EMPTY_ROWS = 6;

export function newRow(): Combatant {
  return { id: makeId(), initiative: null, classIcon: "monster", name: "", conditions: [], ac: null, hp: null };
}

export function newEncounter(): Encounter {
  return {
    schemaVersion: 1,
    id: makeId(),
    name: DEFAULT_NAME,
    round: 1,
    activeId: null,
    rows: Array.from({ length: EMPTY_ROWS }, newRow),
    updatedAt: "",
  };
}

export const isEmptyRow = (r: Combatant) => r.name.trim() === "" && r.initiative === null;

export type NumField = "initiative" | "ac" | "hp";

export type Action =
  | { type: "load"; encounter: Encounter }
  | { type: "setName"; name: string }
  | { type: "editNumber"; rowId: string; field: NumField; value: number | null }
  | { type: "editName"; rowId: string; name: string }
  | { type: "setClass"; rowId: string; classIcon: ClassId }
  | { type: "addRow" }
  | { type: "removeRow"; rowId: string }
  | { type: "addCondition"; rowId: string; condition: ConditionId; rounds: number | null }
  | { type: "setCondition"; rowId: string; condition: ConditionId; rounds: number | null; level?: number }
  | { type: "removeCondition"; rowId: string; condition: ConditionId }
  | { type: "sort" }
  | { type: "next" }
  | { type: "prev" }
  | { type: "resetCombat" };

const mapRow = (s: Encounter, rowId: string, f: (r: Combatant) => Combatant): Encounter => ({
  ...s,
  rows: s.rows.map((r) => (r.id === rowId ? f(r) : r)),
});

/** Timed conditions lose one round at the start of the combatant's turn; at 0 they are removed. */
function tick(r: Combatant): Combatant {
  if (!r.conditions.some((c) => c.roundsLeft !== null)) return r;
  const conditions = r.conditions
    .map((c) => (c.roundsLeft === null ? c : { ...c, roundsLeft: c.roundsLeft - 1 }))
    .filter((c) => c.roundsLeft === null || c.roundsLeft > 0);
  return { ...r, conditions };
}

function activate(s: Encounter, index: number, round: number): Encounter {
  const id = s.rows[index].id;
  return { ...s, round, activeId: id, rows: s.rows.map((r, i) => (i === index ? tick(r) : r)) };
}

export function reducer(s: Encounter, a: Action): Encounter {
  switch (a.type) {
    case "load":
      return a.encounter;
    case "setName":
      return { ...s, name: a.name.trim() === "" ? DEFAULT_NAME : a.name.trim() };
    case "editNumber":
      return mapRow(s, a.rowId, (r) => ({ ...r, [a.field]: a.value }));
    case "editName":
      return mapRow(s, a.rowId, (r) => ({ ...r, name: a.name }));
    case "setClass":
      return mapRow(s, a.rowId, (r) => ({ ...r, classIcon: a.classIcon }));
    case "addRow":
      return { ...s, rows: [...s.rows, newRow()] };
    case "removeRow": {
      const idx = s.rows.findIndex((r) => r.id === a.rowId);
      if (idx < 0) return s;
      const rows = s.rows.filter((r) => r.id !== a.rowId);
      let activeId = s.activeId;
      if (s.activeId === a.rowId) {
        const after = rows.findIndex((r, i) => i >= idx && !isEmptyRow(r));
        const first = rows.findIndex((r) => !isEmptyRow(r));
        const pick = after >= 0 ? after : first;
        activeId = pick >= 0 ? rows[pick].id : null;
      }
      return { ...s, rows, activeId };
    }
    case "addCondition": {
      return mapRow(s, a.rowId, (r) => {
        const existing = r.conditions.find((c) => c.id === a.condition);
        if (a.condition === "exhaustion") {
          const level = Math.min(6, (existing?.level ?? 0) + 1);
          const entry = { id: a.condition, roundsLeft: null, level };
          return { ...r, conditions: existing ? r.conditions.map((c) => (c.id === a.condition ? entry : c)) : [...r.conditions, entry] };
        }
        const entry = { id: a.condition, roundsLeft: a.rounds };
        return { ...r, conditions: existing ? r.conditions.map((c) => (c.id === a.condition ? entry : c)) : [...r.conditions, entry] };
      });
    }
    case "setCondition":
      return mapRow(s, a.rowId, (r) => ({
        ...r,
        conditions: r.conditions.map((c) =>
          c.id !== a.condition
            ? c
            : a.condition === "exhaustion"
              ? { id: c.id, roundsLeft: null, level: Math.max(1, Math.min(6, a.level ?? c.level ?? 1)) }
              : { id: c.id, roundsLeft: a.rounds },
        ),
      }));
    case "removeCondition":
      return mapRow(s, a.rowId, (r) => ({ ...r, conditions: r.conditions.filter((c) => c.id !== a.condition) }));
    case "sort": {
      const group = (r: Combatant) => (r.initiative !== null ? 0 : isEmptyRow(r) ? 2 : 1);
      const rows = [...s.rows].sort((x, y) => {
        const g = group(x) - group(y);
        if (g !== 0) return g;
        return group(x) === 0 ? (y.initiative as number) - (x.initiative as number) : 0;
      });
      return { ...s, rows };
    }
    case "next": {
      if (s.rows.every(isEmptyRow)) return s;
      const cur = s.rows.findIndex((r) => r.id === s.activeId);
      if (cur < 0) return activate(s, s.rows.findIndex((r) => !isEmptyRow(r)), s.round);
      const after = s.rows.findIndex((r, i) => i > cur && !isEmptyRow(r));
      if (after >= 0) return activate(s, after, s.round);
      return activate(s, s.rows.findIndex((r) => !isEmptyRow(r)), s.round + 1);
    }
    case "prev": {
      if (s.rows.every(isEmptyRow)) return s;
      const lastIdx = (from: number) => {
        for (let i = from; i >= 0; i--) if (!isEmptyRow(s.rows[i])) return i;
        return -1;
      };
      const cur = s.rows.findIndex((r) => r.id === s.activeId);
      if (cur < 0) return { ...s, activeId: s.rows[lastIdx(s.rows.length - 1)].id };
      const before = lastIdx(cur - 1);
      if (before >= 0) return { ...s, activeId: s.rows[before].id };
      return { ...s, round: Math.max(1, s.round - 1), activeId: s.rows[lastIdx(s.rows.length - 1)].id };
    }
    case "resetCombat":
      return { ...s, round: 1, activeId: null };
  }
}
