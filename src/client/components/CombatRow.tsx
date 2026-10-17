import { memo } from "react";
import type { Combatant } from "../../shared/types";
import type { Action } from "../state/encounterReducer";
import { ClassPicker } from "./ClassPicker";
import { ConditionCell } from "./ConditionCell";
import { IntField } from "./IntField";

export const CombatRow = memo(function CombatRow({ row, active, dispatch }: { row: Combatant; active: boolean; dispatch: (a: Action) => void }) {
  const who = row.name || "row";
  const focusName = () => document.querySelector<HTMLInputElement>(`tr[data-row="${row.id}"] [data-field="name"]`)?.focus();
  return (
    <tr className={active ? "active" : undefined} data-row={row.id} aria-current={active ? "true" : undefined}>
      <td>
        <IntField
          value={row.initiative}
          label={`Initiative for ${who}`}
          dataField="initiative"
          onChange={(v) => dispatch({ type: "editNumber", rowId: row.id, field: "initiative", value: v })}
          onEnter={focusName}
        />
      </td>
      <td>
        <div className="name-cell">
          <ClassPicker
            value={row.classIcon}
            customIcon={row.customIcon}
            rowName={row.name}
            onPick={(c) => dispatch({ type: "setClass", rowId: row.id, classIcon: c })}
            onPickCustom={(d) => dispatch({ type: "setCustomIcon", rowId: row.id, icon: d })}
          />
          <input
            className="cell-input"
            value={row.name}
            placeholder="Name"
            maxLength={100}
            aria-label="Combatant name"
            data-field="name"
            onChange={(e) => dispatch({ type: "editName", rowId: row.id, name: e.target.value })}
          />
          {active && <span className="sr-only">Current turn</span>}
        </div>
      </td>
      <td>
        <ConditionCell row={row} dispatch={dispatch} />
      </td>
      <td>
        <IntField value={row.ac} label={`AC for ${who}`} onChange={(v) => dispatch({ type: "editNumber", rowId: row.id, field: "ac", value: v })} />
      </td>
      <td>
        <IntField
          value={row.hp}
          label={`HP for ${who}`}
          className={row.hp !== null && row.hp <= 0 ? "hp-low" : ""}
          onChange={(v) => dispatch({ type: "editNumber", rowId: row.id, field: "hp", value: v })}
        />
      </td>
      <td>
        <button className="icon-btn" style={{ color: "var(--danger)" }} aria-label={`Remove ${who}`} title={`Remove ${who}`} onClick={() => dispatch({ type: "removeRow", rowId: row.id })}>
          ✕
        </button>
      </td>
    </tr>
  );
});
