import {describe,expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
const rooms=readFileSync('src/liveRooms.jsx','utf8');
const main=readFileSync('src/main.jsx','utf8');
const css=readFileSync('src/member-chamber-journey.css','utf8');
const chamber=rooms.slice(rooms.indexOf('export function MemberProfileLive({Frame})'),rooms.indexOf('export function ',rooms.indexOf('export function MemberProfileLive({Frame})')+30));

describe('The Chamber tells a member story rather than a wall of statistics',()=>{
 it('introduces the Palace, the person, their work, their notes, then the collection',()=>{
  const tabs=chamber.slice(chamber.indexOf('className="chamber-section-nav'),chamber.indexOf('</nav>',chamber.indexOf('className="chamber-section-nav'))+6);
  const expected=['#chamber-palace','#chamber-about','#chamber-worlds','#chamber-notes','#chamber-honours'];
  const indices=expected.map(anchor=>tabs.indexOf(anchor));
  expect(indices.every(i=>i>=0)).toBe(true);
  expect(indices).toEqual([...indices].sort((a,b)=>a-b));
  const sections=expected.map(anchor=>chamber.indexOf('id="'+anchor.slice(1)+'"'));
  expect(sections.every(i=>i>=0)).toBe(true);
  expect(sections).toEqual([...sections].sort((a,b)=>a-b));
 });
 it('preserves report, correspondence, safety and editing permissions',()=>{
  expect(chamber).toContain('openMemberReport');
  expect(chamber).toContain('toggleBoundary(');
  expect(chamber).toContain('disabled={boundary.blocked||p.message_policy');
  expect(chamber).toContain("p.message_policy!=='closed'&&!boundary.blocked");
  expect(chamber).toContain('openEdit');
 });
 it('retains all six real counts and all earned/gallery rewards',()=>{
  for(const name of ['FOLLOWERS','STORIES','COMICS','SERIES','CLUBS','DISPLAYED HONOURS']){
   expect(chamber).toContain(name);
  }
  expect(chamber).toContain('<PalaceBadge family={x.achievement_families}');
  expect(chamber).toContain('<PalaceGift gift={x.virtual_gifts}');
  expect(chamber).toContain('MemberPalaceShowcase');
  expect(chamber).toContain('MemberChamberDecor');
 });
 it('makes statistics compact while keeping every count visible',()=>{
  expect(css).toContain('grid-template-columns:repeat(3,minmax(0,1fr))!important');
  expect(css).toContain('grid-template-columns:repeat(2,minmax(0,1fr))!important');
  expect(css).toContain('min-height:61px!important');
  expect(css).not.toContain('display:none');
 });
 it('keeps room links keyboard reachable, with light and dark contrast',()=>{
  expect(css).toContain(':focus-visible');
  expect(css).toContain('.palace-shell.daylight');
  expect(css).toContain('prefers-reduced-motion:reduce');
  expect(main.indexOf("import './member-chamber-journey.css';")).toBeGreaterThan(main.indexOf("import './mobile-member-chamber-finish.css';"));
 });
});
