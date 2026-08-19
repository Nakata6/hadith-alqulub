import { ORIGINAL_GAME_DATA } from "./originalGameData";

export type HadithPublicationDecision = "excluded" | "approved";
export type MajlisiGrade = "صحيح" | "حسن" | "موثق" | "ضعيف" | "مرسل" | "غير متحققة";

export type HadithPublicationReview = {
  text: string;
  speaker: string;
  originalSource: string;
  originalReference: string;
  majlisiGrade: MajlisiGrade;
  decision: HadithPublicationDecision;
  reason: string;
  shiaSourceUrl?: string;
  shiaSourceLocation?: string;
  gradingReferenceUrl?: string;
};

type MajlisiFinding = Pick<HadithPublicationReview, "majlisiGrade" | "shiaSourceUrl" | "shiaSourceLocation" | "gradingReferenceUrl">;

const MAJLISI_FINDINGS_BY_ORIGINAL_REFERENCE: Readonly<Record<string, MajlisiFinding>> = {
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
    majlisiGrade: "غير متحققة",
    shiaSourceUrl: "https://thaqalayn.net/hadith/10/2/87/1",
    shiaSourceLocation: "الخصال، الكتاب 2، الباب 87، الحديث 1",
  },
  "الكافي ج2 ص189": {
    majlisiGrade: "غير متحققة",
    shiaSourceUrl: "https://thaqalayn.net/hadith/30/1/5/21",
    shiaSourceLocation: "كتاب المؤمن، الكتاب 1، الباب 5، الحديث 21",
  },
  "الكافي ج2 ص321": {
    majlisiGrade: "غير متحققة",
    shiaSourceUrl: "https://thaqalayn.net/chapter/2/1/129",
    shiaSourceLocation: "الكافي، ج2، كتاب 1، باب سوء الخلق، الحديث 1",
  },
};

const originalHadiths = (ORIGINAL_GAME_DATA.DAILY_TIPS as unknown as ReadonlyArray<{
  text: string;
  speaker: string;
  source: string;
  reference: string;
  category: "hadith" | "expert";
}>).filter(item => item.category === "hadith");

// لا يترقى القرار إلى approved إلا بدرجة مجلسي مقبولة وموضع شيعي وحكم قابلين للفتح.
export const HADITH_PUBLICATION_REVIEW: readonly HadithPublicationReview[] = originalHadiths.map(item => {
  const finding = MAJLISI_FINDINGS_BY_ORIGINAL_REFERENCE[item.reference] ?? { majlisiGrade: "غير متحققة" as const };
  const gradeReason = finding.majlisiGrade === "ضعيف" || finding.majlisiGrade === "مرسل"
    ? `درجة العلّامة المجلسي المنشورة هي «${finding.majlisiGrade}».`
    : "لم تُتحقق بعد درجة العلّامة المجلسي لهذا النص في مكتبة ثقلين؛ فلا يصلح للاعتماد بهذا المعيار.";

  return {
    text: item.text,
    speaker: item.speaker,
    originalSource: item.source,
    originalReference: item.reference,
    ...finding,
    decision: "excluded",
    reason: `${gradeReason} لذلك استبعد النص «${item.reference}» من كتالوج الإنتاج.`,
  };
});

export function isPublishableShiaHadithReview(review: HadithPublicationReview) {
  const acceptedMajlisiGrades: readonly MajlisiGrade[] = ["صحيح", "حسن", "موثق"];
  return review.decision === "approved"
    && acceptedMajlisiGrades.includes(review.majlisiGrade)
    && Boolean(review.shiaSourceUrl?.startsWith("https://"))
    && Boolean(review.shiaSourceLocation?.trim())
    && Boolean(review.gradingReferenceUrl?.startsWith("https://"));
}

export function isApprovedShiaHadith(text: string) {
  const review = HADITH_PUBLICATION_REVIEW.find(item => item.text === text);
  return Boolean(review && isPublishableShiaHadithReview(review));
}
