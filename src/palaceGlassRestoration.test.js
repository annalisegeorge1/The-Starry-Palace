import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';

const read=path=>readFileSync(resolve(process.cwd(),path),'utf8');
const css=read('src/palace-glass-restoration.css');
const main=read('src/main.jsx');

describe('Palace glass visual identity',()=>{
 it('keeps the restoration after the simplifying CSS, across both themes',()=>{
  expect(main.indexOf("import './palace-glass-restoration.css';"))
   .toBeGreaterThan(main.indexOf("import './palace-creative-rooms-finish.css';"));
  expect(css).toContain('.palace-shell.full-palace-shell.nightfall');
  expect(css).toContain('.palace-shell.full-palace-shell.daylight');
  for(const token of ['--palace-glass-panel','--palace-glass-quiet','--palace-glass-active','--palace-glass-edge','--palace-glass-shadow']) {
   expect(css.match(new RegExp(token,'g'))?.length).toBeGreaterThan(1);
  }
 });
 it('restores depth to chrome and main rooms without changing geometry',()=>{
  for(const area of ['.full-sidebar','.full-topbar','.palace-hub-hero','.palace-choice-card','.legacy-reading-intro','.writing-head','.chic-timeline','.treasury-badge-filters']) {
   expect(css).toContain(area);
  }
  expect(css).toContain('inset 0 1px');
  expect(css).toContain('radial-gradient(');
  expect(css).toContain('linear-gradient(');
  expect(css).not.toMatch(/\banimation\s*:/);
  expect(css).not.toMatch(/[;{]\s*(?:width|height|padding|margin|transform)\s*:/);
 });
 it('uses frosted glass only on desktop, with opaque mobile headers',()=>{
  expect(css).toContain('@media(min-width:961px)');
  expect(css).toContain('@media(max-width:960px)');
  expect(css).toContain('backdrop-filter:none!important');
  expect(css).toContain('@media(prefers-reduced-transparency:reduce)');
  expect(css).toContain('@media(forced-colors:active)');
 });
 it('leaves reading paper, avatars, member chambers and special art unstyled',()=>{
  for(const forbiddenSelector of ['.manuscript-page','.reader-page','.member-avatar','.chamber-frame','.badge-art','.heritage-card','.prism-story']) {
   expect(css).not.toContain(forbiddenSelector+' {');
  }
 });
});
