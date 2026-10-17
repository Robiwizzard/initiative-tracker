import type { Encounter } from "../../shared/types";
import type { Action } from "../state/encounterReducer";
import { CombatRow } from "./CombatRow";

export function CombatTable({ encounter, dispatch }: { encounter: Encounter; dispatch: (a: Action) => void }) {
  return (
    <div className="table-wrap">
      <table aria-label="Initiative order">
        <thead>
          <tr>
            <th className="col-init">Init</th>
            <th>Name</th>
            <th>Conditions</th>
            <th className="col-num">AC</th>
            <th className="col-num">HP</th>
            <th className="col-x"><span className="sr-only">Remove</span></th>
          </tr>
        </thead>
        <tbody>
          {encounter.rows.map((r) => (
            <CombatRow key={r.id} row={r} active={r.id === encounter.activeId} dispatch={dispatch} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
