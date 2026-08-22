import { describe, expect, it } from "vitest";
import { canAccessTipLibrary } from "./tipAccess";

describe("canAccessTipLibrary", () => {
  it("يقصر سجل النصائح وفلترتها على المدير", () => {
    expect(canAccessTipLibrary("admin")).toBe(true);
    expect(canAccessTipLibrary("user")).toBe(false);
  });

  it("لا يفتح مكتبة النصائح عند غياب جلسة أو دور", () => {
    expect(canAccessTipLibrary(undefined)).toBe(false);
    expect(canAccessTipLibrary(null)).toBe(false);
  });
});
