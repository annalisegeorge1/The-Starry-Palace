import {describe,expect,it} from 'vitest';
import {readFileSync} from 'node:fs';

describe('mobile Palace reading screenshots regression',()=>{
 const shell=readFileSync('src/main.jsx','utf8');
 const css=readFileSync('src/mobile-reading-chamber-review.css','utf8');
 it('scopes mobile polish to a named active room without changing routes',()=>{
  expect(shell).toContain('data-palace-room={activeRoom?.id||"unknown"}');
  expect(shell).toContain("import './mobile-reading-chamber-review.css';");
  expect(shell).toContain("className={'global-search-live '+");
  expect(shell).toContain('className="mobile-palace-dock"');
  expect(shell).toContain('aria-label="Open Palace Letters"');
 });
 it('keeps archive search available while hiding the duplicate global search only in mobile Reading Rooms',()=>{
  expect(css).toMatch(/@media\s*\(max-width:720px\)/);
  expect(css).toContain('[data-palace-room="reading"] .full-topbar .global-search-live');
  expect(css).toContain('[data-palace-room="reading"] .chic-reading-tools');
  expect(css).toContain('position:relative!important');
  expect(css).not.toContain('.reading-search{display:none');
  expect(css).not.toContain('.story-row{display:none');
 });
 it('retains the theme toggle and top-bar Letters link while eliminating duplicate floating shortcut',()=>{
  expect(css).toContain('.restored-floating-controls .notification-anchor');
  expect(css).not.toMatch(/\.restored-floating-controls\s*\{\s*display:none/);
  expect(shell).toContain('className="float-btn theme-orb"');
  expect(shell).toContain('className="float-btn palace-float-sigil notification-anchor" to="/letters"');
 });
});
