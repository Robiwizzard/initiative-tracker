/** Uploaded icons are stored as small data URLs inside the JSON files. */
export const MAX_ICON_CHARS = 150_000;
export const DATA_URL_RE = /^data:image\/(png|jpeg|webp|gif|svg\+xml);base64,[A-Za-z0-9+/=]+$/;

export const isIconDataUrl = (v: unknown): v is string =>
  typeof v === "string" && v.length <= MAX_ICON_CHARS && DATA_URL_RE.test(v);
