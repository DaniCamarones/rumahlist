// Serves the static build in out/ for local testing of the offline app: `node scripts/serve-out.mjs [port]`.
import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";

const root = join(process.cwd(), "out");
const port = Number(process.argv[2] ?? 3000);
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".webmanifest": "application/manifest+json",
  ".txt": "text/plain; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".ico": "image/x-icon",
};

createServer((req, res) => {
  const path = normalize(decodeURIComponent(new URL(req.url, "http://x").pathname)).replace(/^(\.\.[/\\])+/, "");
  let file = join(root, path);
  if (!file.startsWith(root)) return res.writeHead(403).end();
  if (existsSync(file) && statSync(file).isDirectory()) {
    if (!path.endsWith("/")) return res.writeHead(301, { Location: `${path}/` }).end();
    file = join(file, "index.html");
  }
  if (!existsSync(file)) {
    res.writeHead(404, { "Content-Type": TYPES[".html"] });
    return createReadStream(join(root, "404.html")).pipe(res);
  }
  res.writeHead(200, { "Content-Type": TYPES[extname(file)] ?? "application/octet-stream", "Cache-Control": "no-cache" });
  createReadStream(file).pipe(res);
}).listen(port, () => console.log(`out/ on http://localhost:${port}`));
