import { ORIGINAL_GAME_DATA } from "@shared/originalGameData";

export const LEVELS = ["hamasat", "nabd", "aamaq", "jawhar"] as const;
export type LevelKey = (typeof LEVELS)[number];

export type GameCard = {
  id: string;
  level: LevelKey;
  prompt: string;
};

export type GameTip = {
  id: string;
  text: string;
  summary: string;
  narrator: string;
  source: string;
  sourceUrl?: string;
};

export type CommunityGameContent = {
  kind: "question" | "penalty" | "tip";
  level?: LevelKey | null;
  body: string;
  summary?: string | null;
  narrator?: string | null;
  source?: string | null;
  sourceUrl?: string | null;
};

export type GameCatalog = {
  questions: Record<LevelKey, string[]>;
  penalties: string[];
  tips: GameTip[];
};

type RawGameData = {
  QUESTIONS: Record<LevelKey, readonly string[]>;
  DAILY_TIPS?: readonly unknown[];
  PENALTIES?: readonly unknown[];
  PUNISHMENTS?: readonly unknown[];
  LEVEL_LABELS: Record<LevelKey, string>;
  EXPLANATIONS?: Record<string, { summary?: string }>;
};

const gameData = ORIGINAL_GAME_DATA as unknown as RawGameData;

export const LEVEL_LABELS = gameData.LEVEL_LABELS;
export const QUESTION_BANK = gameData.QUESTIONS;
export const ROUND_LEVEL_LIMITS = { minimum: 1, maximum: 3 } as const;

export function shuffle<T>(items: readonly T[]): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const next = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[next]] = [copy[next]!, copy[index]!];
  }
  return copy;
}

function textFromUnknown(value: unknown): string {
  if (typeof value === "string") return value;
  if (!value || typeof value !== "object") return "";
  const record = value as Record<string, unknown>;
  return ["text", "content", "penalty", "challenge", "title", "hadith", "quote"]
    .map(key => record[key])
    .find((candidate): candidate is string => typeof candidate === "string") ?? "";
}

function field(value: unknown, keys: string[]): string {
  if (!value || typeof value !== "object") return "";
  const record = value as Record<string, unknown>;
  return keys
    .map(key => record[key])
    .find((candidate): candidate is string => typeof candidate === "string") ?? "";
}

const rawPenalties = gameData.PENALTIES ?? gameData.PUNISHMENTS ?? [];
export const PENALTIES = rawPenalties.map(textFromUnknown).filter(Boolean);

export const TIPS: GameTip[] = (gameData.DAILY_TIPS ?? [])
  .map((raw, index) => {
    const text = field(raw, ["text", "hadith", "content", "quote"]);
    const explanation = gameData.EXPLANATIONS?.[text]?.summary ?? field(raw, ["summary", "explanation", "description"]);
    return {
      id: `tip-${index}`,
      text,
      summary: explanation,
      narrator: field(raw, ["narrator", "author", "imam"]) || "من أحاديث أهل البيت (ع)",
      source: field(raw, ["source", "reference", "book"]),
      sourceUrl: field(raw, ["sourceUrl", "url"]) || undefined,
    };
  })
  .filter(tip => Boolean(tip.text));

export function createGameCatalog(additionalContent: CommunityGameContent[] = []): GameCatalog {
  const questions = Object.fromEntries(LEVELS.map(level => [level, [...QUESTION_BANK[level]]])) as Record<LevelKey, string[]>;
  const penalties = [...PENALTIES];
  const tips = [...TIPS];

  additionalContent.forEach(item => {
    const body = item.body.trim();
    if (!body) return;
    if (item.kind === "question" && item.level && !questions[item.level].includes(body)) questions[item.level].push(body);
    if (item.kind === "penalty" && !penalties.includes(body)) penalties.push(body);
    if (item.kind === "tip" && !tips.some(tip => tip.text === body)) {
      tips.push({ id: `community-tip-${tips.length}`, text: body, summary: item.summary || "", narrator: item.narrator || "محتوى مجتمع حديث القلوب", source: item.source || "", sourceUrl: item.sourceUrl || undefined });
    }
  });

  return { questions, penalties, tips };
}

export function roundSizeFromLandscape(isLandscape: boolean) {
  return isLandscape ? 10 : 9;
}

export function roundSizeForViewport() {
  if (typeof window === "undefined") return 9;
  return roundSizeFromLandscape(window.matchMedia("(orientation: landscape)").matches);
}

export function levelCountsForRound(size: number) {
  const safeSize = Math.min(Math.max(size, LEVELS.length * ROUND_LEVEL_LIMITS.minimum), LEVELS.length * ROUND_LEVEL_LIMITS.maximum);
  const counts = Object.fromEntries(LEVELS.map(level => [level, ROUND_LEVEL_LIMITS.minimum])) as Record<LevelKey, number>;
  let remaining = safeSize - LEVELS.length * ROUND_LEVEL_LIMITS.minimum;
  let previousLevel: LevelKey | null = null;

  while (remaining > 0) {
    const weightedCandidates = LEVELS.flatMap(level => {
      if (counts[level] >= ROUND_LEVEL_LIMITS.maximum) return [];
      const capacityWeight = (ROUND_LEVEL_LIMITS.maximum - counts[level]) * 3;
      const repetitionPenalty = previousLevel === level ? 1 : 2;
      return Array.from({ length: capacityWeight * repetitionPenalty }, () => level);
    });
    const chosen = shuffle(weightedCandidates)[0];
    if (!chosen) break;
    counts[chosen] += 1;
    previousLevel = chosen;
    remaining -= 1;
  }
  return counts;
}

export function generateRound(
  size: number,
  recentlyUsed: string[] = [],
  questionBank: Record<LevelKey, readonly string[]> = QUESTION_BANK,
): GameCard[] {
  const counts = levelCountsForRound(size);
  const recentlyUsedSet = new Set(recentlyUsed);
  const selected: GameCard[] = [];

  LEVELS.forEach(level => {
    const fresh = questionBank[level].filter(question => !recentlyUsedSet.has(question));
    const pool = fresh.length >= counts[level] ? fresh : questionBank[level];
    shuffle(pool)
      .slice(0, counts[level])
      .forEach((prompt, position) => {
        selected.push({ id: `${level}-${Date.now()}-${position}-${Math.random()}`, level, prompt });
      });
  });

  return shuffle(selected);
}

export function choosePenalty(penalties: readonly string[] = PENALTIES) {
  return penalties[Math.floor(Math.random() * penalties.length)] ?? "شارك الطرف الآخر بكلمة لطيفة من قلبك.";
}

export function chooseTip(tips: readonly GameTip[] = TIPS) {
  return tips[Math.floor(Math.random() * tips.length)] ?? {
    id: "fallback-tip",
    text: "تَهَادَوْا تَحَابُّوا",
    summary: "المودة تنمو بالاهتمام والتقدير اليومي.",
    narrator: "من أحاديث أهل البيت (ع)",
    source: "",
  };
}

export function searchUrlForTip(tip: GameTip) {
  return `https://www.google.com/search?q=${encodeURIComponent(tip.text)}`;
}
