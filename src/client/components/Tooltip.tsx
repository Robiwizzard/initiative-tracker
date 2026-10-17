import type { ReactNode } from "react";

export function Tooltip({ text, detail, children }: { text: string; detail?: string; children: ReactNode }) {
  return (
    <span className="tip">
      {children}
      <span className="tip-text" role="tooltip">
        {text}
        {detail && <span className="tip-detail">{detail}</span>}
      </span>
    </span>
  );
}
