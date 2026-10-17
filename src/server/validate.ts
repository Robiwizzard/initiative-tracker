import { CLASS_IDS } from "../shared/classes.js";
import { CONDITION_IDS } from "../shared/conditions.js";
import type { Encounter } from "../shared/types.js";

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);
const isIntOrNull = (v: unknown) => v === null || (typeof v === "number" && Number.isInteger(v));

/** Returns an error message, or null when the value is a valid Encounter. */
export function validateEncounter(v: unknown): string | null {
  if (!isObj(v)) return "body must be an object";
  if (v.schemaVersion !== 1) return "schemaVersion must be 1";
  if (typeof v.id !== "string" || v.id.length < 1 || v.id.length > 100) return "bad id";
  if (typeof v.name !== "string" || v.name.length > 200) return "bad name";
  if (typeof v.round !== "number" || !Number.isInteger(v.round) || v.round < 1) return "bad round";
  if (v.activeId !== null && typeof v.activeId !== "string") return "bad activeId";
  if (!Array.isArray(v.rows) || v.rows.length > 500) return "bad rows";
  for (const r of v.rows) {
    if (!isObj(r)) return "row must be an object";
    if (typeof r.id !== "string" || !r.id) return "bad row id";
    if (!isIntOrNull(r.initiative) || !isIntOrNull(r.ac) || !isIntOrNull(r.hp)) return "bad number field";
    if (typeof r.classIcon !== "string" || !(CLASS_IDS as string[]).includes(r.classIcon)) return "bad classIcon";
    if (typeof r.name !== "string" || r.name.length > 200) return "bad row name";
    if (!Array.isArray(r.conditions) || r.conditions.length > 30) return "bad conditions";
    for (const c of r.conditions) {
      if (!isObj(c)) return "bad condition";
      if (typeof c.id !== "string" || !(CONDITION_IDS as string[]).includes(c.id)) return "bad condition id";
      if (c.roundsLeft !== null && !(typeof c.roundsLeft === "number" && Number.isInteger(c.roundsLeft) && c.roundsLeft >= 0))
        return "bad roundsLeft";
      if (c.level !== undefined && !(typeof c.level === "number" && Number.isInteger(c.level) && c.level >= 1 && c.level <= 6))
        return "bad level";
    }
  }
  if (v.deleted !== undefined && typeof v.deleted !== "boolean") return "bad deleted";
  return null;
}

export function asEncounter(v: unknown): Encounter {
  return v as Encounter;
}
