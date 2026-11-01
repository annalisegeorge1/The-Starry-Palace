import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
const css=readFileSync('src/writer-welcome.css','utf8');
const page=readFileSync('src/WriterWelcome.jsx','utf8');
describe('Writer Door responsive layout',()=>{
 it('uses a route-scoped fluid container and single column at tablet widths',()=>{
  expect(css).toContain('#palace-content[data-palace-route="/writers"]>.writer-welcome');
  expect(css).toContain('max-width:1250px!important');
  expect(css).toContain('@media(min-width:761px) and (max-width:1260px)');
  expect(css).toContain('grid-template-columns:minmax(0,1fr)!important');
  expect(css).toContain('max-width:800px');
 });
 it('preserves mobile art, balanced CTA widths and readable copy',()=>{
  expect(page).toContain('Every world begins with a sentence.');
  expect(page).toContain("Gather. Have a cup of tea. Write and read with me.");
  expect(css).toContain('grid-template-columns:minmax(0,1fr);gap:10px');
  expect(css).toContain('color:#252b49');
  expect(css).toContain('color:#fff!important');
  expect(css).toContain('padding-bottom:var(--palace-mobile-dock-clearance');
 });
});