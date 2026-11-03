import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
const css=readFileSync('src/palace-events-profile-commons-refinement.css','utf8');
const shell=readFileSync('src/main.jsx','utf8');
describe('Calendar-specific layout safeguards',()=>{
 it('uses the Events route to protect footer links from the bottom dock',()=>{
  expect(css).toContain('>footer.palace-footer');
  expect(css).toContain('padding-bottom:calc(138px + env(safe-area-inset-bottom,0px))');
  expect(css).toContain('>main#palace-content[data-palace-route^="/events"]');
 });
 it('does not display secondary nearby-room navigation above the Events calendar',()=>{
  expect(shell).toContain("!location.pathname.startsWith('/events')&&shouldShowPalacePassage");
 });
 it('keeps selected days, day numbers and event details visible',()=>{
  expect(css).toContain('.calendar-weekdays');
  expect(css).toContain('.calendar-selection');
  expect(css).toContain('.calendar-quiet-day');
  expect(css).not.toContain('.palace-calendar-days{display:none');
 });
});
