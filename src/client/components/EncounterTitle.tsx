import { useEffect, useRef, useState } from "react";

export function EncounterTitle({ name, onCommit }: { name: string; onCommit: (n: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);
  const input = useRef<HTMLInputElement>(null);
  const cancelled = useRef(false);

  useEffect(() => {
    if (editing) input.current?.select();
  }, [editing]);

  const start = () => {
    cancelled.current = false;
    setDraft(name);
    setEditing(true);
  };
  const finish = () => {
    if (!cancelled.current) onCommit(draft);
    setEditing(false);
  };

  return (
    <div className="title-wrap">
      {editing ? (
        <input
          ref={input}
          className="title-input"
          value={draft}
          aria-label="Encounter name"
          maxLength={100}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={finish}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
            if (e.key === "Escape") {
              cancelled.current = true;
              e.currentTarget.blur();
            }
          }}
          autoFocus
        />
      ) : (
        <button className="title-btn" onClick={start} title="Click to rename" aria-label={`Encounter name: ${name}. Click to rename`}>
          {name}
        </button>
      )}
    </div>
  );
}
