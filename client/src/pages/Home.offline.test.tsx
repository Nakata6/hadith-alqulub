// @vitest-environment jsdom
import React from 'react';
import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import { render, fireEvent, screen, cleanup } from '@testing-library/react';
import { ThemeProvider } from '@/contexts/ThemeContext';
vi.mock('@/components/OnboardingTour',()=>({OnboardingTour:()=>null}));
vi.mock('sonner',()=>({toast:vi.fn()}));
import Home from './Home';
import { TIPS, recordOpenedTip,createRoundSummary } from '@/lib/game';
import { LATEST_VERSION } from '@/lib/changelog';
import {parseSession, STORAGE_KEY as key} from '@/lib/sessionStorage';
const card={id:'test-card',level:'hamasat',prompt:'سؤال تجريبي'};
function seed(round:any[]=[card]){localStorage.setItem(key,JSON.stringify({players:['علي','فاطمة'],currentPlayer:0,round,roundDeck:round,recentPrompts:[],recentPenalties:[],served:0,tipHistory:[],startedSessions:1,roundNumber:1,roundOutcomes:{answered:0,skipped:0,penalty:0},roundPlayerTurns:[0,0],roundTipStartIndex:0}));}
const mount=()=>render(<ThemeProvider defaultTheme="dark" switchable><Home/></ThemeProvider>);
function resume(){const button=screen.queryByText('استئناف جلسة سابقة');if(button)fireEvent.click(button);}
beforeEach(()=>{localStorage.clear();localStorage.setItem('hadith-alqulub-platform-onboarding-v1',JSON.stringify({completed:true,skipped:true,version:1}));localStorage.setItem('hadith-alqulub-platform-last-seen-version-v1',LATEST_VERSION);window.matchMedia=vi.fn().mockReturnValue({matches:false,addEventListener:vi.fn(),removeEventListener:vi.fn()});});
afterEach(()=>{cleanup();vi.restoreAllMocks();});
it('restores last open card and completes its round',()=>{seed();let view=mount();resume();fireEvent.click(document.querySelector('.question-card')!);view.unmount();mount();resume();expect(document.querySelector('.legacy-question-card')).not.toBeNull();fireEvent.click(screen.getByText('أجبتُ عن السؤال'));expect(document.querySelector('.round-summary')).not.toBeNull();});
it('does not consume cards inside end dialog or welcome inputs',()=>{seed();mount();resume();fireEvent.click(screen.getByRole('button',{name:'إنهاء'}));fireEvent.keyDown(window,{key:'1'});expect(document.querySelector('.legacy-question-card')).toBeNull();fireEvent.click(screen.getByText('حفظ الجلسة وإنهاؤها'));fireEvent.keyDown(screen.getByLabelText(/اسم اللاعب الأول/),{key:'1'});expect(document.querySelector('.legacy-question-card')).toBeNull();expect(JSON.parse(localStorage.getItem(key)!).round).toHaveLength(1);});
it('summarizes current tips independently of capped history',()=>{let history:any[]=[];for(let i=0;i<30;i++)history=recordOpenedTip(history,TIPS[0],i);history=recordOpenedTip(history,TIPS[1],31);const result=createRoundSummary({roundNumber:3,totalCards:9,outcomes:{answered:9,skipped:0,penalty:0},playerTurns:[5,4],tipHistory:history,tipStartIndex:30,roundTips:[TIPS[1]],totalTipsShown:31,sessionCardsOpened:27});expect(result.tips).toEqual([TIPS[1]]);expect(result.sessionTipsShown).toBe(31);});
it('rejects malformed saved cards without crashing',()=>{seed([null]);mount();expect(screen.queryByText('استئناف جلسة سابقة')).toBeNull();});
it('survives unavailable device storage',()=>{vi.spyOn(Storage.prototype,'setItem').mockImplementation(()=>{throw new DOMException('quota','QuotaExceededError')});expect(()=>mount()).not.toThrow();expect(document.querySelector('.welcome-panel')).not.toBeNull();});
it('closes completed summary when ending session',()=>{seed();mount();resume();fireEvent.click(document.querySelector('.question-card')!);fireEvent.click(screen.getByText('أجبتُ عن السؤال'));fireEvent.click(screen.getByText('إنهاء الجلسة وحفظها'));fireEvent.click(screen.getByText('حفظ الجلسة وإنهاؤها'));expect(document.querySelector('.welcome-panel')).not.toBeNull();expect(document.querySelector('.round-summary')).toBeNull();});
it('persists appearance',()=>{let view=mount();fireEvent.click(screen.getByLabelText('تفعيل الوضع الفاتح'));view.unmount();mount();expect(document.documentElement.classList.contains('dark')).toBe(false);});
it('restores a pending penalty',()=>{seed();let view=mount();resume();fireEvent.click(document.querySelector('.question-card')!);fireEvent.click(screen.getByText('لم أستطع الإجابة'));const text=document.querySelector('.penalty-dialog')?.textContent;expect(text).toBeTruthy();view.unmount();mount();resume();expect(document.querySelector('.penalty-dialog')?.textContent).toBe(text);});
it('recovers the missing final card from legacy saves',()=>{seed();let saved=JSON.parse(localStorage.getItem(key)!);saved.round=[];saved.recentPrompts=[card.prompt];expect(parseSession(saved)?.activeCard?.id).toBe(card.id);});
it('has no account controls and permits anonymous default names',()=>{mount();expect(screen.queryByText('تسجيل الدخول')).toBeNull();fireEvent.click(screen.getByText('بدء الجلسة'));expect(screen.queryByText('الرجاء إدخال الاسمين للمتابعة')).toBeNull();});
it('keeps light mode after saving and resuming the session',()=>{
  mount(); fireEvent.click(screen.getByText('بدء الجلسة'));
  fireEvent.click(screen.getByRole('radio',{name:/خفيف/}));
  fireEvent.click(screen.getByRole('button',{name:/يبدأ الجولة.*اللاعب الأول/}));
  const saved=JSON.parse(localStorage.getItem(key)!);
  expect(saved.sessionMode).toBe('light');
  expect(saved.round.length).toBeGreaterThanOrEqual(9);
  expect(saved.round.every((c:any)=>['hamasat','nabd'].includes(c.level))).toBe(true);
  expect(parseSession(saved)?.sessionMode).toBe('light');
  delete saved.sessionMode;expect(parseSession(saved)?.sessionMode).toBe('mixed');
});

