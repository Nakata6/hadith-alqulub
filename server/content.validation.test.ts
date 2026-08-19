import { describe, expect, it } from "vitest";
import { suggestionInput } from "./routers";

describe("تحقق اقتراحات المحتوى", () => {
  it("يرفض السؤال الذي لا يحدد مستوى", () => {
    const result = suggestionInput.safeParse({ kind: "question", body: "ما الذي يجعلك سعيداً اليوم؟" });
    expect(result.success).toBe(false);
  });

  it("يرفض النصيحة التي لا تتضمن شرحاً موجزاً", () => {
    const result = suggestionInput.safeParse({ kind: "tip", body: "تَهَادَوْا تَحَابُّوا" });
    expect(result.success).toBe(false);
  });

  it("يقبل العقوبة اللطيفة ويرفض رابط المصدر غير الصحيح", () => {
    expect(suggestionInput.safeParse({ kind: "penalty", body: "قل كلمة تقدير صادقة للطرف الآخر." }).success).toBe(true);
    expect(suggestionInput.safeParse({ kind: "tip", body: "كن لطيفاً", summary: "اللطف يفتح القلوب.", sourceUrl: "ليس رابطاً" }).success).toBe(false);
  });
});
