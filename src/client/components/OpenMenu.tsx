import { useRef, useState } from "react";
import type { EncounterSummary } from "../state/useEncounterApi";
import { Popover } from "./Popover";

export function OpenMenu({ list, lastSlug, onOpenMenu, onPick, onDelete, error }: {
  list: EncounterSummary[] | null;
  lastSlug: string | null;
  onOpenMenu: () => void;
  onPick: (slug: string) => void;
  onDelete: (item: EncounterSummary) => void;
  error: string | null;
}) {
  const [open, setOpen] = useState(false);
  const btn = useRef<HTMLButtonElement>(null);
  const cont = list?.find((e) => e.slug === lastSlug);
  const rest = list ?? [];
  const fmt = (iso: string) => (iso ? new Date(iso).toLocaleString() : "");
  return (
    <>
      <button
        ref={btn}
        className="btn"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => {
          if (!open) onOpenMenu();
          setOpen((o) => !o);
        }}
      >
        Open ▾
      </button>
      {open && (
        <Popover anchor={btn} label="Open encounter" onClose={() => setOpen(false)}>
          <div className="open-list">
            {cont && (
              <div className="open-item">
                <button className="pick" onClick={() => { setOpen(false); onPick(cont.slug); }}>
                  <span>Continue {cont.name}</span>
                  <small>{fmt(cont.updatedAt)}</small>
                </button>
              </div>
            )}
            {error && <div className="status error">{error}</div>}
            {list === null && !error && <div className="empty-note">Loading…</div>}
            {list !== null && rest.length === 0 && <div className="empty-note">No saved encounters yet.</div>}
            {rest.map((e) => (
              <div className="open-item" key={e.slug}>
                <button className="pick" onClick={() => { setOpen(false); onPick(e.slug); }}>
                  <span>{e.name}</span>
                  <small>{fmt(e.updatedAt)}</small>
                </button>
                <button className="icon-btn" style={{ color: "var(--danger)" }} aria-label={`Delete ${e.name}`} title={`Delete ${e.name}`} onClick={() => { setOpen(false); onDelete(e); }}>
                  ✕
                </button>
              </div>
            ))}
          </div>
        </Popover>
      )}
    </>
  );
}
