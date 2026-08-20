import { ORIGINAL_GAME_DATA } from "./originalGameData";

export type HadithPublicationDecision = "excluded" | "approved";
export type MajlisiGrade = "صحيح" | "حسن" | "حسن كالصحيح" | "موثق" | "ضعيف" | "مرسل" | "غير متحققة";
export type HadithReviewStatus = "accepted" | "rejected_weak_or_mursal" | "source_found_without_grade" | "non_shia_source_identified" | "source_or_attribution_unverified";
export type SourceEvidenceStatus = "thaqalayn_direct" | "shia_alternate_or_text_variant" | "no_source_verified" | "non_shia_source_identified";
export type HadithPublicationBasis = "majlisi_accepted" | "verified_shia_chain";

export type HadithPublicationReview = {
  text: string;
  speaker: string;
  originalSource: string;
  originalReference: string;
  majlisiGrade: MajlisiGrade;
  reviewStatus: HadithReviewStatus;
  sourceEvidenceStatus: SourceEvidenceStatus;
  decision: HadithPublicationDecision;
  reason: string;
  thaqalaynSearchUrl: string;
  shiaSourceUrl?: string;
  shiaSourceLocation?: string;
  gradingReferenceUrl?: string;
  publicationBasis?: HadithPublicationBasis;
  publishedText?: string;
  publishedSource?: string;
  publishedReference?: string;
  publishedSpeaker?: string;
};

type MajlisiFinding = Pick<HadithPublicationReview, "majlisiGrade" | "shiaSourceUrl" | "shiaSourceLocation" | "gradingReferenceUrl" | "publicationBasis" | "publishedText" | "publishedSource" | "publishedReference" | "publishedSpeaker">;

const MAJLISI_FINDINGS_BY_TEXT: Readonly<Record<string, MajlisiFinding>> = {
  "جُلُوسُ الْمَرْأَةِ عِنْدَ زَوْجِهَا أَحَبُّ إِلَى اللَّهِ تَعَالَى مِنَ اعْتِكَافٍ فِي مَسْجِدِي هَذَا": {
    majlisiGrade: "غير متحققة",
    shiaSourceUrl: "https://rafed.net/reyhana/article/15699",
    shiaSourceLocation: "تنبيه الخواطر؛ النص المنشور بلفظ «جلوس المرء عند عياله...» وهو مختلف عن النص المؤرشف",
  },
  "التَّوَدُّدُ إِلَى النَّاسِ نِصْفُ الْعَقْلِ": {
    majlisiGrade: "غير متحققة",
    shiaSourceUrl: "https://lib.eshia.ir/11017/1/285",
    shiaSourceLocation: "مسند الإمام الرضا، ج1، ص285؛ يحيل إلى تحف العقول، ص325",
  },
  "إِنَّ اللَّهَ عَزَّ وَجَلَّ إِذَا أَحَبَّ أَهْلَ بَيْتٍ أَدْخَلَ عَلَيْهِمُ الرِّفْقَ": {
    majlisiGrade: "غير متحققة",
    shiaSourceUrl: "https://thaqalayn.net/chapter/31/2/3",
    shiaSourceLocation: "كتاب الزهد، ج1، كتاب 2، باب حسن الخلق؛ لفظ قريب «إذا أراد الله بأهل بيت خيراً رزقهم الرفق في المعيشة وحسن الخلق»",
  },
  "إِنَّ الْمَرْأَةَ رَيْحَانَةٌ وَلَيْسَتْ بِقَهْرَمَانَةٍ": {
    majlisiGrade: "ضعيف",
    shiaSourceUrl: "https://thaqalayn.net/hadith/5/3/151/3",
    shiaSourceLocation: "الكافي، ج5، كتاب 3، باب إكرام المرأة، الحديث 3",
    gradingReferenceUrl: "https://thaqalayn.net/hadith/5/3/151/3",
  },
  "الْعَبْدُ كُلَّمَا ازْدَادَ لِلنِّسَاءِ حُبّاً ازْدَادَ فِي الْإِيمَانِ فَضْلًا": {
    majlisiGrade: "غير متحققة",
    shiaSourceUrl: "https://thaqalayn.net/ar/chapter/36/3/5",
    shiaSourceLocation: "من لا يحضره الفقيه، ج3، كتاب 3، باب حب النساء؛ الرواية الأولى تورد النص عن أبي العباس عن الإمام الصادق (ع)",
    publicationBasis: "verified_shia_chain",
    publishedSource: "من لا يحضره الفقيه",
    publishedReference: "ج3، كتاب 3، باب حب النساء، الحديث 1",
    publishedSpeaker: "الإمام الصادق (ع)",
  },
  "أَيُّمَا امْرَأَةٍ خَدَمَتْ زَوْجَهَا سَبْعَةَ أَيَّامٍ أَغْلَقَ اللَّهُ عَنْهَا سَبْعَةَ أَبْوَابِ النَّارِ": {
    majlisiGrade: "غير متحققة",
    shiaSourceUrl: "https://lib.eshia.ir/11025/20/172",
    shiaSourceLocation: "وسائل الشيعة، ج20، ص172، الحديث 25342؛ الحاشية تصرح بعدم العثور عليه في تنبيه الخواطر المطبوع",
  },
  "خَيْرُكُمْ خَيْرُكُمْ لِأَهْلِهِ، وَأَنَا خَيْرُكُمْ لِأَهْلِي": {
    majlisiGrade: "غير متحققة",
    shiaSourceUrl: "https://thaqalayn.net/hadith/36/4/25/10",
    shiaSourceLocation: "من لا يحضره الفقيه، ج3، كتاب 4، باب 25، الحديث 10",
  },
  "مَا مِنِ امْرَأَةٍ تَسْقِي زَوْجَهَا شَرْبَةً مِنْ مَاءٍ إِلَّا كَانَ خَيْراً لَهَا مِنْ عِبَادَةِ سَنَةٍ": {
    majlisiGrade: "غير متحققة",
    shiaSourceUrl: "https://lib.eshia.ir/11025/20/172",
    shiaSourceLocation: "وسائل الشيعة، ج20، ص172، الحديث 25343؛ الحاشية تصرح بعدم العثور عليه في تنبيه الخواطر المطبوع",
  },
};

