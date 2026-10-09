import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';

const css=readFileSync(resolve(process.cwd(),'src/treasury-daylight-tablet-clarity.css'),'utf8');
const main=readFileSync(resolve(process.cwd(),'src/main.jsx'),'utf8');
const rooms=readFileSync(resolve(process.cwd(),'src/liveRooms.jsx'),'utf8');

describe('Treasury daylight and tablet follow-up',()=>{
 it('loads a late, narrowly scoped polish layer without modifying existing titles',()=>{
  expect(main).toContain("import './treasury-daylight-tablet-clarity.css';");
  expect(main.indexOf("import './treasury-daylight-tablet-clarity.css';"))
    .toBeGreaterThan(main.indexOf("import './palace-prismatic-gradients.css';"));
  expect(rooms).toContain('className="celestial-title-ladder treasury"');
  expect(rooms).toContain('t.title');
  expect(rooms).toContain('t.description');
  expect(rooms).toContain('nextTitle.progress');
 });
 it('raises type size and sets contrast for daylight title cards',()=>{
  expect(css).toContain('.palace-shell.daylight .celestial-title-ladder.treasury');
  expect(css).toContain('.title-constellation-grid>article p');
  expect(css).toContain('font-size:.79rem');
  expect(css).toContain('font-size:.67rem');
  expect(css).toContain('color:#4a3f5a');
  expect(css).toContain('color:#322543');
 });
 it('keeps two columns at tablet widths and one column on small screens',()=>{
  expect(css).toContain('@media(min-width:721px) and (max-width:1360px)');
  expect(css).toContain('grid-template-columns:repeat(2,minmax(0,1fr))');
  expect(css).toContain('@media(max-width:720px)');
  expect(css).toContain('grid-template-columns:minmax(0,1fr)');
 });
 it('separates chat and theme controls without removing chat or Letters links',()=>{
  expect(css).toContain('.restored-floating-controls .notification-anchor{display:none!important}');
  expect(css).toContain('bottom:calc(91px + env(safe-area-inset-bottom,0px))');
  expect(main).toContain('aria-label="Palace Letters"');
  expect(main).toContain('<PalaceChatHost/>');
  expect(css).not.toContain('display:none!important}.palace-chat');
 });
 it('leaves art and motion preferences untouched',()=>{
  expect(css).not.toMatch(/animation\s*:/);
  expect(css).not.toContain('backdrop-filter');
  expect(css).not.toContain('.palace-watercolour-badge');
  expect(css).not.toContain('.badge-art');
  expect(css).not.toContain('filter:blur');
 });
});
