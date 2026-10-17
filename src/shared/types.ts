export type ClassId =
  | "monster" | "npc"
  | "artificer" | "barbarian" | "bard" | "cleric" | "druid" | "fighter"
  | "monk" | "paladin" | "ranger" | "rogue" | "sorcerer" | "warlock" | "wizard";

export type ConditionId =
  | "blinded" | "charmed" | "deafened" | "exhaustion" | "frightened"
  | "grappled" | "incapacitated" | "invisible" | "paralyzed" | "petrified"
  | "poisoned" | "prone" | "restrained" | "stunned" | "unconscious";

export interface AppliedCondition {
  id: ConditionId;
  roundsLeft: number | null; // null = until removed by hand
  level?: number; // exhaustion only, 1-6
}

export interface Combatant {
  id: string;
  initiative: number | null;
  classIcon: ClassId;
  name: string;
  conditions: AppliedCondition[];
  ac: number | null;
  hp: number | null;
}

export interface Encounter {
  schemaVersion: 1;
  id: string;
  name: string;
  round: number;
  activeId: string | null;
  rows: Combatant[];
  updatedAt: string;
  deleted?: boolean;
}

export const DEFAULT_NAME = "Default Encounter";
