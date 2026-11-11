import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {contrastRatio} from './profileSkinModel';
import {prismAppearance} from './prismAppearance';

const css=readFileSync('src/palace-prism-letter-contrast.css','utf8');
const main=readFileSync('src/main.jsx','utf8');

describe('Chosen Prism colour contrast across Palace Letters',()=>{
 it('picks independently readable ink for the primary ground, secondary panel, and accent',()=>{
  const schemes=[
   {primary:'#20345B',secondary:'#87ACD5',accent:'#DBA6D7'},
   {primary:'#61365B',secondary:'#E7B9D3',accent:'#7A3C7B'},
   {primary:'#F1E7D7',secondary:'#2D4A54',accent:'#BD7A53'},
   {primary:'#191A22',secondary:'#21232E',accent:'#7D73C7'},
   {primary:'#7A9BD0',secondary:'#E7E4F9',accent:'#BCA4E9'}
  ];
  for(const palette of schemes){
   const appearance=prismAppearance({prism_colour_chosen:true,prism_palette_data:{slug:'example',...palette}});
   expect(appearance?.kind).toBe('palette');
   const values=appearance.style;
   for(const [colour,ink] of [
    ['--appearance-primary','--palette-ground-ink'],
    ['--appearance-secondary','--palette-panel-ink'],
    ['--appearance-accent','--palette-accent-ink']
   ])expect(contrastRatio(values[colour],values[ink])).toBeGreaterThanOrEqual(4.5);
  }
 });
 it('only adjusts Daybreak layout when the member selected a palette',()=>{
  expect(css).toContain('.daylight[data-viewer-appearance="palette"]');
  expect(css).toContain('var(--palette-ground-ink)!important');
  expect(css).toContain('var(--palette-panel-ink)!important');
  expect(css).toContain('var(--palette-accent-ink)!important');
  expect(css).not.toContain('data-viewer-appearance="none"');
  expect(css).not.toContain('data-member-appearance');
 });
 it('corrects the very dark Palace Letters heading and muted descriptive copy',()=>{
  expect(css).toContain('.chic-letters-head :is(h1,.eyebrow,.lede,p,small)');
  expect(css).toContain('.chic-letters-top-actions>span');
  expect(css).toContain('.chic-letters-head .letters-stats>span');
  expect(css).toContain('opacity:1!important');
 });
 it('separates light coloured list and correspondent header from neutral letter paper',()=>{
  for(const selector of [
   '.chic-letter-list>button','.letter-paper-head','.chic-letter-paper',
   '.letters-filter-buttons>button','.letters-search>input','.chic-letter-stream article.mine',
   '.letter-compose-input>textarea','.letter-compose-footer>small'
  ])expect(css).toContain(selector);
  expect(css).toContain('--letter-palette-paper:#fcfbff');
  expect(css).toContain('--letter-palette-ink:#29253b');
  expect(css).toContain('background:var(--appearance-secondary)!important');
  expect(css).toContain('color:var(--letter-palette-ink)!important');
 });
 it('keeps dark appearance modes in charge of shared Palace Letters colours',()=>{
  expect(css).toContain('.palace-shell.full-palace-shell.nightfall');
  expect(css).toContain('.palace-shell.full-palace-shell.midnight');
  expect(css).toContain('--letters-night-surface:#111015;');
  expect(css).toContain('--letters-night-ink:#f5f1f8;');
  expect(css).toContain('.palace-shell.full-palace-shell:is(.nightfall,.midnight)');
 });
 it('leaves message content, member artwork and saved preferences untouched',()=>{
  expect(css).not.toContain('.legacy-profile-cover');
  expect(css).not.toContain('.painted-chamber-frame');
  expect(css).not.toContain('.public-chamber-appearance');
  expect(main.indexOf("import './palace-prism-letter-contrast.css'")).toBeGreaterThan(main.indexOf("import './palace-dark-theme-priority.css'"));
  expect(main.indexOf("import './palace-prism-letter-contrast.css'")).toBeGreaterThan(main.indexOf("import './heritage-dark-vibrancy.css'"));
 });
});
