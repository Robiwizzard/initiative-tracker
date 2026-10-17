import { CLASS_IDS } from "../shared/classes.js";
import { CONDITION_IDS } from "../shared/conditions.js";
import { isIconDataUrl } from "../shared/images.js";
import type { CustomLibrary, Encounter } from "../shared/types.js";

const CUSTOM_ID_RE = /^custom:[A-Za-z0-9-]{1,64}$/;

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
    if (r.customIcon !== undefined && !isIconDataUrl(r.customIcon)) return "bad customIcon";
    if (!Array.isArray(r.conditions) || r.conditions.length > 30) return "bad conditions";
    for (const c of r.conditions) {
      if (!isObj(c)) return "bad condition";
      if (typeof c.id !== "string" || !((CONDITION_IDS as string[]).includes(c.id) || CUSTOM_ID_RE.test(c.id)))
        return "bad condition id";
      if (c.name !== undefined && (typeof c.name !== "string" || c.name.length > 100)) return "bad condition name";
      if (c.description !== undefined && (typeof c.description !== "string" || c.description.length > 2000))
        return "bad condition description";
      if (c.icon !== undefined && !isIconDataUrl(c.icon)) return "bad condition icon";
      if (c.roundsLeft !== null && !(typeof c.roundsLeft === "number" && Number.isInteger(c.roundsLeft) && c.roundsLeft >= 0))
        return "bad roundsLeft";
      if (c.level !== undefined && !(typeof c.level === "number" && Number.isInteger(c.level) && c.level >= 1 && c.level <= 6))
        return "bad level";
    }
  }
  if (v.deleted !== undefined && typeof v.deleted !== "boolean") return "bad deleted";
  return null;
}

/** Returns an error message, or null when the value is a valid CustomLibrary. */
export function validateLibrary(v: unknown): string | null {
  if (!isObj(v)) return "body must be an object";
  if (v.schemaVersion !== 1) return "schemaVersion must be 1";
  if (!Array.isArray(v.icons) || v.icons.length > 200) return "bad icons";
  for (const i of v.icons) {
    if (!isObj(i)) return "bad icon";
    if (typeof i.id !== "string" || !/^[A-Za-z0-9-]{1,64}$/.test(i.id)) return "bad icon id";
    if (typeof i.name !== "string" || i.name.length > 100) return "bad icon name";
    if (!isIconDataUrl(i.dataUrl)) return "bad icon image";
  }
  if (!Array.isArray(v.conditions) || v.conditions.length > 200) return "bad conditions";
  for (const c of v.conditions) {
    if (!isObj(c)) return "bad condition";
    if (typeof c.id !== "string" || !CUSTOM_ID_RE.test(c.id)) return "bad condition id";
    if (typeof c.name !== "string" || c.name.length < 1 || c.name.length > 100) return "bad condition name";
    if (typeof c.description !== "string" || c.description.length > 2000) return "bad condition description";
    if (c.icon !== undefined && !isIconDataUrl(c.icon)) return "bad condition icon";
  }
  return null;
}

export const asLibrary = (v: unknown) => v as CustomLibrary;

export function asEncounter(v: unknown): Encounter {
  return v as Encounter;
}
