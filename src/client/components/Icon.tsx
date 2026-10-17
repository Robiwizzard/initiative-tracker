import type { CSSProperties } from "react";

/** Tinted by `currentColor` via CSS mask, so any SVG from game-icons follows the theme. */
export function Icon({ url, small }: { url: string; small?: boolean }) {
  return <span className={small ? "icon sm" : "icon"} style={{ "--icon": `url("${url}")` } as CSSProperties} aria-hidden="true" />;
}
