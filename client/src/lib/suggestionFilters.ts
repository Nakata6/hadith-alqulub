export type SuggestionKindFilter = "all" | "question" | "penalty" | "tip";
export type SuggestionStatusFilter = "all" | "pending" | "rejected" | "published";
export type SuggestionDateFilter = "all" | "today" | "week" | "month" | "older";

export type SuggestionFilters = {
  query: string;
  kind: SuggestionKindFilter;
  status: SuggestionStatusFilter;
  date: SuggestionDateFilter;
};

export const DEFAULT_SUGGESTION_FILTERS: SuggestionFilters = { query: "", kind: "all", status: "all", date: "all" };

type FilterableSuggestion = {
  kind: Exclude<SuggestionKindFilter, "all">;
  status: Exclude<SuggestionStatusFilter, "all">;
  body: string;
  summary?: string | null;
  narrator?: string | null;
  source?: string | null;
  createdAt: Date | string;
};

function matchesDate(createdAt: Date | string, filter: SuggestionDateFilter, now: Date) {
  if (filter === "all") return true;
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return false;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(today); weekAgo.setDate(weekAgo.getDate() - 7);
  const monthAgo = new Date(today); monthAgo.setMonth(monthAgo.getMonth() - 1);
  if (filter === "today") return date >= today;
  if (filter === "week") return date >= weekAgo;
  if (filter === "month") return date >= monthAgo;
  return date < monthAgo;
}

export function filterSuggestions<T extends FilterableSuggestion>(items: readonly T[], filters: SuggestionFilters, now = new Date()) {
  const query = filters.query.trim().toLocaleLowerCase("ar");
  return items.filter(item => {
    const searchable = [item.body, item.summary, item.narrator, item.source].filter(Boolean).join(" ").toLocaleLowerCase("ar");
    return (filters.kind === "all" || item.kind === filters.kind)
      && (filters.status === "all" || item.status === filters.status)
      && (!query || searchable.includes(query))
      && matchesDate(item.createdAt, filters.date, now);
  });
}
