import type { ReactNode } from "react";
import type { Action } from "../state/encounterReducer";
import { ThemeToggle } from "./ThemeToggle";

export function Toolbar({ round, dispatch, onNew, onSave, dirty, saving, children }: {
  round: number;
  dispatch: (a: Action) => void;
  onNew: () => void;
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
        <button className="btn" onClick={() => dispatch({ type: "resetCombat" })} title="Round 1, nobody active. Condition durations are kept.">Reset combat</button>
      </div>
      <div className="toolbar-group">
        {children}
        <button className="btn" onClick={onNew}>New</button>
        <button className="btn primary" onClick={onSave} disabled={saving} aria-label={dirty ? "Save (unsaved changes)" : "Save"} title="Save (Ctrl+S)">
          Save{dirty && <span className="dirty-dot" aria-hidden="true" />}
        </button>
        <ThemeToggle />
      </div>
    </div>
  );
}
