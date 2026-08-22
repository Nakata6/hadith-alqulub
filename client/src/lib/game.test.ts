import { describe, expect, it } from "vitest";
import {
  LEVELS,
  choosePenalty,
  chooseTip,
  createEmptyRoundOutcomeCounts,
  createRoundSummary,
  roundSummaryReflection,
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
import { CURATED_SHIA_HADITH_TIPS, HADITH_PUBLICATION_REVIEW, formatHadithVerification, isPublishableShiaHadithReview, verificationForCuratedShiaHadith } from "@shared/hadithPublicationReview";

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

  it("يتجنب العقوبات والنصائح الحديثة عندما تتوافر بدائل، ثم يعود للمكتبة الصغيرة بأمان", () => {
    const penalties = ["عقوبة أولى", "عقوبة ثانية"];
    const tips = [
      { id: "tip-one", text: "نصيحة أولى", summary: "", narrator: "مرجع", source: "" },
      { id: "tip-two", text: "نصيحة ثانية", summary: "", narrator: "مرجع", source: "" },
    ];

    expect(choosePenalty(penalties, ["عقوبة أولى"])).toBe("عقوبة ثانية");
    expect(chooseTip(tips, ["نصيحة أولى"])?.id).toBe("tip-two");
    expect(choosePenalty(["العقوبة الوحيدة"], ["العقوبة الوحيدة"])).toBe("العقوبة الوحيدة");
    expect(chooseTip([tips[0]!], ["نصيحة أولى"])?.id).toBe("tip-one");
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

  it("يعرض الروايات ذات الحكم المنشور، ويُميّز صراحة النصوص التي أقر المالك نشرها بمصدر شيعي بلا حكم سند منشور", () => {
    const sourceTips = ORIGINAL_GAME_DATA.DAILY_TIPS as readonly Array<{
      text: string; source: string; speaker: string; category: "hadith" | "expert"; reference: string; translation?: string; textOriginal?: string;
    }>;

    const expertSourceTips = sourceTips.filter(sourceTip => sourceTip.category === "expert");
    const approvedHadithReviews = HADITH_PUBLICATION_REVIEW.filter(item => item.decision === "approved");
    const publishedHadithTips = TIPS.filter(tip => tip.category === "hadith");
    expect(TIPS).toHaveLength(expertSourceTips.length + CURATED_EXPERT_TIPS.length + approvedHadithReviews.length + CURATED_SHIA_HADITH_TIPS.length);
    expect(TIPS).toHaveLength(69);
    expect(TIPS.filter(tip => tip.category === "expert")).toHaveLength(45);
    expect(publishedHadithTips).toHaveLength(24);
    expect(TIPS.filter(tip => tip.category === "expert").every(tip => Boolean(tip.sourceUrl))).toBe(true);
    expect(CURATED_EXPERT_TIPS).toHaveLength(24);
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
      "expert-parent-emotion-coaching",
      "expert-family-routines",
      "expert-coparenting-check-in",
      "expert-support-coparent-privately",
      "expert-share-mental-load",
      "expert-child-led-play",
      "expert-calm-clear-limits",
      "expert-financial-check-in",
      "expert-parent-accountable-apology",
      "expert-collaborative-child-plan",
      "expert-dialogic-book-sharing",
      "expert-reflect-before-solving",
      "expert-weekly-appreciation-meeting",
      "expert-responsive-child-exchange",
      "expert-short-family-meeting",
    ]));
    expect(CURATED_EXPERT_TIPS.every(tip => tip.category === "expert" && Boolean(tip.sourceUrl) && Boolean(tip.reference))).toBe(true);
    expect(CURATED_EXPERT_TIPS.find(tip => tip.id === "expert-financial-check-in")).toMatchObject({
      source: "Journal of Social and Personal Relationships",
      sourceUrl: "https://journals.sagepub.com/doi/10.1177/02654075221118816",
    });
    expect(CURATED_EXPERT_TIPS.find(tip => tip.id === "expert-parent-accountable-apology")?.summary).toContain("لا يلزم الطفل بالمسامحة");
    expect(CURATED_EXPERT_TIPS.find(tip => tip.id === "expert-collaborative-child-plan")?.summary).toContain("ليست بديلاً عن تقييم مختص");
    expect(CURATED_EXPERT_TIPS.find(tip => tip.id === "expert-dialogic-book-sharing")).toMatchObject({
      source: "Journal of Early Childhood Research",
      sourceUrl: "https://pmc.ncbi.nlm.nih.gov/articles/PMC9455889/",
    });
    expect(approvedHadithReviews).toHaveLength(1);
    expect(approvedHadithReviews.map(item => item.originalReference)).toEqual(["الكافي ج2 ص321"]);
    expect(HADITH_PUBLICATION_REVIEW.filter(item => item.publicationBasis === "verified_shia_chain")).toHaveLength(0);
    expect(approvedHadithReviews.find(item => item.originalReference === "الكافي ج2 ص321")).toMatchObject({
      majlisiGrade: "حسن كالصحيح",
      publicationBasis: "majlisi_accepted",
      shiaSourceUrl: "https://thaqalayn.net/hadith/2/1/129/1",
    });
    expect(publishedHadithTips).toHaveLength(1 + CURATED_SHIA_HADITH_TIPS.length);
    expect(publishedHadithTips.find(tip => tip.text.includes("حَسُنَ بَرُّهُ بِأَهْلِهِ"))).toBeUndefined();
    expect(publishedHadithTips.every(tip => Boolean(tip.sourceUrl))).toBe(true);
    expect(CURATED_SHIA_HADITH_TIPS).toHaveLength(23);
    expect(new Set(CURATED_SHIA_HADITH_TIPS.map(tip => tip.text)).size).toBe(CURATED_SHIA_HADITH_TIPS.length);
    const ownerApprovedSourceOnly = CURATED_SHIA_HADITH_TIPS.filter(tip => (
      verificationForCuratedShiaHadith(tip).status === "owner_approved_source_only"
    ));
    const gradedCuratedHadiths = CURATED_SHIA_HADITH_TIPS.filter(tip => (
      verificationForCuratedShiaHadith(tip).status === "publishable"
    ));
    expect(ownerApprovedSourceOnly).toHaveLength(5);
    expect(ownerApprovedSourceOnly.every(tip => (
      verificationForCuratedShiaHadith(tip).method === "source_only"
      && verificationForCuratedShiaHadith(tip).label === "مصدر شيعي بلا حكم سند منشور"
      && verificationForCuratedShiaHadith(tip).verdict === "نُشر بقرار المالك بعد المراجعة"
      && Boolean(tip.sourceUrl)
      && Boolean(tip.shiaSourceLocation)
    ))).toBe(true);
    expect(gradedCuratedHadiths).toHaveLength(18);
    expect(gradedCuratedHadiths.every(tip => (
      ["صحيح", "حسن", "حسن كالصحيح", "موثق"].includes(tip.majlisiGrade ?? "")
      && /^https:\/\/thaqalayn\.net\/(?:ar\/)?hadith\//.test(tip.sourceUrl)
      && tip.shiaSourceLocation.includes("الكافي")
    ))).toBe(true);
    expect(gradedCuratedHadiths.every(tip => {
      const verification = verificationForCuratedShiaHadith(tip);
      return verification.method === "majlisi_grade"
        && verification.status === "publishable"
        && verification.verdict === tip.majlisiGrade
        && Boolean(verification.verifier)
        && Boolean(verification.verifierWork)
        && verification.referenceUrl === tip.sourceUrl;
    })).toBe(true);
    expect(formatHadithVerification(verificationForCuratedShiaHadith(CURATED_SHIA_HADITH_TIPS[0]!))).toContain("درجة المجلسي");
    expect(formatHadithVerification(verificationForCuratedShiaHadith(CURATED_SHIA_HADITH_TIPS[0]!))).toContain("وفق العلامة محمد باقر المجلسي");
    expect(CURATED_SHIA_HADITH_TIPS.filter(tip => tip.id.startsWith("curated-hadith-household-") || tip.id === "curated-hadith-family-sustenance" || tip.id === "curated-hadith-relieve-hardship" || tip.id === "curated-hadith-gentleness-blessing")).toHaveLength(4);
    expect(CURATED_SHIA_HADITH_TIPS.filter(tip => [
      "curated-hadith-child-kindness",
      "curated-hadith-keep-promises-to-children",
    ].includes(tip.id))).toHaveLength(1);
    expect(CURATED_SHIA_HADITH_TIPS.find(tip => tip.id === "curated-hadith-child-kindness")?.majlisiGrade).toBe("صحيح");
    expect(CURATED_SHIA_HADITH_TIPS.find(tip => tip.id === "curated-hadith-household-partnership")).toMatchObject({
      majlisiGrade: "حسن",
      sourceUrl: "https://thaqalayn.net/ar/hadith/5/2/11/1",
    });
    const secondBatchIds = [
      "curated-hadith-gentle-dealings",
      "curated-hadith-practical-joy",
      "curated-hadith-good-character",
    ];
    const secondBatch = CURATED_SHIA_HADITH_TIPS.filter(tip => secondBatchIds.includes(tip.id));
    expect(secondBatch).toHaveLength(3);
    expect(secondBatch.every(tip => Boolean(tip.application))).toBe(true);
    const positiveParentingBatchIds = [
      "curated-hadith-family-compassion",
    ];
    const positiveParentingBatch = CURATED_SHIA_HADITH_TIPS.filter(tip => positiveParentingBatchIds.includes(tip.id));
    expect(positiveParentingBatch).toHaveLength(1);
    expect(positiveParentingBatch.every(tip => Boolean(tip.application))).toBe(true);
    expect(CURATED_SHIA_HADITH_TIPS.find(tip => tip.id === "curated-hadith-family-compassion")).toMatchObject({
      majlisiGrade: "صحيح",
      sourceUrl: "https://thaqalayn.net/hadith/2/1/69/8",
    });
    expect(CURATED_SHIA_HADITH_TIPS.some(tip => tip.text.includes("..."))).toBe(false);
    expect(CURATED_SHIA_HADITH_TIPS.map(tip => tip.id)).not.toEqual(expect.arrayContaining([
      "curated-hadith-keep-promises-to-children",
      "curated-hadith-arbitration-consent",
      "curated-hadith-developmental-stages",
      "curated-hadith-social-visit",
      "curated-hadith-social-respect-elders",
      "curated-hadith-social-greeting-consent",
      "curated-hadith-kinship-persist-with-boundaries",
      "curated-hadith-child-cry",
      "curated-hadith-repair-with-child",
      "curated-hadith-family-reconciliation",
      "curated-hadith-kinship-greetings",
      "curated-hadith-truth-and-trust",
      "curated-hadith-protect-dignity",
      "curated-hadith-fairness-and-support",
      "curated-hadith-family-priority",
      "curated-hadith-honor-mother",
    ]));
    const socialKinshipBatchIds = [
      "curated-hadith-social-sincere-advice",
      "curated-hadith-social-honor-guest",
    ];
    const socialKinshipBatch = CURATED_SHIA_HADITH_TIPS.filter(tip => socialKinshipBatchIds.includes(tip.id));
    expect(socialKinshipBatch).toHaveLength(2);
    expect(socialKinshipBatch.every(tip => Boolean(tip.application))).toBe(true);
    expect(socialKinshipBatch.every(tip => verificationForCuratedShiaHadith(tip).status === "publishable")).toBe(true);
    expect(CURATED_SHIA_HADITH_TIPS.filter(tip => tip.id.includes("family-sustenance") || tip.id.includes("relieve-hardship") || tip.id.includes("gentleness-blessing")).every(tip => tip.majlisiGrade === "صحيح" && Boolean(tip.application))).toBe(true);
    expect(publishedHadithTips.find(tip => tip.text.includes("نِعْمَ الْجُرْعَةُ الْغَيْظُ"))).toMatchObject({
      narrator: "الإمام الصادق (ع)",
      sourceUrl: "https://thaqalayn.net/hadith/2/1/54/2",
    });
    expect(HADITH_PUBLICATION_REVIEW).toHaveLength(28);
    expect(HADITH_PUBLICATION_REVIEW.filter(item => item.decision === "excluded")).toHaveLength(27);
    expect(HADITH_PUBLICATION_REVIEW.every(item => item.reason.includes(item.originalReference))).toBe(true);
    expect(HADITH_PUBLICATION_REVIEW.filter(item => item.publicationBasis === "majlisi_accepted").every(item => item.verification?.method === "majlisi_grade" && item.verification.status === "publishable")).toBe(true);
    expect(HADITH_PUBLICATION_REVIEW.filter(item => item.verification?.method === "source_only").every(item => item.verification?.status === "research_only" && item.decision === "excluded")).toBe(true);
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
    })).toBe(false);
    expect(isPublishableShiaHadithReview({
      ...incompleteApproval,
      majlisiGrade: "غير متحققة",
      shiaSourceUrl: "https://thaqalayn.net/hadith/example",
      shiaSourceLocation: "الكتاب، الباب، الحديث، بسند منشور",
      publicationBasis: "published_scholarly_verdict",
      verification: {
        method: "published_scholarly_verdict",
        status: "publishable",
        label: "حكم السند",
        verdict: "معتبر",
        verifier: "مرجع شيعي محدد",
        verifierWork: "كتاب تقييم الأسانيد",
        referenceUrl: "https://example.org/shia-verdict",
      },
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

    expect(excluded).toHaveLength(27);
    expect(excluded.every(item => (
      item.reason.trim().length > 0
      && item.thaqalaynSearchUrl.startsWith("https://thaqalayn.net/search?q=")
      && ["thaqalayn_direct", "shia_alternate_or_text_variant", "no_source_verified", "non_shia_source_identified"].includes(item.sourceEvidenceStatus)
    ))).toBe(true);
    expect(excluded.filter(item => item.verification?.method === "source_only")).toHaveLength(4);
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
    expect(roundSummaryReflection(summary)).toContain("النصيحة التي ظهرت");
  });
});
