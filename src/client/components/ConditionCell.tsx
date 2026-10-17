import { useRef, useState } from "react";
import { CONDITIONS } from "../../shared/conditions";
import type { AppliedCondition, Combatant, ConditionId } from "../../shared/types";
import type { Action } from "../state/encounterReducer";
import { CONDITION_ICON_URL } from "../icons";
import { Icon } from "./Icon";
import { Popover } from "./Popover";
import { Tooltip } from "./Tooltip";
import { ConditionPicker } from "./ConditionPicker";

const labelOf = (id: ConditionId) => CONDITIONS.find((c) => c.id === id)!.label;

function describe(c: AppliedCondition): string {
  const base = labelOf(c.id);
  if (c.id === "exhaustion") return `${base}, level ${c.level ?? 1}`;
  if (c.roundsLeft === null) return base;
  return `${base}, ${c.roundsLeft} round${c.roundsLeft === 1 ? "" : "s"} left`;
}

function AppliedIcon({ row, cond, dispatch }: { row: Combatant; cond: AppliedCondition; dispatch: (a: Action) => void }) {
  const [open, setOpen] = useState(false);
  const btn = useRef<HTMLButtonElement>(null);
  const [val, setVal] = useState("");
  const isEx = cond.id === "exhaustion";
  const badge = isEx ? cond.level ?? 1 : cond.roundsLeft;
  const apply = () => {
    if (isEx) {
      const n = parseInt(val, 10);
      if (n >= 1) dispatch({ type: "setCondition", rowId: row.id, condition: cond.id, rounds: null, level: n });
    } else {
      const n = parseInt(val, 10);
      dispatch({ type: "setCondition", rowId: row.id, condition: cond.id, rounds: n > 0 ? n : null });
    }
    setOpen(false);
  };
  return (
    <>
      <Tooltip text={describe(cond)}>
        <button
          ref={btn}
          className="icon-btn"
          aria-label={`${describe(cond)} on ${row.name || "row"}. Click to edit`}
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => {
            setVal(isEx ? String(cond.level ?? 1) : cond.roundsLeft === null ? "" : String(cond.roundsLeft));
            setOpen((o) => !o);
          }}
        >
          <Icon url={CONDITION_ICON_URL[cond.id]} />
          {badge !== null && <span className="badge">{badge}</span>}
        </button>
      </Tooltip>
      {open && (
        <Popover anchor={btn} label={`Edit ${labelOf(cond.id)}`} onClose={() => setOpen(false)}>
          <div className="pop-row" style={{ marginTop: 0 }}>
            <label htmlFor={`edit-${row.id}-${cond.id}`}>{isEx ? "Level (1–6)" : "Rounds left"}</label>
            <input
              id={`edit-${row.id}-${cond.id}`}
              className="cell-input num"
              inputMode="numeric"
              placeholder={isEx ? "1" : "until removed"}
              value={val}
              onChange={(e) => /^\d{0,3}$/.test(e.target.value) && setVal(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && apply()}
            />
          </div>
          <div className="pop-row">
            <button className="btn primary" onClick={apply}>Apply</button>
            <button className="btn danger" onClick={() => { dispatch({ type: "removeCondition", rowId: row.id, condition: cond.id }); setOpen(false); }}>Remove</button>
          </div>
        </Popover>
      )}
    </>
  );
}

export function ConditionCell({ row, dispatch }: { row: Combatant; dispatch: (a: Action) => void }) {
  const [open, setOpen] = useState(false);
  const btn = useRef<HTMLButtonElement>(null);
  return (
    <div className="cond-cell">
      {row.conditions.map((c) => (
        <AppliedIcon key={c.id} row={row} cond={c} dispatch={dispatch} />
      ))}
      <Tooltip text="Add condition">
        <button ref={btn} className="icon-btn add-cond" aria-label={`Add condition to ${row.name || "row"}`} aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
          +
        </button>
      </Tooltip>
      {open && (
        <Popover anchor={btn} label="Add condition" onClose={() => setOpen(false)}>
          <ConditionPicker
            applied={row.conditions}
            onAdd={(id, rounds) => {
              dispatch({ type: "addCondition", rowId: row.id, condition: id, rounds });
              setOpen(false);
              btn.current?.focus();
            }}
          />
        </Popover>
      )}
    </div>
  );
}
