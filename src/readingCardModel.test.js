import {describe,it,expect} from 'vitest';
import {readingSummaryPreview,readingCardTagItems} from './readingCardModel';
const tags=Array.from({length:6},(_,i)=>({id:String(i),name:'Tag '+i}));
describe('Reading Room card disclosure',()=>{
 it('shortens long summaries on word boundaries without losing original text',()=>{
  const full='A slow and thoughtful story about letters, constellations, moonlight and the people beneath them.';
  const result=readingSummaryPreview(full,52);
  expect(result.truncated).toBe(true);
  expect(result.preview).toMatch(/…$/);
  expect(full.startsWith(result.preview.slice(0,-1))).toBe(true);
  expect(readingSummaryPreview('Short summary',150)).toEqual({preview:'Short summary',truncated:false});
  expect(readingSummaryPreview(null,150)).toEqual({preview:'',truncated:false});
 });
 it('shows three tags by default and reveals every remaining tag on request',()=>{
  const first=readingCardTagItems(tags,false);
  expect(first.visible.map(t=>t.id)).toEqual(['0','1','2']);
  expect(first.hidden).toBe(3);
  expect(first.total).toBe(6);
  expect(readingCardTagItems(tags,true).visible).toEqual(tags);
  expect(readingCardTagItems(tags,true).hidden).toBe(0);
  expect(readingCardTagItems([]).total).toBe(0);
 });
 it('does not mutate data used by other shelf cards',()=>{
  const input=tags.slice();
  readingCardTagItems(input,true);
  expect(input).toEqual(tags);
 });
});
