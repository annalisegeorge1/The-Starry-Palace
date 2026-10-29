import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {palaceTabFromSearch,palaceTabUrl,WRITING_TABS,LIBRARY_TABS,SETTINGS_TABS,EVENTS_PUBLIC_TABS,EVENTS_MEMBER_TABS} from './palaceTabNavigation';

describe('Palace core tab routing cleanup',()=>{
 it('recognizes every available writing tab and handles legacy or invalid links safely',()=>{
  expect(WRITING_TABS).toEqual(['drafts','collab','relay','duels','comments','permissions']);
  expect(palaceTabFromSearch('?tab=duels',WRITING_TABS,'drafts')).toBe('duels');
  expect(palaceTabFromSearch('?tab=permissions',WRITING_TABS,'drafts')).toBe('permissions');
  expect(palaceTabFromSearch('?tab=missing',WRITING_TABS,'drafts')).toBe('drafts');
  expect(palaceTabFromSearch('',WRITING_TABS,'drafts')).toBe('drafts');
  expect(palaceTabUrl('/writing','duels',WRITING_TABS,'drafts')).toBe('/writing?tab=duels');
 });
 it('keeps every existing Library shelf deep-linkable, including History',()=>{
  expect(LIBRARY_TABS).toHaveLength(11);
  expect(palaceTabFromSearch('?tab=overview',LIBRARY_TABS,'overview')).toBe('overview');
  expect(palaceTabFromSearch('',LIBRARY_TABS,'overview')).toBe('overview');
  expect(palaceTabUrl('/library','overview',LIBRARY_TABS,'overview')).toBe('/library?tab=overview');
  expect(palaceTabFromSearch('?tab=history',LIBRARY_TABS,'continue')).toBe('history');
  expect(palaceTabFromSearch('?tab=finished',LIBRARY_TABS,'continue')).toBe('finished');
  expect(palaceTabFromSearch('?tab=invalid',LIBRARY_TABS,'continue')).toBe('continue');
  expect(palaceTabUrl('/library','history',LIBRARY_TABS,'continue')).toBe('/library?tab=history');
 });
 it('guards malformed and empty values without redirecting to an unsupported screen',()=>{
  expect(palaceTabFromSearch('?tab=__proto__',LIBRARY_TABS,'continue')).toBe('continue');
  expect(palaceTabFromSearch('?tab=',WRITING_TABS,'drafts')).toBe('drafts');
  expect(palaceTabUrl('/writing','not-real',WRITING_TABS,'drafts')).toBe('/writing?tab=drafts');
 });
 it('preserves Settings, member calendars and public event links without exposing member-only event tabs',()=>{
  expect(SETTINGS_TABS).toEqual(['privacy','notifications','quiet','storage','account','system','guide','testing']);
  expect(palaceTabFromSearch('?tab=account',SETTINGS_TABS,'privacy')).toBe('account');
  expect(palaceTabFromSearch('?tab=invalid',SETTINGS_TABS,'privacy')).toBe('privacy');
  expect(EVENTS_PUBLIC_TABS).toEqual(['writing','events','heritage']);
  expect(EVENTS_MEMBER_TABS).toContain('calendar');
  expect(EVENTS_MEMBER_TABS).toContain('proposals');
  expect(palaceTabFromSearch('?tab=ballots',EVENTS_MEMBER_TABS,'writing')).toBe('ballots');
  expect(palaceTabFromSearch('?tab=ballots',EVENTS_PUBLIC_TABS,'writing')).toBe('writing');
  expect(palaceTabUrl('/events','heritage',EVENTS_PUBLIC_TABS,'writing')).toBe('/events?tab=heritage');
 });
 it('uses React Router for tab transitions and Back/Forward instead of raw history edits',()=>{
  const src=readFileSync('src/liveRooms.jsx','utf8');
  const writing=src.split('export function WritingLive({Frame})')[1]?.split('export function ')[0]||'';
  const library=src.split('export function LibraryLive({Frame})')[1]?.split('export function ')[0]||'';
  const settings=readFileSync('src/SettingsRoom.jsx','utf8');
  const events=src.split('export function EventsLive({Frame})')[1]?.split('export function ')[0]||'';
  for(const area of [writing,library,settings,events]){
   expect(area).toContain('palaceTabFromSearch(location.search,');
   expect(area).toContain('navigate(palaceTabUrl(');
   expect(area).not.toContain('history.replaceState(');
   expect(area).toMatch(/\[location\.search(?:,session\?\.user\?\.id)?\]/);
  }
 });
 it('opens the selected scheduled release and most recent edited chapter',()=>{
  const src=readFileSync('src/liveRooms.jsx','utf8');
  const writing=src.split('export function WritingLive({Frame})')[1]?.split('export function ')[0]||'';
  expect(writing).toContain('preferChapter||chooseWritingResumeTarget([work])?.chapter');
  expect(writing).toContain("encodeURIComponent(scheduledChapters[0].chapter.id)");
  expect(writing).toContain('href:resumeWritingPath(resumeTarget)');
 });
});
