import { useLayoutEffect, useRef, useState } from "react";
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
  const pop = useRef<HTMLSpanElement>(null);
  const anchorX = useRef(0);
  const wide = !!detail;

  // The box is as wide as its content (up to a maximum), so keep it on screen once its width is known.
  useLayoutEffect(() => {
    const w = pop.current?.getBoundingClientRect().width;
    if (!w || !place) return;
    const left = Math.max(w / 2 + 8, Math.min(anchorX.current, window.innerWidth - w / 2 - 8));
    if (Math.abs(left - place.left) > 0.5) setPlace({ ...place, left });
  }, [place]);

  const show = (el: HTMLElement) => {
    const r = el.getBoundingClientRect();
    anchorX.current = r.left + r.width / 2;
    const left = anchorX.current;
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
        <span ref={pop} className="tip-pop" role="tooltip" style={place}>
          <span className="tip-box">
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
