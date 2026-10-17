import type { ReactNode } from "react";
import type { Action } from "../state/encounterReducer";

export function Toolbar({ round, dispatch, onNew, onReset, onSave, dirty, saving, children }: {
  round: number;
  dispatch: (a: Action) => void;
  onNew: () => void;
  onReset: () => void;
  onSave: () => void;
  dirty: boolean;
  saving: boolean;
  children: ReactNode; // Open menu
}) {
  return (
    <div className="toolbar" role="toolbar" aria-label="Encounter controls">
      <div className="toolbar-group">
        <span className="round" aria-live="polite">
          Round {round}
        </span>
        <button className="btn" onClick={() => dispatch({ type: "prev" })} aria-label="Previous turn">◀ Prev</button>
        <button className="btn primary" onClick={() => dispatch({ type: "next" })} aria-label="Next turn">Next ▶</button>
        <button className="btn" onClick={() => dispatch({ type: "sort" })}>Sort</button>
        <button className="btn" onClick={() => dispatch({ type: "addRow" })}>+ Row</button>
        <button className="btn" onClick={onReset} title="Round 1 and six empty rows. Keeps the encounter name.">Reset combat</button>
      </div>
      <div className="toolbar-group">
        {children}
        <button className="btn" onClick={onNew}>New</button>
        <button className="btn primary" onClick={onSave} disabled={saving} aria-label={dirty ? "Save (unsaved changes)" : "Save"} title="Save (Ctrl+S)">
          Save{dirty && <span className="dirty-dot" aria-hidden="true" />}
        </button>
      </div>
    </div>
  );
}
