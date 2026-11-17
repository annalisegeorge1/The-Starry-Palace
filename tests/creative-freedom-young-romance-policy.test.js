import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';

const content=readFileSync('docs/legal/content-policy.md','utf8');
const terms=readFileSync('docs/legal/terms-of-service.md','utf8');
const rules=readFileSync('docs/legal/site-rules.md','utf8');

describe('creative freedom and minors safety policy boundaries',()=>{
 it('allows nonexplicit young romance without changing the 13+ account minimum',()=>{
  expect(content).toContain('Non-explicit romantic stories involving teenage characters are welcome');
  expect(content).toContain('same-sex and other LGBTQ+ young relationships');
  expect(content).toContain('a **minor is any character or real person under 18**');
  expect(terms).toContain('The minimum age to create or use a Palace account is **13 years old**');
 });
 it('preserves hard protection against abuse and does not turn warnings into permissions',()=>{
  for(const policy of [content,terms,rules]){
   expect(policy).toMatch(/depictions of sexual violence against children/i);
   expect(policy).toMatch(/explicit or eroticised sexual content involving minors/i);
  }
  expect(content).toContain('including when both characters are minors');
  expect(content).toContain('no adult may be a romantic or sexual participant');
  expect(content).toContain('a fade-to-black');
  expect(terms).toContain('off-page implications of consensual intimacy');
  expect(rules).toContain('no adult may be a romantic or sexual participant');
  expect(content).toContain('An **Explicit** rating is not permission to post these materials');
  expect(content).toContain('a fictional framing nor a tag can override');
 });
 it('allows historical arranged-marriage narratives while preserving explicit-content boundaries',()=>{
  expect(content).toContain('Historical and culturally situated stories may depict practices');
  expect(content).toContain('a 16-year-old being married off');
  expect(content).toContain('an adult spouse may appear as a major character');
  expect(content).toContain('Context does not waive safety boundaries');
  expect(terms).toContain('Historical fiction may portray a 16-year-old being married off');
  expect(rules).toContain('depiction is not endorsement');
  expect(terms).toContain('Policy update — 17 November 2026 (creative freedom and child safety)');
  expect(content).toContain('**Last updated:** 17 November 2026');
  expect(rules).toContain('**Last updated:** 17 November 2026');
 });
 it('protects fictional difficult topics while separating references from depictions',()=>{
  expect(content).toContain('We distinguish fictional depiction from endorsement');
  expect(content).toContain('the **consequences** of childhood abuse');
  expect(content).toContain('does not describe or sexualise the abusive acts');
  expect(rules).toContain('Non-graphic discussion of the aftermath of childhood abuse may be allowed');
 });
});
