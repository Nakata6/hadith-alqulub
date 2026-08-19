import { ORIGINAL_GAME_DATA } from "./originalGameData";

export type HadithPublicationDecision = "excluded" | "approved";

export type HadithPublicationReview = {
  text: string;
  speaker: string;
  originalSource: string;
  originalReference: string;
  decision: HadithPublicationDecision;
  reason: string;
  shiaSourceUrl?: string;
  shiaSourceLocation?: string;
  gradingReferenceUrl?: string;
};

const originalHadiths = (ORIGINAL_GAME_DATA.DAILY_TIPS as unknown as ReadonlyArray<{
  text: string;
  speaker: string;
  source: string;
  reference: string;
  category: "hadith" | "expert";
}>).filter(item => item.category === "hadith");

// كل حديث مدرج هنا بقرار فردي نهائي لهذا الإصدار. لا يترقى القرار إلى approved إلا بعد توثيق موضع شيعي قابل للفتح وحكم سندي يعتمد مالك المشروع.
export const HADITH_PUBLICATION_REVIEW: readonly HadithPublicationReview[] = originalHadiths.map(item => ({
  text: item.text,
  speaker: item.speaker,
  originalSource: item.source,
  originalReference: item.reference,
  decision: "excluded",
  reason: `المرجع الموروث «${item.source} — ${item.reference}» لا يحقق وحده شرط موضع شيعي قابل للفتح مع حكم سندي موثق؛ لذلك استبعد النص من النشر العام في هذا الإصدار.`,
}));

export function isPublishableShiaHadithReview(review: HadithPublicationReview) {
  return review.decision === "approved"
    && Boolean(review.shiaSourceUrl?.startsWith("https://"))
    && Boolean(review.shiaSourceLocation?.trim())
    && Boolean(review.gradingReferenceUrl?.startsWith("https://"));
}

export function isApprovedShiaHadith(text: string) {
  const review = HADITH_PUBLICATION_REVIEW.find(item => item.text === text);
  return Boolean(review && isPublishableShiaHadithReview(review));
}
