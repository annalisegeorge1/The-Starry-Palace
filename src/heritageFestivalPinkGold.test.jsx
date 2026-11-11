import React from 'react';
import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {cleanup,render,screen} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import {readFileSync} from 'node:fs';
import PalaceCalendar from './PalaceCalendar';

beforeEach(()=>{
 vi.useFakeTimers();
 vi.setSystemTime(new Date(2026,10,2,12,0,0));
});
afterEach(()=>{cleanup();vi.useRealTimers()});

describe('pink and gold festival calendar markers',()=>{
 it('shows matching Festival key and date dot without changing other heritage categories',()=>{
  const items=[
   {id:'festival',title:'Festival gathering',summary:'Festival observance',observance_type:'festival',month:11,day:2,year:2026},
   {id:'heritage',title:'Heritage gathering',summary:'Heritage observance',observance_type:'heritage',month:11,day:3,year:2026}
  ];
  const view=render(<MemoryRouter><PalaceCalendar kind="heritage" items={items}/></MemoryRouter>);
  const key=screen.getByText('Festival').closest('.legend-festival');
  expect(key?.querySelector('i')).toBeTruthy();
  expect(view.container.querySelector('.palace-calendar-days button[data-day-index="1"] i.dot-festival')).toBeTruthy();
  expect(view.container.querySelector('.palace-calendar-days button[data-day-index="2"] i.dot-heritage')).toBeTruthy();
  expect(view.container.querySelector('.palace-calendar-days button[data-day-index="2"] i.dot-festival')).toBeNull();
 });
 it('uses the same pink-gold gradient in the legend and actual festival dots',()=>{
  const css=readFileSync('src/heritage-festival-pink-gold.css','utf8');
  const main=readFileSync('src/main.jsx','utf8');
  expect(css).toContain('#ef4eaa');
  expect(css).toContain('#f2bf72');
  expect(css).toContain('--palace-festival-marker');
  expect(css).toContain('.calendar-kind-dots>i.dot-festival');
  expect(css).toContain('.legend-festival>i');
  expect(css).toContain('.calendar-selection li.heritage-type-festival');
  expect(main.indexOf("import './heritage-festival-pink-gold.css'")).toBeGreaterThan(main.indexOf("import './daybreak-events-desktop-polish.css'"));
 });
});
