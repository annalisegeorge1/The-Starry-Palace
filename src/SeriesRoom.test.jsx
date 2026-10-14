import React from 'react';
import {beforeEach,afterEach,describe,expect,it,vi} from 'vitest';
import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import {useAuth} from './auth';
import {getSeriesLibrary,getMyWorks,createSeries,updateSeries,deleteSeries,addWorkToSeries,removeWorkFromSeries,reorderSeriesWorks} from './palaceData';
import SeriesRoom from './SeriesRoom';

vi.mock('./auth',()=>({useAuth:vi.fn()}));
vi.mock('./palaceData',()=>({
 getSeriesLibrary:vi.fn(),getMyWorks:vi.fn(),
 createSeries:vi.fn(),updateSeries:vi.fn(),deleteSeries:vi.fn(),
 addWorkToSeries:vi.fn(),removeWorkFromSeries:vi.fn(),reorderSeriesWorks:vi.fn()
}));
const Frame=({children})=><main>{children}</main>;
function mount(){return render(<MemoryRouter><SeriesRoom Frame={Frame}/></MemoryRouter>)}
beforeEach(()=>{
 vi.clearAllMocks();
 getSeriesLibrary.mockResolvedValue([]);
 getMyWorks.mockResolvedValue([]);
});
afterEach(cleanup);
describe('Extracted series shelves',()=>{
 it('allows guest visitors to browse reading-order collections',async()=>{
  useAuth.mockReturnValue({session:null});
  mount();
  expect(screen.getByRole('heading',{name:'The series shelves.'})).toBeTruthy();
  await waitFor(()=>expect(getSeriesLibrary).toHaveBeenCalledWith(undefined));
  expect(getMyWorks).not.toHaveBeenCalled();
  expect(screen.queryByRole('button',{name:/Create a series/})).toBeNull();
 });
 it('keeps the writer-controlled series creation route',async()=>{
  useAuth.mockReturnValue({session:{user:{id:'writer-1'}}});
  mount();
  await waitFor(()=>expect(getMyWorks).toHaveBeenCalledWith('writer-1'));
  fireEvent.click(screen.getByRole('button',{name:/Create a series/}));
  expect(screen.getAllByText(/Create a series/).length).toBeGreaterThan(0);
  expect(screen.getByText(/New works are added at the end/)).toBeTruthy();
 });
});
