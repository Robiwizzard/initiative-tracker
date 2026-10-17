import type { ReactNode } from "react";

export function Tooltip({ text, children }: { text: string; children: ReactNode }) {
  return (
    <span className="tip">
      {children}
      <span className="tip-text" role="tooltip">{text}</span>
    </span>
  );
}
