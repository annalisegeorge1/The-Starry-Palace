import {describe,it,expect} from 'vitest';
import {cleanReadingPrecision,hasReadingPrecision,readingPrecisionCount,matchesReadingPrecision} from './readingPrecisionModel';
const fandom=id=>({tags:{id,name:'Fandom '+id,category:'fandom',status:'canonical'}});
const work=(words,date='2026-11-12',fandoms=['one'])=>({
 reading_stats:words==null?null:{words},
 first_published_at:'2026-01-01T12:00:00Z',last_published_at:date+'T12:00:00Z',
 work_tags:fandoms.map(fandom)
});
describe('loaded-shelf Boolean precision',()=>{
 it('requires included word ranges while excluding matching word intervals without treating unknown as zero',()=>{
  const items=[work(1200),work(5000),work(9000),work(null)];
  const f={includeMinWords:'1000',includeMaxWords:'10000',excludeMinWords:'4000',excludeMaxWords:'6000'};
  expect(items.filter(w=>matchesReadingPrecision(w,f)).map(w=>w.reading_stats?.words)).toEqual([1200,9000]);
  expect(matchesReadingPrecision(work(null),{includeMaxWords:'10000'})).toBe(false);
  expect(matchesReadingPrecision(work(null),{excludeMaxWords:'10000'})).toBe(true);
  expect(matchesReadingPrecision(work(0),{includeMaxWords:'0'})).toBe(true);
  expect(matchesReadingPrecision(work(1),{includeMaxWords:'0'})).toBe(false);
  expect(matchesReadingPrecision(work(5000),{excludeMinWords:'5000'})).toBe(false);
 });
 it('supports inclusive and excluded date intervals using published or updated timestamps',()=>{
  expect(matchesReadingPrecision(work(1000,'2026-11-12'),{includeFrom:'2026-11-12',includeTo:'2026-11-12'})).toBe(true);
  expect(matchesReadingPrecision(work(1000,'2026-11-12'),{excludeFrom:'2026-11-12',excludeTo:'2026-11-12'})).toBe(false);
  expect(matchesReadingPrecision(work(1000,'2026-11-12'),{dateField:'published',includeFrom:'2026-01-01',includeTo:'2026-01-01'})).toBe(true);
  expect(matchesReadingPrecision(work(1000,'2026-11-12'),{dateField:'published',includeFrom:'2026-11-01'})).toBe(false);
  expect(matchesReadingPrecision({...work(10),last_published_at:null},{includeFrom:'2026-01-01'})).toBe(false);
 });
 it('detects crossover only from accepted, distinct fandom metadata and not relationships or prose',()=>{
  const multi=work(900,'2026-11-12',['one','two']);
  const one=work(900);
  expect(matchesReadingPrecision(multi,{crossover:'include'})).toBe(true);
  expect(matchesReadingPrecision(one,{crossover:'include'})).toBe(false);
  expect(matchesReadingPrecision(multi,{crossover:'exclude'})).toBe(false);
  expect(matchesReadingPrecision(one,{crossover:'exclude'})).toBe(true);
  const guessed={...one,title:'Crossover with Doctor Who',work_tags:[{tags:{id:'pair',name:'A/B',category:'relationship',status:'canonical'}}]};
  expect(matchesReadingPrecision(guessed,{crossover:'include'})).toBe(false);
  expect(matchesReadingPrecision({...multi,work_tags:[fandom('one'),fandom('one')]},{crossover:'include'})).toBe(false);
  expect(matchesReadingPrecision({...multi,work_tags:[fandom('one'),{tags:{...fandom('two').tags,status:'pending'}}]},{crossover:'include'})).toBe(false);
 });
 it('sanitizes corrupted preference values and counts only meaningful active refinements',()=>{
  const p=cleanReadingPrecision({includeMinWords:'-50',excludeMaxWords:'abc',includeFrom:'2026-02-30',dateField:'hack',crossover:'random'});
  expect(p).toMatchObject({includeMinWords:'',excludeMaxWords:'',includeFrom:'',dateField:'updated',crossover:'all'});
  expect(hasReadingPrecision(p)).toBe(false);
  expect(readingPrecisionCount({includeMinWords:'1000',includeMaxWords:'2000',crossover:'exclude',excludeFrom:'2026-01-01'})).toBe(3);
 });
});
