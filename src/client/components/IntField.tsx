import { useEffect, useState } from "react";
import type { KeyboardEvent } from "react";

const parse = (t: string): number | null => (/^-?\d+$/.test(t) ? parseInt(t, 10) : null);

export function IntField({ value, onChange, label, className = "", dataField, onEnter }: {
  value: number | null;
  onChange: (v: number | null) => void;
  label: string;
  className?: string;
  dataField?: string;
  onEnter?: () => void;
}) {
  const [text, setText] = useState(value === null ? "" : String(value));
  useEffect(() => {
    if (parse(text) !== value && !(value === null && (text === "" || text === "-"))) setText(value === null ? "" : String(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && onEnter) {
      e.preventDefault();
      onEnter();
    }
  };
  return (
    <input
      className={`cell-input num ${className}`}
      inputMode="numeric"
      value={text}
      placeholder="—"
      aria-label={label}
      data-field={dataField}
      onKeyDown={onKey}
      onChange={(e) => {
        const t = e.target.value;
        if (!/^-?\d*$/.test(t)) return;
        setText(t);
        onChange(parse(t));
      }}
    />
  );
}
