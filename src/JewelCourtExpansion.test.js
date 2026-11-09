import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';

const sql=readFileSync('database/jewel-court-collectible-expansion.sql','utf8');
const atelier=readFileSync('src/MemberChamberDecor.jsx','utf8');
const originals=[...sql.matchAll(/^\s*\('([a-z0-9-]+)','(earned|treasury)',/gm)].map(x=>({slug:x[1],category:x[2]}));
const newcomers=[...sql.matchAll(/^\s*\('([a-z0-9-]+)','([^']+)','Jewel Court','(free|earned|treasury)',/gm)].map(x=>({slug:x[1],name:x[2],category:x[3]}));

describe('Jewel Court II collectible palette rollout',()=>{
 it('reclassifies nine previously free gems, keeping the other three included',()=>{
  expect(originals).toHaveLength(9);
  expect(new Set(originals.map(x=>x.slug)).size).toBe(9);
  expect(originals.filter(x=>x.category==='earned')).toHaveLength(6);
  expect(originals.filter(x=>x.category==='treasury')).toHaveLength(3);
  for(const slug of ['celestial-teal','electric-azure','rose-garnet']){
   expect(originals.map(x=>x.slug)).not.toContain(slug);
  }
 });
 it('adds twenty distinct new hues, at least 90% of them locked',()=>{
  expect(newcomers).toHaveLength(20);
  expect(new Set(newcomers.map(x=>x.slug)).size).toBe(20);
  expect(newcomers.filter(x=>x.category==='free')).toHaveLength(2);
  expect(newcomers.filter(x=>x.category==='earned')).toHaveLength(8);
  expect(newcomers.filter(x=>x.category==='treasury')).toHaveLength(10);
  expect(newcomers.filter(x=>x.category!=='free').length/newcomers.length).toBeGreaterThanOrEqual(.9);
  expect(new Set([...originals,...newcomers].map(x=>x.slug)).size).toBe(29);
 });
 it('protects worn and saved colours and does not rewrite other members or grant access',()=>{
  expect(sql).toContain('A Jewel Court colour is in use.');
  expect(sql).toContain('member_chamber_decor');
  expect(sql).toContain('chamber_prism_saved_looks');
  expect(sql).toContain('get diagnostics changed_rows=row_count');
  expect(sql).toContain('on conflict(slug) do nothing');
  expect(sql).not.toMatch(/drop table|delete from|grant execute|create or replace function|disable row level security/i);
 });
 it('explains the difference between included, earned and Treasury colours in the Atelier',()=>{
  expect(atelier).toContain('Jewel Court · {jewelCourt.length} powerful shades');
  expect(atelier).toContain('Earn to unlock');
  expect(atelier).toContain('Unlock earned shades');
  expect(atelier).toContain('purchasePrismPalette(choice.slug)');
  expect(atelier).toContain('applyAtelierColour(palette,finish,accent,decor.backdrop,ornament,layout)');
 });
});
