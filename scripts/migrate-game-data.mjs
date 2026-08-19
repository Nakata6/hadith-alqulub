import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const sourcePath = "/home/ubuntu/hadith-alqulub/src/data.js";
const destinationPath = resolve("shared/originalGameData.ts");
const sourceUrl = `${pathToFileURL(sourcePath).href}?migration=${Date.now()}`;
const { default: gameData } = await import(sourceUrl);

await mkdir(dirname(destinationPath), { recursive: true });
await writeFile(
  destinationPath,
  `/**\n * مولّد من بنك بيانات النسخة السابقة من حديث القلوب.\n * لا تعدّل هذا الملف يدوياً؛ شغّل scripts/migrate-game-data.mjs عند ترحيل نسخة جديدة.\n */\nexport const ORIGINAL_GAME_DATA = ${JSON.stringify(gameData, null, 2)} as const;\n\nexport type OriginalGameData = typeof ORIGINAL_GAME_DATA;\n`,
  "utf8",
);

console.log(`Migrated original game data to ${destinationPath}`);
