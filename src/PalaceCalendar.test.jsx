import React from 'react';
import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {cleanup,fireEvent,render,screen} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import PalaceCalendar from './PalaceCalendar';

beforeEach(()=>{
 vi.useFakeTimers();
 vi.setSystemTime(new Date(2026,10,2,12,0,0));
});
afterEach(()=>{cleanup();vi.useRealTimers()});

describe('Palace calendar selected-day experience',()=>{
 it('shows a real Reading Rooms link for a quiet writing day',()=>{
  render(<MemoryRouter><PalaceCalendar items={[]}/></MemoryRouter>);
  expect(screen.getByText('A quiet day in the Palace.')).toBeTruthy();
  expect(screen.getByText('No published writing events for this date.')).toBeTruthy();
  expect(screen.getByRole('link',{name:/Explore Reading Rooms/}).getAttribute('href')).toBe('/reading');
 });
 it('preserves real event details instead of showing the empty message',()=>{
  const event={id:'e1',title:'Writing sprint',summary:'A shared creative hour',starts_at:new Date(2026,10,2,10,0,0).toISOString(),ends_at:new Date(2026,10,2,11,0,0).toISOString()};
  render(<MemoryRouter><PalaceCalendar items={[event]}/></MemoryRouter>);
  expect(screen.getByText('Writing sprint')).toBeTruthy();
  expect(screen.queryByText('A quiet day in the Palace.')).toBeNull();
 });
 it('retains month navigation and day selection',()=>{
  render(<MemoryRouter><PalaceCalendar items={[]}/></MemoryRouter>);
  fireEvent.click(screen.getByRole('button',{name:'Next month'}));
  expect(screen.getByRole('heading',{name:/December 2026/})).toBeTruthy();
  fireEvent.click(screen.getByRole('button',{name:'Today'}));
  expect(screen.getByRole('heading',{name:/November 2026/})).toBeTruthy();
 });
 it('also explains empty heritage days without inventing observances',()=>{
  render(<MemoryRouter><PalaceCalendar kind="heritage" items={[]}/></MemoryRouter>);
  expect(screen.getByText('No verified observances for this date.')).toBeTruthy();
 });
});
