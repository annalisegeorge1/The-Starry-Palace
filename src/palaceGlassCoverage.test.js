import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';

const read=path=>readFileSync(resolve(process.cwd(),path),'utf8');
const visual=read('src/palace-glass-coverage.css');
const main=read('src/main.jsx');

describe('Palace-wide prismatic glass coverage',()=>{
 it('loads the stronger glass treatment after all room and prior restoration styles',()=>{
  const latest=main.indexOf("import './palace-glass-coverage.css';");
  expect(latest).toBeGreaterThan(main.indexOf("import './palace-glass-restoration.css';"));
  expect(latest).toBeGreaterThan(main.indexOf("import './palace-creative-rooms-finish.css';"));
 });
 it('restores glossy room introductions and both reading/writing card finishes',()=>{
  for(const selector of ['.legacy-reading-page .legacy-reading-intro','.chic-writing-head','.chic-commons .chic-life-intro','.chic-draft-list .writer-work-card','.chic-story-catalogue .story-row','.reading-facet-sidebar','.palace-hub-hero','.palace-passage','.chic-library-page .library-card']){
   expect(visual).toContain(selector);
  }
  expect(visual).toContain('radial-gradient(');
  expect(visual).toContain('linear-gradient(');
  expect(visual).toContain('inset 0 1px');
  expect(visual).toContain('box-shadow:var(--lustre-shadow)!important');
 });
 it('uses vivid night and daylight palettes with portable chat theme scope',()=>{
  expect(visual).toContain('.palace-shell.full-palace-shell.nightfall');
  expect(visual).toContain('.palace-shell.full-palace-shell.daylight');
  expect(visual).toContain('html[data-palace-theme="nightfall"] .palace-chat-v2');
  expect(visual).toContain('html[data-palace-theme="daylight"] .palace-chat-v2');
 });
 it('protects custom artwork, rainbow cards, reader/writer paper and layout',()=>{
  expect(visual).toContain('.story-row:not(.prism-story)');
  expect(visual).toContain('.legacy-constellation-list article:not(.prism-story)');
  for(const selector of ['.heritage-card','.painted-palace-banner','.member-avatar','.painted-chamber-frame','.badge-art','.reader-page','.manuscript-page']){
   expect(visual).not.toContain(selector+' {');
  }
  expect(visual).not.toMatch(/\banimation\s*:/);
  expect(visual).not.toMatch(/[;{]\s*(?:width|height|padding|margin|transform)\s*:/);
  expect(visual).toContain('The member\'s Chamber tabs may use a personalised colour scheme.');
 });
});