const MAJLISI_FINDINGS_BY_ORIGINAL_REFERENCE: Readonly<Record<string, MajlisiFinding>> = {
  "مستدرك الوسائل ج15 ص116": {
    majlisiGrade: "غير متحققة",
    shiaSourceUrl: "https://lib.eshia.ir/11015/15/116",
    shiaSourceLocation: "مستدرك الوسائل، ج15، ص116، الحديث 17709؛ يرويه جامع الأخبار عن أبي هريرة",
  },
  "بحار الأنوار ج43 ص117": {
    majlisiGrade: "غير متحققة",
    shiaSourceUrl: "https://lib.eshia.ir/11008/43/117",
    shiaSourceLocation: "بحار الأنوار، ج43، ص117؛ خبر سؤال النبي للإمام علي عن فاطمة",
  },
  "جامع السعادات ج2 ص140": {
    majlisiGrade: "غير متحققة",
    shiaSourceUrl: "https://lib.eshia.ir/11008/104/132",
    shiaSourceLocation: "بحار الأنوار، ج104، ص132، باب فضل خدمة العيال؛ ينقل عن جامع الأخبار ص102",
  },
  "الحكمة 136": {
    majlisiGrade: "غير متحققة",
    shiaSourceUrl: "https://thaqalayn.net/hadith/10/25/10/1",
    shiaSourceLocation: "الخصال، الكتاب 25، الباب 10، الحديث 1؛ السند منشور في الموضع",
    publicationBasis: "verified_shia_chain",
    publishedSource: "الخصال",
    publishedReference: "الكتاب 25، الباب 10، الحديث 1",
    publishedSpeaker: "الإمام الباقر (ع)",
  },
  "ج66 ص408": {
    majlisiGrade: "غير متحققة",
    shiaSourceUrl: "https://thaqalayn.net/ar/chapter/10/4/15",
    shiaSourceLocation: "الخصال، ج1، الكتاب 4، الباب 15، الحديث 1؛ السند منشور في الموضع",
    publicationBasis: "verified_shia_chain",
    publishedText: "مَنْ حَسُنَ بَرُّهُ بِأَهْلِهِ زَادَ اللَّهُ فِي عُمُرِهِ",
    publishedSource: "الخصال",
    publishedReference: "ج1، الكتاب 4، الباب 15، الحديث 1",
    publishedSpeaker: "الإمام الصادق (ع)",
  },
  "ج5 ص569": {
    majlisiGrade: "ضعيف",
    shiaSourceUrl: "https://thaqalayn.net/hadith/5/3/190/59",
    shiaSourceLocation: "الكافي، ج5، كتاب 3، باب 190، ح59",
    gradingReferenceUrl: "https://thaqalayn.net/hadith/5/3/190/59",
  },
  "الكافي ج2 ص110": {
    majlisiGrade: "مرسل",
    shiaSourceUrl: "https://thaqalayn.net/ar/hadith/2/1/54/6",
    shiaSourceLocation: "الكافي، ج2، كتاب 1، باب كظم الغيظ، ح6",
    gradingReferenceUrl: "https://thaqalayn.net/ar/hadith/2/1/54/6",
  },
  "ج5 ص144": {
    majlisiGrade: "ضعيف",
    shiaSourceUrl: "https://thaqalayn.net/ar/hadith/5/2/50/14",
    shiaSourceLocation: "الكافي، ج5، كتاب 2، باب الهدية، الحديث 14",
    gradingReferenceUrl: "https://thaqalayn.net/ar/hadith/5/2/50/14",
  },
  "الكافي ج2 ص189": {
    majlisiGrade: "غير متحققة",
    shiaSourceUrl: "https://thaqalayn.net/hadith/30/1/5/21",
    shiaSourceLocation: "كتاب المؤمن، الكتاب 1، الباب 5، الحديث 21",
  },
  "الكافي ج2 ص321": {
    majlisiGrade: "حسن كالصحيح",
    shiaSourceUrl: "https://thaqalayn.net/hadith/2/1/129/1",
    shiaSourceLocation: "الكافي، ج2، كتاب 1، باب سوء الخلق، الحديث 1",
    gradingReferenceUrl: "https://thaqalayn.net/hadith/2/1/129/1",
  },
  "الكافي ج2 ص635": {
    majlisiGrade: "غير متحققة",
    shiaSourceUrl: "https://thaqalayn.net/hadith/29/1/36/16",
    shiaSourceLocation: "الأمالي، الكتاب 1، المجلس 36، الحديث 16؛ السند منشور في الموضع",
    publicationBasis: "verified_shia_chain",
    publishedSource: "الأمالي",
    publishedReference: "الكتاب 1، المجلس 36، الحديث 16",
    publishedSpeaker: "رسول الله (ص)",
  },
};

