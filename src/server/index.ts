import path from "node:path";
import { fileURLToPath } from "node:url";
import { createApp } from "./app.js";
import { Storage } from "./storage.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..", "..");
const port = Number(process.env.PORT) || 5180;
const dataDir = path.resolve(process.env.DATA_DIR || path.join(root, "data"));

const storage = new Storage(dataDir);
await storage.init();

const app = createApp(storage, path.join(root, "dist", "client"));
const server = app.listen(port, "127.0.0.1", () => {
  console.log(`Initiative Tracker on http://127.0.0.1:${port}`);
  console.log(`Data folder: ${dataDir}`);
});

function shutdown() {
  server.close(() => process.exit(0));
  server.closeAllConnections?.();
  setTimeout(() => process.exit(0), 3000).unref();
}
for (const sig of ["SIGINT", "SIGTERM", "SIGBREAK"] as const) process.on(sig, shutdown);
