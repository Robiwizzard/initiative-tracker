import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { ReactNode, RefObject } from "react";

/** Fixed-position popover under an anchor. Closes on Escape or an outside click. */
export function Popover({ anchor, onClose, label, tall, children }: { anchor: RefObject<HTMLElement | null>; onClose: () => void; label: string; tall?: boolean; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number }>({ top: -9999, left: -9999 });

  useLayoutEffect(() => {
    const place = () => {
      const a = anchor.current?.getBoundingClientRect();
      const p = ref.current?.getBoundingClientRect();
      if (!a || !p) return;
      const left = Math.min(a.left, window.innerWidth - p.width - 8);
      let top = a.bottom + 4;
      if (top + p.height > window.innerHeight - 8) top = Math.max(8, a.top - p.height - 4);
      if (top + p.height > window.innerHeight - 8) top = Math.max(8, window.innerHeight - p.height - 8);
      setPos((old) => (old.top === top && old.left === Math.max(8, left) ? old : { top, left: Math.max(8, left) }));
    };
    place();
    const ro = new ResizeObserver(place);
    if (ref.current) ro.observe(ref.current);
    return () => ro.disconnect();
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
    <div ref={ref} className={tall ? "popover tall" : "popover"} role="dialog" aria-label={label} style={pos}>
      {children}
    </div>
  );
}
