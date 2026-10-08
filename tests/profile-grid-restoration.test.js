import {describe,expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';

const read=path=>readFileSync(resolve(process.cwd(),path),'utf8');
const css=read('src/profile-grid-restoration.css');
const main=read('src/main.jsx');
const rooms=read('src/liveRooms.jsx');

describe('Profile screenshot regression: all six stats visible, aligned and readable',()=>{
 it('overrides the obsolete horizontally scrolling flex rail with a responsive grid',()=>{
  expect(rooms).toContain('className="legacy-profile-stats"');
  for(const label of ['FOLLOWERS','STORIES','COMICS','SERIES','CLUBS','DISPLAYED HONOURS'])expect(rooms).toContain(label);
  expect(css).toContain('.member-chamber-atelier.chic-member-profile .legacy-profile-stats{');
  expect(css).toContain('display:grid!important;');
  expect(css).toContain('grid-template-columns:repeat(6,minmax(0,1fr))!important');
  expect(css).toContain('overflow-x:visible!important');
  expect(css).toContain('flex:none!important');
  expect(css).toContain('flex-direction:column!important');
  expect(css).toContain('min-width:0!important');
  expect(css).not.toContain('overflow-x:hidden!important');
 });
 it('uses three equal columns on tablets and two on narrow phones instead of clipping tiles',()=>{
  expect(css).toContain('@media(max-width:1100px)');
  expect(css).toContain('grid-template-columns:repeat(3,minmax(0,1fr))!important');
  expect(css).toContain('@media(max-width:640px)');
  expect(css).toContain('grid-template-columns:repeat(2,minmax(0,1fr))!important');
  expect(css).toContain('white-space:normal!important');
  expect(css).toContain('overflow-wrap:break-word!important');
 });
 it('lets one, two or three worn honours form balanced rows without ghost columns',()=>{
  expect(rooms).toContain('chamber-crown-ribbon chamber-atelier-crown-ribbon');
  expect(css).toContain('grid-template-columns:repeat(auto-fit,minmax(min(100%,240px),1fr))!important');
  expect(css).toContain('.chamber-atelier-crown-ribbon>span:first-child');
  expect(css).toContain('grid-column:auto!important');
 });
 it('keeps navigation and gallery bounded by the content, with all five phone tabs visible',()=>{
  expect(css).toContain('width:min(100%,1180px)!important');
  expect(css).toContain('max-width:100%!important');
  expect(css).toContain('.chamber-atelier-palace-stage');
  expect(css).toContain('.chamber-atelier-gallery');
  expect(css).toContain('grid-template-columns:repeat(5,minmax(0,1fr))!important');
  expect(css).toContain('overflow-x:visible!important');
  expect(css).toContain('flex-direction:column!important');
  expect(css).toContain('min-height:48px!important');
  expect(css).toContain(':focus-visible');
 });
 it('preserves cover/art proportions and both palettes while avoiding motion dependence',()=>{
  expect(css).not.toContain('aspect-ratio:');
  expect(css).not.toContain('object-fit:');
  expect(css).not.toContain('background-size:');
  expect(css).toContain('.palace-shell.daylight');
  expect(css).toContain('prefers-reduced-motion:reduce');
  expect(css).toContain('.legacy-profile-actions :is(a,button)');
  expect(css).toContain('.member-palace-heraldry:focus-visible');
  expect(css).toContain('.chamber-atelier-gallery-filters button:focus-visible');
 });
 it('loads the final repair after all prior profile and mobile styles',()=>{
  const last="import './profile-grid-restoration.css';";
  expect(main).toContain(last);
  expect(main.indexOf(last)).toBeGreaterThan(main.indexOf("import './mobile-profile-writer-layout.css';"));
  expect(main.indexOf(last)).toBeGreaterThan(main.indexOf("import './palace-next.css';"));
 });
});
