import { describe, expect, it } from "vitest";
import { CURATED_SHIA_HADITH_TIPS } from "@shared/hadithPublicationReview";
import {
  filterHadithTransparencyEntries,
  HADITH_TRANSPARENCY_ENTRIES,
  hadithTransparencyCounts,
} from "./hadithTransparency";

describe("سجل التوثيق العام", () => {
  it("يعرض كل رواية منشورة بمصدر وحكم منسوبين", () => {
    const published = filterHadithTransparencyEntries("published");
    expect(published).toHaveLength(26);
    expect(published.every(entry => Boolean(entry.sourceUrl?.startsWith("https://")) && !entry.verificationLabel.startsWith("لا يوجد"))).toBe(true);
  });

  it("يبقي السجل البحثي منفصلاً عن الروايات المعروضة في اللعبة", () => {
    const research = filterHadithTransparencyEntries("research");
    expect(research.length).toBeGreaterThan(0);
    expect(research.every(entry => entry.status === "research")).toBe(true);
    expect(research.some(entry => entry.source === "عيون أخبار الرضا")).toBe(true);
    expect(hadithTransparencyCounts().published).toBe(CURATED_SHIA_HADITH_TIPS.length + 1);
  });

  it("يحسب السجل كاملاً من دون إسقاط أي قرار موثق", () => {
    const counts = hadithTransparencyCounts();
    expect(counts.total).toBe(HADITH_TRANSPARENCY_ENTRIES.length);
    expect(counts.published + counts.research).toBe(counts.total);
  });
});
