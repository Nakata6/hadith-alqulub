import { describe, expect, it } from "vitest";
import { supportsServiceWorker } from "./pwa";

describe("PWA capability guard", () => {
  it("accepts browsers that expose serviceWorker", () => {
    expect(supportsServiceWorker({ serviceWorker: {} })).toBe(true);
  });

  it("does not attempt registration when the capability is absent", () => {
    expect(supportsServiceWorker({})).toBe(false);
    expect(supportsServiceWorker(null)).toBe(false);
  });
});
