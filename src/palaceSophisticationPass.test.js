import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
const css=readFileSync('src/palace-sophistication-pass.css','utf8');
const main=readFileSync('src/main.jsx','utf8');
const tags=readFileSync('src/liveRooms.jsx','utf8');
const gov=readFileSync('src/PalaceGovernance.jsx','utf8');
describe('Scoped Palace sophistication refinements',()=>{
 it('loads after previously shipped mobile stylesheet overrides',()=>{
  expect(main.indexOf("import './palace-sophistication-pass.css';")).toBeGreaterThan(main.indexOf("import './reading-facet-mobile-quickpass.css';"));
 });
 it('flattens tag rows without removing their include, exclude or archive controls',()=>{
  expect(css).toContain('.legacy-tags-page .tag-picker.restored>.tag-pick-row');
  expect(css).toContain('.legacy-tags-page .tag-pick-plus');
  expect(tags).toContain("onClick={()=>flip(tag.id,'include')}");
  expect(tags).toContain("onClick={()=>flip(tag.id,'exclude')}");
  expect(tags).toContain("tag-pick-archive");
 });
 it('keeps Council navigation functional and its ballot controls intact',()=>{
  expect(css).toContain('.palace-governance .governance-entry-grid>button');
  expect(css).toContain('.palace-governance .governance-ballot-controls');
  expect(gov).toContain("onClick={()=>goView('ballots')}");
  expect(gov).toContain("onClick={()=>goView('petitions')}");
  expect(css).not.toContain('display:none!important;\n .palace-shell.full-palace-shell .palace-governance .governance-choice');
 });
 it('styles Treasury catalogue toolbar without suppressing collectible artwork',()=>{
  expect(css).toContain('.treasury-gallery .treasury-catalogue-toolbar');
  expect(css).toContain('.treasury-gallery .treasury-family-tabs');
  expect(css).not.toContain('.palace-watercolour-badge{display:none');
  expect(css).toContain('min-height:44px');
 });
});
