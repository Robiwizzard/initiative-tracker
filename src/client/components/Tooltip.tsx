import { useState } from "react";
import type { FocusEvent, ReactNode } from "react";

interface Placement {
  left: number;
  top?: number;
  bottom?: number;
}

/**
 * Hover/focus tooltip. It is positioned with `position: fixed`, so it is never clipped by the table,
 * and a long description scrolls inside the tooltip instead of scrolling the page or table.
 */
export function Tooltip({ text, detail, children }: { text: string; detail?: string; children: ReactNode }) {
  const [place, setPlace] = useState<Placement | null>(null);
  const wide = !!detail;

  const show = (el: HTMLElement) => {
    const r = el.getBoundingClientRect();
    const half = wide ? 150 : 90;
    const left = Math.max(half + 8, Math.min(r.left + r.width / 2, window.innerWidth - half - 8));
    const roomBelow = window.innerHeight - r.bottom;
    setPlace(roomBelow < (wide ? 220 : 50) && r.top > roomBelow ? { left, bottom: window.innerHeight - r.top } : { left, top: r.bottom });
  };
  const onFocus = (e: FocusEvent<HTMLElement>) => {
    if (e.target.matches(":focus-visible")) show(e.currentTarget);
  };

  return (
    <span
      className="tip"
      onMouseEnter={(e) => show(e.currentTarget)}
      onMouseLeave={() => setPlace(null)}
      onFocus={onFocus}
      onBlur={() => setPlace(null)}
    >
      {children}
      {place && (
        <span className="tip-pop" role="tooltip" style={place}>
          <span className={wide ? "tip-box wide" : "tip-box"}>
            <span className="tip-name">{text}</span>
            {detail && (
              <>
                <span className="tip-rule" />
                <span className="tip-detail">{detail}</span>
              </>
            )}
          </span>
        </span>
      )}
    </span>
  );
}
