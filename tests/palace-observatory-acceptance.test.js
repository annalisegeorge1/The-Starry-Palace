import {describe,it,expect} from 'vitest';
import {PALACE_OBSERVATORY_ACCEPTANCE,palaceObservatoryAcceptanceGroups} from '../src/palaceObservatoryAcceptance.js';

describe('Observatory manual review cases',()=>{
 it('contains distinct repeatable checks with known Palace routes',()=>{
  const ids=PALACE_OBSERVATORY_ACCEPTANCE.map(x=>x.id);
  expect(new Set(ids).size).toBe(ids.length);
  expect(ids.length).toBeGreaterThanOrEqual(12);
  for(const item of PALACE_OBSERVATORY_ACCEPTANCE){
   expect(item.route.startsWith('/')).toBe(true);
   expect(item.route.startsWith('//')).toBe(false);
   expect(item.expected.length).toBeGreaterThan(35);
   expect(item.persona.length).toBeGreaterThan(3);
   expect(palaceObservatoryAcceptanceGroups).toContain(item.group);
   expect(item.status).toBeUndefined();
  }
 });
 it('includes public Mature/Explicit metadata alongside independent chapter age gates',()=>{
  expect(PALACE_OBSERVATORY_ACCEPTANCE.some(x=>x.id==='restricted-metadata')).toBe(true);
  expect(PALACE_OBSERVATORY_ACCEPTANCE.some(x=>x.id==='restricted-reader')).toBe(true);
 });
 it('keeps partial fandom pages in manual review instead of treating them as a true empty result',()=>{
  const fandom=PALACE_OBSERVATORY_ACCEPTANCE.find(item=>item.id==='fandom-shelf');
  expect(fandom?.expected).toContain('further result pages');
  expect(fandom?.expected).toContain('premature no-works claim');
 });
 it('keeps private drafts, rights, anonymous access and responsive navigation in scope',()=>{
  for(const id of ['private-work','permissions','owner-only','small-android','tablet','tags-exclusion'])
   expect(PALACE_OBSERVATORY_ACCEPTANCE.some(x=>x.id===id)).toBe(true);
 });
});
