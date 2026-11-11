import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
const css=readFileSync('src/palace-dark-theme-priority.css','utf8');
const main=readFileSync('src/main.jsx','utf8');
describe('Palace dark appearance precedence',()=>{
 it('loads after personal Chamber palette and legacy theme patches',()=>{
  expect(main.indexOf("import './palace-dark-theme-priority.css'")).toBeGreaterThan(main.indexOf("import './chamber-avatar-palette-correction.css'"));
  expect(main.indexOf("import './palace-dark-theme-priority.css'")).toBeGreaterThan(main.indexOf("import './prism-appearance.css'"));
 });
 it('keeps Nightfall dark and Midnight near-black independently of viewer palette',()=>{
  expect(css).toContain('.palace-shell.full-palace-shell.nightfall');
  expect(css).toContain('background:#0b142d!important;');
  expect(css).toContain('.palace-shell.full-palace-shell.midnight');
  expect(css).toContain('background:#050506!important;');
  expect(css).toContain('background:#0e0e11!important;');
 });
 it('makes account menu links and sign out readable on dark overlay',()=>{
  expect(css).toContain('.palace-account-menu-popover > a');
  expect(css).toContain('.palace-account-sign-out');
  expect(css).toContain('color:#f5f0fa!important;');
  expect(css).toContain('background:#13131a!important;');
  expect(css).toContain('.palace-account-menu-popover :is(a,button):focus-visible');
 });
 it('preserves artwork and member-owned Chamber colour boundaries',()=>{
  expect(css).not.toMatch(/\.public-chamber-appearance\[[^\]]+\]\s*\{/);
  expect(css).not.toMatch(/\.legacy-profile-cover\s*\{/);
  expect(css).not.toMatch(/\.painted-chamber-frame\s*\{/);
  expect(css).not.toMatch(/\.member-avatar\s*\{/);
 });
 it('does not force white labels on all header buttons including the pale search button',()=>{
  expect(css).not.toContain('.full-topbar button,.full-topbar a');
 });
});
