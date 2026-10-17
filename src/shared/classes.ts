import type { ClassId } from "./types.js";

export const CLASSES: { id: ClassId; label: string }[] = [
  { id: "monster", label: "Monster" },
  { id: "npc", label: "NPC" },
  { id: "artificer", label: "Artificer" },
  { id: "barbarian", label: "Barbarian" },
  { id: "bard", label: "Bard" },
  { id: "cleric", label: "Cleric" },
  { id: "druid", label: "Druid" },
  { id: "fighter", label: "Fighter" },
  { id: "monk", label: "Monk" },
  { id: "paladin", label: "Paladin" },
  { id: "ranger", label: "Ranger" },
  { id: "rogue", label: "Rogue" },
  { id: "sorcerer", label: "Sorcerer" },
  { id: "warlock", label: "Warlock" },
  { id: "wizard", label: "Wizard" },
];

export const CLASS_IDS = CLASSES.map((c) => c.id);
