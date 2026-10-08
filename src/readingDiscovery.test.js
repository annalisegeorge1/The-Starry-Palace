import {describe,expect,it} from 'vitest';
import {chooseReadingSurprise,readingFilterChips} from './readingDiscovery';

describe('reader discovery',()=>{
 it('only surprises from the visible matching set',()=>{
  const visible=[{id:'fandom'}, {id:'gothic'}];
  expect(chooseReadingSurprise(visible,0)?.id).toBe('fandom');
  expect(chooseReadingSurprise(visible,0.99)?.id).toBe('gothic');
  expect(chooseReadingSurprise([],0.7)).toBeNull();
  expect(chooseReadingSurprise(null,0.2)).toBeNull();
 });
 it('does not break on invalid random values',()=>{
  const visible=[{id:'sole'}];
  for(const value of [-1,4,NaN,Infinity,undefined]){
   expect(chooseReadingSurprise(visible,value)?.id).toBe('sole');
  }
 });
 it('shows each active choice and keeps the personal lens private to the reader',()=>{
  const chips=readingFilterChips({
   origin:'fandom',vibeDoor:'yearn',query:'  blue moon  ',
   rating:'teen',status:'in_progress',readerLens:'saved'
  },{yearn:'Make me yearn'});
  expect(chips.map(x=>x.key)).toEqual(['origin','vibeDoor','query','rating','status','readerLens']);
  expect(chips.map(x=>x.label)).toEqual([
   'Room: Fandom','Feeling: Make me yearn','Search: blue moon',
   'Rating: teen','Status: in progress','My shelf: Saved'
  ]);
  expect(readingFilterChips()).toEqual([]);
  expect(readingFilterChips({origin:'all',query:'   ',rating:'all'})).toEqual([]);
 });
});
