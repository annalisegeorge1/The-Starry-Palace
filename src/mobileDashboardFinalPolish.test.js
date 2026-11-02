import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';

const css=readFileSync('src/mobile-dashboard-final-polish.css','utf8');
const shell=readFileSync('src/main.jsx','utf8');

describe('mobile dashboard finishing pass',()=>{
 it('loads the final polish after the earlier mobile fixes',()=>{
  expect(shell.indexOf("import './mobile-dashboard-final-polish.css';"))
   .toBeGreaterThan(shell.indexOf("import './mobile-dock-header-fix.css';"));
  expect(shell.indexOf("import './mobile-dashboard-final-polish.css';"))
   .toBeGreaterThan(shell.indexOf("import './palace-mobile-home-hero-parity.css';"));
 });
 it('protects all mobile rooms and their scrolled content from the dock',()=>{
  expect(css).toContain('--palace-mobile-dock-clearance:calc(164px + env(safe-area-inset-bottom,0px))');
  expect(css).toContain('.full-stage > main#palace-content');
  expect(css).toContain('padding-bottom:var(--palace-mobile-dock-clearance)!important');
  expect(css).toContain('scroll-padding-bottom:var(--palace-mobile-dock-clearance)!important');
  expect(css).toContain('scroll-margin-block-end:var(--palace-mobile-dock-clearance)!important');
 });
 it('preserves responsive labels, compact prompt and safely tappable buttons',()=>{
  expect(css).toContain('.palace-home-mobile-hero');
  expect(css).toContain('margin-bottom:-9px!important');
  expect(css).toContain('.palace-mobile-stats span');
  expect(css).toContain('font-size:.72rem!important');
  expect(css).toContain('.palace-moon-prompt h2');
  expect(css).toContain('clamp(.91rem,3.8vw,.97rem)');
  expect(css).toContain('min-height:44px!important');
  expect(css).toContain('.palace-shell.full-palace-shell.daylight');
 });
});
