import { describe, expect, it } from "vitest";
import { canOfferPWAInstall, supportsServiceWorker } from "./pwa";

describe("PWA capability guard", () => {
  it("accepts browsers that expose serviceWorker", () => {
    expect(supportsServiceWorker({ serviceWorker: {} })).toBe(true);
  });

  it("does not attempt registration when the capability is absent", () => {
    expect(supportsServiceWorker({})).toBe(false);
    expect(supportsServiceWorker(null)).toBe(false);
  });

  it("only exposes the install action while a deferred browser prompt is available", () => {
    expect(canOfferPWAInstall(true, false)).toBe(true);
    expect(canOfferPWAInstall(false, false)).toBe(false);
    expect(canOfferPWAInstall(true, true)).toBe(false);
  });
});
