import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';

const css=readFileSync('src/daybreak-events-desktop-polish.css','utf8');
const shell=readFileSync('src/main.jsx','utf8');
const calendar=readFileSync('src/PalaceCalendar.jsx','utf8');
const events=readFileSync('src/liveRooms.jsx','utf8');

describe('Daybreak Events and Heritage desktop polish',()=>{
 it('loads after existing Daybreak home, profile and reading overrides',()=>{
  const wanted="import './daybreak-events-desktop-polish.css';";
  expect(shell).toContain(wanted);
  expect(shell.indexOf(wanted)).toBeGreaterThan(shell.indexOf("import './daybreak-dashboard-profile-contrast.css';"));
 });
 it('protects the opaque Events header from transparent scrolling text',()=>{
  expect(css).toContain('>header.topbar.full-topbar');
  expect(css).toContain('background:#faf9ff!important');
  expect(css).toContain('background-image:none!important');
  expect(css).toContain('z-index:950!important');
 });
 it('keeps truthful event totals while compacting desktop overview tiles',()=>{
  expect(events).toContain('className="events-pulse"');
  expect(css).toContain('grid-template-columns:repeat(4,minmax(0,1fr))!important');
  expect(css).toContain('min-height:48px!important');
  expect(css).toContain('grid-template-columns:repeat(2,minmax(0,1fr))!important');
 });
 it('softens active tab and selected Events navigation without changing routes',()=>{
  expect(css).toContain('.chic-events-tabs>button.active');
  expect(css).toContain('background:#e8dff4!important');
  expect(css).toContain('[data-palace-room="events"] #palace-sidebar');
 });
 it('keeps an easy-to-read month grid, quiet-day text and coloured dots',()=>{
  expect(calendar).toContain('className="calendar-heritage-legend"');
  expect(calendar).toContain('className="calendar-quiet-day"');
  expect(calendar).toContain('className="calendar-kind-dots"');
  expect(css).toContain('max-width:940px!important');
  expect(css).toContain('.calendar-weekdays');
  expect(css).toContain('.calendar-kind-dots>i');
  expect(css).toContain('width:7px!important');
  expect(css).toContain('.calendar-selection li small');
 });
 it('does not change the phone calendar or remove heritage artwork',()=>{
  expect(css).toContain('@media (min-width:761px)');
  expect(css).not.toContain('@media(max-width:760px)');
  expect(css).not.toContain('.heritage-card{display:none');
  expect(css).not.toContain('.palace-calendar-days{display:none');
 });
});
