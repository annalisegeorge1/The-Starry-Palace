import React from 'react';
import {afterEach,expect,it,vi} from 'vitest';
import {cleanup,render,screen} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import FullStoryDiscussion from './FullStoryDiscussion';
import {getWorkCommunity} from './palaceData';
vi.mock('./auth',()=>({useAuth:()=>({session:null})}));
vi.mock('./palaceData',async original=>({...await original(),getWorkCommunity:vi.fn()}));
afterEach(()=>{cleanup();vi.clearAllMocks()});
it('renders full-work responses inline, leaves chapter replies with their chapters and retains the work discussion destination for guest sign-in',async()=>{
 const comment={id:'r',body:'Story response',status:'approved',author_id:'u'};
 getWorkCommunity.mockResolvedValue({tags:[],comments:[comment,{...comment,id:'s',chapter_id:'one',body:'Chapter only'}]});
 render(<MemoryRouter><FullStoryDiscussion work={{id:'w',slug:'demo',author_id:'writer'}}/></MemoryRouter>);
 expect(await screen.findByText('Story response')).toBeTruthy();
 expect(screen.queryByText('Chapter only')).toBeNull();
 expect(screen.getByText('Return to reading').getAttribute('href')).toBe('#full-reader-heading');
 expect(document.querySelector('a[href*="next=%2Fwork%2Fdemo%23comments"]')).toBeTruthy();
});
