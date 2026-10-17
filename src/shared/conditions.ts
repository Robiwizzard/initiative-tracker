import type { ConditionId } from "./types.js";

export const CONDITIONS: { id: ConditionId; label: string }[] = [
  { id: "blinded", label: "Blinded" },
  { id: "charmed", label: "Charmed" },
  { id: "deafened", label: "Deafened" },
  { id: "exhaustion", label: "Exhaustion" },
  { id: "frightened", label: "Frightened" },
  { id: "grappled", label: "Grappled" },
  { id: "incapacitated", label: "Incapacitated" },
  { id: "invisible", label: "Invisible" },
  { id: "paralyzed", label: "Paralyzed" },
  { id: "petrified", label: "Petrified" },
  { id: "poisoned", label: "Poisoned" },
  { id: "prone", label: "Prone" },
  { id: "restrained", label: "Restrained" },
  { id: "stunned", label: "Stunned" },
  { id: "unconscious", label: "Unconscious" },
];

export const CONDITION_IDS = CONDITIONS.map((c) => c.id);
