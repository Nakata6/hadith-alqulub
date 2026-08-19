import { describe, expect, it } from "vitest";
import {
  LEVELS,
  recordOpenedTip,
  ROUND_LEVEL_LIMITS,
  TIPS,
  generateRound,
  levelCountsForRound,
  roundSizeFromLandscape,
  roundSizeFromViewport,
  searchUrlForTip,
} from "./game";
import { ORIGINAL_GAME_DATA } from "@shared/originalGameData";
import { HADITH_PUBLICATION_REVIEW, isPublishableShiaHadithReview } from "@shared/hadithPublicationReview";

describe("توزيع جولات حديث القلوب", () => {
  it("يعطي 9 بطاقات في الوضع العمودي و10 في الوضع الأفقي", () => {
    expect(roundSizeFromLandscape(false)).toBe(9);
    expect(roundSizeFromLandscape(true)).toBe(10);
    expect(roundSizeFromViewport(390, 844)).toBe(9);
    expect(roundSizeFromViewport(844, 390)).toBe(10);
  });

  it("يحافظ على حد أدنى وأقصى مرنين لكل مستوى عبر جولات عشوائية", () => {
    for (const roundSize of [9, 10]) {
      for (let attempt = 0; attempt < 80; attempt += 1) {
        const counts = levelCountsForRound(roundSize);
        expect(Object.values(counts).reduce((sum, count) => sum + count, 0)).toBe(roundSize);
        LEVELS.forEach(level => {
          expect(counts[level]).toBeGreaterThanOrEqual(ROUND_LEVEL_LIMITS.minimum);
          expect(counts[level]).toBeLessThanOrEqual(ROUND_LEVEL_LIMITS.maximum);
        });
      }
    }
  });

  it("ينشئ بطاقات فريدة بالعدد المطلوب من دون تعديل المحتوى النشط", () => {
    const cards = generateRound(10, []);
    expect(cards).toHaveLength(10);
    expect(new Set(cards.map(card => card.id)).size).toBe(10);
    expect(new Set(cards.map(card => card.prompt)).size).toBe(10);
  });

  it("يحافظ على المصدر والمرجع والنص الأصلي والتطبيق في نصائح الخبراء الموثقة", () => {
    const expert = TIPS.find(tip => tip.reference === "Words of Affirmation (Chapman)");

    expect(expert).toMatchObject({
      category: "expert",
      narrator: "د. غاري تشابمان",
      source: "The 5 Love Languages",
      reference: "Words of Affirmation (Chapman)",
      textOriginal: "For some, actions don't speak louder than words. Unsolicited compliments and words of affection are powerful communicators of love.",
      translation: "اترك لشريكك رسالة ورقية صغيرة تعبر فيها عن إعجابك بصفة فيه.",
    });
    expect(expert?.sourceUrl).toContain("moodypublishers.com");
    expect(searchUrlForTip(expert!)).toContain(encodeURIComponent("د. غاري تشابمان The 5 Love Languages Words of Affirmation (Chapman)"));
  });

  it("لا يسمح بعرض حديث إلا بعد اعتماده بسجل فردي يحمل المصدر الشيعي والموضع وحكم السند", () => {
    const sourceTips = ORIGINAL_GAME_DATA.DAILY_TIPS as readonly Array<{
      text: string; source: string; speaker: string; category: "hadith" | "expert"; reference: string; translation?: string; textOriginal?: string;
    }>;

    const expertSourceTips = sourceTips.filter(sourceTip => sourceTip.category === "expert");
    expect(TIPS).toHaveLength(expertSourceTips.length);
    expect(TIPS.every(tip => tip.category === "expert" && Boolean(tip.sourceUrl))).toBe(true);
    expect(TIPS.some(tip => tip.category === "hadith")).toBe(false);
    expect(HADITH_PUBLICATION_REVIEW).toHaveLength(28);
    expect(HADITH_PUBLICATION_REVIEW.every(item => item.decision === "excluded")).toBe(true);
    expect(HADITH_PUBLICATION_REVIEW.every(item => item.reason.includes(item.originalReference))).toBe(true);
    expect(HADITH_PUBLICATION_REVIEW.every(item => ["ضعيف", "مرسل", "غير متحققة"].includes(item.majlisiGrade))).toBe(true);
    expect(HADITH_PUBLICATION_REVIEW.find(item => item.originalReference === "ج5 ص569")).toMatchObject({ majlisiGrade: "ضعيف" });
    expect(HADITH_PUBLICATION_REVIEW.find(item => item.originalReference === "الكافي ج2 ص110")).toMatchObject({ majlisiGrade: "مرسل" });

    const incompleteApproval = { ...HADITH_PUBLICATION_REVIEW[0]!, decision: "approved" as const };
    expect(isPublishableShiaHadithReview(incompleteApproval)).toBe(false);
    expect(isPublishableShiaHadithReview({
      ...incompleteApproval,
      majlisiGrade: "صحيح",
      shiaSourceUrl: "https://thaqalayn.net/hadith/example",
      shiaSourceLocation: "الكتاب، الباب، الحديث",
      gradingReferenceUrl: "https://example.org/shia-grading",
    })).toBe(true);

    expertSourceTips.forEach(sourceTip => {
      const tip = TIPS.find(candidate => candidate.text === sourceTip.text);
      expect(tip).toMatchObject({
        narrator: sourceTip.speaker,
        source: sourceTip.source,
        reference: sourceTip.reference,
        category: sourceTip.category,
        translation: sourceTip.translation || "",
        textOriginal: sourceTip.textOriginal || "",
      });
    });
  });

  it("يسجل كل نصيحة مفتوحة بمعرف مستقل كي تظهر فوراً في سجل النصائح", () => {
    const sample = TIPS[0]!;
    const first = recordOpenedTip([], sample, 1000);
    const second = recordOpenedTip(first, sample, 2000);

    expect(first).toHaveLength(1);
    expect(second).toHaveLength(2);
    expect(second.map(item => item.id)).toEqual([`${sample.id}-shown-1000`, `${sample.id}-shown-2000`]);
  });
});
