import { useRef, useState } from "react";
import { CLASSES } from "../../shared/classes";
import type { ClassId } from "../../shared/types";
import { CLASS_ICON_URL } from "../icons";
import { Icon } from "./Icon";
import { Popover } from "./Popover";
import { Tooltip } from "./Tooltip";

export function ClassPicker({ value, rowName, onPick }: { value: ClassId; rowName: string; onPick: (c: ClassId) => void }) {
  const [open, setOpen] = useState(false);
  const btn = useRef<HTMLButtonElement>(null);
  const label = CLASSES.find((c) => c.id === value)!.label;
  return (
    <>
      <Tooltip text={label}>
        <button ref={btn} className="icon-btn" aria-haspopup="dialog" aria-expanded={open} aria-label={`Class icon for ${rowName || "row"}: ${label}`} onClick={() => setOpen((o) => !o)}>
          <Icon url={CLASS_ICON_URL[value]} />
        </button>
      </Tooltip>
      {open && (
        <Popover anchor={btn} label="Choose class icon" onClose={() => setOpen(false)}>
          <div className="class-grid">
            {CLASSES.map((c) => (
              <Tooltip key={c.id} text={c.label}>
                <button
                  className="icon-btn"
                  aria-label={c.label}
                  aria-pressed={c.id === value}
                  style={c.id === value ? { borderColor: "var(--accent)" } : undefined}
                  onClick={() => { onPick(c.id); setOpen(false); btn.current?.focus(); }}
                >
                  <Icon url={CLASS_ICON_URL[c.id]} />
                </button>
              </Tooltip>
            ))}
          </div>
        </Popover>
      )}
    </>
  );
}