it('automatically restores active sessions but waits for paused sessions',()=>{seed();let view=mount();expect(document.querySelector('.question-card')).not.toBeNull();view.unmount();const saved=JSON.parse(localStorage.getItem(key)!);saved.isPaused=true;localStorage.setItem(key,JSON.stringify(saved));mount();expect(screen.getByText('استئناف جلسة سابقة')).toBeTruthy();expect(document.querySelector('.question-card')).toBeNull();});
it('keeps favorite questions and comfort reading across reload',()=>{seed();let view=mount();fireEvent.click(screen.getByRole('button',{name:'الإعدادات'}));fireEvent.click(screen.getByText('تفعيل قراءة مريحة'));view.unmount();view=mount();expect(document.querySelector('.reading-comfort')).not.toBeNull();fireEvent.click(document.querySelector('.question-card')!);fireEvent.click(screen.getByLabelText('إضافة السؤال إلى المفضلة'));view.unmount();mount();expect(screen.getByLabelText('إزالة السؤال من المفضلة').getAttribute('aria-pressed')).toBe('true');});
it('skipping an optional activity keeps the current player',()=>{seed();mount();fireEvent.click(document.querySelector('.question-card')!);fireEvent.click(screen.getByText('لم أستطع الإجابة'));fireEvent.click(screen.getByText('تخطي النشاط'));expect(JSON.parse(localStorage.getItem(key)!).currentPlayer).toBe(0);expect(JSON.parse(localStorage.getItem(key)!).roundOutcomes.skipped).toBe(1);});

