import { z } from "zod";
import { createRoundSummary } from "./game";
import { localStore } from "./localStore";
export const STORAGE_KEY = "hadith-alqulub-platform-session-v1";
const count = z.number().int().min(0).max(Number.MAX_SAFE_INTEGER);
const card = z.object({ id: z.string().min(1), level: z.enum(["hamasat", "nabd", "aamaq", "jawhar"]), prompt: z.string().min(1).max(10000) });
const tip = z.object({ id: z.string(), text: z.string(), summary: z.string(), narrator: z.string(), source: z.string(), translation: z.string().optional(), textOriginal: z.string().optional(), reference: z.string().optional(), category: z.enum(["hadith", "expert", "community"]).optional(), sourceUrl: z.string().optional() });
const outcomes = z.object({ answered: count, skipped: count, penalty: count });
const turns = z.tuple([count, count]);
const summary = z.object({ roundNumber: count, totalCards: count, outcomes, playerTurns: turns, tips: z.array(tip), sessionCardsOpened: count, sessionTipsShown: count });
const schema = z.object({
  isPaused: z.boolean().default(false),
  sessionMode: z.enum(["mixed", "light", "deep"]).default("mixed"),
  version: z.literal(2).optional(), players: z.tuple([z.string().min(1).max(32), z.string().min(1).max(32)]), currentPlayer: z.union([z.literal(0), z.literal(1)]),
  round: z.array(card).max(10), roundDeck: z.array(card).max(10).optional(),
  recentPrompts: z.array(z.string()).default([]), recentPenalties: z.array(z.string()).default([]), served: count.default(0),
  tipHistory: z.array(tip).max(30).default([]), startedSessions: count.default(1), roundNumber: count.default(1),
  roundOutcomes: outcomes.default({ answered: 0, skipped: 0, penalty: 0 }), roundPlayerTurns: turns.default([0, 0]), roundTipStartIndex: count.default(0),
  roundSummary: summary.optional(), activeCard: card.nullable().default(null), penalty: z.string().nullable().default(null), tip: tip.nullable().default(null),
  roundTips: z.array(tip).default([]), totalTipsShown: count.optional(),
});
export type GameSession = Omit<z.infer<typeof schema>, "roundDeck" | "totalTipsShown"> & { roundDeck: z.infer<typeof card>[]; totalTipsShown: number };
export function parseSession(value: unknown): GameSession | null {
  const parsed = schema.safeParse(value);
  if (!parsed.success) return null;
  const s = parsed.data;
  const deck = s.roundDeck ?? s.round;
  const ids = new Set(deck.map(c => c.id));
  if (ids.size !== deck.length || new Set(s.round.map(c => c.id)).size !== s.round.length || s.round.some(c => !ids.has(c.id))) return null;
  if (s.activeCard && (!ids.has(s.activeCard.id) || s.round.some(c => c.id === s.activeCard!.id))) return null;
  const next: GameSession = { ...s, version: 2, roundDeck: deck, totalTipsShown: s.totalTipsShown ?? s.tipHistory.length };
  // Legacy saves removed the open card before saving its action. Recover it when identifiable.
  if (!s.version) {
    if (!(value && typeof value === "object" && "roundTips" in value)) next.roundTips = s.tipHistory.slice(Math.min(s.roundTipStartIndex, s.tipHistory.length));
    const resolved = s.roundOutcomes.answered + s.roundOutcomes.skipped + s.roundOutcomes.penalty;
    const missing = deck.filter(c => !s.round.some(item => item.id === c.id));
    if (!s.roundSummary && missing.length > resolved) {
      next.activeCard = missing.find(c => c.prompt === s.recentPrompts.at(-1)) ?? missing.at(-1) ?? null;
    }
  }
  if (!next.round.length && !next.activeCard && !next.penalty && !next.roundSummary) {
    next.roundSummary = createRoundSummary({ roundNumber: next.roundNumber, totalCards: deck.length, outcomes: next.roundOutcomes, playerTurns: next.roundPlayerTurns, tipHistory: next.tipHistory, tipStartIndex: 0, roundTips: next.roundTips, totalTipsShown: next.totalTipsShown, sessionCardsOpened: next.served });
  }
  return next;
}
export function loadSession(): GameSession | null {
  try { return parseSession(JSON.parse(localStore.getItem(STORAGE_KEY) || "null")); } catch { return null; }
}
export function saveSession(session: GameSession) { return localStore.setItem(STORAGE_KEY, JSON.stringify({ ...session, version: 2 })); }
