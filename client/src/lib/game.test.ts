import { describe, expect, it } from "vitest";
import {
  LEVELS,
  ROUND_LEVEL_LIMITS,
  generateRound,
  levelCountsForRound,
  roundSizeFromLandscape,
  roundSizeFromViewport,
} from "./game";

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
});
