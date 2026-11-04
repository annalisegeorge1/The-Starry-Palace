import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';

const css=readFileSync('src/daybreak-dashboard-profile-contrast.css','utf8');
const main=readFileSync('src/main.jsx','utf8');
const source=readFileSync('src/liveRooms.jsx','utf8');

describe('Daybreak dashboard and chamber accessibility',()=>{
 it('loads the correction after the earlier tablet and reader styles',()=>{
  const imported="import './daybreak-dashboard-profile-contrast.css';";
  expect(main).toContain(imported);
  expect(main.indexOf(imported)).toBeGreaterThan(main.indexOf("import './tablet-daybreak-reading-polish.css';"));
 });
 it('keeps the six My Palace destinations while making shortcut labels dark',()=>{
  for(const name of ['Writing','Library','Comic Studio','Calendar','Treasury','History']){
   expect(source).toContain('<small>'+name+'</small>');
  }
  expect(css).toContain('.palace-home-shortcuts-calm > a > small');
  expect(css).toContain('color:#25324b !important');
  expect(css).toContain('min-height:54px !important');
 });
 it('fixes the pale chamber interests without touching honours or stats',()=>{
  expect(source).toContain('className="legacy-profile-tags"');
  expect(css).toContain('.chic-member-profile .legacy-profile-tags > span');
  expect(css).toContain('color:#3d305a !important');
  expect(css).not.toContain('.chamber-atelier-crown-ribbon');
  expect(css).not.toContain('.palace-home-pulse > span');
 });
 it('retains the actual refresh action and aligns its icon at the heading top right',()=>{
  expect(source).toContain('className="quiet-button" onClick={load}>Refresh</button>');
  expect(css).toContain('.palace-now-stream > .section-heading > button.quiet-button');
  expect(css).toContain('position:absolute !important');
  expect(css).toContain('content:"↻"');
 });
 it('limits denser action layout and refresh repositioning to tablet and desktop',()=>{
  expect(css).toContain('@media (min-width:761px)');
  expect(css).toContain('grid-template-columns:repeat(4,minmax(0,1fr)) !important');
  expect(css).toContain('@media (forced-colors:active)');
 });
});
