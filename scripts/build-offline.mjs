import { readdir, readFile, writeFile, rm } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
const out = path.resolve("dist/static-pwa");
await rm(path.join(out, "__manus__"), { recursive: true, force: true });
async function files(dir) {
  const entries = await readdir(path.join(out, dir), { withFileTypes: true });
  return (await Promise.all(entries.map(e => e.isDirectory() ? files(path.posix.join(dir, e.name)) : path.posix.join(dir, e.name)))).flat();
}
const list = (await files("")).filter(f => f !== "sw.js" && f !== ".nojekyll").sort();
const hash = createHash("sha256");
for (const f of list) hash.update(f).update(await readFile(path.join(out, f)));
const template = await readFile("client/public/sw.js", "utf8");
hash.update(template);
await writeFile(path.join(out, "sw.js"), template.replace('"__REVISION__"', JSON.stringify(hash.digest("hex").slice(0, 16))).replace('/*__PRECACHE__*/ []', JSON.stringify(list)));
await writeFile(path.join(out, ".nojekyll"), "");
console.log(`Offline package: ${list.length} local files precached.`);
