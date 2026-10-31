import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';

const shell=readFileSync('src/main.jsx','utf8');

describe('retire legacy floating shortcuts without losing destinations',()=>{
 it('does not mount the obsolete hover orbs that overlap room content',()=>{
  expect(shell).not.toContain('restored-floating-controls');
  expect(shell).not.toContain('className="float-btn theme-orb"');
  expect(shell).not.toContain('className="float-btn palace-float-sigil');
  expect(shell).not.toContain('className="palace-passage-wander"');
  expect(shell).not.toContain('function wanderFromHere()');
 });
 it('keeps the useful controls and unread counts in established navigation',()=>{
  expect(shell).toContain('className="sidebar-theme"');
  expect(shell).toContain('className="mobile-more-grid"');
  expect(shell).toContain('to="/letters" className={letterBadge?');
  expect(shell).toContain('className="mobile-dock-badge"');
  expect(shell).toContain('Switch to Daylight');
  expect(shell).toContain('Switch to Nightfall');
  expect(shell).toContain('Open Palace Chat');
 });
 it('preserves the contextual doors behind the compact mobile disclosure',()=>{
  expect(shell).toContain('label:\'Find a story\'');
  expect(shell).toContain('label:\'Return to the page\'');
  expect(shell).toContain('label:\'See what people are saying\'');
  expect(shell).toContain('Explore nearby rooms');
  expect(shell).toContain('aria-expanded={passageOpen}');
 });
});
