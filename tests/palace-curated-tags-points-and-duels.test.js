import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
const tags=readFileSync('database/palace-curated-tags-expansion.sql','utf8');
const points=readFileSync('database/palace-points-fairness-hardening.sql','utf8');
const live=readFileSync('src/liveRooms.jsx','utf8');
describe('curated taxonomy and point-award fairness',()=>{
 it('adds at least 500 curated descriptors from real semantic categories and not generated combinations',()=>{
  const matches=[...tags.matchAll(/\('([^']+)','((?:[^']|'')+)'\)/g)];
  expect(matches.length).toBeGreaterThanOrEqual(500);
  const keys=matches.map(m=>m[1]+':'+m[2].toLocaleLowerCase());
  expect(new Set(keys).size).toBe(matches.length);
  for(const category of ['fandom','genre','trope','theme','mood','setting','relationship','character',
    'era','accessibility','identity','language','format','warning','additional']){
   expect(matches.some(m=>m[1]===category)).toBe(true);
  }
  expect(tags).toContain('ON CONFLICT DO NOTHING');
  expect(tags).toContain("lower(t.name)=lower(catalogue.name)");
 });
 it('does not mint points for approving your own comment or a private-work response',()=>{
  expect(points).toContain('v_author = new.author_id');
  expect(points).toContain("w.publication_status='published'");
  expect(points).toContain("w.visibility='public'");
 });
 it('requires an actual changed manuscript body for published revision points',()=>{
  expect(points).toContain('new.body_html is distinct from old.body_html');
  expect(points).toContain('new.word_count>=old.word_count+150');
  expect(points).toContain('grant_celestial_points');
 });
 it('draws bases in the Duel editor but persists the actual prompt to the existing duel RPC',()=>{
  expect(live).toContain("pullDuelBasis('word')");
  expect(live).toContain("pullDuelBasis('topic')");
  expect(live).toContain('suggestedDuelBasis(contentType');
  expect(live).toContain("await createMicroDuel(duelForm.title,duelForm.prompt");
 });
});
