import { describe, expect, it } from "vitest";
import { nextTurnNotice } from "./uiCopy";

describe("nextTurnNotice", () => {
  it("يعرض اسم اللاعب التالي بصياغة عربية مكتملة", () => {
    expect(nextTurnNotice("فاطمة")).toBe("الدور الآن لـ فاطمة.");
  });

  it("يستعمل بديلًا واضحًا عند غياب الاسم", () => {
    expect(nextTurnNotice("   ")).toBe("انتقل الدور إلى اللاعب الآخر.");
  });
});
