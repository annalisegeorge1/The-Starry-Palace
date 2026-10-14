import React from 'react';
import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {cleanup,render,screen,fireEvent,waitFor} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import {useAuth} from './auth';
import {getHonour,createHonourRecommendation,withdrawHonourRecommendation} from './palaceData';
import HonourRoom from './HonourRoom';

vi.mock('./auth',()=>({useAuth:vi.fn()}));
vi.mock('./palaceData',()=>({
 getHonour:vi.fn(),createHonourRecommendation:vi.fn(),withdrawHonourRecommendation:vi.fn()
}));
const Frame=({children})=><main>{children}</main>;
function mount(){return render(<MemoryRouter><HonourRoom Frame={Frame}/></MemoryRouter>)}
beforeEach(()=>{
 vi.clearAllMocks();
 getHonour.mockResolvedValue({recommendations:[],periods:[],rankings:[]});
 createHonourRecommendation.mockResolvedValue({});
 withdrawHonourRecommendation.mockResolvedValue({});
});
afterEach(cleanup);
describe('Independent Throne of Honour room',()=>{
 it('preserves the public gallery without requesting sign-in',async()=>{
  useAuth.mockReturnValue({session:null});
  mount();
  expect(screen.getByRole('heading',{name:'The Throne of Honour.'})).toBeTruthy();
  expect(screen.getByRole('link',{name:'Sign in to recommend'}).getAttribute('href')).toBe('/login');
  await waitFor(()=>expect(getHonour).toHaveBeenCalledWith(undefined));
  expect(screen.getByText('Octavia E. Butler')).toBeTruthy();
  expect(screen.getByText('James Baldwin')).toBeTruthy();
 });
 it('keeps the signed-in recommendation door intact after extraction',async()=>{
  useAuth.mockReturnValue({session:{user:{id:'member-1'}}});
  mount();
  await waitFor(()=>expect(getHonour).toHaveBeenCalledWith('member-1'));
  fireEvent.click(screen.getByRole('button',{name:'Recommend an author'}));
  expect(screen.getByText('Recommend an author or creator')).toBeTruthy();
  expect(screen.getAllByText(/Recommendations are reviewed before publication/).length).toBeGreaterThan(0);
 });
});
