import {describe,expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';

const live=readFileSync(resolve(process.cwd(),'src/liveRooms.jsx'),'utf8');
const shell=readFileSync(resolve(process.cwd(),'src/main.jsx'),'utf8');
const css=readFileSync(resolve(process.cwd(),'src/palace-calm-inner-rooms.css'),'utf8');

function sliceRoom(start,end){
 const a=live.indexOf(start);
 const b=live.indexOf(end,a+start.length);
 expect(a).toBeGreaterThan(-1);
 expect(b).toBeGreaterThan(a);
 return live.slice(a,b);
}
describe('a calmer Palace without feature removal',()=>{
 it('keeps the Reading Room filters, full catalogue and every discovery wing',()=>{
  const room=sliceRoom('export function ReadingLive({Frame})','export function WritingLive({Frame})');
  expect(room).toContain('reading-compass');
  expect(room).toContain('palace-calm-moods');
  expect(room).toContain('reading-mood-doors');
  expect(room).toContain('palace-calm-classics');
  expect(room).toContain('reading-classics-hall');
  expect(room).toContain('chic-discovery-court');
  expect(room).toContain('chic-story-catalogue');
  expect(room).toContain('advanced-search-mode');
  expect(room).toContain('reading-reader-lenses');
  expect(room).toContain('reading-filter-trail');
  expect(room).toContain('reading-search');
 });
 it('keeps the manuscript action primary and the complete Prompt Orrery reachable',()=>{
  const room=sliceRoom('export function WritingLive({Frame})','export function SettingsLive');
  for(const landmark of [
   'palace-calm-writing-overview','writing-summary chic-writing-summary',
   'FirstManuscriptGuide works={works}','palace-calm-writing-points',
   'writing-pad-launch','writing-pad-primary','chic-writing-tabs',
   'palace-calm-prompt-fold','prompt-orrery','prompt-reels',
   'new-work chic-'
  ])expect(room).toContain(landmark);
  expect(room.indexOf('writing-pad-launch')).toBeLessThan(room.indexOf('palace-calm-prompt-fold'));
 });
 it('keeps all seven Palace Life rooms, pulses, member safeguards and history',()=>{
  const room=sliceRoom('export function PalaceLifeLive({Frame})','export function LettersLive');
  for(const landmark of ['palace-calm-life-pulse','community-pulse-row',
    'palace-calm-life-more',"['commons','♢ Commons']","['clubs','✦ Clubs']",
    "['forum','⌕ Forum']","['moonlight','☾ Moonlight']",
    "['stars','✧ New Stars']","['highlights','♛ Highlights']",
    "['history','⌛ History']",'historyStories','commons-compose-fold'
  ])expect(room).toContain(landmark);
  expect(room).toContain("['stars','highlights','history'].includes(room)");
 });
 it('supports the dark and daylight shell without replacing functional buttons with inert visuals',()=>{
  expect(shell).toContain("import './palace-calm-inner-rooms.css'");
  expect(css).toContain('.palace-shell.daylight');
  expect(css).toContain(':focus-visible');
  expect(css).toContain('.palace-calm-prompt-fold');
  expect(css).toContain('.palace-calm-life-more');
 });
});
