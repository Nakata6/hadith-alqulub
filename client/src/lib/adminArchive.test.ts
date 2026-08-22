import { describe, expect, it } from "vitest";
import { canConfirmArchive, canConfirmRestore } from "./adminArchive";

describe("canConfirmArchive", () => {
  it("لا يسمح بالأرشفة إلا بعد اختيار عنصر ومع عدم وجود طلب جارٍ", () => {
    expect(canConfirmArchive(null, false)).toBe(false);
    expect(canConfirmArchive(12, true)).toBe(false);
    expect(canConfirmArchive(12, false)).toBe(true);
  });
});

describe("canConfirmRestore", () => {
  it("لا يسمح بإعادة النشر إلا لعنصر مختار ومن دون طلب جارٍ", () => {
    expect(canConfirmRestore(null, false)).toBe(false);
    expect(canConfirmRestore(12, true)).toBe(false);
    expect(canConfirmRestore(12, false)).toBe(true);
  });
});
