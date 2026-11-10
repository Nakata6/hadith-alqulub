import { APPRECIATION_QUESTIONS } from "@shared/originalGameData";
import { expect, it } from 'vitest';
import { generateRound, SESSION_MODE_LEVELS, createGameCatalog, dealSessionRound } from './game';
it('limits light rounds to two levels without reducing the deck size',()=>{
  for(const size of [9,10]) for(let i=0;i<10;i++){
    const cards=generateRound(size,[],undefined,SESSION_MODE_LEVELS.light);
    expect(cards).toHaveLength(size);
    expect(cards.every(c=>c.level==='hamasat'||c.level==='nabd')).toBe(true);
  }
});
it('deals a light opening and appreciative closing around a deep middle', () => {
  const { questions } = createGameCatalog();
  for (const size of [9, 10]) {
    const cards = dealSessionRound(size, [], questions, 'deep');
    expect(new Set(cards.map(c => c.prompt)).size).toBe(size);
    expect(cards.slice(0, 2).map(c => c.level)).toEqual(['hamasat', 'nabd']);
    expect(cards.slice(2).every(c => ['aamaq', 'jawhar'].includes(c.level))).toBe(true);
    expect(APPRECIATION_QUESTIONS).toContain(cards.at(-1)!.prompt);
    const mixed = dealSessionRound(size, [], questions, 'mixed');
    expect(mixed.filter(c => c.level === 'aamaq' || c.level === 'jawhar').length).toBeLessThanOrEqual(6);
  }
});
