export const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,63}$/;

export function slugify(name: string): string {
  const s = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64)
    .replace(/-+$/g, "");
  return s || "encounter";
}
