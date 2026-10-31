import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
const out = "dist/static-pwa";
const html = await readFile(`${out}/index.html`, "utf8");
assert(!/manus|umami|googleapis|fonts.gstatic|VITE_ANALYTICS|\/src\//i.test(html), "HTML must be standalone");
const sw = await readFile(`${out}/sw.js`, "utf8");
assert(!sw.includes("__PRECACHE__") && !sw.includes("__REVISION__"), "Worker must be generated");
const list = JSON.parse(sw.match(/const FILES = (\[.*\]);/)[1]);
assert(list.includes("index.html") && list.includes("manifest.json"));
assert(list.some(f => f.endsWith(".woff2")) && list.some(f => f.endsWith(".png")));
for (const file of list) await readFile(path.join(out, file));
const manifest = JSON.parse(await readFile(`${out}/manifest.json`, "utf8"));
assert.equal(manifest.start_url, "./"); assert.equal(manifest.scope, "./");
for (const icon of manifest.icons) await readFile(path.join(out, icon.src));
for (const file of await readdir(`${out}/assets`)) {
  if (!file.endsWith(".js")) continue;
  const js = await readFile(`${out}/assets/${file}`, "utf8");
  assert(!/\/api\/trpc|manus-cookie|oauth\/authorize|__manus__/.test(js), `Unexpected server dependency: ${file}`);
}
console.log(`PASS: independent static PWA; ${list.length} complete local resources.`);
