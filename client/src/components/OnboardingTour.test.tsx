// @vitest-environment jsdom
import React from 'react';
import {it,expect,vi} from 'vitest';
import {render,fireEvent} from '@testing-library/react';
import {OnboardingTour} from './OnboardingTour';
it('reuses one resize observer across scroll events and disconnects it',()=>{
 const created:{disconnect:ReturnType<typeof vi.fn>}[]=[];
 vi.stubGlobal('ResizeObserver',class{disconnect=vi.fn();observe=vi.fn();constructor(){created.push(this);}});
 window.matchMedia=vi.fn().mockReturnValue({matches:true});
 Element.prototype.scrollIntoView=vi.fn();
 const target=document.createElement('div');target.dataset.tour='players';document.body.append(target);
 const view=render(<OnboardingTour open screen="welcome" activeCardOpen={false} stepIndex={0} onStepChange={()=>{}} onComplete={()=>{}}/>);
 fireEvent.scroll(window);fireEvent.scroll(window);view.unmount();
 expect(created).toHaveLength(1);expect(created[0].disconnect).toHaveBeenCalledOnce();
 target.remove();vi.unstubAllGlobals();
});
