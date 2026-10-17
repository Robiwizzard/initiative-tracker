import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { ReactNode, RefObject } from "react";

/** Fixed-position popover under an anchor. Closes on Escape or an outside click. */
export function Popover({ anchor, onClose, label, children }: { anchor: RefObject<HTMLElement | null>; onClose: () => void; label: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number }>({ top: -9999, left: -9999 });

  useLayoutEffect(() => {
    const a = anchor.current?.getBoundingClientRect();
    const p = ref.current?.getBoundingClientRect();
    if (!a || !p) return;
    let left = Math.min(a.left, window.innerWidth - p.width - 8);
    let top = a.bottom + 4;
    if (top + p.height > window.innerHeight - 8) top = Math.max(8, a.top - p.height - 4);
    setPos({ top, left: Math.max(8, left) });
  }, [anchor]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        anchor.current?.focus();
      }
    };
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!ref.current?.contains(t) && !anchor.current?.contains(t)) onClose();
    };
    document.addEventListener("keydown", onKey, true);
    document.addEventListener("mousedown", onDown);
    ref.current?.querySelector<HTMLElement>("button, input")?.focus();
    return () => {
      document.removeEventListener("keydown", onKey, true);
      document.removeEventListener("mousedown", onDown);
    };
  }, [anchor, onClose]);

  return (
    <div ref={ref} className="popover" role="dialog" aria-label={label} style={pos}>
      {children}
    </div>
  );
}
