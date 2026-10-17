import { useState } from "react";
import { CONDITIONS } from "../../shared/conditions";
import type { AppliedCondition, AppliedConditionId, CustomCondition } from "../../shared/types";
import { CONDITION_ICON_URL } from "../icons";
import { conditionDefaultIconUrl } from "../conditionDisplay";
import { useLibrary } from "../state/customLibrary";
import { Glyph } from "./Glyph";
import { Icon } from "./Icon";
import { Tooltip } from "./Tooltip";

/** Add-condition panel: standard conditions, your own, and a way to make a new one. */
export function ConditionPicker({ applied, onAdd, onAddCustom, onNew }: {
  applied: AppliedCondition[];
  onAdd: (id: AppliedConditionId, rounds: number | null) => void;
  onAddCustom: (c: CustomCondition, rounds: number | null) => void;
  onNew: () => void;
}) {
  const lib = useLibrary();
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
      {lib.library.conditions.length > 0 && (
        <>
          <div className="pop-label" style={{ marginTop: 10 }}>My conditions</div>
          <div className="cond-grid">
            {lib.library.conditions.map((c) => (
              <span className="my-cond" key={c.id}>
                <Tooltip text={c.name} detail={c.description || undefined}>
                  <button className="cond-opt" aria-label={`Add my condition ${c.name}`} onClick={() => onAddCustom(c, r)}>
                    <Glyph image={c.icon} url={conditionDefaultIconUrl(c.id)} small />
                    <span>{c.name}</span>
                  </button>
                </Tooltip>
                <button className="my-icon-x" aria-label={`Delete my condition ${c.name}`} title="Delete from my conditions" onClick={() => lib.removeCondition(c.id)}>
                  ✕
                </button>
              </span>
            ))}
          </div>
        </>
      )}
      <div className="pop-row">
        <button className="btn" onClick={onNew}>+ New condition…</button>
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
      {lib.error && <div className="status error">{lib.error}</div>}
    </div>
  );
}
