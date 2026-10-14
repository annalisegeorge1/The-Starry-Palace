import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';

const main=readFileSync('src/main.jsx','utf8');
const core=readFileSync('src/palace-muted-midnight-core.css','utf8');

describe('Muted midnight Palace core',()=>{
 it('loads after the existing glass and room-theme styles',()=>{
  const art=main.indexOf("import './palace-glass-coverage.css';");
  const last=main.indexOf("import './palace-community-focus.css';");
  const muted=main.indexOf("import './palace-muted-midnight-core.css';");
  expect(art).toBeGreaterThan(-1);
  expect(muted).toBeGreaterThan(last);
  expect(muted).toBeGreaterThan(art);
 });
 it('limits the new atmosphere to the dark outer shell',()=>{
  expect(core).toContain('.palace-shell.full-palace-shell.nightfall :is(.full-stage,.palace-stage)');
  expect(core).toContain('radial-gradient(ellipse 76% 92% at -11% 73%');
  expect(core).toContain('linear-gradient(115deg,');
  expect(core).toContain('background-attachment:scroll;');
  expect(core).not.toMatch(/\.daylight\s*\{/);
  expect(core).not.toMatch(/\.story-row|\.profile-banner|\.badge-card|\.chamber-frame|\.palace-chat-bubble/);
 });
 it('removes the old flowing cloud without disabling glossy panels',()=>{
  expect(core).toContain('::after {');
  expect(core).toContain('opacity:0!important;');
  expect(core).toContain('animation:none!important;');
  expect(core).toContain('filter:none!important;');
  expect(core).toContain('::before {');
  expect(core).toContain('opacity:.09!important;');
  expect(core).not.toContain('backdrop-filter');
  expect(core).not.toContain('transform:');
 });
 it('retains usable system colors in high-contrast mode',()=>{
  expect(core).toContain('@media(forced-colors:active)');
  expect(core).toContain('background:Canvas!important;');
 });
});
