import { useRef, useState } from "react";
import { CLASSES } from "../../shared/classes";
import type { ClassId } from "../../shared/types";
import { CLASS_ICON_URL } from "../icons";
import { Glyph } from "./Glyph";
import { IconPicker } from "./IconPicker";
import { Popover } from "./Popover";
import { Tooltip } from "./Tooltip";

export function ClassPicker({ value, customIcon, rowName, onPick, onPickCustom }: {
  value: ClassId;
  customIcon?: string;
  rowName: string;
  onPick: (c: ClassId) => void;
  onPickCustom: (dataUrl: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const btn = useRef<HTMLButtonElement>(null);
  const label = customIcon ? "Custom image" : CLASSES.find((c) => c.id === value)!.label;
  const done = () => {
    setOpen(false);
    btn.current?.focus();
  };
  return (
    <>
      <Tooltip text={label}>
        <button ref={btn} className="icon-btn" aria-haspopup="dialog" aria-expanded={open} aria-label={`Class icon for ${rowName || "row"}: ${label}`} onClick={() => setOpen((o) => !o)}>
          <Glyph image={customIcon} url={CLASS_ICON_URL[value]} />
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
                  aria-pressed={!customIcon && c.id === value}
                  style={!customIcon && c.id === value ? { borderColor: "var(--accent)" } : undefined}
                  onClick={() => { onPick(c.id); done(); }}
                >
                  <Glyph url={CLASS_ICON_URL[c.id]} />
                </button>
              </Tooltip>
            ))}
          </div>
          <IconPicker onPick={(d) => { onPickCustom(d); done(); }} />
        </Popover>
      )}
    </>
  );
}
