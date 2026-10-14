import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';

const main=readFileSync('src/main.jsx','utf8');
const core=readFileSync('src/palace-muted-midnight-core.css','utf8');

describe('Blue-muted Nightfall and frosted periwinkle Daylight core',()=>{
 it('loads the background refinement after the existing glass and room-theme styles',()=>{
  const glass=main.indexOf("import './palace-glass-coverage.css';");
  const last=main.indexOf("import './palace-community-focus.css';");
  const coreImport=main.indexOf("import './palace-muted-midnight-core.css';");
  expect(glass).toBeGreaterThan(-1);
  expect(coreImport).toBeGreaterThan(last);
  expect(coreImport).toBeGreaterThan(glass);
 });
 it('uses restrained blue-indigo Nightfall instead of intense magenta',()=>{
  expect(core).toContain('.palace-shell.full-palace-shell.nightfall :is(.full-stage,.palace-stage)');
  expect(core).toContain('radial-gradient(ellipse 76% 92% at -11% 73%');
  expect(core).toContain('rgba(56,48,131,.34)');
  expect(core).toContain('rgba(6,21,101,.63)');
  expect(core).toContain('linear-gradient(115deg,');
  expect(core).not.toContain('rgba(99,3,141,.72)');
 });
 it('gives Daylight cool misty lavender-blue glass, not a flat pastel paint',()=>{
  expect(core).toContain('.palace-shell.full-palace-shell.daylight {');
  expect(core).toContain('.palace-shell.full-palace-shell.daylight :is(.full-stage,.palace-stage)');
  expect(core).toContain('#f1edf8 0%,#e8eaf8 48%,#e1e8f7 100%');
  expect(core).toContain('--lustre-hero:');
  expect(core).toContain('--lustre-card:');
  expect(core).toContain('--lustre-soft:');
  expect(core).toContain('--lustre-tab:');
  expect(core).toContain('rgba(255,255,255,.96)');
  expect(core).toContain('linear-gradient(130deg,#f2ebfa');
  expect(core).toContain('.palace-shell.full-palace-shell.daylight .full-sidebar');
  expect(core).toContain('.palace-shell.full-palace-shell.daylight .full-topbar');
 });
 it('removes flowing cloud ovals while leaving stars quiet and existing gloss intact',()=>{
  expect(core).toContain(':is(.nightfall,.daylight) :is(.full-stage,.palace-stage)::after');
  expect(core).toContain('opacity:0!important;');
  expect(core).toContain('animation:none!important;');
  expect(core).toContain('background-attachment:scroll;');
  expect(core).toContain('opacity:.09!important;');
  expect(core).toContain('opacity:.12!important;');
  expect(core).not.toContain('backdrop-filter');
  expect(core).not.toContain('transform:');
 });
 it('does not repaint protected artwork, custom chambers or manuscript paper',()=>{
  expect(core).not.toMatch(/\.story-row|\.profile-banner|\.badge-card|\.chamber-frame|\.palace-chat-bubble|\.writer-editor|\.reader-page|\.chamber-atelier-tabs/);
  expect(core).not.toContain('url(');
 });
 it('respects high-contrast system colors on either outer theme',()=>{
  expect(core).toContain('@media(forced-colors:active)');
  expect(core).toContain('background:Canvas!important;');
  expect(core).toContain('color:CanvasText;');
 });
});
