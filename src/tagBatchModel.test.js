import {describe,it,expect} from 'vitest';
import {toggleQueuedTag,pendingTagBatch,visibleTagSuggestions,TAG_BATCH_PAGE_SIZE} from './tagBatchModel';

const a={id:'a',name:'Slow Burn'},b={id:'b',name:'Found Family'},c={id:'c',name:'Fantasy'};
describe('non-destructive work tag queue',()=>{
 it('toggles choices without mutating input or duplicating choices',()=>{
  const first=[a];
  expect(toggleQueuedTag(first,b)).toEqual([a,b]);
  expect(first).toEqual([a]);
  expect(toggleQueuedTag([a,b],a)).toEqual([b]);
  expect(toggleQueuedTag([a],null)).toEqual([a]);
 });
 it('never reapplies an already attached tag or duplicate queued ID',()=>{
  expect(pendingTagBatch([a,b,a,c],[{tags:{id:'a'}}])).toEqual([b,c]);
  expect(pendingTagBatch([a,b],[{id:'b'}])).toEqual([a]);
  expect(pendingTagBatch([],[])).toEqual([]);
 });
 it('grows the visible result window without losing later matches',()=>{
  const rows=Array.from({length:55},(_,i)=>({id:String(i)}));
  expect(visibleTagSuggestions(rows).length).toBe(TAG_BATCH_PAGE_SIZE);
  expect(visibleTagSuggestions(rows,36).at(-1).id).toBe('35');
  expect(visibleTagSuggestions(rows,72).length).toBe(55);
 });
});
