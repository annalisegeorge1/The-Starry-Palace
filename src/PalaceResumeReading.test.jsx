import React from 'react';
import {afterEach,describe,expect,it,vi} from 'vitest';
import {cleanup,fireEvent,render,screen} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';

const queryRows=vi.hoisted(()=>({rows:[],error:null}));
vi.mock('./supabase',()=>({
 supabase:{from:()=>({
  select:()=>({
   eq:()=>({
    eq:()=>({
     order:()=>({
      limit:()=>Promise.resolve({data:queryRows.rows,error:queryRows.error})
     })
    })
   })
  })
 })}
}));
vi.mock('./StoryRatingBadge',()=>({default:()=>null}));
import PalaceResumeReading from './PalaceResumeReading';

afterEach(cleanup);
const row=(id,chapterId)=>({
 work_id:id,chapter_id:chapterId,updated_at:'2026-10-20T12:00:00Z',completed:false,
 chapter_progress_percent:42,
 works:{id,title:'Story '+id,slug:'story-'+id,publication_status:'published',cover_url:null,rating:null}
});
describe('home reading resume interface',()=>{
 it('labels the chapter destination and announces percentage without exposing other members',async()=>{
  queryRows.rows=[row('a','chapter-a')];queryRows.error=null;
  const {rerender}=render(<MemoryRouter><PalaceResumeReading memberId="member-a"/></MemoryRouter>);
  const resume=await screen.findByRole('link',{name:/Story a.*Resume chapter/i});
  expect(resume.getAttribute('href')).toBe('/work/story-a/chapter/chapter-a');
  expect(screen.getByRole('progressbar').getAttribute('aria-valuetext')).toBe('42 percent through the chapter');
  rerender(<MemoryRouter><PalaceResumeReading memberId="member-b"/></MemoryRouter>);
  expect(screen.queryByText('Story a')).toBeNull();
 });
 it('uses the story overview when no saved chapter exists',async()=>{
  queryRows.rows=[row('b',null)];queryRows.error=null;
  render(<MemoryRouter><PalaceResumeReading memberId="member-b"/></MemoryRouter>);
  const link=await screen.findByRole('link',{name:/Story b.*View story/i});
  expect(link.getAttribute('href')).toBe('/work/story-b');
  expect(screen.queryByRole('progressbar')).toBeNull();
 });
 it('expands and filters the private shelf without changing saved progress',async()=>{
  queryRows.rows=[row('a','chapter-a'),row('b','chapter-b'),row('c','chapter-c'),row('d','chapter-d')];queryRows.error=null;
  render(<MemoryRouter><PalaceResumeReading memberId="member-a"/></MemoryRouter>);
  const expand=await screen.findByRole('button',{name:/See all saved reads/i});
  expect(screen.queryByText('Story d')).toBeNull();
  fireEvent.click(expand);
  expect(screen.getByText('Story d')).toBeTruthy();
  fireEvent.change(screen.getByRole('combobox',{name:'Sort saved stories'}),{target:{value:'title'}});
  expect(screen.getByText('Story a')).toBeTruthy();
  fireEvent.change(screen.getByRole('combobox',{name:'Sort saved stories'}),{target:{value:'progress'}});
  fireEvent.change(screen.getByRole('searchbox',{name:'Find a saved story'}),{target:{value:'Story d'}});
  expect(screen.getByText('Story d')).toBeTruthy();
  expect(screen.queryByText('Story a')).toBeNull();
  fireEvent.change(screen.getByRole('searchbox',{name:'Find a saved story'}),{target:{value:'not found'}});
  expect(screen.getByText(/No matching saved stories/)).toBeTruthy();
  expect(screen.getByRole('status').textContent).toMatch(/0 matching saved stories/);
 });
});
