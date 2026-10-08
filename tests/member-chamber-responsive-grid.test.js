import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';

const root=resolve(process.cwd());
const finish=readFileSync(resolve(root,'src/member-chamber-grid-finish.css'),'utf8');
const app=readFileSync(resolve(root,'src/main.jsx'),'utf8');
const rooms=readFileSync(resolve(root,'src/liveRooms.jsx'),'utf8');

describe('Profile grid and responsive chamber refinement',()=>{
 it('does not silently scroll the six public statistics offscreen',()=>{
  expect(rooms).toContain('className="legacy-profile-stats"');
  for(const label of ['FOLLOWERS','STORIES','COMICS','SERIES','CLUBS','DISPLAYED HONOURS']){
   expect(rooms).toContain(label);
  }
  expect(finish).toContain('.member-chamber-atelier.chic-member-profile .legacy-profile-stats{');
  expect(finish).toContain('display:grid!important;');
  expect(finish).toContain('grid-template-columns:repeat(6,minmax(0,1fr))!important;');
  expect(finish).toContain('overflow:visible!important;');
  expect(finish).toContain('flex:none!important;');
  expect(finish).toContain('width:auto!important;');
 });
 it('fits three columns on tablets and two on narrow screens',()=>{
  expect(finish).toContain('@media(max-width:980px)');
  expect(finish).toContain('grid-template-columns:repeat(3,minmax(0,1fr))!important;');
  expect(finish).toContain('@media(max-width:600px)');
  expect(finish).toContain('grid-template-columns:repeat(2,minmax(0,1fr))!important;');
  expect(finish).toContain('overflow-wrap:break-word!important;');
 });
 it('places only existing worn regalia in equal automatic columns',()=>{
  expect(rooms).toContain('chamber-crown-ribbon chamber-atelier-crown-ribbon');
  expect(rooms).toContain('className="chamber-crown-title"');
  expect(finish).toContain('grid-template-columns:repeat(auto-fit,minmax(min(100%,230px),1fr))!important;');
  expect(finish).toContain('grid-column:auto!important;');
  expect(finish).toContain('grid-template-columns:minmax(0,1fr)!important;');
 });
 it('makes all five profile tabs reachable on phones without hiding any',()=>{
  for(const label of ['Palace</a>','About</a>','Notes</a>','Gallery</a>','Worlds</a>']){
   expect(rooms).toContain(label);
  }
  expect(finish).toContain('grid-template-columns:repeat(6,minmax(0,1fr))!important;');
  expect(finish).toContain('a:nth-child(n+4){grid-column:span 3}');
  expect(finish).toContain('a:focus-visible');
  expect(finish).toContain('scroll-margin-top:184px');
  expect(finish).toContain('@media(max-height:480px) and (max-width:600px)');
 });
 it('keeps the existing identity artwork, sizing and day/night palettes',()=>{
  expect(finish).toContain('.palace-shell.daylight');
  expect(finish).toContain('prefers-reduced-motion:reduce');
  expect(finish).not.toContain('aspect-ratio');
  expect(finish).not.toContain('display:none');
  expect(finish).not.toContain('background-image');
  expect(app).toContain("import './member-chamber-grid-finish.css';");
  expect(app.indexOf("import './member-chamber-grid-finish.css';"))
   .toBeGreaterThan(app.indexOf("import './mobile-profile-writer-layout.css';"));
 });
});
