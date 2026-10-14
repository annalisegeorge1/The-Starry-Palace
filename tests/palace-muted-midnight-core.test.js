import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';

const main=readFileSync('src/main.jsx','utf8');
const core=readFileSync('src/palace-muted-midnight-core.css','utf8');

describe('Blue-muted Nightfall and lilac-to-blue Daylight core',()=>{
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
 it('gives Daylight lavender/lilac-first gradient glass instead of a pink flat fill',()=>{
  expect(core).toContain('.palace-shell.full-palace-shell.daylight {');
  expect(core).toContain('.palace-shell.full-palace-shell.daylight :is(.full-stage,.palace-stage)');
  expect(core).toContain('linear-gradient(180deg,');
  expect(core).toContain('#e6daf7 0%');
  expect(core).toContain('#dacbf3 24%');
  expect(core).toContain('#cec8f2 51%');
  expect(core).toContain('#bdcff5 75%');
  expect(core).toContain('#a9dcfa 100%');
  expect(core).toContain('rgba(255,211,231,.10)');
  expect(core).not.toContain('#f7b9df 0%');
  expect(core).not.toContain('#edc1e9 24%');
  expect(core).toContain('--lustre-hero:');
  expect(core).toContain('--lustre-card:');
  expect(core).toContain('--lustre-soft:');
  expect(core).toContain('--lustre-tab:');
  expect(core).toContain('rgba(255,255,255,.96)');
  expect(core).toContain('linear-gradient(130deg,#f3eafa');
  expect(core).toContain('.palace-shell.full-palace-shell.daylight .full-sidebar');
  expect(core).toContain('.palace-shell.full-palace-shell.nightfall .full-sidebar');
  expect(core).toContain('.palace-shell.full-palace-shell.nightfall .full-topbar');
  expect(core).toContain('.palace-shell.full-palace-shell.daylight .full-topbar');
 });
 it('uses the supplied five-colour palette as layered Daylight accents',()=>{
  expect(core).toContain('--palace-daylight-sky:#aee4ff;');
  expect(core).toContain('--palace-daylight-periwinkle:#6a9cfd;');
  expect(core).toContain('--palace-daylight-blush:#ffbbd0;');
  expect(core).toContain('--palace-daylight-peach:#fee5e1;');
  expect(core).toContain('--palace-daylight-royal:#033495;');
  expect(core).toContain('--ui-accent:#17469c;');
  expect(core).toContain('--palace-text:#25365b;');
  expect(core).toContain('rgba(242,232,255,.83)');
  expect(core).toContain('rgba(174,228,255,.34)');
 });
 it('keeps Daylight reading text dark against the palest shared glass',()=>{
  const rgb=hex=>hex.match(/[a-f0-9]{2}/gi).map(n=>parseInt(n,16)/255);
  const luminance=hex=>rgb(hex).map(c=>c<=.04045?c/12.92:((c+.055)/1.055)**2.4)
   .reduce((sum,v,i)=>sum+[.2126,.7152,.0722][i]*v,0);
  const ink=luminance('25365b'),glass=luminance('f7f6fd');
  expect((glass+.05)/(ink+.05)).toBeGreaterThan(9);
 });
 it('uses a smooth pastel sky rather than grid lines or an embedded reference image',()=>{
  const daylight=core.slice(core.indexOf('/* DAYLIGHT —'),core.indexOf('/* Match the Nightfall chrome'));
  expect(daylight).toContain('linear-gradient(180deg,');
  expect(daylight).not.toContain('repeating-linear-gradient');
  expect(daylight).not.toContain('background-image:url');
  expect(daylight).not.toContain('background-size:20px');
  expect(daylight).toContain('--lustre-hero:');
  expect(daylight).toContain('--lustre-card:');
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
