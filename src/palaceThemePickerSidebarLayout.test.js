import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';

const css=readFileSync('src/palace-midnight-theme.css','utf8');
const component=readFileSync('src/PalaceThemePicker.jsx','utf8');

describe('sidebar appearance options at narrow desktop widths',()=>{
 it('preserves three real theme buttons and accessible selected state',()=>{
  for(const label of ['Nightfall','Midnight','Daybreak'])expect(component).toContain("label:'"+label+"'");
  expect(component).toContain('aria-pressed={value===id}');
  expect(component).toContain('onClick={()=>onChange(id)}');
 });
 it('stacks each icon above its label within equal-width sidebar buttons',()=>{
  expect(css).toContain('#palace-sidebar .palace-theme-options');
  expect(css).toContain('grid-template-columns:repeat(3,minmax(0,1fr))!important');
  expect(css).toContain('#palace-sidebar .palace-theme-option');
  expect(css).toContain('grid-template-rows:20px auto!important');
  expect(css).toContain('min-height:58px!important');
  expect(css).toContain('#palace-sidebar .palace-theme-option>.palace-theme-swatch');
  expect(css).toContain('grid-row:1!important');
  expect(css).toContain('#palace-sidebar .palace-theme-option>.palace-theme-name');
  expect(css).toContain('grid-row:2!important');
 });
 it('does not change the separate mobile More picker layout',()=>{
  const segment=css.slice(css.indexOf('/* Sidebar-only fit:'),
    css.indexOf('.palace-shell.full-palace-shell .palace-theme-swatch {'));
  expect(segment).not.toContain('.mobile-more-sheet');
 });
});
