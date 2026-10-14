import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';

const main=readFileSync('src/main.jsx','utf8');
const core=readFileSync('src/palace-muted-midnight-core.css','utf8');

describe('Blue-muted Nightfall and blush-to-periwinkle Daylight core',()=>{
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
  expect(core).toContain('rgba(35,53,122,.24)');
  expect(core).toContain('rgba(8,29,100,.54)');
  expect(core).toContain('linear-gradient(115deg,');
  expect(core).not.toContain('rgba(56,48,131,.34)');
 });
 it('gives Daylight blush-lavender-blue gradient glass instead of a flat pastel fill',()=>{
  expect(core).toContain('.palace-shell.full-palace-shell.daylight {');
  expect(core).toContain('.palace-shell.full-palace-shell.daylight :is(.full-stage,.palace-stage)');
  expect(core).toContain('#f8e6ed 0%,#e9e2f7 47%,#c6def7 100%');
  expect(core).toContain('rgba(255,211,218,.67)');
  expect(core).toContain('rgba(157,194,232,.46)');
  expect(core).toContain('rgba(207,194,244,.38)');
  expect(core).toContain('--lustre-hero:');
  expect(core).toContain('--lustre-card:');
  expect(core).toContain('--lustre-soft:');
  expect(core).toContain('--lustre-tab:');
  expect(core).toContain('rgba(255,255,255,.96)');
  expect(core).toContain('linear-gradient(130deg,#f7eaf8');
  expect(core).toContain('.palace-shell.full-palace-shell.daylight .full-sidebar');
  expect(core).toContain('.palace-shell.full-palace-shell.nightfall .full-sidebar');
  expect(core).toContain('.palace-shell.full-palace-shell.nightfall .full-topbar');
  expect(core).toContain('.palace-shell.full-palace-shell.daylight .full-topbar');
 });
 it('does not change the approved blue Nightfall theme while adjusting Daylight',()=>{
  const night=core.slice(core.indexOf('/* NIGHTFALL —'),core.indexOf('/* DAYLIGHT —'));
  expect(night).toContain('rgba(35,53,122,.24)');
  expect(night).toContain('rgba(8,29,100,.54)');
  expect(night).toContain('#060b20 0%,#05112e 39%,#030b22 69%,#020511 100%');
  expect(core).toContain('linear-gradient(170deg,#1c2146 0%,#111932 57%,#0c1428 100%)');
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
