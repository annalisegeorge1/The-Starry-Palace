import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';

const live=readFileSync(resolve(process.cwd(),'src/liveRooms.jsx'),'utf8');
const life=live.split('export function PalaceLifeLive(')[1]?.split('export function ')[0]||'';
const css=readFileSync(resolve(process.cwd(),'src/palace-life-room-clarity.css'),'utf8');
const main=readFileSync(resolve(process.cwd(),'src/main.jsx'),'utf8');

describe('Palace Life rooms feel coherent and easy to enter',()=>{
 it('uses router navigation instead of bypassing React Router with raw history edits',()=>{
  expect(life).toContain('const initialRoom=palaceLifeRoomFromSearch(location.search)');
  expect(life).toContain('const next=palaceLifeRoomFromSearch(location.search);if(next!==room)setRoom(next)');
  expect(life).toContain('const url=palaceLifeRoomUrl(target)');
  expect(life).toContain('navigate(url,{preventScrollReset:true})');
  expect(life).not.toContain('history.replaceState(');
  expect(life).toContain('const rooms=PALACE_LIFE_ROOMS.filter(x=>x!==room)');
 });
 it('keeps meaningful deep-linked Commons conversations and Salon drafting',()=>{
  expect(life).toContain("const talk=params.get('talk')");
  expect(life).toContain("if(talk&&next==='commons')");
  expect(life).toContain("setThread({title:prompt.title,body:prompt.opening,kind:'salon',source:prompt.kind})");
  expect(life).toContain('threadComposeRef.current?.scrollIntoView');
  expect(life).toContain('localStorage.setItem(\'palace-commons-compose\'');
  expect(life).toContain("getPalaceLife(session.user.id)");
 });
 it('gives empty Commons, Forum and circle searches clear next moves',()=>{
  expect(life).toContain('Show all conversations');
  expect(life).toContain('Start the first conversation');
  expect(life).toContain('Show all threads');
  expect(life).toContain('Go to the Commons');
  expect(life).toContain('Clear circle filters');
  expect(life).toContain('Create a circle');
  expect(life).toContain("setThreadQuery('');setThreadView('all')");
  expect(life).toContain("setClubQuery('');setClubType('all');setClubDoor('all')");
 });
 it('shows the active room, accessible navigation and moonlit empty state buttons',()=>{
  expect(life).toContain("aria-current={room===k?'page':undefined}");
  expect(css).toContain('button[aria-current="page"]');
  expect(css).toContain('.palace-life-empty-actions');
  expect(css).toContain('focus-visible');
  expect(css).toContain('.palace-shell.daylight');
  expect(css).toContain('@media(max-width:650px)');
  expect(css).toContain('prefers-reduced-motion:reduce');
  expect(main).toContain("import './palace-life-room-clarity.css';");
 });
});
