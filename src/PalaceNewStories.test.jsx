import React from 'react';
import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {cleanup,render,screen} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
const mocks=vi.hoisted(()=>({result:vi.fn()}));
vi.mock('./supabase',()=>({
 configured:true,
 supabase:{from:()=>({select:()=>({eq:()=>({order:()=>({limit:()=>mocks.result()})})})})}
}));
import PalaceNewStories from './PalaceNewStories';
beforeEach(()=>mocks.result.mockReset());
afterEach(cleanup);
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
 mocks.result.mockResolvedValue({data:[{id:'1',slug:'moonlight',title:'Moonlight Pages',summary:'A small beginning'}],error:null});
 render(<MemoryRouter><PalaceNewStories/></MemoryRouter>);
 expect(await screen.findByRole('link',{name:/Moonlight Pages/})).toBeTruthy();
 expect(screen.queryByText(/This shelf is waiting for its next story/)).toBeNull();
});
