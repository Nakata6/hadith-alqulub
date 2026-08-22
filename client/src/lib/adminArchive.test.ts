import { describe, expect, it } from "vitest";
import { canConfirmArchive } from "./adminArchive";

describe("canConfirmArchive", () => {
  it("لا يسمح بالأرشفة إلا بعد اختيار عنصر ومع عدم وجود طلب جارٍ", () => {
    expect(canConfirmArchive(null, false)).toBe(false);
    expect(canConfirmArchive(12, true)).toBe(false);
    expect(canConfirmArchive(12, false)).toBe(true);
  });
});
