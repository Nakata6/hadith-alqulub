import { describe, expect, it } from "vitest";
import { LATEST_VERSION } from "./changelog";
import { canShowWhatsNew, shouldShowWhatsNew, unseenChangelogEntries } from "./whatsNew";

describe("what's new visibility", () => {
  it("shows updates when no prior version has been seen", () => {
    expect(shouldShowWhatsNew(null)).toBe(true);
    expect(unseenChangelogEntries(null)[0]?.version).toBe(LATEST_VERSION);
  });

  it("does not repeat the latest update once marked as seen", () => {
    expect(shouldShowWhatsNew(LATEST_VERSION)).toBe(false);
  });

  it("shows only releases newer than the stored version", () => {
    expect(unseenChangelogEntries("1.6.0").map(entry => entry.version)).toEqual([LATEST_VERSION]);
  });

  it("allows an existing restorable session to receive updates without forcing an introductory replay", () => {
    expect(canShowWhatsNew(false, true)).toBe(true);
    expect(canShowWhatsNew(false, false)).toBe(false);
  });
});
