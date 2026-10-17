import { useState } from "react";
import { CONDITIONS } from "../../shared/conditions";
import type { AppliedCondition, ConditionId } from "../../shared/types";
import { CONDITION_ICON_URL } from "../icons";
import { Icon } from "./Icon";

/** Add-condition panel: pick a condition, with an optional duration in rounds. */
export function ConditionPicker({ applied, onAdd }: { applied: AppliedCondition[]; onAdd: (id: ConditionId, rounds: number | null) => void }) {
  const [rounds, setRounds] = useState("");
  const r = /^\d+$/.test(rounds) && parseInt(rounds, 10) > 0 ? parseInt(rounds, 10) : null;
  return (
    <div>
      <div className="cond-grid">
        {CONDITIONS.map((c) => {
          const cur = applied.find((a) => a.id === c.id);
          const stack = c.id === "exhaustion" && cur;
          return (
            <button key={c.id} className="cond-opt" onClick={() => onAdd(c.id, r)} aria-label={stack ? `Add a level of ${c.label}` : `Add ${c.label}`}>
              <Icon url={CONDITION_ICON_URL[c.id]} small />
              <span>{c.label}{stack ? " +1" : ""}</span>
            </button>
          );
        })}
      </div>
      <div className="pop-row">
        <label htmlFor="cond-rounds">Rounds (optional)</label>
        <input
          id="cond-rounds"
          className="cell-input num"
          inputMode="numeric"
          placeholder="until removed"
          value={rounds}
          onChange={(e) => /^\d{0,3}$/.test(e.target.value) && setRounds(e.target.value)}
        />
      </div>
    </div>
  );
}
