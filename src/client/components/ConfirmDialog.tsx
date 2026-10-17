import { useEffect, useRef } from "react";

export function ConfirmDialog({ message, confirmLabel = "OK", onConfirm, onCancel }: { message: string; confirmLabel?: string; onConfirm: () => void; onCancel: () => void }) {
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCancel]);
  return (
    <div className="dialog-back" onMouseDown={onCancel}>
      <div className="dialog" role="alertdialog" aria-modal="true" aria-label={message} onMouseDown={(e) => e.stopPropagation()}>
        <p>{message}</p>
        <div className="dialog-actions">
          <button className="btn" onClick={onCancel}>Cancel</button>
          <button ref={ref} className="btn primary" onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
