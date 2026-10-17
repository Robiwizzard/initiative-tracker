import { CONDITIONS } from "../shared/conditions";
import type { AppliedCondition } from "../shared/types";
import { CONDITION_ICON_URL } from "./icons";

export function standardLabel(id: string): string | undefined {
  return CONDITIONS.find((c) => c.id === id)?.label;
}

export const conditionName = (c: AppliedCondition) => c.name || standardLabel(c.id) || "Custom condition";

/** Name plus level or rounds, e.g. "Poisoned, 3 rounds left". */
export function conditionTitle(c: AppliedCondition): string {
  const base = conditionName(c);
  if (c.id === "exhaustion") return `${base}, level ${c.level ?? 1}`;
  if (c.roundsLeft === null) return base;
  return `${base}, ${c.roundsLeft} round${c.roundsLeft === 1 ? "" : "s"} left`;
}

export const conditionDefaultIconUrl = (id: string) => CONDITION_ICON_URL[id] ?? CONDITION_ICON_URL.custom;
