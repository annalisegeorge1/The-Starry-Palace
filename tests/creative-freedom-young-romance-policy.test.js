import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
const content=readFileSync('docs/legal/content-policy.md','utf8');
const terms=readFileSync('docs/legal/terms-of-service.md','utf8');
const rules=readFileSync('docs/legal/site-rules.md','utf8');

describe('contextual fiction policy, teen intimacy and historical settings',()=>{
 it('allows non-graphic on-page teen intimacy without a forced fade-to-black',()=>{
  expect(content).toContain('Non-graphic intimate moments may appear on the page');
  expect(content).toContain('Writers are not required to use a fade-to-black');
  expect(terms).toContain('does not automatically require fade-to-black');
  expect(rules).toContain('without a compulsory fade-to-black');
  expect(content).toContain('there is no automatic removal simply because one teenager is slightly older or turns eighteen');
 });
 it('respects historical marriages and does not require author moral disclaimers',()=>{
  expect(content).toContain('sixteen-year-old in a political marriage');
  expect(content).toContain("without a mandatory author's condemnation");
  expect(terms).toContain("without automatically being treated as endorsement");
  expect(rules).toContain('without automatically endorsing the practice');
 });
 it('maintains non-negotiable child safety and age boundaries',()=>{
  for(const s of [content,terms,rules]){
   expect(s).toMatch(/child sexual abuse material/i);
   expect(s).toMatch(/graphic.*eroticised sexual depictions.*minors/i);
   expect(s).toMatch(/graphic.*sexual violence against children|graphic child sexual violence/i);
  }
  expect(content).toContain('The minimum account age of 13');
  expect(content).toContain('rating, tag, marriage, fictional age of adulthood, or reader restriction cannot override');
 });
 it('keeps a clearly visible dated notice and consistent language',()=>{
  expect(terms).toContain('Policy clarification — 17 November 2026 (fictional intimacy and historical context)');
  expect(rules).toContain('See [Content Policy Section 3A]');
  expect(content).toContain('A less restrictive response');
 });
});
