import {describe,it,expect,vi} from 'vitest';
import {eligibleFandomIds,paginatePublicFandomStories,FANDOM_STORY_PAGE_SIZE}
 from '../src/fandomPublishedPages';

const a='11111111-1111-4111-8111-111111111111';
const b='22222222-2222-4222-8222-222222222222';
const c='33333333-3333-4333-8333-333333333333';
const work=(id,updated)=>({id,title:'Public work '+id,last_published_at:updated,work_type:'fanwork',rating:'explicit'});
const base={
 verifyFandoms:async ids=>ids,
 listPublicIds:async ids=>ids
};

describe('Fandom Atlas paginated public works',()=>{
 it('rejects invalid, duplicate and excessive tag IDs before querying',async()=>{
  expect(eligibleFandomIds([a,a,'not a tag',b])).toEqual([a,b]);
  expect(eligibleFandomIds([a,b,c,a,b,c,a])).toHaveLength(3);
  const searchPublished=vi.fn();
  const result=await paginatePublicFandomStories({...base,tagIds:['invalid'],searchPublished});
  expect(result).toMatchObject({results:[],hasMore:false});
  expect(searchPublished).not.toHaveBeenCalled();
 });
 it('uses an AND query for crossovers and confirms public visibility',async()=>{
  const searchPublished=vi.fn(async filters=>({
   total:2,results:[work('public','2026-11-03'),work('members-only','2026-11-02')]
  }));
  const result=await paginatePublicFandomStories({
   ...base,tagIds:[a,b],mode:'all',limit:24,searchPublished,
   listPublicIds:vi.fn(async()=>['public'])
  });
  expect(searchPublished).toHaveBeenCalledTimes(1);
  expect(searchPublished.mock.calls[0][0]).toMatchObject({
   include:[a,b],origin:'all',offset:0,limit:24
  });
  expect(result.results.map(w=>w.id)).toEqual(['public']);
  expect(result.hasMore).toBe(false);
 });
 it('unions any-matching tag pages, dedupes overlap, orders by update date, and continues pagination',async()=>{
  const searchPublished=vi.fn(async filters=>filters.include[0]===a?{
   total:40,results:[work('public-1','2026-11-01'),work('both','2026-11-02')]
  }:{
   total:30,results:[work('both','2026-11-02'),work('public-3','2026-11-03')]
  });
  const seenPublic=vi.fn(async ids=>ids);
  const result=await paginatePublicFandomStories({...base,tagIds:[a,b],mode:'any',
   limit:2,searchPublished,listPublicIds:seenPublic});
  expect(searchPublished).toHaveBeenCalledTimes(2);
  expect(searchPublished.mock.calls.map(([params])=>params.include)).toEqual([[a],[b]]);
  expect(result.results.map(w=>w.id)).toEqual(['public-3','both','public-1']);
  expect(result.hasMore).toBe(true);
  expect(seenPublic).toHaveBeenCalledWith(['public-1','both','public-3']);
  expect(FANDOM_STORY_PAGE_SIZE).toBe(24);
 });
 it('does not claim a missing work if paging data is incomplete',async()=>{
  await expect(paginatePublicFandomStories({...base,tagIds:[a],
   searchPublished:async()=>({total:30,results:[]})}))
   .rejects.toThrow(/incomplete/i);
  await expect(paginatePublicFandomStories({...base,tagIds:[a],
   searchPublished:async()=>({results:[]})}))
   .rejects.toThrow(/incomplete/i);
  // A nonempty but truncated intermediate page must be rejected too.
  await expect(paginatePublicFandomStories({...base,tagIds:[a],limit:3,
   searchPublished:async()=>({total:10,results:[work('only-one','2026-11-03')]})}))
   .rejects.toThrow(/incomplete/i);
 });
 it('stops safely when required crossover tags are not approved',async()=>{
  const searchPublished=vi.fn();
  const result=await paginatePublicFandomStories({...base,tagIds:[a,b],
   mode:'all',verifyFandoms:async()=>[a],searchPublished});
  expect(result.hasMore).toBe(false);
  expect(searchPublished).not.toHaveBeenCalled();
 });
 it('keeps page offsets and public checks independent of member authentication',async()=>{
  const searchPublished=vi.fn(async()=>({total:49,results:[work('hidden','2026-11-03')]}));
  const listPublicIds=vi.fn(async()=>[]);
  const result=await paginatePublicFandomStories({...base,tagIds:[a],
   offset:24,limit:1,searchPublished,listPublicIds});
  expect(searchPublished.mock.calls[0][0].offset).toBe(24);
  expect(result.results).toEqual([]);
  expect(result.hasMore).toBe(true);
  expect(listPublicIds).toHaveBeenCalledWith(['hidden']);
 });
});
