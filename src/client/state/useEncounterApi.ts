import type { Encounter } from "../../shared/types";

export interface EncounterSummary {
  slug: string;
  name: string;
  updatedAt: string;
}

export class ConflictError extends Error {}

async function check(res: Response) {
  if (!res.ok) throw new Error(`Server said ${res.status}`);
  return res;
}

export const api = {
  async list(): Promise<EncounterSummary[]> {
    return (await check(await fetch("/api/encounters"))).json();
  },
  async load(slug: string): Promise<Encounter> {
    return (await check(await fetch(`/api/encounters/${slug}`))).json();
  },
  async save(slug: string, enc: Encounter, overwrite = false): Promise<string> {
    const res = await fetch(`/api/encounters/${slug}${overwrite ? "?overwrite=1" : ""}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(enc),
    });
    if (res.status === 409) throw new ConflictError();
    await check(res);
    return (await res.json()).updatedAt as string;
  },
  async remove(slug: string): Promise<void> {
    await check(await fetch(`/api/encounters/${slug}`, { method: "DELETE" }));
  },
};

const KEY = "initiative-tracker:last-slug";
export const lastSlug = {
  get(): string | null {
    try { return localStorage.getItem(KEY); } catch { return null; }
  },
  set(slug: string) {
    try { localStorage.setItem(KEY, slug); } catch { /* convenience only */ }
  },
};
