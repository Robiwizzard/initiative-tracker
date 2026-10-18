import { useRef, useState } from "react";
import type { ReactNode } from "react";
import { useLibrary } from "../state/customLibrary";
import { fileToIconDataUrl } from "../imageUpload";
import { Tooltip } from "./Tooltip";

/** Your uploaded images (shown by default, can be hidden) plus a button to upload another. */
export function IconPicker({ onPick, leading, extra }: { onPick: (dataUrl: string) => void; leading?: ReactNode; extra?: ReactNode }) {
  const lib = useLibrary();
  const input = useRef<HTMLInputElement>(null);
  const [show, setShow] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const upload = async (file: File | undefined) => {
    if (!file) return;
    try {
      const dataUrl = await fileToIconDataUrl(file);
      const icon = lib.addIcon(file.name.replace(/\.[^.]+$/, "") || "Icon", dataUrl);
      setError(null);
      setShow(true);
      onPick(icon.dataUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not use that image.");
    }
  };

  return (
    <div className="icon-picker">
      <div className="pop-row" style={{ marginTop: 0 }}>
        {leading}
        <button className="btn" onClick={() => setShow((s) => !s)} aria-expanded={show}>
          {show ? "Hide my icons" : "Show my icons"}
        </button>
        <button className="btn" onClick={() => input.current?.click()}>Upload image…</button>
        {extra}
        <input
          ref={input}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            void upload(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </div>
      {show && (
        <>
          <div className="pop-label" style={{ marginTop: 8 }}>My icons</div>
          {lib.library.icons.length === 0 ? (
            <div className="pop-hint">Nothing uploaded yet.</div>
          ) : (
            <div className="class-grid">
              {lib.library.icons.map((i) => (
                <span className="my-icon" key={i.id}>
                  <Tooltip text={i.name}>
                    <button className="icon-btn" aria-label={`Use my icon ${i.name}`} onClick={() => onPick(i.dataUrl)}>
                      <img className="icon-img" src={i.dataUrl} alt="" />
                    </button>
                  </Tooltip>
                  <button className="my-icon-x" aria-label={`Remove ${i.name} from my icons`} title="Remove from my icons" onClick={() => lib.removeIcon(i.id)}>
                    ✕
                  </button>
                </span>
              ))}
            </div>
          )}
        </>
      )}
      <div className="pop-hint">Shown in full colour, resized to 96 px. Transparent PNGs look best.</div>
      {error && <div className="status error">{error}</div>}
      {lib.error && <div className="status error">{lib.error}</div>}
    </div>
  );
}
