import { ORIGINAL_GAME_DATA } from "@shared/originalGameData";
import { approvedShiaHadithPresentation, CURATED_SHIA_HADITH_TIPS, isApprovedShiaHadith, sourceUrlForApprovedShiaHadith } from "@shared/hadithPublicationReview";

export const LEVELS = ["hamasat", "nabd", "aamaq", "jawhar"] as const;
export type LevelKey = (typeof LEVELS)[number];

export type GameCard = {
  id: string;
  level: LevelKey;
  prompt: string;
};

export type RoundCardState = "available" | "consumed";

export type GameTip = {
  id: string;
  text: string;
  summary: string;
  translation?: string;
  textOriginal?: string;
  narrator: string;
  source: string;
  reference?: string;
  category?: "hadith" | "expert" | "community";
  sourceUrl?: string;
};

export type RoundOutcome = "answered" | "skipped" | "penalty";

export type RoundOutcomeCounts = Record<RoundOutcome, number>;

export type RoundSummary = {
  roundNumber: number;
  totalCards: number;
  outcomes: RoundOutcomeCounts;
  playerTurns: [number, number];
  tips: GameTip[];
  sessionCardsOpened: number;
  sessionTipsShown: number;
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
  HADITH_EXPLANATIONS?: Record<string, { summary?: string }>;
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

function sourceUrlForExpert(source: string, reference: string) {
  const label = `${source} ${reference}`;
  if (label.includes("Turn Towards")) return "https://www.gottman.com/blog/turn-toward-instead-of-away/";
  if (label.includes("Love Maps")) return "https://www.gottman.com/blog/build-love-maps/";
  if (label.includes("5:1 Ratio")) return "https://www.gottman.com/blog/the-magic-ratio-the-key-to-relationship-satisfaction/";
  if (label.includes("Soft Start-up")) return "https://www.gottman.com/blog/softening-startup/";
  if (label.includes("Accept Influence")) return "https://www.gottman.com/blog/accepting-influence-find-ways-to-say-yes/";
  if (label.includes("Created for Connection")) return "https://drsuejohnson.com/books/";
  if (label.includes("Sue Johnson")) return "https://www.hachettebookgroup.com/titles/dr-sue-johnson/hold-me-tight/9780316113007/";
  if (label.includes("Chapman")) return "https://www.moodypublishers.com/the-5-love-languagesreg";
  if (label.includes("Love 2.0")) return "https://positivityresonance.com/";
  if (label.includes("Positivity")) return "https://peplab.web.unc.edu/research/";
  if (label.includes("Gable")) return "https://psycnet.apa.org/record/2012-22248-012";
  if (label.includes("Finkel")) return "https://elifinkel.com/allornothingmarriage";
  return undefined;
}

// الأحاديث المؤرشفة لا تُعرض حتى تكتمل مراجعة سندية متخصصة لكل نص؛ نصائح الخبراء تبقى بعد تحقق المرجع والنسبة.
export const TIPS: GameTip[] = (gameData.DAILY_TIPS ?? [])
  .filter(raw => field(raw, ["category"]) === "expert" || isApprovedShiaHadith(field(raw, ["text", "hadith", "content", "quote"])))
  .map((raw, index) => {
    const originalText = field(raw, ["text", "hadith", "content", "quote"]);
    const hadithPresentation = field(raw, ["category"]) === "hadith" ? approvedShiaHadithPresentation(originalText) : undefined;
    const text = hadithPresentation?.text ?? originalText;
    const explanation = gameData.HADITH_EXPLANATIONS?.[text]?.summary ?? gameData.EXPLANATIONS?.[text]?.summary ?? field(raw, ["summary", "explanation", "description"]);
    return {
      id: `tip-${index}`,
      text,
      summary: explanation,
      translation: field(raw, ["translation"]),
      textOriginal: field(raw, ["textOriginal"]),
      narrator: hadithPresentation?.narrator || field(raw, ["narrator", "speaker", "author", "imam"]) || "من أحاديث أهل البيت (ع)",
      source: hadithPresentation?.source || field(raw, ["source", "reference", "book"]),
      reference: hadithPresentation?.reference || field(raw, ["reference"]),
      category: field(raw, ["category"]) === "hadith" ? "hadith" as const : "expert" as const,
      sourceUrl: field(raw, ["category"]) === "hadith"
        ? hadithPresentation?.sourceUrl || sourceUrlForApprovedShiaHadith(originalText)
        : field(raw, ["sourceUrl", "url"]) || sourceUrlForExpert(field(raw, ["source"]), field(raw, ["reference"])),
    };
  })
  .filter(tip => Boolean(tip.text))
  .concat(CURATED_SHIA_HADITH_TIPS.map(tip => ({
    id: tip.id,
    text: tip.text,
    summary: tip.summary,
    translation: tip.application ?? "",
    textOriginal: "",
    narrator: tip.narrator,
    source: tip.source,
    reference: `${tip.reference} — درجة المجلسي: ${tip.majlisiGrade}`,
    category: "hadith" as const,
    sourceUrl: tip.sourceUrl,
  })));

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
      tips.push({ id: `community-tip-${tips.length}`, text: body, summary: item.summary || "", narrator: item.narrator || "محتوى مجتمع حديث القلوب", source: item.source || "", category: "community", sourceUrl: item.sourceUrl || undefined });
    }
  });

  return { questions, penalties, tips };
}

export function roundSizeFromLandscape(isLandscape: boolean) {
  return isLandscape ? 10 : 9;
}

export function roundSizeFromViewport(width: number, height: number) {
  return roundSizeFromLandscape(width > height);
}

export function roundSizeForViewport() {
  if (typeof window === "undefined") return 9;
  return roundSizeFromViewport(window.innerWidth, window.innerHeight);
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

export function getRoundCardStates(deck: readonly GameCard[], availableCards: readonly GameCard[]) {
  const availableIds = new Set(availableCards.map(card => card.id));
  return deck.map(card => ({ card, state: (availableIds.has(card.id) ? "available" : "consumed") as RoundCardState }));
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

export function recordOpenedTip(history: readonly GameTip[], tip: GameTip, openedAt = Date.now()) {
  return [...history, { ...tip, id: `${tip.id}-shown-${openedAt}` }].slice(-30);
}

export function createEmptyRoundOutcomeCounts(): RoundOutcomeCounts {
  return { answered: 0, skipped: 0, penalty: 0 };
}

export function createRoundSummary(input: {
  roundNumber: number;
  totalCards: number;
  outcomes: RoundOutcomeCounts;
  playerTurns: [number, number];
  tipHistory: readonly GameTip[];
  tipStartIndex: number;
  sessionCardsOpened: number;
}): RoundSummary {
  return {
    roundNumber: input.roundNumber,
    totalCards: input.totalCards,
    outcomes: { ...input.outcomes },
    playerTurns: [...input.playerTurns] as [number, number],
    tips: input.tipHistory.slice(input.tipStartIndex),
    sessionCardsOpened: input.sessionCardsOpened,
    sessionTipsShown: input.tipHistory.length,
  };
}

export function searchUrlForTip(tip: GameTip) {
  return `https://www.google.com/search?q=${encodeURIComponent([tip.narrator, tip.source, tip.reference, tip.text].filter(Boolean).join(" "))}`;
}
