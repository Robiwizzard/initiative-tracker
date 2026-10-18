import { useState } from "react";
import { conditionDefaultIconUrl } from "../conditionDisplay";
import { Glyph } from "./Glyph";
import { IconPicker } from "./IconPicker";

export interface EditorValues {
  name: string;
  description: string;
  icon: string | null;
  rounds: number | null;
  level: number;
}

/** Name, description, icon and duration of one condition on one combatant. */
export function ConditionEditor({ idKey, conditionId, initial, placeholderName, exhaustion, confirmLabel, requireName, onConfirm, onRemove, onSaveToLibrary }: {
  idKey: string;
  conditionId: string;
  initial: EditorValues;
  placeholderName: string;
  exhaustion?: boolean;
  confirmLabel: string;
  requireName?: boolean;
  onConfirm: (v: EditorValues) => void;
  onRemove?: () => void;
  onSaveToLibrary?: (v: EditorValues) => void;
}) {
  const [name, setName] = useState(initial.name);
  const [description, setDescription] = useState(initial.description);
  const [icon, setIcon] = useState<string | null>(initial.icon);
  const [num, setNum] = useState(
    exhaustion ? String(initial.level) : initial.rounds === null ? "" : String(initial.rounds),
  );

  const values = (): EditorValues => {
    const n = parseInt(num, 10);
    return {
      name,
      description,
      icon,
      rounds: !exhaustion && n > 0 ? n : null,
      level: exhaustion && n >= 1 ? Math.min(6, n) : initial.level,
    };
  };
  const nameMissing = requireName && name.trim() === "";

  return (
    <div className="editor">
      <div className="pop-field">
        <label htmlFor={`${idKey}-name`}>Name</label>
        <input id={`${idKey}-name`} className="cell-input wide" value={name} maxLength={100} placeholder={placeholderName} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="pop-field">
        <label htmlFor={`${idKey}-desc`}>Description (shown on hover)</label>
        <textarea id={`${idKey}-desc`} className="cell-input wide area" value={description} maxLength={2000} rows={3} placeholder="What does this do?" onChange={(e) => setDescription(e.target.value)} />
      </div>
      <div className="pop-field">
        <span className="pop-label">Icon</span>
        <IconPicker
          onPick={(d) => setIcon(d)}
          leading={
            <span className="icon-btn" style={{ cursor: "default" }} aria-label="Current icon">
              <Glyph image={icon ?? undefined} url={conditionDefaultIconUrl(conditionId)} />
            </span>
          }
          extra={
            icon ? (
              <button className="btn" onClick={() => setIcon(null)}>
                Default icon
              </button>
            ) : undefined
          }
        />
      </div>
      <div className="pop-row">
        <label htmlFor={`${idKey}-num`}>{exhaustion ? "Level (1–6)" : "Rounds"}</label>
        <input
          id={`${idKey}-num`}
          className="cell-input num"
          inputMode="numeric"
          placeholder={exhaustion ? "1" : "until removed"}
          value={num}
          onChange={(e) => /^\d{0,3}$/.test(e.target.value) && setNum(e.target.value)}
        />
      </div>
      <div className="pop-row">
        <button className="btn primary" disabled={nameMissing} onClick={() => onConfirm(values())}>
          {confirmLabel}
        </button>
        {onRemove && (
          <button className="btn danger" onClick={onRemove}>
            Remove
          </button>
        )}
        {onSaveToLibrary && (
          <button className="btn" disabled={name.trim() === "" && description.trim() === "" && !icon} onClick={() => onSaveToLibrary(values())} title="Add this to the + list for every encounter">
            Save to my conditions
          </button>
        )}
      </div>
    </div>
  );
}
