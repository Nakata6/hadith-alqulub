import type { GameTip } from "./game";

export const TIP_FILTER_OPTIONS = [
  { key: "hadith", label: "روايات أهل البيت" },
  { key: "expert", label: "نصائح الخبراء" },
  { key: "marital", label: "الحياة الزوجية" },
  { key: "parenting", label: "التربية والأسرة" },
  { key: "social", label: "الحياة الاجتماعية" },
  { key: "community", label: "محتوى المجتمع" },
] as const;

export type TipFilterKey = (typeof TIP_FILTER_OPTIONS)[number]["key"];

export type TipFilterState = {
  include: TipFilterKey[];
  exclude: TipFilterKey[];
};

export const DEFAULT_TIP_FILTER: TipFilterState = { include: [], exclude: [] };

const tipFilterKeys = new Set<TipFilterKey>(TIP_FILTER_OPTIONS.map(option => option.key));

function uniqueFilterKeys(value: unknown): TipFilterKey[] {
  if (!Array.isArray(value)) return [];
  return Array.from(new Set(value.filter((item): item is TipFilterKey => typeof item === "string" && tipFilterKeys.has(item as TipFilterKey))));
}

export function normalizeTipFilter(value: unknown): TipFilterState {
  if (!value || typeof value !== "object") return { ...DEFAULT_TIP_FILTER };
  const record = value as Record<string, unknown>;
  const include = uniqueFilterKeys(record.include);
  const exclude = uniqueFilterKeys(record.exclude).filter(key => !include.includes(key));
  return { include, exclude };
}

export function tipFilterKeysForTip(tip: GameTip): TipFilterKey[] {
  const keys = new Set<TipFilterKey>();
  if (tip.category === "hadith" || tip.category === "expert" || tip.category === "community") keys.add(tip.category);

  const text = [tip.text, tip.summary, tip.translation, tip.narrator, tip.source, tip.reference].filter(Boolean).join(" ");
  if (/زوج|زوجة|زواج|شريك|علاقة|طلاق|معاشرة|بيت/.test(text)) keys.add("marital");
  if (/طفل|طفل|ولد|أولاد|أبناء|والد|والدين|ترب|صبي|بنت|بنات|أسرة|عيال/.test(text)) keys.add("parenting");
  if (/رحم|قريب|قريب|جار|ضيف|زيارة|مؤمن|صديق|اجتماع|مصافحة|كبير/.test(text)) keys.add("social");
  return Array.from(keys);
}

export function filterTipsBySelection(tips: readonly GameTip[], filter: TipFilterState): GameTip[] {
  const normalized = normalizeTipFilter(filter);
  return tips.filter(tip => {
    const keys = tipFilterKeysForTip(tip);
    const matchesIncluded = normalized.include.length === 0 || normalized.include.some(key => keys.includes(key));
    const matchesExcluded = normalized.exclude.some(key => keys.includes(key));
    return matchesIncluded && !matchesExcluded;
  });
}
