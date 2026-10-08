import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';

const css=readFileSync(resolve(process.cwd(),'src/palace-moonlit-curation.css'),'utf8');
const entry=readFileSync(resolve(process.cwd(),'src/main.jsx'),'utf8');
describe('Palace visual curation release guard',()=>{
 it('loads the finish after the established theme layers, without replacing them',()=>{
  const safety=entry.indexOf("import './palace-build-safety.css'");
  const curated=entry.indexOf("import './palace-moonlit-curation.css'");
  expect(safety).toBeGreaterThan(-1);
  expect(curated).toBeGreaterThan(safety);
 });
 it('keeps every new visual change within the Palace shell',()=>{
  for(const selectors of ['.palace-resume-reading','.palace-live-gatherings','.palace-beta-guide','.palace-paths','.manifesto']){
   expect(css).toContain(selectors);
  }
  expect(css).toContain('.palace-shell.daylight');
  expect(css).toContain('.palace-shell.nightfall');
 });
 it('gives focus and low-motion users equal access to the finish',()=>{
  expect(css).toContain(':focus-visible');
  expect(css).toContain('@media(prefers-reduced-motion:reduce)');
  expect(css).toContain('@media(max-width:640px)');
 });
 it('does not hide navigation or change application state',()=>{
  expect(css).not.toMatch(/display:\s*none\s*!important/i);
  expect(css).not.toContain('pointer-events:none!important');
  expect(css).not.toContain('@keyframes');
 });
});
