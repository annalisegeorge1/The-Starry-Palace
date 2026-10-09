import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
const read=path=>readFileSync(resolve(process.cwd(),path),'utf8');
const rooms=read('src/liveRooms.jsx');
const calendar=read('src/PalaceCalendar.jsx');
const styles=read('src/heritage-theme-gradients.css');
describe('Pride gradients and themed holidays remain present across the Palace',()=>{
 it('applies shared content labels to stories, shelf picks, comics and observances',()=>{
  expect(rooms).toContain('isLgbtqContent(w.title,w.summary,workTags(w))');
  expect(rooms).toContain('isLgbtqContent(c.title,c.summary,');
  expect(rooms).toContain('heritageVisualTheme(h)');
  expect(rooms).toContain('heritage-theme-'+''+'');
  expect(rooms).toContain('prism-glass prism-story');
  expect(rooms).toContain('prism-glass prism-comic');
  expect(rooms).toContain('prism-glass heritage-prism');
 });
 it('matches both calendar cells and selected date cards',()=>{
  expect(calendar).toContain('heritageVisualTheme(dayItems[0])');
  expect(calendar).toContain('has-theme-'+''+'');
  expect(calendar).toContain('heritageVisualTheme(item)');
  expect(styles).toContain('.has-theme-rainbow');
 });
 it('puts the gradient on the full holiday card and removes the inner date rectangle',()=>{
  expect(styles).toContain('.heritage-grid.enriched .heritage-card');
  expect(styles).toContain('background:var(--holiday-wash)!important');
  expect(styles).toContain('.heritage-date');
  expect(styles).toContain('background:transparent!important');
  expect(styles).toContain('border:0!important');
  expect(styles).toContain('.heritage-card::after');
  expect(styles).toContain('display:none!important');
 });
 it('keeps rainbow glass in dark/light themes with reduced-motion support',()=>{
  expect(styles).toContain('article.prism-story');
  expect(styles).toContain('.comic-card.prism-comic');
  expect(styles).toContain('.heritage-card.heritage-prism');
  expect(styles).toContain('.palace-shell.daylight');
  expect(styles).toContain('prefers-reduced-motion:reduce');
 });
});
