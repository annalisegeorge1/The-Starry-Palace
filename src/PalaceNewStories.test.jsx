import React from 'react';
import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {cleanup,render,screen,fireEvent} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
const mocks=vi.hoisted(()=>({result:vi.fn()}));
vi.mock('./supabase',()=>({
 configured:true,
 supabase:{from:()=>({select:()=>{const q={eq:()=>q,order:()=>q,limit:()=>mocks.result()};return q}})}
}));
import PalaceNewStories from './PalaceNewStories';
const publicWork=(extras={})=>({id:'1',slug:'moonlight',title:'Moonlight Pages',summary:'A small beginning',rating:'general',work_type:'original',completion_status:'complete',publication_status:'published',visibility:'public',...extras});
beforeEach(()=>mocks.result.mockReset());
afterEach(()=>{cleanup();localStorage.clear()});
it('never invents stories when the public shelf is empty',async()=>{
 mocks.result.mockResolvedValue({data:[],error:null});
 render(<MemoryRouter><PalaceNewStories/></MemoryRouter>);
 expect(await screen.findByText(/This shelf is waiting for its next story/i)).toBeTruthy();
 expect(screen.getByRole('link',{name:/Write something wonderful/i}).getAttribute('href')).toBe('/writers');
});
it('offers a usable way out if the public query fails',async()=>{
 mocks.result.mockResolvedValue({data:null,error:new Error('network unavailable')});
 render(<MemoryRouter><PalaceNewStories/></MemoryRouter>);
 expect(await screen.findByText(/The story shelf could not be opened/i)).toBeTruthy();
 expect(screen.getByRole('link',{name:/Explore stories/i}).getAttribute('href')).toBe('/reading');
});
it('shows only genuine published results returned by the server',async()=>{
 mocks.result.mockResolvedValue({data:[publicWork()],error:null});
 render(<MemoryRouter><PalaceNewStories/></MemoryRouter>);
 expect(await screen.findByRole('link',{name:/Moonlight Pages/})).toBeTruthy();
 expect(screen.queryByText(/This shelf is waiting for its next story/)).toBeNull();
});

it('remembers the shelf layout while preserving the story destination',async()=>{
 mocks.result.mockResolvedValue({data:[publicWork()],error:null});
 const {unmount}=render(<MemoryRouter><PalaceNewStories/></MemoryRouter>);
 fireEvent.click(await screen.findByRole('button',{name:'List'}));
 expect(screen.getByRole('button',{name:'List'}).getAttribute('aria-pressed')).toBe('true');
 expect(screen.getByRole('link',{name:/Moonlight Pages/}).getAttribute('href')).toBe('/work/moonlight');
 unmount();
 render(<MemoryRouter><PalaceNewStories/></MemoryRouter>);
 expect((await screen.findByRole('button',{name:'List'})).getAttribute('aria-pressed')).toBe('true');
});

it('welcomes new readers with an actual completed general-audience work rather than a fictitious feature',async()=>{
 mocks.result.mockResolvedValue({data:[publicWork()],error:null});
 render(<MemoryRouter><PalaceNewStories/></MemoryRouter>);
 expect(await screen.findByRole('heading',{name:'Your first story begins here.'})).toBeTruthy();
 expect(screen.getByRole('link',{name:/Start reading/}).getAttribute('href')).toBe('/work/moonlight');
 expect(screen.getByText(/A FINISHED STORY TO BEGIN WITH/)).toBeTruthy();
 expect(screen.getByRole('link',{name:/Fanfiction & fandoms/}).getAttribute('href')).toBe('/fandoms');
});
it('does not recommend explicit, unfinished or unlisted titles as safe starting stories',async()=>{
 const bad=[publicWork({id:'2',slug:'adult',title:'Adult Only',rating:'explicit'}),publicWork({id:'3',slug:'unfinished',title:'Still Going',completion_status:'in_progress'}),publicWork({id:'4',slug:'hidden',title:'Unlisted',visibility:'unlisted'})];
 mocks.result.mockResolvedValue({data:bad,error:null});
 render(<MemoryRouter><PalaceNewStories/></MemoryRouter>);
 expect(await screen.findByText(/Pick a doorway that interests you/)).toBeTruthy();
 expect(screen.queryByRole('link',{name:/Start reading/})).toBeNull();
 expect(screen.queryByRole('link',{name:/Adult Only/})).toBeNull();
 expect(screen.queryByRole('link',{name:/Unlisted/})).toBeNull();
});
