import { describe, expect, it } from "vitest";
import {
  LEVELS,
  createEmptyRoundOutcomeCounts,
  createRoundSummary,
  recordOpenedTip,
  ROUND_LEVEL_LIMITS,
  CURATED_EXPERT_TIPS,
  TIPS,
  generateRound,
  getRoundCardStates,
  levelCountsForRound,
  roundSizeFromLandscape,
  roundSizeFromViewport,
  searchUrlForTip,
} from "./game";
import { ORIGINAL_GAME_DATA } from "@shared/originalGameData";
import { CURATED_SHIA_HADITH_TIPS, HADITH_PUBLICATION_REVIEW, isPublishableShiaHadithReview } from "@shared/hadithPublicationReview";

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

  it("يبقي مواضع الجولة ظاهرة ويعلّم البطاقة المفتوحة كمستهلكة من دون تغيير البطاقات المتاحة", () => {
    const deck = [
      { id: "hamasat-1", level: "hamasat" as const, prompt: "سؤال أول" },
      { id: "nabd-1", level: "nabd" as const, prompt: "سؤال ثان" },
      { id: "aamaq-1", level: "aamaq" as const, prompt: "سؤال ثالث" },
    ];
    const states = getRoundCardStates(deck, [deck[0]!, deck[2]!]);

    expect(states.map(item => item.state)).toEqual(["available", "consumed", "available"]);
    expect(states.filter(item => item.state === "available").map(item => item.card.id)).toEqual(["hamasat-1", "aamaq-1"]);
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

  it("لا يسمح بعرض حديث إلا بسجل فردي يحمل موضعاً شيعياً قابلاً للتحقق ودرجة مجلسي مقبولة أو سنداً شيعياً ظاهراً", () => {
    const sourceTips = ORIGINAL_GAME_DATA.DAILY_TIPS as readonly Array<{
      text: string; source: string; speaker: string; category: "hadith" | "expert"; reference: string; translation?: string; textOriginal?: string;
    }>;

    const expertSourceTips = sourceTips.filter(sourceTip => sourceTip.category === "expert");
    const approvedHadithReviews = HADITH_PUBLICATION_REVIEW.filter(item => item.decision === "approved");
    const publishedHadithTips = TIPS.filter(tip => tip.category === "hadith");
    expect(TIPS).toHaveLength(expertSourceTips.length + CURATED_EXPERT_TIPS.length + approvedHadithReviews.length + CURATED_SHIA_HADITH_TIPS.length);
    expect(TIPS).toHaveLength(60);
    expect(TIPS.filter(tip => tip.category === "expert")).toHaveLength(30);
    expect(publishedHadithTips).toHaveLength(30);
    expect(TIPS.filter(tip => tip.category === "expert").every(tip => Boolean(tip.sourceUrl))).toBe(true);
    expect(CURATED_EXPERT_TIPS).toHaveLength(9);
    expect(CURATED_EXPERT_TIPS.map(tip => tip.id)).toEqual(expect.arrayContaining([
      "expert-repair-attempts",
      "expert-stress-reducing-conversation",
      "expert-dyadic-coping",
      "expert-shared-rituals",
      "expert-self-soothing",
      "expert-shared-novelty",
      "expert-specific-gratitude",
      "expert-autonomy-support",
      "expert-goal-coordination",
    ]));
    expect(CURATED_EXPERT_TIPS.every(tip => tip.category === "expert" && Boolean(tip.sourceUrl) && Boolean(tip.reference))).toBe(true);
    expect(approvedHadithReviews).toHaveLength(5);
    expect(approvedHadithReviews.map(item => item.originalReference)).toEqual(expect.arrayContaining([
      "الحكمة 136",
      "ج66 ص408",
      "ج5 ص320",
      "الكافي ج2 ص635",
      "الكافي ج2 ص321",
    ]));
    expect(approvedHadithReviews.filter(item => item.publicationBasis === "verified_shia_chain")).toHaveLength(4);
    expect(approvedHadithReviews.find(item => item.originalReference === "الكافي ج2 ص321")).toMatchObject({
      majlisiGrade: "حسن كالصحيح",
      publicationBasis: "majlisi_accepted",
      shiaSourceUrl: "https://thaqalayn.net/hadith/2/1/129/1",
    });
    expect(publishedHadithTips).toHaveLength(5 + CURATED_SHIA_HADITH_TIPS.length);
    expect(publishedHadithTips.find(tip => tip.text.includes("حَسُنَ بَرُّهُ بِأَهْلِهِ"))).toMatchObject({
      source: "الخصال",
      reference: "ج1، الكتاب 4، الباب 15، الحديث 1",
      sourceUrl: "https://thaqalayn.net/ar/chapter/10/4/15",
    });
    expect(publishedHadithTips.every(tip => Boolean(tip.sourceUrl))).toBe(true);
    expect(CURATED_SHIA_HADITH_TIPS).toHaveLength(25);
    expect(new Set(CURATED_SHIA_HADITH_TIPS.map(tip => tip.text)).size).toBe(CURATED_SHIA_HADITH_TIPS.length);
    expect(CURATED_SHIA_HADITH_TIPS.every(tip => (
      ["صحيح", "حسن", "حسن كالصحيح", "موثق"].includes(tip.majlisiGrade)
      && /^https:\/\/thaqalayn\.net\/(?:ar\/)?hadith\//.test(tip.sourceUrl)
      && tip.shiaSourceLocation.includes("الكافي")
    ))).toBe(true);
    expect(CURATED_SHIA_HADITH_TIPS.filter(tip => tip.id.startsWith("curated-hadith-household-") || tip.id === "curated-hadith-family-sustenance" || tip.id === "curated-hadith-relieve-hardship" || tip.id === "curated-hadith-gentleness-blessing")).toHaveLength(4);
    expect(CURATED_SHIA_HADITH_TIPS.filter(tip => [
      "curated-hadith-child-kindness",
      "curated-hadith-keep-promises-to-children",
      "curated-hadith-repair-with-child",
      "curated-hadith-family-reconciliation",
    ].includes(tip.id))).toHaveLength(4);
    expect(CURATED_SHIA_HADITH_TIPS.filter(tip => [
      "curated-hadith-child-kindness",
      "curated-hadith-repair-with-child",
      "curated-hadith-family-reconciliation",
    ].includes(tip.id)).every(tip => tip.majlisiGrade === "صحيح")).toBe(true);
    expect(CURATED_SHIA_HADITH_TIPS.find(tip => tip.id === "curated-hadith-keep-promises-to-children")).toMatchObject({
      majlisiGrade: "حسن",
      sourceUrl: "https://thaqalayn.net/hadith/6/1/35/8",
    });
    expect(CURATED_SHIA_HADITH_TIPS.find(tip => tip.id === "curated-hadith-household-partnership")).toMatchObject({
      majlisiGrade: "حسن",
      sourceUrl: "https://thaqalayn.net/ar/hadith/5/2/11/1",
    });
    const secondBatchIds = [
      "curated-hadith-arbitration-consent",
      "curated-hadith-gentle-dealings",
      "curated-hadith-practical-joy",
      "curated-hadith-kinship-greetings",
      "curated-hadith-truth-and-trust",
      "curated-hadith-protect-dignity",
      "curated-hadith-good-character",
      "curated-hadith-fairness-and-support",
      "curated-hadith-family-priority",
    ];
    const secondBatch = CURATED_SHIA_HADITH_TIPS.filter(tip => secondBatchIds.includes(tip.id));
    expect(secondBatch).toHaveLength(9);
    expect(secondBatch.every(tip => Boolean(tip.application))).toBe(true);
    expect(CURATED_SHIA_HADITH_TIPS.find(tip => tip.id === "curated-hadith-arbitration-consent")).toMatchObject({
      majlisiGrade: "حسن",
      sourceUrl: "https://thaqalayn.net/hadith/6/2/67/2",
    });
    expect(CURATED_SHIA_HADITH_TIPS.find(tip => tip.id === "curated-hadith-family-priority")).toMatchObject({
      majlisiGrade: "موثق",
      sourceUrl: "https://thaqalayn.net/hadith/4/1/15/1",
    });
    expect(CURATED_SHIA_HADITH_TIPS.filter(tip => tip.id.includes("family-sustenance") || tip.id.includes("relieve-hardship") || tip.id.includes("gentleness-blessing")).every(tip => tip.majlisiGrade === "صحيح" && Boolean(tip.application))).toBe(true);
    expect(publishedHadithTips.find(tip => tip.text.includes("نِعْمَ الْجُرْعَةُ الْغَيْظُ"))).toMatchObject({
      narrator: "الإمام الصادق (ع)",
      sourceUrl: "https://thaqalayn.net/hadith/2/1/54/2",
    });
    expect(HADITH_PUBLICATION_REVIEW).toHaveLength(28);
    expect(HADITH_PUBLICATION_REVIEW.filter(item => item.decision === "excluded")).toHaveLength(23);
    expect(HADITH_PUBLICATION_REVIEW.every(item => item.reason.includes(item.originalReference))).toBe(true);
    expect(HADITH_PUBLICATION_REVIEW.every(item => item.thaqalaynSearchUrl.startsWith("https://thaqalayn.net/search?q=") && item.thaqalaynSearchUrl.endsWith("&exact=1"))).toBe(true);
    expect(HADITH_PUBLICATION_REVIEW.every(item => ["حسن كالصحيح", "ضعيف", "مرسل", "غير متحققة"].includes(item.majlisiGrade))).toBe(true);
    expect(HADITH_PUBLICATION_REVIEW.every(item => ["accepted", "rejected_weak_or_mursal", "source_found_without_grade", "non_shia_source_identified", "source_or_attribution_unverified"].includes(item.reviewStatus))).toBe(true);
    expect(HADITH_PUBLICATION_REVIEW.every(item => ["thaqalayn_direct", "shia_alternate_or_text_variant", "no_source_verified", "non_shia_source_identified"].includes(item.sourceEvidenceStatus))).toBe(true);
    expect(HADITH_PUBLICATION_REVIEW.filter(item => item.sourceEvidenceStatus === "thaqalayn_direct").every(item => item.shiaSourceUrl?.startsWith("https://thaqalayn.net/hadith/"))).toBe(true);
    expect(HADITH_PUBLICATION_REVIEW.filter(item => item.sourceEvidenceStatus === "shia_alternate_or_text_variant").every(item => Boolean(item.shiaSourceUrl))).toBe(true);
    expect(HADITH_PUBLICATION_REVIEW.filter(item => item.sourceEvidenceStatus === "no_source_verified").every(item => !item.shiaSourceUrl)).toBe(true);
    expect(HADITH_PUBLICATION_REVIEW.filter(item => item.sourceEvidenceStatus === "non_shia_source_identified").every(item => item.reviewStatus === "non_shia_source_identified")).toBe(true);
    expect(HADITH_PUBLICATION_REVIEW.filter(item => item.reviewStatus === "rejected_weak_or_mursal").every(item => ["ضعيف", "مرسل"].includes(item.majlisiGrade))).toBe(true);
    expect(HADITH_PUBLICATION_REVIEW.filter(item => item.majlisiGrade === "ضعيف")).toHaveLength(3);
    expect(HADITH_PUBLICATION_REVIEW.filter(item => item.majlisiGrade === "مرسل")).toHaveLength(1);
    expect(HADITH_PUBLICATION_REVIEW.filter(item => item.reviewStatus === "non_shia_source_identified")).toHaveLength(5);
    expect(HADITH_PUBLICATION_REVIEW.find(item => item.originalReference === "ج3 ص439")).toMatchObject({
      reviewStatus: "non_shia_source_identified",
      decision: "excluded",
    });
    expect(HADITH_PUBLICATION_REVIEW.find(item => item.originalReference === "ج5 ص569")).toMatchObject({ majlisiGrade: "ضعيف" });
    expect(HADITH_PUBLICATION_REVIEW.find(item => item.originalReference === "الكافي ج2 ص110")).toMatchObject({ majlisiGrade: "مرسل" });
    expect(HADITH_PUBLICATION_REVIEW.find(item => item.text.includes("رَيْحَانَةٌ وَلَيْسَتْ بِقَهْرَمَانَةٍ"))).toMatchObject({
      majlisiGrade: "ضعيف",
      decision: "excluded",
    });

    const incompleteApproval = { ...HADITH_PUBLICATION_REVIEW[0]!, decision: "approved" as const };
    expect(isPublishableShiaHadithReview(incompleteApproval)).toBe(false);
    expect(isPublishableShiaHadithReview({
      ...incompleteApproval,
      majlisiGrade: "صحيح",
      shiaSourceUrl: "https://thaqalayn.net/hadith/example",
      shiaSourceLocation: "الكتاب، الباب، الحديث",
      gradingReferenceUrl: "https://example.org/shia-grading",
      publicationBasis: "majlisi_accepted",
    })).toBe(true);
    expect(isPublishableShiaHadithReview({
      ...incompleteApproval,
      majlisiGrade: "غير متحققة",
      shiaSourceUrl: "https://thaqalayn.net/hadith/example",
      shiaSourceLocation: "الكتاب، الباب، الحديث، بسند منشور",
      publicationBasis: "verified_shia_chain",
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

  it("يوثق كل حديث مستبعد بقرار وسبب ورابط بحث وحالة دليل مصدر صريحة", () => {
    const excluded = HADITH_PUBLICATION_REVIEW.filter(item => item.decision === "excluded");

    expect(excluded).toHaveLength(23);
    expect(excluded.every(item => (
      item.reason.trim().length > 0
      && item.thaqalaynSearchUrl.startsWith("https://thaqalayn.net/search?q=")
      && ["thaqalayn_direct", "shia_alternate_or_text_variant", "no_source_verified", "non_shia_source_identified"].includes(item.sourceEvidenceStatus)
    ))).toBe(true);
  });

  it("يسجل كل نصيحة مفتوحة بمعرف مستقل كي تظهر فوراً في سجل النصائح", () => {
    const sample = TIPS[0]!;
    const first = recordOpenedTip([], sample, 1000);
    const second = recordOpenedTip(first, sample, 2000);

    expect(first).toHaveLength(1);
    expect(second).toHaveLength(2);
    expect(second.map(item => item.id)).toEqual([`${sample.id}-shown-1000`, `${sample.id}-shown-2000`]);
  });

  it("يلخص نهاية الجولة محلياً مع النتائج والمشاركة والنصائح الخاصة بتلك الجولة", () => {
    const outcomes = createEmptyRoundOutcomeCounts();
    outcomes.answered = 6;
    outcomes.skipped = 2;
    outcomes.penalty = 1;
    const roundTips = recordOpenedTip([], TIPS[0]!, 1000);
    const summary = createRoundSummary({
      roundNumber: 2,
      totalCards: 9,
      outcomes,
      playerTurns: [4, 5],
      tipHistory: roundTips,
      tipStartIndex: 0,
      sessionCardsOpened: 18,
    });

    expect(summary).toMatchObject({
      roundNumber: 2,
      totalCards: 9,
      outcomes: { answered: 6, skipped: 2, penalty: 1 },
      playerTurns: [4, 5],
      sessionCardsOpened: 18,
      sessionTipsShown: 1,
    });
    expect(summary.tips).toHaveLength(1);
    expect(Object.values(summary.outcomes).reduce((total, value) => total + value, 0)).toBe(summary.totalCards);
  });
});
