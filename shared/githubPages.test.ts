import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("بوابة GitHub Pages", () => {
  it("لا تعيد توجيه الزائر إلى معاينة غير قابلة للمشاركة", () => {
    const pagesEntry = readFileSync(resolve(process.cwd(), "index.html"), "utf8");
    const readme = readFileSync(resolve(process.cwd(), "README.md"), "utf8");

    expect(pagesEntry).not.toContain("http-equiv=\"refresh\"");
    expect(pagesEntry).not.toContain("manus.computer");
    expect(readme).toContain("لا يُستخدم رابط المعاينة للتشارك");
  });
});
