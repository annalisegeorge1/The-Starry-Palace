import {describe,it,expect,vi} from 'vitest';
import {splitTagQueries,matchesTagQueries,exactTagQueryMatches,searchSeveralTags,isMultiTagPhrase,resolveMultiTagPhrase} from './multiTagSearch';

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

it('recognizes multi-tag searches but preserves ordinary single-tag text searches',()=>{
 expect(isMultiTagPhrase('Michonne, Richonne')).toBe(true);
 expect(isMultiTagPhrase('Richonne; children')).toBe(true);
 expect(isMultiTagPhrase('Richonne')).toBe(false);
 expect(isMultiTagPhrase('Richonne,')).toBe(false);
});
it('translates complete multi-tag lists into exact tag IDs without partial assumptions',()=>{
 const tags=[
  {id:'a',name:'Richonne',status:'community'},
  {id:'b',name:'Michonne',status:'community'},
  {id:'c',name:'Children',status:'community'},
  {id:'x',name:'Private unverified',status:'pending'}
 ];
 expect(resolveMultiTagPhrase('Michonne, Richonne',tags).matches.map(x=>x.id)).toEqual(['b','a']);
 expect(resolveMultiTagPhrase('Richonne, Children',tags).complete).toBe(true);
 expect(resolveMultiTagPhrase('Richonne, unlisted',tags).complete).toBe(false);
 expect(resolveMultiTagPhrase('Richonne, Private unverified',tags).unresolved).toEqual(['private unverified']);
});
