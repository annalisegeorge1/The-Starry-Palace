import {describe,it,expect} from 'vitest';
import {COMMONS_MOMENTS,commonsMoment,matchesCommonsMoment,commonsVisiblePage} from './commonsDiscovery';

const threads=[
 {id:'a',reply_count:0,poll:null},
 {id:'b',reply_count:4,poll:null},
 {id:'c',reply_count:1,poll:{status:'open'}},
 {id:'d',reply_count:0,poll:{status:'closed'}},
 {id:'e',reply_count:0,poll:{status:'open'}}
];
describe('Commons discovers authentic conversations without ranking',()=>{
 it('keeps the four supported, understandable discovery lenses',()=>{
  expect(COMMONS_MOMENTS.map(x=>x.id)).toEqual(['all','first','talking','polls']);
  expect(commonsMoment('fake')).toBe('all');
  expect(commonsMoment('polls')).toBe('polls');
 });
 it('finds first replies without pretending there are responses',()=>{
  expect(threads.filter(t=>matchesCommonsMoment(t,'first')).map(x=>x.id)).toEqual(['a','d','e']);
 });
 it('finds conversations with replies and only polls that remain open',()=>{
  expect(threads.filter(t=>matchesCommonsMoment(t,'talking')).map(x=>x.id)).toEqual(['b','c']);
  expect(threads.filter(t=>matchesCommonsMoment(t,'polls')).map(x=>x.id)).toEqual(['c','e']);
  expect(threads.filter(t=>matchesCommonsMoment(t,'all'))).toEqual(threads);
 });
 it('preserves source order and reveals more in finite, predictable pages',()=>{
  expect(commonsVisiblePage(threads,1,2).map(x=>x.id)).toEqual(['a','b']);
  expect(commonsVisiblePage(threads,2,2).map(x=>x.id)).toEqual(['a','b','c','d']);
  expect(commonsVisiblePage(threads,4,2).map(x=>x.id)).toEqual(['a','b','c','d','e']);
  expect(commonsVisiblePage(null,1,12)).toEqual([]);
  expect(commonsVisiblePage(threads,-1,0).length).toBe(threads.length);
 });
});
