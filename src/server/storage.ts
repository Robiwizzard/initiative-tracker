import { promises as fs } from "node:fs";
import path from "node:path";
import { EMPTY_LIBRARY } from "../shared/types.js";
import type { CustomLibrary, Encounter } from "../shared/types.js";

export type SaveResult = "saved" | "conflict";

export class Storage {
  readonly dir: string;
  private readonly customDir: string;
  constructor(dataDir: string) {
    this.dir = path.join(dataDir, "encounters");
    this.customDir = path.join(dataDir, "custom");
  }

  async init() {
    await fs.mkdir(this.dir, { recursive: true });
    await fs.mkdir(this.customDir, { recursive: true });
  }

  async readLibrary(): Promise<CustomLibrary> {
    try {
      return JSON.parse(await fs.readFile(path.join(this.customDir, "library.json"), "utf8")) as CustomLibrary;
    } catch (e: any) {
      if (e.code === "ENOENT") return { ...EMPTY_LIBRARY, icons: [], conditions: [] };
      throw e;
    }
  }

  async writeLibrary(lib: CustomLibrary) {
    await this.writeAtomic(path.join(this.customDir, "library.json"), lib);
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
    await this.writeAtomic(this.file(slug), enc);
  }

  private async writeAtomic(target: string, data: unknown) {
    const tmp = `${target}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(data, null, 2), "utf8");
    await fs.rename(tmp, target);
  }
}
