// @vitest-environment jsdom
import {beforeEach, expect, it} from 'vitest';
import {FAVORITE_TIPS_KEY,FAVORITE_QUESTIONS_KEY,loadFavoriteTips,loadFavoriteQuestions,toggleFavoriteTip,toggleFavoriteQuestion} from './localPreferences';
import {TIPS} from './game';
beforeEach(()=>localStorage.clear());
it('loads old favorites, deduplicates shown tips and ignores corrupt entries',()=>{
 localStorage.setItem(FAVORITE_TIPS_KEY,JSON.stringify([null,{...TIPS[0],id:'tip-1-shown-123'}, {...TIPS[0],id:'tip-1'},{}]));
 expect(loadFavoriteTips()).toHaveLength(1);expect(loadFavoriteTips()[0].id).toBe('tip-1');
 localStorage.setItem(FAVORITE_QUESTIONS_KEY,JSON.stringify([{id:'q',prompt:'سؤال',level:'hamasat'},null,{id:'bad',prompt:'سؤال',level:'invalid'}]));expect(loadFavoriteQuestions()).toHaveLength(1);
});
it('retains original limits and allows removing an existing favorite',()=>{
 let tips:any[]=[];let questions:any[]=[];
 for(let i=0;i<45;i++){tips=toggleFavoriteTip(tips,{...TIPS[0],id:`tip-${i}`});questions=toggleFavoriteQuestion(questions,{id:`q-${i}`,prompt:'سؤال',level:'hamasat'});}
 expect(tips).toHaveLength(24);expect(questions).toHaveLength(36);
 expect(toggleFavoriteTip(tips,tips[0])).toHaveLength(23);expect(toggleFavoriteQuestion(questions,questions[0])).toHaveLength(35);
});
