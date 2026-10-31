import {describe,expect,it} from 'vitest';
import {readFileSync} from 'node:fs';

const member=readFileSync('src/MemberPalaceShowcase.jsx','utf8');
const activity=readFileSync('src/PalaceActivityRoom.jsx','utf8');
const rooms=readFileSync('src/liveRooms.jsx','utf8');
const shell=readFileSync('src/main.jsx','utf8');
const css=readFileSync('src/palace-content-icon-refinement.css','utf8');

describe('Palace content glyph refinement, without changing navigation icons',()=>{
 it('shows dedicated heritage glass artwork for each living library statistic',()=>{
  for(const name of ['feather','book-open','bookmark','celestial-star']){
   expect(member).toContain('<PalaceGlowIcon name="'+name+'"');
  }
  expect(member).toContain('className="member-palace-stat-sigil"');
  expect(member).toContain('PUBLISHED WORDS');
  expect(member).toContain('PUBLISHED WORLDS');
  expect(member).toContain('CHAPTERS READ FOR POINTS');
  expect(member).toContain('PERSONAL CELESTIAL POINTS');
  expect(member).toContain('reading_opted_in');
 });
 it('updates activity summary glyphs while preserving controls and unread counts',()=>{
  expect((activity.match(/className="activity-metric-sigil"/g)||[]).length).toBe(4);
  expect(activity).toContain('className="activity-private-sigil"');
  expect(activity).toContain('aria-pressed={noticeGroup===k}');
  expect(activity).toContain('updateHeaderUnread');
  expect(activity).toContain('savedCount');
 });
 it('restyles the three creator shelf icons, keeping every shelf and destination',()=>{
  for(const title of ['Written worlds','Illustrated worlds','Connected reading paths'])
   expect(rooms).toContain('<h3>'+title+'</h3>');
  expect((rooms.match(/className="creator-shelf-sigil"/g)||[]).length).toBe(3);
  expect(rooms).toContain('chamberPreviewCount');
 });
 it('uses existing content-only icon system and no topbar, sidebar or dock selectors',()=>{
  expect(member).toContain("import './palace-content-icon-refinement.css';");
  expect(activity).toContain("import './palace-content-icon-refinement.css';");
  expect(css).toContain('.member-palace-creative-grid');
  expect(css).toContain('.creator-worlds-room');
  expect(css).toContain('.chic-activity-overview');
  expect(css).toContain('.palace-heritage-icon');
  expect(css).not.toMatch(/\.full-topbar|\.mobile-palace-dock|\.sidebar/);
  expect(shell).toContain('className="topbar full-topbar"');
  expect(shell).toContain('className="mobile-palace-dock"');
  expect(shell).not.toContain("import './palace-content-icon-refinement.css';");
 });
});
