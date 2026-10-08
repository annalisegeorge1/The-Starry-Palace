import React from 'react';
import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {cleanup,fireEvent,render,screen} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import PalaceBetaGuide,{PALACE_BETA_CHECKS} from './PalaceBetaGuide';
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
it('offers a keyboard-accessible next checkpoint and a saved unfinished-only view',()=>{
 mount();
 expect(screen.getByText('Next up: Find reading and writing from the home page')).toBeTruthy();
 const first=screen.getByText('Find reading and writing from the home page').closest('article');
 fireEvent.click(first.querySelector('input[value="passed"]'));
 expect(screen.getByText('Next up: Navigate between sections and go back')).toBeTruthy();
 fireEvent.click(screen.getByLabelText("Focus on unfinished and troubled checkpoints"));
 expect(screen.queryByText('Find reading and writing from the home page')).toBeNull();
 const troubled=screen.getByText('Navigate between sections and go back').closest('article');
 fireEvent.click(troubled.querySelector('input[value="stuck"]'));
 expect(screen.getByRole('button',{name:'Describe what happened →'})).toBeTruthy();
 fireEvent.click(screen.getByRole('button',{name:/Go to next checkpoint/}));
 expect(document.activeElement?.id).toBe('palace-beta-task-reading');
 expect(JSON.parse(localStorage.getItem('palace-beta-feedback-v2')).showRemaining).toBe(true);
});
it('handles a finished track without hiding the report or making results irreversible',()=>{
 const results=Object.fromEntries(PALACE_BETA_CHECKS.filter(x=>x.roles.includes('reader')).map(x=>[x.id,'skipped']));
 localStorage.setItem('palace-beta-feedback-v2',JSON.stringify({role:'reader',results,showRemaining:true}));
 mount();
 expect(screen.getByText('All caught up for this track.')).toBeTruthy();
 fireEvent.click(screen.getByRole('button',{name:/Review my report/}));
 expect(document.activeElement?.id).toBe('palace-beta-final-report');
 fireEvent.click(screen.getByRole('button',{name:'Review all checkpoints'}));
 expect(screen.getByText('Find reading and writing from the home page')).toBeTruthy();
});
it('warns when feedback cannot be saved locally but keeps an export path available',()=>{
 const blocked=vi.spyOn(Storage.prototype,'setItem').mockImplementation(()=>{throw new Error('Storage blocked')});
 try{
  mount();
  expect(screen.getByRole('alert').textContent).toContain('Local saving is unavailable');
  expect(screen.getByRole('button',{name:'Copy my report'})).toBeTruthy();
  expect(screen.getByText(/export your report before leaving/)).toBeTruthy();
 }finally{blocked.mockRestore()}
});
it('can show the full set on request',()=>{
 mount();
 fireEvent.click(screen.getByLabelText(/Show all Palace checkpoints/));
 expect(screen.getByText('Find the Council and read its voting rules')).toBeTruthy();
});

it('shows the current preview host clearly and blocks local-only tester invitations',()=>{
 mount();
 const invite=screen.getByRole('button',{name:'Copy a friendly tester invitation'});
 expect(invite.disabled).toBe(true);
 expect(screen.getByText(/This is a local or unshareable preview/)).toBeTruthy();
});
