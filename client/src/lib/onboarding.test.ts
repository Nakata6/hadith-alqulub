import { describe, expect, it } from "vitest";
import { completionState, DEFAULT_ONBOARDING_STATE, ONBOARDING_VERSION, shouldStartOnboarding } from "./onboarding";

describe("onboarding persistence", () => {
  it("starts only for a new visitor without a saved session", () => {
    expect(shouldStartOnboarding(DEFAULT_ONBOARDING_STATE, false)).toBe(true);
    expect(shouldStartOnboarding(DEFAULT_ONBOARDING_STATE, true)).toBe(false);
  });

  it("does not repeat after completion at the current version", () => {
    expect(shouldStartOnboarding(completionState(false), false)).toBe(false);
  });

  it("can intentionally reappear after a future onboarding version", () => {
    expect(shouldStartOnboarding({ completed: true, skipped: false, version: ONBOARDING_VERSION - 1 }, false)).toBe(true);
  });
});
