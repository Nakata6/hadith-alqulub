import { readFile } from "node:fs/promises";

const path = process.argv[2];
if (!path) throw new Error("Manifest path is required");

const manifest = JSON.parse(await readFile(path, "utf8"));
const hasMaskableIcon = manifest.icons?.some(icon => icon.purpose === "maskable");

if (manifest.name !== "حديث القلوب" || manifest.icons?.length !== 3 || !hasMaskableIcon) {
  throw new Error("PWA manifest is missing its expected app identity or icons");
}

console.log(`manifest: valid, icons=${manifest.icons.length}`);
