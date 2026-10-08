import React from 'react';
import {afterEach,beforeEach,expect,it} from 'vitest';
import {cleanup,fireEvent,render,screen} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import PalaceBetaGuide from './PalaceBetaGuide';
beforeEach(()=>localStorage.clear());
afterEach(()=>{cleanup();localStorage.clear()});
const mount=()=>render(<MemoryRouter><PalaceBetaGuide Frame={({children})=><div>{children}</div>}/></MemoryRouter>);
it('guides new testers through a role-sized task list and never claims feedback was sent',()=>{
 mount();
 expect(screen.getByRole('heading',{name:'Help make the Palace feel effortless.'})).toBeTruthy();
 expect(screen.getByText(/Nothing on this page is automatically sent/)).toBeTruthy();
 expect(screen.getAllByText('How did this go?').length).toBeGreaterThan(0);
 expect(screen.getByRole('button',{name:'Copy my report'})).toBeTruthy();
 expect(screen.queryByRole('heading',{name:'Find the Council and read its voting rules'})).toBeNull();
});
it('retains explicit trouble states, structured issues and notes on the device',()=>{
 mount();
 const first=screen.getByText('Find reading and writing from the home page');
 const article=first.closest('article');
 fireEvent.click(article.querySelector('input[value="stuck"]'));
 expect(screen.getByRole('button',{name:'Describe what happened →'})).toBeTruthy();
 fireEvent.click(screen.getByRole('button',{name:'Describe what happened →'}));
 fireEvent.change(screen.getByPlaceholderText('The page stayed blank until I refreshed…'),{target:{value:'The sidebar disappeared'}});
 fireEvent.click(screen.getByRole('button',{name:/Add this issue to my report/}));
 expect(screen.getByText('1 issue in this report')).toBeTruthy();
 const saved=JSON.parse(localStorage.getItem('palace-beta-feedback-v2'));
 expect(saved.results.start).toBe('stuck');
 expect(saved.issues[0].actual).toBe('The sidebar disappeared');
});
it('can show the full set on request',()=>{
 mount();
 fireEvent.click(screen.getByLabelText(/Show all Palace checkpoints/));
 expect(screen.getByText('Find the Council and read its voting rules')).toBeTruthy();
});
