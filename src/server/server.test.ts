import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { mkdtempSync, readFileSync, existsSync, readdirSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import type { Server } from "node:http";
import { createApp } from "./app.js";
import { Storage } from "./storage.js";
import { validateEncounter } from "./validate.js";
import type { Encounter } from "../shared/types.js";

const mk = (id: string, name = "Goblin Ambush"): Encounter => ({
  schemaVersion: 1,
  id,
  name,
  round: 1,
  activeId: null,
  rows: [
    { id: "r1", initiative: 12, classIcon: "monster", name: "Goblin", conditions: [{ id: "prone", roundsLeft: 2 }], ac: 15, hp: 7 },
  ],
  updatedAt: "",
});

describe("validateEncounter", () => {
  it("accepts a good encounter", () => expect(validateEncounter(mk("a"))).toBeNull());
  it("rejects bad shapes", () => {
    expect(validateEncounter(null)).not.toBeNull();
    expect(validateEncounter({ ...mk("a"), schemaVersion: 2 })).not.toBeNull();
    expect(validateEncounter({ ...mk("a"), rows: "x" })).not.toBeNull();
    const bad = mk("a");
    (bad.rows[0] as any).hp = 1.5;
    expect(validateEncounter(bad)).not.toBeNull();
    (bad.rows[0] as any).hp = 1;
    (bad.rows[0] as any).classIcon = "jedi";
    expect(validateEncounter(bad)).not.toBeNull();
  });
});

describe("api", () => {
  let server: Server;
  let base: string;
  let dir: string;
  beforeAll(async () => {
    dir = mkdtempSync(path.join(os.tmpdir(), "it-"));
    const storage = new Storage(dir);
    await storage.init();
    server = createApp(storage).listen(0, "127.0.0.1");
    await new Promise((r) => server.once("listening", r));
    base = `http://127.0.0.1:${(server.address() as any).port}`;
  });
  afterAll(() => server.close());

  const put = (slug: string, body: unknown, q = "") =>
    fetch(`${base}/api/encounters/${slug}${q}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });

  it("saves, lists and reloads", async () => {
    expect((await put("goblin-ambush", mk("id1"))).status).toBe(200);
    expect(existsSync(path.join(dir, "encounters", "goblin-ambush.json"))).toBe(true);
    expect(readdirSync(path.join(dir, "encounters")).some((f) => f.endsWith(".tmp"))).toBe(false);
    const list = await (await fetch(`${base}/api/encounters`)).json();
    expect(list).toHaveLength(1);
    expect(list[0].name).toBe("Goblin Ambush");
    const got = await (await fetch(`${base}/api/encounters/goblin-ambush`)).json();
    expect(got.rows[0].name).toBe("Goblin");
  });

  it("overwrites with same id, 409 with different id, overwrite=1 forces", async () => {
    expect((await put("goblin-ambush", { ...mk("id1"), round: 3 })).status).toBe(200);
    expect((await put("goblin-ambush", mk("other"))).status).toBe(409);
    expect((await put("goblin-ambush", mk("other"), "?overwrite=1")).status).toBe(200);
    const got = await (await fetch(`${base}/api/encounters/goblin-ambush`)).json();
    expect(got.id).toBe("other");
  });

  it("rejects bad slug and bad body", async () => {
    expect((await put("Bad_Slug", mk("x"))).status).toBe(400);
    expect((await fetch(`${base}/api/encounters/..%2Fetc`)).status).toBe(400);
    expect((await put("ok", { nope: true })).status).toBe(400);
  });

  it("soft deletes: hidden from list, file stays with deleted:true", async () => {
    expect((await fetch(`${base}/api/encounters/goblin-ambush`, { method: "DELETE" })).status).toBe(200);
    expect(await (await fetch(`${base}/api/encounters`)).json()).toEqual([]);
    const raw = JSON.parse(readFileSync(path.join(dir, "encounters", "goblin-ambush.json"), "utf8"));
    expect(raw.deleted).toBe(true);
    expect((await fetch(`${base}/api/encounters/goblin-ambush`)).status).toBe(404);
    // a deleted name can be reused by a different encounter without a conflict
    expect((await put("goblin-ambush", mk("fresh"))).status).toBe(200);
  });
});
