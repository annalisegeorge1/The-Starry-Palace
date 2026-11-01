import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';

const rooms=readFileSync('src/liveRooms.jsx','utf8');
const events=rooms.split('export function EventsLive({Frame})')[1].split('export function ',2)[0]||rooms.slice(rooms.indexOf('export function EventsLive({Frame})'),rooms.indexOf('export function EventsLive({Frame})')+42000);
const calendar=readFileSync('src/PalaceCalendar.jsx','utf8');
const css=readFileSync('src/events-calendar-mobile-clarity.css','utf8');
const main=readFileSync('src/main.jsx','utf8');

describe('Events and Heritage calm mobile calendar',()=>{
 it('removes the large first-look box only from events and leaves contextual help',()=>{
  expect(events).toContain('<PalaceTopicHelp id="events"/>');
  expect(events).not.toContain('<PalaceFirstRoomHint id="events"/>');
  expect(rooms).toContain('<PalaceFirstRoomHint id=');
  expect(events).toContain('className="events-pulse"');
 });
 it('keeps member and public sections while making the scrollable tabs discoverable',()=>{
  for(const label of ['Writing calendar','All Palace events','Heritage calendar','My calendar','Event proposals']){
   expect(events).toContain(label);
  }
  expect(events).toContain('className="events-tabs-rail"');
  expect(events).toContain('aria-pressed={tab===k}');
  expect(css).toContain('.events-tabs-rail::after');
  expect(css).toContain('scroll-snap-type:x proximity');
 });
 it('keeps every statistic visible in a mobile two-column grid',()=>{
  for(const label of ['upcoming gatherings','heritage observances','on your calendar','saved observances']){
   expect(events).toContain(label);
  }
  expect(css).toContain('grid-template-columns:repeat(2,minmax(0,1fr))!important;');
  expect(css).toContain('.events-pulse>span');
 });
 it('keeps date selection, month navigation, accessibility and one dot per event day',()=>{
  expect(calendar).toContain('aria-pressed={selected===day}');
  expect(calendar).toContain("aria-current={day===today?'date':undefined}");
  expect(calendar).toContain("aria-label="Previous month"");
  expect(calendar).toContain("aria-label="Next month"");
  expect(calendar).toContain('onClick={reset}');
  expect(calendar).toContain("count+' '");
  expect(calendar).toContain('className="calendar-date-number"');
  expect(calendar).toContain('className="calendar-kind-dots"');
  expect(calendar).toContain("types[0]||'heritage'");
  expect(calendar).not.toContain("types.slice(0,4)");
  expect(calendar).not.toContain('className="calendar-count-word"');
 });
 it('does not lose themed observances or the full legend',()=>{
  for(const type of ['Festival','Heritage','History','Language','Awareness','Commemoration'])expect(calendar).toContain(type);
  expect(calendar).toContain('heritageVisualTheme(item)');
  expect(calendar).toContain('heritageVisualTheme(dayItems[0])');
  expect(calendar).toContain('calendar-selection');
  expect(css).toContain('var(--holiday-wash)');
 });
 it('adds safe-area scroll clearance and solid header surface without touching header icons',()=>{
  expect(main).toContain("import './events-calendar-mobile-clarity.css';");
  expect(css).toContain('padding-bottom:max(120px,var(--palace-mobile-dock-clearance,120px))');
  expect(css).toContain('header.topbar.full-topbar');
  expect(css).toContain('background-color:#0d142b!important');
  expect(css).not.toContain('.top-icon-link');
  expect(css).not.toContain('.write-action');
  expect(css).not.toContain('.mobile-palace-dock>');
 });
});
