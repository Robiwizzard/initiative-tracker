import { promises as fs } from "node:fs";
import path from "node:path";
import type { Encounter } from "../shared/types.js";

export type SaveResult = "saved" | "conflict";

export class Storage {
  readonly dir: string;
  constructor(dataDir: string) {
    this.dir = path.join(dataDir, "encounters");
  }

  async init() {
    await fs.mkdir(this.dir, { recursive: true });
  }

  private file(slug: string) {
    return path.join(this.dir, `${slug}.json`);
  }

  async read(slug: string): Promise<Encounter | null> {
    try {
      return JSON.parse(await fs.readFile(this.file(slug), "utf8")) as Encounter;
    } catch (e: any) {
      if (e.code === "ENOENT") return null;
      throw e;
    }
  }

  async list(): Promise<{ slug: string; name: string; updatedAt: string }[]> {
    const out: { slug: string; name: string; updatedAt: string }[] = [];
    for (const f of await fs.readdir(this.dir)) {
      if (!f.endsWith(".json")) continue;
      const slug = f.slice(0, -5);
      try {
        const enc = await this.read(slug);
        if (enc && !enc.deleted) out.push({ slug, name: enc.name, updatedAt: enc.updatedAt });
      } catch {
        /* skip unreadable files */
      }
    }
    return out.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  /** Same id or no file: write. Different id (and not overwrite): conflict. */
  async save(slug: string, enc: Encounter, overwrite = false): Promise<SaveResult> {
    const existing = await this.read(slug);
    if (existing && !existing.deleted && existing.id !== enc.id && !overwrite) return "conflict";
    const toWrite: Encounter = { ...enc, updatedAt: new Date().toISOString() };
    delete toWrite.deleted;
    await this.write(slug, toWrite);
    return "saved";
  }

  async softDelete(slug: string): Promise<boolean> {
    const existing = await this.read(slug);
    if (!existing) return false;
    await this.write(slug, { ...existing, deleted: true, updatedAt: new Date().toISOString() });
    return true;
  }

  private async write(slug: string, enc: Encounter) {
    const target = this.file(slug);
    const tmp = `${target}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(enc, null, 2), "utf8");
    await fs.rename(tmp, target);
  }
}
