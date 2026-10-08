import React from 'react';
import {afterEach,expect,it,vi} from 'vitest';
import {render,screen,cleanup} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import {WriterWelcome,FirstManuscriptGuide} from './WriterWelcome';

vi.mock('./auth',()=>({useAuth:()=>({session:null})}));
afterEach(cleanup);

it('gives new writers a direct private-draft path without promising a following',()=>{
 render(<MemoryRouter><WriterWelcome/></MemoryRouter>);
 expect(screen.getByRole('heading',{name:'Your next chapter belongs here.'})).toBeTruthy();
 expect(screen.getByRole('link',{name:/Start my first draft/i}).getAttribute('href')).toBe('/writing');
 expect(screen.getByRole('link',{name:/Explore the Reading Rooms/i}).getAttribute('href')).toBe('/reading');
 expect(screen.getByText(/cannot promise followers, votes, rankings/i)).toBeTruthy();
});

it('explains that the founding programme is an invitation and not enrollment',()=>{
 render(<MemoryRouter><WriterWelcome/></MemoryRouter>);
 expect(screen.getByRole('heading',{name:'The Founding Writers Circle'})).toBeTruthy();
 expect(screen.getByText(/joining the site does not automatically enroll/i)).toBeTruthy();
});

it('shows first manuscript guidance before publishing and hides it afterwards',()=>{
 const {rerender}=render(<MemoryRouter><FirstManuscriptGuide works={[]}/></MemoryRouter>);
 expect(screen.getByText(/Create a private manuscript to begin/i)).toBeTruthy();
 rerender(<MemoryRouter><FirstManuscriptGuide works={[{chapters:[{id:'a',status:'draft'}]}]}/></MemoryRouter>);
 expect(screen.getByText(/Your manuscript has begun/i)).toBeTruthy();
 rerender(<MemoryRouter><FirstManuscriptGuide works={[{chapters:[{id:'a',status:'published'}]}]}/></MemoryRouter>);
 expect(screen.queryByText(/Your first chapter, your own pace/i)).toBeNull();
});
