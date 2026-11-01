import {readFileSync} from 'node:fs';
import {describe,expect,it} from 'vitest';

const css=readFileSync('src/palace-mobile-home-hero-parity.css','utf8');
const main=readFileSync('src/main.jsx','utf8');
const component=readFileSync('src/PalaceHomeHub.jsx','utf8');

describe('tablet-inspired mobile home hero proportions',()=>{
 it('targets the actual home hub pictured on phone and tablet',()=>{
  expect(component).toContain("palace-hub-hero");
  expect(component).toContain('Make yourself at home.');
  expect(component).toContain('Find your next story');
  expect(component).toContain('palace-hub-art');
  expect(css).toContain('.palace-hub-hero.is-member');
  expect(css).toContain('.palace-hub-art');
  expect(css).toContain('.palace-hub-copy');
  expect(css).not.toContain('.palace-home-mobile-hero');
 });
 it('loads after palette parity and preserves tablet/desktop',()=>{
  expect(main).toContain("import './palace-mobile-home-hero-parity.css'");
  expect(main.lastIndexOf("import './palace-mobile-home-hero-parity.css'"))
   .toBeGreaterThan(main.lastIndexOf("import './palace-mobile-blue-indigo-balance.css'"));
  expect(css).toContain('@media (max-width:600px)');
  expect(css).toContain('@media (max-width:360px)');
  expect(css).not.toContain('min-width:761px');
 });
 it('prioritizes the existing art above a shorter member welcome',()=>{
  expect(css).toContain('grid-template-rows:clamp(134px,39vw,172px) auto!important');
  expect(css).toContain('grid-row:1!important');
  expect(css).toContain('grid-row:2!important');
  expect(css).toContain('padding:18px 20px 19px!important');
  expect(css).toContain('margin-top:15px!important');
  expect(css).toContain('.palace-hub-recent');
 });
 it('keeps the actual story/writing links, art and theme tokens unchanged',()=>{
  expect(component).toContain('to="/reading"');
  expect(component).toContain("to={member?'/writing':'/writers'}");
  expect(component).toContain('/assets/palace/palace-belonging.gif');
  expect(css).not.toContain('background-image:');
  expect(css).not.toContain('--palace-');
  expect(css).not.toContain('.mobile-palace-dock');
  expect(css).not.toContain('.top-icon-link');
  expect(css).not.toContain('display:none!important');
 });
});
