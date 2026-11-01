import {readFileSync} from 'node:fs';
import {describe,expect,it} from 'vitest';

const mobile=readFileSync('src/palace-mobile-blue-indigo-balance.css','utf8');
const main=readFileSync('src/main.jsx','utf8');
const tablet=readFileSync('src/tablet-landscape-readable-layout.css','utf8');
const glass=readFileSync('src/palace-glass-restoration.css','utf8');
const chrome=readFileSync('src/palace-unified-action-gradients.css','utf8');

describe('phone uses actual tablet theme',()=>{
 it('loads after earlier responsive fixes and keeps tablets outside its scope',()=>{
  expect(main).toContain("import './palace-mobile-blue-indigo-balance.css'");
  expect(main.lastIndexOf("import './palace-mobile-blue-indigo-balance.css'"))
   .toBeGreaterThan(main.lastIndexOf("import './palace-daylight-library-council-fix.css'"));
  expect(mobile).toContain('@media (max-width:760px)');
  expect(mobile).not.toContain('(max-width:950px)');
 });
 it('does not invent a second phone palette or replace the shared stage sky',()=>{
  expect(mobile).not.toMatch(/^\s*--[\w-]+\s*:/m);
  expect(mobile).not.toMatch(/\.palace-shell\.full-palace-shell\.nightfall\s*\{/);
  expect(mobile).not.toMatch(/\.palace-shell\.full-palace-shell\.daylight\s*\{/);
  expect(mobile).not.toContain('background-attachment:fixed');
  expect(mobile).toContain('var(--palace-glass-quiet)');
  expect(glass).toContain('--palace-glass-quiet:');
  expect(chrome).toContain('--palace-chrome-panel:');
 });
 it('uses the same opaque mobile header colours as the tablet',()=>{
  for(const header of [
   'linear-gradient(120deg,#111934,#0d142b 72%,#141c38)',
   'linear-gradient(120deg,#f4f0fb,#e7e9fa)'
  ]){
   expect(tablet).toContain(header);
   expect(mobile).toContain(header);
  }
  expect(mobile).toContain('.full-stage>header.topbar.full-topbar::before');
 });
 it('reuses actual tablet home shortcut colours and shared surfaces',()=>{
  const base=readFileSync('src/my-palace-calm.css','utf8');
  expect(base).toContain('linear-gradient(110deg,rgba(74,75,137,.4),rgba(47,91,132,.32))');
  expect(mobile).toContain('linear-gradient(110deg,rgba(74,75,137,.4),rgba(47,91,132,.32))');
  expect(mobile).toContain('background:var(--palace-panel)!important');
  expect(mobile).toContain('.palace-home-mobile-hero');
  expect(mobile).toContain('.chic-home-stats.palace-home-stats>a');
 });
 it('preserves artwork, member customisations, responsive geometry and chat icons',()=>{
  for(const selector of [
   '.top-icon-link','.palace-chat-open',
   '.chamber-atelier-art-stage','.chamber-atelier-art-stage img'
  ])expect(mobile).not.toContain(selector);
  expect(mobile).not.toMatch(/(?:^|\n)\s*(?:object-fit|width|height|padding-bottom|stroke|font-size|z-index)\s*:/m);
  expect(mobile).not.toContain('filter:');
  expect(mobile).not.toContain('animation:');
 });
});
