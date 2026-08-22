import {
  CURATED_SHIA_HADITH_TIPS,
  formatHadithVerification,
  HADITH_PUBLICATION_REVIEW,
  isPublishableShiaHadithReview,
  verificationForCuratedShiaHadith,
} from "@shared/hadithPublicationReview";

export type TransparencyFilter = "published" | "research" | "all";

export type HadithTransparencyEntry = {
  id: string;
  status: "published" | "research";
  text: string;
  narrator: string;
  source: string;
  reference: string;
  sourceUrl?: string;
  sourceLocation?: string;
  verificationLabel: string;
  verificationDetail?: string;
  reason: string;
};

const curatedEntries: readonly HadithTransparencyEntry[] = CURATED_SHIA_HADITH_TIPS.map(tip => {
  const verification = verificationForCuratedShiaHadith(tip);
  return {
    id: `curated-${tip.id}`,
    status: "published",
    text: tip.text,
    narrator: tip.narrator,
    source: tip.source,
    reference: tip.reference,
    sourceUrl: tip.sourceUrl,
    sourceLocation: tip.shiaSourceLocation,
    verificationLabel: formatHadithVerification(verification),
    verificationDetail: verification.verdict,
    reason: "يظهر النص في كتالوج اللعبة لأن الحكم المنشور منسوب إلى مرجعه وموضعه قابلان للمراجعة.",
  };
});

const archiveEntries: readonly HadithTransparencyEntry[] = HADITH_PUBLICATION_REVIEW.map((review, index) => {
  const published = isPublishableShiaHadithReview(review);
  return {
    id: `archive-${index}`,
    status: published ? "published" : "research",
    text: review.publishedText ?? review.text,
    narrator: review.publishedSpeaker ?? review.speaker,
    source: review.publishedSource ?? review.originalSource,
    reference: review.publishedReference ?? review.originalReference,
    sourceUrl: review.shiaSourceUrl ?? review.thaqalaynSearchUrl,
    sourceLocation: review.shiaSourceLocation,
    verificationLabel: review.verification ? formatHadithVerification(review.verification) : "لا يوجد حكم منشور مؤهل للعرض",
    verificationDetail: review.verification?.verdict,
    reason: review.reason,
  };
});

const uyunResearchEntries: readonly HadithTransparencyEntry[] = [
  {
    id: "uyun-research-gentle-social-conduct",
    status: "research",
    text: "فَمُدَارَاةُ النَّاسِ",
    narrator: "الإمام الرضا (ع)",
    source: "عيون أخبار الرضا",
    reference: "الكتاب 2، الباب 26، الحديث 9",
    sourceUrl: "https://thaqalayn.net/ar/hadith/11/2/26/9",
    sourceLocation: "السند يمر بسهل بن زياد والحارث بن الدلهاث في الموضع المعروض.",
    verificationLabel: "لا يوجد حكم منشور مؤهل للعرض",
    reason: "المحور موجود في الكتالوج برواية من الكافي لها حكم منشور، ولم يظهر حكم فردي منسوب على هذا السند من عيون أخبار الرضا.",
  },
  {
    id: "uyun-research-kinship-and-parents",
    status: "research",
    text: "وَأَمَرَ بِاتِّقَاءِ الله وَصِلَةِ الرَّحِمِ",
    narrator: "الإمام الرضا (ع)",
    source: "عيون أخبار الرضا",
    reference: "الكتاب 2، الباب 26، الحديث 13",
    sourceUrl: "https://thaqalayn.net/ar/hadith/11/2/26/13",
    sourceLocation: "السند يمر بالسياري والحارث بن الدلهاث في الموضع المعروض.",
    verificationLabel: "لا يوجد حكم منشور مؤهل للعرض",
    reason: "المعنى قريب من روايات صلة الرحم وبر الوالدين المعروضة، ولم يظهر حكم فردي منسوب على السند المطابق؛ لذلك بقي للبحث.",
  },
  {
    id: "uyun-research-hospitality-without-burden",
    status: "research",
    text: "لَا تُدْخِلْ عَلَيْنَا شَيْئاً مِنْ خَارِجٍ، وَلَا تُجْحِفْ بِالْعِيَالِ",
    narrator: "الإمام علي (ع)، برواية الإمام الرضا (ع)",
    source: "عيون أخبار الرضا",
    reference: "الكتاب 2، الباب 26، الحديث 16",
    sourceUrl: "https://thaqalayn.net/ar/hadith/11/2/26/16",
    sourceLocation: "موضع مباشر للسند والنص في مكتبة ثقلين.",
    verificationLabel: "لا يوجد حكم منشور مؤهل للعرض",
    reason: "مرشح اجتماعي غير مكرر، لكنه لا يدخل اللعبة قبل العثور على حكم منشور ومحدد على هذا السند أو موضع موازٍ بحكم منشور.",
  },
];

export const HADITH_TRANSPARENCY_ENTRIES: readonly HadithTransparencyEntry[] = [
  ...curatedEntries,
  ...archiveEntries,
  ...uyunResearchEntries,
];

export function filterHadithTransparencyEntries(filter: TransparencyFilter) {
  return filter === "all"
    ? HADITH_TRANSPARENCY_ENTRIES
    : HADITH_TRANSPARENCY_ENTRIES.filter(entry => entry.status === filter);
}

export function hadithTransparencyCounts() {
  const published = HADITH_TRANSPARENCY_ENTRIES.filter(entry => entry.status === "published").length;
  return {
    published,
    research: HADITH_TRANSPARENCY_ENTRIES.length - published,
    total: HADITH_TRANSPARENCY_ENTRIES.length,
  };
}
