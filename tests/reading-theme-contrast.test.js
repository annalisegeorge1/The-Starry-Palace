import {readFileSync} from 'node:fs';
import {describe,it,expect} from 'vitest';

const css=readFileSync('src/reading-theme-contrast-repair.css','utf8');
const main=readFileSync('src/main.jsx','utf8');

describe('Reading Rooms color and mobile contrast repairs',()=>{
 it('loads the scoped repair after all other bundled theme layers',()=>{
  const patch="import './reading-theme-contrast-repair.css';";
  expect(main).toContain(patch);
  expect(main.indexOf(patch)).toBeGreaterThan(main.indexOf("import './palace-mobile-home-hero-parity.css';"));
  expect(css).toContain('.palace-shell.full-palace-shell .chic-reading-page');
  expect(css).not.toContain(':is(>');
 });
 it('uses explicit readable Light/Nightfall color tokens for the tabs and active choices',()=>{
  expect(css).toContain('--reading-ink:#f4f3ff');
  expect(css).toContain('--reading-ink:#27334b');
  expect(css).toContain('.reading-unified-tabs > :is(button,a)');
  expect(css).toContain('button[aria-pressed="true"]');
  expect(css).toContain('color:var(--reading-ink)!important');
 });
 it('keeps all three waypoint labels and icon wells readable in Daylight and Nightfall',()=>{
  expect(css).toContain('--journey-ink:#f4f4ff');
  expect(css).toContain('--journey-ink:#25334b');
  expect(css).toContain('.prism-room-wayfinder-label strong');
  expect(css).toContain('.prism-room-wayfinder-label small');
  expect(css).toContain('.prism-room-wayfinder-glyph');
  expect(css).toContain('background:#e3e7f7!important');
 });
 it('restores input placeholder, active lens, and count readability on both surfaces',()=>{
  expect(css).toContain('input::placeholder');
  expect(css).toContain('color:#c5d0e4!important');
  expect(css).toContain('color:#606c81!important');
  expect(css).toContain('.reading-result-count strong');
  expect(css).toContain('.reading-result-count span');
  expect(css).toContain('.reading-reader-lenses nav button.active');
 });
 it('keeps the bottom dock from obstructing the final lenses and makes the header opaque',()=>{
  expect(css).toContain('padding-bottom:calc(146px + env(safe-area-inset-bottom,0px))!important');
  expect(css).toContain('.reading-reader-lenses{\n  scroll-margin-bottom:');
  expect(css).toContain('.full-stage:has(>main#palace-content .chic-reading-page)>header.topbar.full-topbar');
  expect(css).toContain('backdrop-filter:blur(12px)!important');
  expect(css).toContain('background:#f2eff9!important');
  expect(css).toContain('background:#111a32!important');
  expect(css).toContain('opacity:1!important');
 });
 it('preserves keyboard focus visibility and high-contrast mode',()=>{
  expect(css).toContain(':focus-visible');
  expect(css).toContain('@media(forced-colors:active)');
 });
});
