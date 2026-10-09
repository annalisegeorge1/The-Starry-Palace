import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
const source=readFileSync('src/liveRooms.jsx','utf8');
const life=source.split('export function PalaceLifeLive(')[1]?.split('export function ')[0]||'';
const style=readFileSync('src/forum-thread-continuity.css','utf8');
describe('Forum continuity and voting',()=>{
 it('opens a shared conversation after data becomes available',()=>{
  expect(life).toContain('palaceForumThreadFromSearch(location.search)');
  expect(life).toContain('pageForForumThread(data?.threads||[],target,12)');
  expect(life).toContain('navigate(palaceForumThreadUrl(target),{preventScrollReset:true})');
  expect(life).toContain('data?.threads]);');
 });
 it('keeps public discussions readable in smaller groups',()=>{
  expect(life).toContain('const displayedForumThreads=commonsVisiblePage(visibleThreads,forumPage,12)');
  expect(life).toContain('visibleThreads.length?displayedForumThreads.map(t=>');
  expect(life).toContain('Reveal more Forum threads');
  expect(life).toContain('setForumPage(v=>v+1)');
 });
 it('supports voting and closing polls in their Forum room',()=>{
  expect(life).toContain('forum-ledger-live-poll');
  expect(life).toContain('Vote in this Forum poll');
  expect(life).toContain('onClick={()=>voteForumPoll(t.poll,option.id)}');
  expect(life).toContain('onClick={()=>finishForumPoll(t.poll)}');
 });
 it('persists valid poll drafts and checks options before publishing',()=>{
  expect(life).toContain('validateCommonsPollChoices(pollOptions)');
  expect(life).toContain('if(validatedPoll&&!validatedPoll.valid)');
  expect(life).toContain('palace-commons-poll-options');
  expect(life).toContain('const choices=validatedPoll.choices');
 });
 it('has mobile and daylight styles',()=>{
  expect(style).toContain('.forum-ledger-live-poll');
  expect(style).toContain('.forum-thread-permalink');
  expect(style).toContain('@media(max-width:650px)');
  expect(style).toContain('.palace-shell.daylight');
 });
});
