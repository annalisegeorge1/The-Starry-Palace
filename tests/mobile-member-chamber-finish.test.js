import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
const main=readFileSync('src/main.jsx','utf8');
const css=readFileSync('src/mobile-member-chamber-finish.css','utf8');
const room=readFileSync('src/liveRooms.jsx','utf8');
describe('Mobile public Chamber screenshots: no clipped artwork, buttons or docks',()=>{
 it('loads the targeted mobile fix last, without changing profile media sources',()=>{
  const added="import './mobile-member-chamber-finish.css';";
  expect(main).toContain(added);
  expect(main.indexOf(added)).toBeGreaterThan(main.indexOf("import './palace-search-room-refinement.css';"));
  expect(room).toContain('className="legacy-profile-cover" style={p.cover_url?');
  expect(css).not.toContain('background-image:');
  expect(css).not.toContain('object-fit:');
  expect(css).not.toContain('display:none!important}.legacy-profile-cover');
 });
 it('compacts tablet and phone profiles without hiding identity, tabs or stats',()=>{
  expect(css).toContain('@media(max-width:950px)');
  expect(css).toContain('height:196px!important');
  expect(css).toContain('@media(max-width:720px)');
  expect(css).toContain('height:166px!important');
  expect(css).toContain('top:118px!important');
  expect(css).toContain('grid-template-columns:repeat(2,minmax(0,1fr))!important');
  expect(room).toContain('className="legacy-profile-stats"');
  expect(room).toContain('chamber-atelier-tabs');
 });
 it('replaces pale system buttons with accessible night and daylight contrast',()=>{
  expect(css).toContain('.palace-shell.nightfall .chamber-contact-state>button');
  expect(css).toContain('.palace-shell.daylight .chamber-contact-state>button');
  expect(css).toContain('.palace-shell.nightfall .boundary-bar>div:last-child button');
  expect(css).toContain('min-height:44px!important');
  expect(css).toContain(':focus-visible');
  expect(css).toContain('[disabled]');
 });
 it('keeps report available but modest instead of spanning an entire huge row',()=>{
  expect(css).toContain('.legacy-profile-actions .chamber-report-button');
  expect(css).toContain('grid-column:1/-1!important');
  expect(css).toContain('justify-self:end!important');
  expect(css).toContain('width:auto!important');
  expect(room).toContain('openMemberReport');
 });
 it('separates chat, theme orb and the fixed five-door dock',()=>{
  expect(css).toContain('.palace-chat-dock:not(.is-open)');
  expect(css).toContain('bottom:calc(169px + env(safe-area-inset-bottom,0px))!important');
  expect(css).toContain('.palace-shell .restored-floating-controls .notification-anchor{display:none!important}');
  expect(css).toContain('bottom:calc(91px + env(safe-area-inset-bottom,0px))!important');
  expect(css).toContain('padding-bottom:calc(150px + env(safe-area-inset-bottom,0px))!important');
  expect(main).toContain('className="mobile-palace-dock"');
 });
 it('preserves existing reading and writing room routing',()=>{
  expect(main).toContain("} from './liveRooms';");
  expect(main).toContain('function BlankScreenWatchdog()');
  expect(css).toContain('prefers-reduced-motion:reduce');
 });
});
