import { localStore } from './localStore';
import type { GameCard, GameTip } from './game';
export const FAVORITE_TIPS_KEY = 'hadith-alqulub-platform-favorite-tips-v1';
export const FAVORITE_QUESTIONS_KEY = 'hadith-alqulub-platform-favorite-questions-v1';
export const READING_KEY = 'hadith-alqulub-platform-reading-preference-v1';
export type FavoriteTip = GameTip & { savedAt: number };
export type FavoriteQuestion = GameCard & { savedAt: number };
export const tipIdentity = (tip: GameTip) => tip.id.replace(/-shown-\d+$/, '');
function readList(key: string): unknown[] {
  try { const value = JSON.parse(localStore.getItem(key) || '[]'); return Array.isArray(value) ? value : []; } catch { return []; }
}
export function loadFavoriteTips(): FavoriteTip[] {
  const seen = new Set<string>();
  return readList(FAVORITE_TIPS_KEY).flatMap(value => {
    if (!value || typeof value !== 'object') return [];
    const t = value as Record<string, unknown>;
    if (typeof t.id !== 'string' || typeof t.text !== 'string' || !t.text.trim()) return [];
    const id = t.id.replace(/-shown-\d+$/, ''); if(seen.has(id)) return []; seen.add(id);
    const tip: FavoriteTip = {id, text:t.text, summary:typeof t.summary==='string'?t.summary:'', narrator:typeof t.narrator==='string'?t.narrator:'', source:typeof t.source==='string'?t.source:'', savedAt:Number(t.savedAt)||0};
    for (const field of ['translation','reference','textOriginal','sourceUrl'] as const) if(typeof t[field]==='string') tip[field]=t[field];
    if(t.category==='hadith'||t.category==='expert'||t.category==='community') tip.category=t.category;
    return [tip];
  }).slice(0,24);
}
export function questionIdentity(card: GameCard): string {
  return card.level + ":" + card.prompt.trim();
}
export function loadFavoriteQuestions(): FavoriteQuestion[] {
  const seen = new Set<string>();
  return readList(FAVORITE_QUESTIONS_KEY).flatMap(value => {
    if (!value || typeof value !== 'object') return [];
    const q = value as FavoriteQuestion;
    if(typeof q.id!=='string'||typeof q.prompt!=='string'||!q.prompt.trim()||!['hamasat','nabd','aamaq','jawhar'].includes(q.level)) return [];
    const identity = questionIdentity(q);
    if (seen.has(identity)) return [];
    seen.add(identity);
    return [{id:q.id,prompt:q.prompt,level:q.level,savedAt:Number(q.savedAt)||0}];
  }).slice(0,36);
}
export function toggleFavoriteTip(items: FavoriteTip[], tip: GameTip): FavoriteTip[] {
  const id=tipIdentity(tip); return items.some(t=>t.id===id)?items.filter(t=>t.id!==id):[{...tip,id,savedAt:Date.now()},...items].slice(0,24);
}
export function toggleFavoriteQuestion(items: FavoriteQuestion[], card: GameCard): FavoriteQuestion[] {
  const identity = questionIdentity(card);
  const remaining = items.filter(item => questionIdentity(item) !== identity);
  if (remaining.length !== items.length) return remaining;
  return [{ ...card, savedAt: Date.now() }, ...items].slice(0, 36);
}
