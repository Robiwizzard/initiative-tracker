export type ClassId =
  | "monster" | "npc"
  | "artificer" | "barbarian" | "bard" | "cleric" | "druid" | "fighter"
  | "monk" | "paladin" | "ranger" | "rogue" | "sorcerer" | "warlock" | "wizard";

export type ConditionId =
  | "blinded" | "charmed" | "deafened" | "exhaustion" | "frightened"
  | "grappled" | "incapacitated" | "invisible" | "paralyzed" | "petrified"
  | "poisoned" | "prone" | "restrained" | "stunned" | "unconscious";

/** A standard condition id, or `custom:<uuid>` for a user-made one. */
export type AppliedConditionId = ConditionId | `custom:${string}`;

export interface AppliedCondition {
  id: AppliedConditionId;
  roundsLeft: number | null; // null = until removed by hand
  level?: number; // exhaustion only, 1-6
  /** Overrides, saved with the encounter so it stays self-contained. */
  name?: string;
  description?: string;
  icon?: string; // image data URL
}

export interface Combatant {
  id: string;
  initiative: number | null;
  classIcon: ClassId;
  customIcon?: string; // image data URL, shown instead of the class icon
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

/** Reusable things the user made; stored in `$DATA_DIR/custom/library.json`. */
export interface CustomIcon {
  id: string;
  name: string;
  dataUrl: string;
}

export interface CustomCondition {
  id: `custom:${string}`;
  name: string;
  description: string;
  icon?: string; // image data URL
}

export interface CustomLibrary {
  schemaVersion: 1;
  icons: CustomIcon[];
  conditions: CustomCondition[];
}

export const EMPTY_LIBRARY: CustomLibrary = { schemaVersion: 1, icons: [], conditions: [] };
