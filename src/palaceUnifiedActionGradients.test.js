import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';

const read=path=>readFileSync(resolve(process.cwd(),path),'utf8');
const css=read('src/palace-unified-action-gradients.css');
const existing=read('src/palace-prismatic-gradients.css');
const main=read('src/main.jsx');
const rooms=read('src/liveRooms.jsx');

describe('Palace action gradients — screenshot refinement',()=>{
 it('matches the selected All Stories tab gradient in both themes',()=>{
  for(const declaration of [
   'linear-gradient(115deg,#e7d7fa,#dce8fe 58%,#d4f0e9)',
   'linear-gradient(118deg,#7660bd,#516ca5 57%,#337a90)'
  ]){
   expect(existing).toContain(declaration);
   expect(css).toContain(declaration);
  }
  expect(css).toContain('--palace-unified-action-ink:#302347');
  expect(css).toContain('--palace-unified-action-ink:#ffffff');
 });
 it('targets precisely the four controls shown without changing site structure',()=>{
  expect(main).toContain('className="global-search-live"');
  expect(main).toContain('className="write-action"');
  expect(main).toContain('className="palace-passage-wander"');
  expect(rooms).toContain('className="reading-compass-wander"');
  for(const selector of [
   '.full-topbar .global-search-live>button[type="submit"]',
   '.full-topbar .full-top-actions .write-action',
   '.palace-passage .palace-passage-wander',
   '.legacy-reading-page .reading-compass .reading-compass-wander'
  ])expect(css).toContain(selector);
 });
 it('loads after existing gradients and layout rules',()=>{
  const latest=main.indexOf("import './palace-unified-action-gradients.css';");
  expect(latest).toBeGreaterThan(main.indexOf("import './palace-prismatic-gradients.css';"));
  expect(latest).toBeGreaterThan(main.indexOf("import './treasury-daylight-tablet-clarity.css';"));
  expect(css).not.toMatch(/\b(?:position|height|width|transform|display)\s*:/);
  expect(css).toContain(':focus-visible');
  expect(css).toContain(':disabled');
 });
 it('preserves reduced-motion preferences and static gradients',()=>{
  expect(css).toContain('@media(prefers-reduced-motion:reduce)');
  expect(css).not.toMatch(/\banimation\s*:/);
  expect(css).not.toContain('backdrop-filter');
 });
});
