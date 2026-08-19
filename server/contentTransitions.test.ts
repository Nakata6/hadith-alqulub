import { describe, expect, it } from "vitest";
import { publicationLogEntry, publishedSuggestionUpdate, rejectedSuggestionUpdate } from "./contentTransitions";

describe("انتقالات حالة اقتراحات المحتوى", () => {
  it("ينقل الاقتراح المعلق إلى مرفوض مع سجل مراجعة المدير", () => {
    const reviewedAt = new Date("2026-08-19T08:00:00.000Z");
    expect(rejectedSuggestionUpdate(3, "صياغة السؤال قريبة من محتوى موجود.", reviewedAt)).toEqual({
      status: "rejected", reviewNote: "صياغة السؤال قريبة من محتوى موجود.", reviewedByUserId: 3, reviewedAt,
    });
  });

  it("ينقل الاقتراح المعلق إلى منشور ويربطه بالمحتوى العام وسجل النشر", () => {
    const reviewedAt = new Date("2026-08-19T08:01:00.000Z");
    expect(publishedSuggestionUpdate(3, 99, reviewedAt)).toEqual({
      status: "published", reviewedByUserId: 3, reviewedAt, publishedContentId: 99,
    });
    expect(publicationLogEntry(44, 99, 3)).toEqual({ suggestionId: 44, contentItemId: 99, adminUserId: 3 });
  });
});
