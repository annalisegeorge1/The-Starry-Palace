import {describe,it,expect,vi} from 'vitest';
import {splitTagQueries,matchesTagQueries,exactTagQueryMatches,searchSeveralTags} from './multiTagSearch';

describe('multiple tag search queries',()=>{
 it('splits commas, semicolons and new lines while keeping pairing names and deduplicating',()=>{
  expect(splitTagQueries(' Richonne, Slow Burn; Rick/Michonne\nrichonne ')).toEqual(['richonne','slow burn','rick/michonne']);
 });
 it('matches any typed name for suggestions, not a single combined phrase',()=>{
  expect(matchesTagQueries('Slow Burn','Richonne, slow')).toBe(true);
  expect(matchesTagQueries('Angst','Richonne, Slow Burn')).toBe(false);
 });
 it('adds only uniquely identified exact tags, never fuzzy or ambiguous names',()=>{
  const tags=[{id:'a',name:'Richonne'},{id:'b',name:'Slow Burn'},{id:'c',name:'Slow Romance'}];
  expect(exactTagQueryMatches(tags,'Richonne, Slow Burn').matches.map(x=>x.id)).toEqual(['a','b']);
  expect(exactTagQueryMatches(tags,'slow, Missing').unresolved).toEqual(['slow','missing']);
  expect(exactTagQueryMatches([...tags,{id:'d',name:'Richonne'}],'Richonne').matches).toEqual([]);
 });
 it('queries all entered names separately, merges and deduplicates real tag results',async()=>{
  const lookup=vi.fn(async term=>term==='richonne'?[{id:'r',name:'Richonne'},{id:'same',name:'Shared'}]:[{id:'s',name:'Slow Burn'},{id:'same',name:'Shared'}]);
  const rows=await searchSeveralTags(lookup,'Richonne, Slow Burn');
  expect(lookup).toHaveBeenCalledTimes(2);
  expect(lookup).toHaveBeenCalledWith('richonne','all',35);
  expect(lookup).toHaveBeenCalledWith('slow burn','all',35);
  expect(rows.map(tag=>tag.id)).toEqual(['r','s','same']);
 });
 it('limits the number of searched tags to avoid unbounded requests',()=>{
  expect(splitTagQueries(Array.from({length:12},(_,i)=>'tag '+i).join(', '))).toHaveLength(8);
 });
});
