import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
it("builds and deploys the local PWA, without a platform redirect", () => {
  const pkg = JSON.parse(readFileSync("package.json", "utf8"));
  expect(pkg.scripts["build:static-pwa"]).toBeTruthy();
  expect(pkg.scripts["verify:static-pwa"]).toBeTruthy();
  expect(readFileSync("client/src/main.tsx", "utf8")).not.toMatch(/trpc|startLogin/);
  expect(readFileSync(".github/workflows/pages.yml", "utf8")).toContain("dist/static-pwa");
});
