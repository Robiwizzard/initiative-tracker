import { useRef, useState } from "react";
import type { AppliedCondition, Combatant, CustomCondition } from "../../shared/types";
import { makeId } from "../../shared/ids";
import type { Action } from "../state/encounterReducer";
import { useLibrary } from "../state/customLibrary";
import { conditionDefaultIconUrl, conditionName, conditionTitle } from "../conditionDisplay";
import { Glyph } from "./Glyph";
import { Popover } from "./Popover";
import { Tooltip } from "./Tooltip";
import { ConditionPicker } from "./ConditionPicker";
import { ConditionEditor } from "./ConditionEditor";
import type { EditorValues } from "./ConditionEditor";

function AppliedIcon({ row, cond, dispatch }: { row: Combatant; cond: AppliedCondition; dispatch: (a: Action) => void }) {
  const lib = useLibrary();
  const [open, setOpen] = useState(false);
  const btn = useRef<HTMLButtonElement>(null);
  const isEx = cond.id === "exhaustion";
  const badge = isEx ? cond.level ?? 1 : cond.roundsLeft;
  const title = conditionTitle(cond);

  const apply = (v: EditorValues) => {
    dispatch({
      type: "setCondition",
      rowId: row.id,
      condition: cond.id,
      rounds: v.rounds,
      level: v.level,
      patch: { name: v.name, description: v.description, icon: v.icon },
    });
    setOpen(false);
    btn.current?.focus();
  };

  return (
    <>
      <Tooltip text={title} detail={cond.description}>
        <button
          ref={btn}
          className="icon-btn"
          aria-label={`${title}${cond.description ? `. ${cond.description}` : ""}. On ${row.name || "row"}. Click to edit`}
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          <Glyph image={cond.icon} url={conditionDefaultIconUrl(cond.id)} />
          {badge !== null && <span className="badge">{badge}</span>}
        </button>
      </Tooltip>
      {open && (
        <Popover anchor={btn} label={`Edit ${conditionName(cond)}`} onClose={() => setOpen(false)} tall>
          <ConditionEditor
            idKey={`edit-${row.id}-${cond.id}`}
            conditionId={cond.id}
            initial={{ name: cond.name ?? "", description: cond.description ?? "", icon: cond.icon ?? null, rounds: cond.roundsLeft, level: cond.level ?? 1 }}
            placeholderName={conditionName({ ...cond, name: undefined })}
            exhaustion={isEx}
            confirmLabel="Apply"
            onConfirm={apply}
            onRemove={() => {
              dispatch({ type: "removeCondition", rowId: row.id, condition: cond.id });
              setOpen(false);
            }}
            onSaveToLibrary={(v) => {
              lib.saveCondition({
                name: v.name.trim() || conditionName({ ...cond, name: undefined }),
                description: v.description.trim(),
                ...(v.icon ? { icon: v.icon } : {}),
              });
              apply(v);
            }}
          />
        </Popover>
      )}
    </>
  );
}

export function ConditionCell({ row, dispatch }: { row: Combatant; dispatch: (a: Action) => void }) {
  const lib = useLibrary();
  const [mode, setMode] = useState<"closed" | "pick" | "create">("closed");
  const btn = useRef<HTMLButtonElement>(null);
  const close = () => {
    setMode("closed");
    btn.current?.focus();
  };
  return (
    <div className="cond-cell">
      {row.conditions.map((c) => (
        <AppliedIcon key={c.id} row={row} cond={c} dispatch={dispatch} />
      ))}
      <Tooltip text="Add condition">
        <button ref={btn} className="icon-btn add-cond" aria-label={`Add condition to ${row.name || "row"}`} aria-haspopup="dialog" aria-expanded={mode !== "closed"} onClick={() => setMode((m) => (m === "closed" ? "pick" : "closed"))}>
          +
        </button>
      </Tooltip>
      {mode === "pick" && (
        <Popover anchor={btn} label="Add condition" onClose={() => setMode("closed")}>
          <ConditionPicker
            applied={row.conditions}
            onAdd={(id, rounds) => {
              dispatch({ type: "addCondition", rowId: row.id, condition: id, rounds });
              close();
            }}
            onAddCustom={(c: CustomCondition, rounds) => {
              dispatch({
                type: "addCondition",
                rowId: row.id,
                condition: c.id,
                rounds,
                custom: { name: c.name, description: c.description, icon: c.icon ?? null },
              });
              close();
            }}
            onNew={() => setMode("create")}
          />
        </Popover>
      )}
      {mode === "create" && (
        <Popover anchor={btn} label="New condition" onClose={() => setMode("closed")} tall>
          <ConditionEditor
            idKey={`new-${row.id}`}
            conditionId="custom"
            initial={{ name: "", description: "", icon: null, rounds: null, level: 1 }}
            placeholderName="e.g. Hexed"
            confirmLabel="Add to this row"
            requireName
            onConfirm={(v) => {
              dispatch({
                type: "addCondition",
                rowId: row.id,
                condition: `custom:${makeId()}`,
                rounds: v.rounds,
                custom: { name: v.name, description: v.description, icon: v.icon },
              });
              close();
            }}
            onSaveToLibrary={(v) => {
              const saved = lib.saveCondition({ name: v.name.trim(), description: v.description.trim(), ...(v.icon ? { icon: v.icon } : {}) });
              dispatch({
                type: "addCondition",
                rowId: row.id,
                condition: saved.id,
                rounds: v.rounds,
                custom: { name: saved.name, description: saved.description, icon: saved.icon ?? null },
              });
              close();
            }}
          />
        </Popover>
      )}
    </div>
  );
}