const originalHadiths = (ORIGINAL_GAME_DATA.DAILY_TIPS as unknown as ReadonlyArray<{
  text: string;
  speaker: string;
  source: string;
  reference: string;
  category: "hadith" | "expert";
}>).filter(item => item.category === "hadith");

const ACCEPTED_MAJLISI_GRADES: readonly MajlisiGrade[] = ["صحيح", "حسن", "حسن كالصحيح", "موثق"];
const NON_SHIA_SOURCE_TEXTS = new Set([
  "إِذَا أَرَدْتَ الدُّخُولَ عَلَى أَهْلِكَ فَسَلِّمْ فَإِنَّهُ بَرَكَةٌ عَلَيْكَ وَعَلَى أَهْلِ بَيْتِكَ",
  "التَّوَدُّدُ إِلَى النَّاسِ نِصْفُ الْعَقْلِ",
  "إِنَّ اللَّهَ عَزَّ وَجَلَّ إِذَا أَحَبَّ أَهْلَ بَيْتٍ أَدْخَلَ عَلَيْهِمُ الرِّفْقَ",
  "لَا يَفْرَكْ مُؤْمِنٌ مُؤْمِنَةً، إِنْ كَرِهَ مِنْهَا خُلُقاً رَضِيَ مِنْهَا آخَرَ",
  "أَفْضَلُ الْأَعْمَالِ إِدْخَالُ السُّرُورِ عَلَى الْمُؤْمِنِ",
]);

