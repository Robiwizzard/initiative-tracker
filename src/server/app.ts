import express from "express";
import path from "node:path";
import { existsSync } from "node:fs";
import { SLUG_RE } from "../shared/slug.js";
import { Storage } from "./storage.js";
import { validateEncounter, asEncounter, validateLibrary, asLibrary } from "./validate.js";

export function createApp(storage: Storage, staticDir?: string) {
  const app = express();
  app.use(express.json({ limit: "4mb" }));

  app.get("/api/ping", (_req, res) => {
    res.json({ ok: true });
  });

  app.get("/api/custom", async (_req, res, next) => {
    try {
      res.json(await storage.readLibrary());
    } catch (e) {
      next(e);
    }
  });

  app.put("/api/custom", async (req, res, next) => {
    try {
      const err = validateLibrary(req.body);
      if (err) {
        res.status(400).json({ error: err });
        return;
      }
      await storage.writeLibrary(asLibrary(req.body));
      res.json({ ok: true });
    } catch (e) {
      next(e);
    }
  });

  app.get("/api/encounters", async (_req, res, next) => {
    try {
      res.json(await storage.list());
    } catch (e) {
      next(e);
    }
  });

  app.use("/api/encounters/:slug", (req, res, next) => {
    if (!SLUG_RE.test(req.params.slug)) {
      res.status(400).json({ error: "invalid slug" });
      return;
    }
    next();
  });

  app.get("/api/encounters/:slug", async (req, res, next) => {
    try {
      const enc = await storage.read(req.params.slug);
      if (!enc || enc.deleted) {
        res.status(404).json({ error: "not found" });
        return;
      }
      res.json(enc);
    } catch (e) {
      next(e);
    }
  });

  app.put("/api/encounters/:slug", async (req, res, next) => {
    try {
      const err = validateEncounter(req.body);
      if (err) {
        res.status(400).json({ error: err });
        return;
      }
      const result = await storage.save(req.params.slug, asEncounter(req.body), req.query.overwrite === "1");
      if (result === "conflict") {
        res.status(409).json({ error: "another encounter already uses this name" });
        return;
      }
      const saved = await storage.read(req.params.slug);
      res.json({ ok: true, updatedAt: saved?.updatedAt });
    } catch (e) {
      next(e);
    }
  });

  app.delete("/api/encounters/:slug", async (req, res, next) => {
    try {
      const ok = await storage.softDelete(req.params.slug);
      res.status(ok ? 200 : 404).json({ ok });
    } catch (e) {
      next(e);
    }
  });

  if (staticDir && existsSync(staticDir)) {
    app.use(express.static(staticDir));
    app.get(/^\/(?!api\/).*/, (_req, res) => {
      res.sendFile(path.join(staticDir, "index.html"));
    });
  }

  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    if (err?.type === "entity.parse.failed") {
      res.status(400).json({ error: "invalid JSON" });
      return;
    }
    if (err?.type === "entity.too.large") {
      res.status(413).json({ error: "too large" });
      return;
    }
    console.error(err);
    res.status(500).json({ error: "server error" });
  });

  return app;
}
