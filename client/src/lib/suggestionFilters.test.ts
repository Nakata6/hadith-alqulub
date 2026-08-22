import { describe, expect, it } from "vitest";
import { DEFAULT_SUGGESTION_FILTERS, filterSuggestions } from "./suggestionFilters";

const items = [
  { kind: "question" as const, status: "pending" as const, body: "ما أجمل موقف؟", createdAt: new Date("2026-08-22T10:00:00Z") },
  { kind: "tip" as const, status: "published" as const, body: "خصصا وقتاً للإنصات", narrator: "مرجع أسري", createdAt: new Date("2026-08-15T10:00:00Z") },
  { kind: "penalty" as const, status: "rejected" as const, body: "قولا كلمة امتنان", createdAt: new Date("2026-06-01T10:00:00Z") },
];

describe("filterSuggestions", () => {
  it("يجمع البحث والنوع والحالة من دون تغيير ترتيب الاقتراحات", () => {
    expect(filterSuggestions(items, { ...DEFAULT_SUGGESTION_FILTERS, query: "إنصات", kind: "tip", status: "published" }, new Date("2026-08-22T12:00:00Z"))).toEqual([items[1]]);
  });

  it("يفصل الاقتراحات حسب عمرها الزمني محلياً", () => {
    expect(filterSuggestions(items, { ...DEFAULT_SUGGESTION_FILTERS, date: "today" }, new Date("2026-08-22T12:00:00Z"))).toEqual([items[0]]);
    expect(filterSuggestions(items, { ...DEFAULT_SUGGESTION_FILTERS, date: "older" }, new Date("2026-08-22T12:00:00Z"))).toEqual([items[2]]);
  });
});
