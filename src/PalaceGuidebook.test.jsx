import React from 'react';
import {afterEach,beforeEach,describe,expect,it} from 'vitest';
import {cleanup,fireEvent,render,screen} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import PalaceGuidebook,{PalaceTopicHelp,PalaceFirstRoomHint} from './PalaceGuidebook';
import {PALACE_HELP_TOPICS,palaceHelpTopic} from './palaceHelpTopics';

beforeEach(()=>localStorage.clear());
afterEach(()=>{cleanup();localStorage.clear()});
const Frame=({children})=><>{children}</>;

describe('Palace Guidebook and contextual guidance',()=>{
 it('has unique sections and working Palace room destinations',()=>{
  expect(new Set(PALACE_HELP_TOPICS.map(t=>t.id)).size).toBe(PALACE_HELP_TOPICS.length);
  for(const topic of PALACE_HELP_TOPICS){
   expect(topic.title).toBeTruthy();
   expect(topic.route.startsWith('/')).toBe(true);
   expect(topic.details.length).toBeGreaterThan(0);
   expect(palaceHelpTopic(topic.id)).toEqual(topic);
  }
 });
 it('searches help topics and exposes their matching room links',()=>{
  render(<MemoryRouter><PalaceGuidebook Frame={Frame}/></MemoryRouter>);
  expect(screen.getByRole('heading',{name:'Find your way among the stars.'})).toBeTruthy();
  const search=screen.getByRole('searchbox',{name:'Search the Guidebook'});
  fireEvent.change(search,{target:{value:'duplicate'}});
  expect(screen.getByRole('heading',{name:'Duplicate exchanges and ascension'})).toBeTruthy();
  expect(screen.queryByRole('heading',{name:'Reading Rooms and discovery'})).toBeNull();
  fireEvent.change(search,{target:{value:'zzzzzzz'}});
  expect(screen.getByText('No topics match that search.')).toBeTruthy();
  fireEvent.click(screen.getByRole('button',{name:'Show all topics'}));
  expect(screen.getByRole('heading',{name:'Reading Rooms and discovery'})).toBeTruthy();
 });
 it('uses a touch-accessible information mark with an in-context Guidebook link',()=>{
  render(<MemoryRouter><div className="palace-shell"><PalaceTopicHelp id="drafts"/></div></MemoryRouter>);
  const button=screen.getByRole('button',{name:'About: Draft saving and recovery'});
  expect(button.getAttribute('aria-expanded')).toBe('false');
  fireEvent.click(button);
  expect(screen.getByRole('group',{name:'Draft saving and recovery'})).toBeTruthy();
  expect(screen.getByRole('link',{name:/More in the Palace Guidebook/}).getAttribute('href')).toBe('/guidebook#guide-drafts');
  fireEvent.click(button);
  expect(button.getAttribute('aria-expanded')).toBe('false');
 });
 it('offers first-room help once and lets people dismiss it permanently on this browser',()=>{
  const view=render(<MemoryRouter><PalaceFirstRoomHint id="writing"/></MemoryRouter>);
  expect(screen.getByText('A GENTLE FIRST LOOK')).toBeTruthy();
  fireEvent.click(screen.getByRole('button',{name:'Got it'}));
  expect(localStorage.getItem('palace-room-introduction:v1:writing')).toBe('seen');
  expect(screen.queryByText('A GENTLE FIRST LOOK')).toBeNull();
  view.unmount();
  render(<MemoryRouter><PalaceFirstRoomHint id="writing"/></MemoryRouter>);
  expect(screen.queryByText('A GENTLE FIRST LOOK')).toBeNull();
 });
});