it('preserves published round tips during legacy migration',()=>{seed();const saved=JSON.parse(localStorage.getItem(key)!);saved.roundTips=[TIPS[0]];saved.tipHistory=[];expect(parseSession(saved)?.roundTips).toEqual([TIPS[0]]);});
it('opens the tenth card using zero',()=>{seed(Array.from({length:10},(_,i)=>({...card,id:`card-${i}`,prompt:`سؤال ${i}`})));mount();fireEvent.keyDown(window,{key:'0'});expect(document.querySelector('.legacy-question-card__copy')?.textContent).toBe('سؤال 9');});
it('reopens favorite tips without incrementing the history count',()=>{seed();mount();fireEvent.click(screen.getByRole('button',{name:'عرض نصيحة'}));fireEvent.click(screen.getByText('إضافة إلى المفضلة'));const before=JSON.parse(localStorage.getItem(key)!).totalTipsShown;fireEvent.click(document.querySelector('.tip-dialog__close')!);fireEvent.click(screen.getByRole('button',{name:/المفضلة الخاصة/}));fireEvent.click(document.querySelector('.favorite-list__item button')!);expect(JSON.parse(localStorage.getItem(key)!).totalTipsShown).toBe(before);});

it('sets up a fresh session only after choosing a starter and safely cancels setup', () => {
  seed(); mount();
  const before = localStorage.getItem(key);
  const newGame = () => fireEvent.click(screen.getByRole('button', {name: 'بدء جلسة جديدة'}));
  newGame();
  const firstName = () => screen.getByLabelText(/اسم اللاعب الأول/) as HTMLInputElement;
  const secondName = () => screen.getByLabelText(/اسم اللاعب الثاني/) as HTMLInputElement;
  expect(firstName().value).toBe('');
  expect(secondName().value).toBe('');
  fireEvent.change(firstName(), {target:{value:'حسين'}});
  fireEvent.click(screen.getByText('بدء الجلسة'));
  expect(screen.getByText('من يبدأ الحديث؟')).toBeTruthy();
  expect(screen.queryByText('حذف الجلسة وإنهاؤها')).toBeNull();
  fireEvent.click(screen.getByText('رجوع'));
  expect(firstName().value).toBe('حسين');
  fireEvent.click(screen.getByText('رجوع للجلسة الحالية'));
  expect(localStorage.getItem(key)).toBe(before);
  newGame();
  expect(firstName().value).toBe('');
  fireEvent.change(secondName(), {target:{value:'مريم'}});
  fireEvent.click(screen.getByText('بدء الجلسة'));
  fireEvent.click(screen.getByRole('radio', {name: /خفيف/}));
  fireEvent.click(screen.getByRole('button', {name: /يبدأ الجولة.*مريم/}));
  const fresh = JSON.parse(localStorage.getItem(key)!);
  expect(fresh.players).toEqual(["اللاعب الأول", "مريم"]);
  expect(fresh.currentPlayer).toBe(1);
  expect(fresh.sessionMode).toBe('light');
  expect(fresh.roundNumber).toBe(1);
  expect(fresh.roundDeck.map((item:any) => item.id)).not.toContain(card.id);
});
it('keeps the session open after failed save or delete and allows retry', () => {
  seed(); mount();
  const before = localStorage.getItem(key);
  fireEvent.click(screen.getByRole('button', {name: 'إنهاء'}));
  const write = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota'); });
  fireEvent.click(screen.getByText('حفظ الجلسة وإنهاؤها'));
  expect(screen.getByText('حذف الجلسة وإنهاؤها')).toBeTruthy();
  expect(localStorage.getItem(key)).toEqual(before);
  write.mockRestore();
  const remove = vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => { throw new Error('unavailable'); });
  fireEvent.click(screen.getByText('حذف الجلسة وإنهاؤها'));
  expect(screen.getByText('حفظ الجلسة وإنهاؤها')).toBeTruthy();
  expect(localStorage.getItem(key)).toEqual(before);
  remove.mockRestore();
  fireEvent.click(screen.getByText('حذف الجلسة وإنهاؤها'));
  expect(localStorage.getItem(key)).toBeNull();
  expect(document.querySelector('.welcome-panel')).toBeTruthy();
});
