import { describe, expect, it } from "vitest";
import { canOwnerDeleteSuggestion, canReviewSuggestion, canViewPrivateSuggestion } from "./suggestionRules";

describe("قواعد ملكية اقتراحات المحتوى", () => {
  it("تسمح لصاحب الاقتراح بحذف المعلق أو المرفوض فقط", () => {
    expect(canOwnerDeleteSuggestion("pending")).toBe(true);
    expect(canOwnerDeleteSuggestion("rejected")).toBe(true);
    expect(canOwnerDeleteSuggestion("published")).toBe(false);
  });

  it("تحصر مراجعة الاقتراحات المعلقة في المدير", () => {
    expect(canReviewSuggestion("admin", "pending")).toBe(true);
    expect(canReviewSuggestion("user", "pending")).toBe(false);
    expect(canReviewSuggestion("admin", "published")).toBe(false);
  });

  it("لا يكشف الاقتراح الخاص لغير صاحبه إلا للمدير", () => {
    expect(canViewPrivateSuggestion({ ownerId: 7, viewerId: 7, viewerRole: "user" })).toBe(true);
    expect(canViewPrivateSuggestion({ ownerId: 7, viewerId: 8, viewerRole: "user" })).toBe(false);
    expect(canViewPrivateSuggestion({ ownerId: 7, viewerId: 8, viewerRole: "admin" })).toBe(true);
  });
});
