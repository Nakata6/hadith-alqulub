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
function resume(){fireEvent.click(screen.getByText('استئناف جلسة سابقة'));}
beforeEach(()=>{localStorage.clear();localStorage.setItem('hadith-alqulub-platform-onboarding-v1',JSON.stringify({completed:true,skipped:true,version:1}));localStorage.setItem('hadith-alqulub-platform-last-seen-version-v1',LATEST_VERSION);window.matchMedia=vi.fn().mockReturnValue({matches:false,addEventListener:vi.fn(),removeEventListener:vi.fn()});});
afterEach(()=>{cleanup();vi.restoreAllMocks();});
it('restores last open card and completes its round',()=>{seed();let view=mount();resume();fireEvent.click(document.querySelector('.question-card')!);view.unmount();mount();resume();expect(document.querySelector('.legacy-question-card')).not.toBeNull();fireEvent.click(screen.getByText('أجبتُ عن السؤال'));expect(document.querySelector('.round-summary')).not.toBeNull();});
it('does not consume cards inside end dialog or welcome inputs',()=>{seed();mount();resume();fireEvent.click(screen.getByRole('button',{name:'إنهاء'}));fireEvent.keyDown(window,{key:'1'});expect(document.querySelector('.legacy-question-card')).toBeNull();fireEvent.click(screen.getByText('حفظ الجلسة وإنهاؤها'));fireEvent.keyDown(screen.getByLabelText('اسم اللاعب الأول'),{key:'1'});expect(document.querySelector('.legacy-question-card')).toBeNull();expect(JSON.parse(localStorage.getItem(key)!).round).toHaveLength(1);});
it('summarizes current tips independently of capped history',()=>{let history:any[]=[];for(let i=0;i<30;i++)history=recordOpenedTip(history,TIPS[0],i);history=recordOpenedTip(history,TIPS[1],31);const result=createRoundSummary({roundNumber:3,totalCards:9,outcomes:{answered:9,skipped:0,penalty:0},playerTurns:[5,4],tipHistory:history,tipStartIndex:30,roundTips:[TIPS[1]],totalTipsShown:31,sessionCardsOpened:27});expect(result.tips).toEqual([TIPS[1]]);expect(result.sessionTipsShown).toBe(31);});
it('rejects malformed saved cards without crashing',()=>{seed([null]);mount();expect(screen.queryByText('استئناف جلسة سابقة')).toBeNull();});
it('survives unavailable device storage',()=>{vi.spyOn(Storage.prototype,'setItem').mockImplementation(()=>{throw new DOMException('quota','QuotaExceededError')});expect(()=>mount()).not.toThrow();expect(document.querySelector('.welcome-panel')).not.toBeNull();});
it('closes completed summary when ending session',()=>{seed();mount();resume();fireEvent.click(document.querySelector('.question-card')!);fireEvent.click(screen.getByText('أجبتُ عن السؤال'));fireEvent.click(screen.getByText('إنهاء الجلسة وحفظها'));fireEvent.click(screen.getByText('حفظ الجلسة وإنهاؤها'));expect(document.querySelector('.welcome-panel')).not.toBeNull();expect(document.querySelector('.round-summary')).toBeNull();});
it('persists appearance',()=>{let view=mount();fireEvent.click(screen.getByLabelText('تفعيل الوضع الفاتح'));view.unmount();mount();expect(document.documentElement.classList.contains('dark')).toBe(false);});
it('restores a pending penalty',()=>{seed();let view=mount();resume();fireEvent.click(document.querySelector('.question-card')!);fireEvent.click(screen.getByText('لم أستطع الإجابة'));const text=document.querySelector('.penalty-dialog')?.textContent;expect(text).toBeTruthy();view.unmount();mount();resume();expect(document.querySelector('.penalty-dialog')?.textContent).toBe(text);});
it('recovers the missing final card from legacy saves',()=>{seed();let saved=JSON.parse(localStorage.getItem(key)!);saved.round=[];saved.recentPrompts=[card.prompt];expect(parseSession(saved)?.activeCard?.id).toBe(card.id);});
it('has no account controls and permits anonymous default names',()=>{mount();expect(screen.queryByText('تسجيل الدخول')).toBeNull();fireEvent.click(screen.getByText('بدء الجلسة'));expect(screen.queryByText('الرجاء إدخال الاسمين للمتابعة')).toBeNull();});
