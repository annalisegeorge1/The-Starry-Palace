import React from 'react';
import {describe,it,expect,vi,afterEach} from 'vitest';
import {render,screen,cleanup} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import PrismWayfinder,{palaceJourneyDoors} from './PrismWayfinder';
import {useAuth} from './auth';

vi.mock('./auth',()=>({useAuth:vi.fn()}));
afterEach(cleanup);

describe('Contextual Palace next-step directions',()=>{
 it('offers a small different set of actual destinations in each core room',()=>{
  const expected={
   writing:['/reading','/library?tab=continue','/palace-life?room=commons'],
   library:['/reading','/writing','/palace-life?room=commons'],
   commons:['/reading','/library?tab=continue','/chamber'],
   duels:['/writing','/palace-life?room=commons','/treasury?tab=achievements']
  };
  for(const [room,paths] of Object.entries(expected)){
   const actual=palaceJourneyDoors(room,true);
   expect(actual.map(x=>x.to),room).toEqual(paths);
   expect(actual).toHaveLength(3);
   expect(new Set(actual.map(x=>x.to)).size).toBe(3);
  }
 });
 it('keeps discovery entirely public for a guest reader',()=>{
  const doors=palaceJourneyDoors('reading',false);
  expect(doors.map(x=>x.to)).toEqual(['/fandoms','/comics','/tags']);
  expect(doors.some(x=>x.to.includes('/login'))).toBe(false);
  useAuth.mockReturnValue({session:null});
  render(<MemoryRouter><PrismWayfinder active="reading"/></MemoryRouter>);
  const nav=screen.getByRole('navigation',{name:'Where to go next in the Palace'});
  expect(nav.querySelectorAll('a')).toHaveLength(3);
  expect(screen.getByRole('link',{name:/Explore fandoms/}).getAttribute('href')).toBe('/fandoms');
 });
 it('preserves member access checks if a guest renders a protected room link',()=>{
  const doors=palaceJourneyDoors('writing',false);
  expect(doors.find(x=>x.id==='saved').to).toContain('/login');
  expect(doors.find(x=>x.id==='gather').to).toContain('/login');
  expect(doors.find(x=>x.id==='read').to).toBe('/reading');
 });
 it('shows only relevant next steps, not another active room directory',()=>{
  useAuth.mockReturnValue({session:{user:{id:'member'}}});
  render(<MemoryRouter><PrismWayfinder active="commons"/></MemoryRouter>);
  const nav=screen.getByRole('navigation',{name:'Where to go next in the Palace'});
  expect(nav.querySelectorAll('a')).toHaveLength(3);
  expect(screen.getByRole('link',{name:/Discover a story/}).getAttribute('href')).toBe('/reading');
  expect(screen.getByRole('link',{name:/Return home/}).getAttribute('href')).toBe('/chamber');
  expect(screen.queryByRole('link',{name:'Palace Commons'})).toBeNull();
 });
});
