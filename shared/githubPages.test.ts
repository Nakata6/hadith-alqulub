import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const gameUrl = "https://3000-ipkkkunmbxt0zu91vkc8u-b657d3b8.us4.manus.computer/";
const pagesUrl = "https://nakata6.github.io/hadith-alqulub/";

describe("بوابة GitHub Pages", () => {
  it("تحول مدخل Pages إلى اللعبة وتعرض README رابط التشغيل نفسه", () => {
    const pagesEntry = readFileSync(resolve(process.cwd(), "index.html"), "utf8");
    const readme = readFileSync(resolve(process.cwd(), "README.md"), "utf8");

    expect(pagesEntry).toContain(`url=${gameUrl}`);
    expect(pagesEntry).toContain(`href="${gameUrl}"`);
    expect(readme).toContain(`[**افتح لعبة حديث القلوب**](${pagesUrl})`);
  });
});