// يعتمد النشر على درجة مجلسي مقبولة، أو على سند/موضع شيعي منشور قابل للتحقق؛ لا يكفي النقل التجميعي أو النص غير المسند.
export const HADITH_PUBLICATION_REVIEW: readonly HadithPublicationReview[] = originalHadiths.map(item => {
  const finding = MAJLISI_FINDINGS_BY_TEXT[item.text]
    ?? MAJLISI_FINDINGS_BY_ORIGINAL_REFERENCE[item.reference]
    ?? { majlisiGrade: "غير متحققة" as const };
  const gradeReason = finding.majlisiGrade === "ضعيف" || finding.majlisiGrade === "مرسل"
    ? `درجة العلّامة المجلسي المنشورة هي «${finding.majlisiGrade}».`
    : "لم تُتحقق بعد درجة العلّامة المجلسي لهذا النص في مكتبة ثقلين؛ فلا يصلح للاعتماد بهذا المعيار.";

  const hasAcceptedMajlisiEvidence = ACCEPTED_MAJLISI_GRADES.includes(finding.majlisiGrade)
    && Boolean(finding.shiaSourceUrl?.startsWith("https://"))
    && Boolean(finding.shiaSourceLocation?.trim())
    && Boolean(finding.gradingReferenceUrl?.startsWith("https://"));
  const hasVerifiedShiaChainEvidence = finding.publicationBasis === "verified_shia_chain"
    && Boolean(finding.shiaSourceUrl?.startsWith("https://"))
    && Boolean(finding.shiaSourceLocation?.trim());
  const hasPublishableEvidence = hasAcceptedMajlisiEvidence || hasVerifiedShiaChainEvidence;
  const publicationBasis = hasAcceptedMajlisiEvidence
    ? "majlisi_accepted" as const
    : hasVerifiedShiaChainEvidence
      ? "verified_shia_chain" as const
      : undefined;
  const reviewStatus: HadithReviewStatus = hasPublishableEvidence
    ? "accepted"
    : finding.majlisiGrade === "ضعيف" || finding.majlisiGrade === "مرسل"
      ? "rejected_weak_or_mursal"
      : NON_SHIA_SOURCE_TEXTS.has(item.text)
        ? "non_shia_source_identified"
        : finding.shiaSourceUrl
          ? "source_found_without_grade"
          : "source_or_attribution_unverified";
  const sourceEvidenceStatus: SourceEvidenceStatus = NON_SHIA_SOURCE_TEXTS.has(item.text)
    ? "non_shia_source_identified"
    : finding.shiaSourceUrl?.startsWith("https://thaqalayn.net/hadith/")
      ? "thaqalayn_direct"
      : finding.shiaSourceUrl
        ? "shia_alternate_or_text_variant"
        : "no_source_verified";

  return {
    text: item.text,
    speaker: item.speaker,
    originalSource: item.source,
    originalReference: item.reference,
    ...finding,
    publicationBasis,
    reviewStatus,
    sourceEvidenceStatus,
    decision: hasPublishableEvidence ? "approved" : "excluded",
    reason: hasPublishableEvidence
      ? publicationBasis === "majlisi_accepted"
        ? `درجة العلّامة المجلسي المنشورة هي «${finding.majlisiGrade}» مع موضع شيعي ورابط حكم قابلين للفتح؛ أُجيز النص «${item.reference}» للعرض.`
        : `ورد النص بسند أو موضع شيعي منشور قابل للتحقق؛ أُجيز النص «${item.reference}» للعرض وفق معيار السند الشيعي المعتمد.`
      : NON_SHIA_SOURCE_TEXTS.has(item.text)
        ? `أظهرت نتائج التحقق نسبة النص إلى مصادر غير شيعية، ولذلك استبعد النص «${item.reference}» من كتالوج الإنتاج.`
        : `${gradeReason} لذلك استبعد النص «${item.reference}» من كتالوج الإنتاج.`,
    thaqalaynSearchUrl: `https://thaqalayn.net/search?q=${encodeURIComponent(item.text)}&exact=1`,
  };
});

export function isPublishableShiaHadithReview(review: HadithPublicationReview) {
  const hasSource = Boolean(review.shiaSourceUrl?.startsWith("https://")) && Boolean(review.shiaSourceLocation?.trim());
  if (review.decision !== "approved" || !hasSource) return false;
  if (review.publicationBasis === "verified_shia_chain") return true;
  return review.publicationBasis === "majlisi_accepted"
    && ACCEPTED_MAJLISI_GRADES.includes(review.majlisiGrade)
    && Boolean(review.gradingReferenceUrl?.startsWith("https://"));
}

export function isApprovedShiaHadith(text: string) {
  const review = HADITH_PUBLICATION_REVIEW.find(item => item.text === text);
  return Boolean(review && isPublishableShiaHadithReview(review));
}

export function sourceUrlForApprovedShiaHadith(text: string) {
  const review = HADITH_PUBLICATION_REVIEW.find(item => item.text === text);
  return review && isPublishableShiaHadithReview(review) ? review.shiaSourceUrl : undefined;
}

export function approvedShiaHadithPresentation(text: string) {
  const review = HADITH_PUBLICATION_REVIEW.find(item => item.text === text);
  if (!review || !isPublishableShiaHadithReview(review)) return undefined;
  return {
    text: review.publishedText ?? review.text,
    narrator: review.publishedSpeaker,
    source: review.publishedSource,
    reference: review.publishedReference,
    sourceUrl: review.shiaSourceUrl,
  };
}
