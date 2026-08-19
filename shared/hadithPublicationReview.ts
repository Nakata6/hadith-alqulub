import { ORIGINAL_GAME_DATA } from "./originalGameData";

export type HadithPublicationDecision = "excluded" | "approved";
export type MajlisiGrade = "صحيح" | "حسن" | "حسن كالصحيح" | "موثق" | "ضعيف" | "مرسل" | "غير متحققة";

export type HadithPublicationReview = {
  text: string;
  speaker: string;
  originalSource: string;
  originalReference: string;
  majlisiGrade: MajlisiGrade;
  decision: HadithPublicationDecision;
  reason: string;
  thaqalaynSearchUrl: string;
  shiaSourceUrl?: string;
  shiaSourceLocation?: string;
  gradingReferenceUrl?: string;
};

type MajlisiFinding = Pick<HadithPublicationReview, "majlisiGrade" | "shiaSourceUrl" | "shiaSourceLocation" | "gradingReferenceUrl">;

const MAJLISI_FINDINGS_BY_TEXT: Readonly<Record<string, MajlisiFinding>> = {
  "خَيْرُكُمْ خَيْرُكُمْ لِأَهْلِهِ، وَأَنَا خَيْرُكُمْ لِأَهْلِي": {
    majlisiGrade: "غير متحققة",
    shiaSourceUrl: "https://thaqalayn.net/hadith/36/4/25/10",
    shiaSourceLocation: "من لا يحضره الفقيه، ج3، كتاب 4، باب 25، الحديث 10",
  },
  "مَا مِنِ امْرَأَةٍ تَسْقِي زَوْجَهَا شَرْبَةً مِنْ مَاءٍ إِلَّا كَانَ خَيْراً لَهَا مِنْ عِبَادَةِ سَنَةٍ": {
    majlisiGrade: "غير متحققة",
    shiaSourceUrl: "https://wasail-al-shia.net/r/25439",
    shiaSourceLocation: "وسائل الشيعة، ج20، قسم النكاح، الباب 89، الحديث 25343",
  },
};

const MAJLISI_FINDINGS_BY_ORIGINAL_REFERENCE: Readonly<Record<string, MajlisiFinding>> = {
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
    shiaSourceLocation: "الخصال، الكتاب 25، الباب 10، الحديث 1",
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
    shiaSourceLocation: "الأمالي، الكتاب 1، المجلس 36، الحديث 16",
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

// لا يترقى القرار إلى approved إلا بدرجة مجلسي مقبولة وموضع شيعي وحكم قابلين للفتح.
export const HADITH_PUBLICATION_REVIEW: readonly HadithPublicationReview[] = originalHadiths.map(item => {
  const finding = MAJLISI_FINDINGS_BY_TEXT[item.text]
    ?? MAJLISI_FINDINGS_BY_ORIGINAL_REFERENCE[item.reference]
    ?? { majlisiGrade: "غير متحققة" as const };
  const gradeReason = finding.majlisiGrade === "ضعيف" || finding.majlisiGrade === "مرسل"
    ? `درجة العلّامة المجلسي المنشورة هي «${finding.majlisiGrade}».`
    : "لم تُتحقق بعد درجة العلّامة المجلسي لهذا النص في مكتبة ثقلين؛ فلا يصلح للاعتماد بهذا المعيار.";

  const hasPublishableEvidence = ACCEPTED_MAJLISI_GRADES.includes(finding.majlisiGrade)
    && Boolean(finding.shiaSourceUrl?.startsWith("https://"))
    && Boolean(finding.shiaSourceLocation?.trim())
    && Boolean(finding.gradingReferenceUrl?.startsWith("https://"));

  return {
    text: item.text,
    speaker: item.speaker,
    originalSource: item.source,
    originalReference: item.reference,
    ...finding,
    decision: hasPublishableEvidence ? "approved" : "excluded",
    reason: hasPublishableEvidence
      ? `درجة العلّامة المجلسي المنشورة هي «${finding.majlisiGrade}» مع موضع شيعي ورابط حكم قابلين للفتح؛ أُجيز النص «${item.reference}» للعرض.`
      : `${gradeReason} لذلك استبعد النص «${item.reference}» من كتالوج الإنتاج.`,
    thaqalaynSearchUrl: `https://thaqalayn.net/search?q=${encodeURIComponent(item.text)}&exact=1`,
  };
});

export function isPublishableShiaHadithReview(review: HadithPublicationReview) {
  return review.decision === "approved"
    && ACCEPTED_MAJLISI_GRADES.includes(review.majlisiGrade)
    && Boolean(review.shiaSourceUrl?.startsWith("https://"))
    && Boolean(review.shiaSourceLocation?.trim())
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
