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
  expect(content).toContain('An **Explicit** rating is not permission to post these materials');
  expect(content).toContain('a fictional framing nor a tag can override');
 });
 it('protects fictional difficult topics while separating references from depictions',()=>{
  expect(content).toContain('We distinguish fictional depiction from endorsement');
  expect(content).toContain('the **consequences** of childhood abuse');
  expect(content).toContain('does not describe or sexualise the abusive acts');
  expect(rules).toContain('Non-graphic discussion of the aftermath of childhood abuse may be allowed');
 });
});
