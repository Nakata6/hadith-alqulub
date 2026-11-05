import { expect, it } from 'vitest';
import { generateRound, SESSION_MODE_LEVELS } from './game';
it('limits light rounds to two levels without reducing the deck size',()=>{
  for(const size of [9,10]) for(let i=0;i<10;i++){
    const cards=generateRound(size,[],undefined,SESSION_MODE_LEVELS.light);
    expect(cards).toHaveLength(size);
    expect(cards.every(c=>c.level==='hamasat'||c.level==='nabd')).toBe(true);
  }
});
it('preserves the original all-level behavior of mixed and deep rounds',()=>{
  for(const mode of ['mixed','deep'] as const){
    expect(new Set(generateRound(10,[],undefined,SESSION_MODE_LEVELS[mode]).map(c=>c.level)).size).toBe(4);
  }
});
