import { describe, expect, it } from "vitest";
import type { GameTip } from "./game";
import { DEFAULT_TIP_FILTER, filterTipsBySelection, normalizeTipFilter, tipFilterKeysForTip } from "./tipFilters";

const tips: GameTip[] = [
  { id: "hadith-family", text: "رواية عن صلة الرحم والأسرة", summary: "", narrator: "الإمام الصادق (ع)", source: "الكافي", category: "hadith" },
  { id: "expert-marital", text: "نصيحة للشريك", summary: "", narrator: "مرجع أسري", source: "دراسة", category: "expert" },
  { id: "expert-parenting", text: "رافقي طفلك بهدوء", summary: "", narrator: "مرجع تربوي", source: "دراسة", category: "expert" },
];

describe("فلترة نصائح حديث القلوب", () => {
  it("تبقي الكتالوج مختلطاً كاملاً افتراضياً", () => {
    expect(filterTipsBySelection(tips, DEFAULT_TIP_FILTER)).toEqual(tips);
  });

  it("تدعم حصر النصائح في محور واحد أو عدة محاور", () => {
    expect(filterTipsBySelection(tips, { include: ["hadith"], exclude: [] }).map(tip => tip.id)).toEqual(["hadith-family"]);
    expect(filterTipsBySelection(tips, { include: ["marital", "parenting"], exclude: [] }).map(tip => tip.id)).toEqual(["hadith-family", "expert-marital", "expert-parenting"]);
  });

  it("تدعم استبعاد محور من العرض من دون تغيير بقية الاختيارات", () => {
    expect(filterTipsBySelection(tips, { include: [], exclude: ["hadith"] }).map(tip => tip.id)).toEqual(["expert-marital", "expert-parenting"]);
  });

  it("ينظف التفضيل المحفوظ ويمنع تعارض الحصر والاستبعاد", () => {
    expect(normalizeTipFilter({ include: ["expert", "غير صالح", "expert"], exclude: ["expert", "hadith"] })).toEqual({ include: ["expert"], exclude: ["hadith"] });
    expect(tipFilterKeysForTip(tips[0]!)).toEqual(expect.arrayContaining(["hadith", "parenting", "social"]));
  });
});
