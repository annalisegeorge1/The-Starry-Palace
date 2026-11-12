import {expect,it,vi} from 'vitest';
import {searchPublishedArchive} from './palaceData';
import {supabase} from './supabase';

vi.mock('./supabase',()=>({configured:true,supabase:{rpc:vi.fn()}}));
const memberTag='00000000-0000-4000-8000-000000000001';

it('requires an archive-only tag even when a member tag is also selected',async()=>{
 const result=await searchPublishedArchive({include:[memberTag,'archive-category-Literary sequel'],limit:20});
 expect(result).toEqual({results:[],total:0,limit:20,offset:0});
 expect(supabase.rpc).not.toHaveBeenCalled();
});

it('keeps eligible member rows when only an archive-only tag is excluded',async()=>{
 supabase.rpc.mockResolvedValueOnce({data:{results:[{id:'member'}],total:1}});
 const result=await searchPublishedArchive({include:[memberTag],exclude:['archive-category-Literary sequel']});
 expect(result.total).toBe(1);
 expect(supabase.rpc).toHaveBeenCalledWith('search_published_works_v2',expect.objectContaining({p_include:[memberTag],p_exclude:[]}));
});
