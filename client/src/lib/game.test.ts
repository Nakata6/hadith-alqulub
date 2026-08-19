import { describe, expect, it } from "vitest";
import {
  LEVELS,
  ROUND_LEVEL_LIMITS,
  TIPS,
  generateRound,
  levelCountsForRound,
  roundSizeFromLandscape,
  roundSizeFromViewport,
  searchUrlForTip,
} from "./game";
import { ORIGINAL_GAME_DATA } from "@shared/originalGameData";

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

  it("يحافظ على المصدر والمرجع والنص الأصلي والتطبيق في النصائح المرحّلة", () => {
    const hadith = TIPS.find(tip => tip.text === "خَيْرُكُمْ خَيْرُكُمْ لِأَهْلِهِ، وَأَنَا خَيْرُكُمْ لِأَهْلِي");
    const expert = TIPS.find(tip => tip.reference === "Words of Affirmation (Chapman)");

    expect(hadith).toMatchObject({ category: "hadith", narrator: "رسول الله (ص)", source: "الكافي", reference: "ج5 ص323" });
    expect(expert).toMatchObject({
      category: "expert",
      narrator: "د. غاري تشابمان",
      source: "The 5 Love Languages",
      reference: "Words of Affirmation (Chapman)",
      textOriginal: "For some, actions don't speak louder than words. Unsolicited compliments and words of affection are powerful communicators of love.",
      translation: "اترك لشريكك رسالة ورقية صغيرة تعبر فيها عن إعجابك بصفة فيه.",
    });
    expect(searchUrlForTip(expert!)).toContain(encodeURIComponent("د. غاري تشابمان The 5 Love Languages Words of Affirmation (Chapman)"));
  });

  it("لا يفقد حقول المصدر والمرجع في أي نصيحة مرجعية أثناء التحويل", () => {
    const sourceTips = ORIGINAL_GAME_DATA.DAILY_TIPS as readonly Array<{
      text: string; source: string; speaker: string; category: "hadith" | "expert"; reference: string; translation?: string; textOriginal?: string;
    }>;

    sourceTips.forEach(sourceTip => {
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
});
