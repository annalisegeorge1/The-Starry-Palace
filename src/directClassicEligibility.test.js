import {beforeEach,expect,it,vi} from 'vitest';
import {openHostedClassic} from './directClassicApi';
import {getArchiveText} from './palaceData';
import {supabase} from './supabase';

vi.mock('./supabase',()=>({supabase:{from:vi.fn(),rpc:vi.fn()}}));
vi.mock('./palaceData',()=>({getArchiveText:vi.fn()}));
function fixture(patch={},rights={data:[]}){
 const record={id:'fixture',host_mode:'full',publication_status:'published',rights_status:'licensed',verified_at:'2026-01-01',minimum_reader_age:13,...patch};
 const metadata={select:vi.fn().mockReturnThis(),eq:vi.fn().mockReturnThis(),maybeSingle:async()=>({data:record})};
 const grants={select:vi.fn().mockReturnThis(),eq:vi.fn().mockReturnThis(),or:vi.fn().mockReturnThis(),limit:vi.fn().mockResolvedValue(rights)};
 supabase.from.mockImplementation(table=>table==='archive_records'?metadata:grants);
 return grants;
}
beforeEach(()=>{vi.resetAllMocks();getArchiveText.mockResolvedValue({body_text:'Synthetic eligible edition'})});
it.each([{host_mode:'citation'},{host_mode:'excerpt',rights_status:'unreviewed'},{verified_at:null},{minimum_reader_age:18}])('does not fetch a body for an ineligible edition %o',async patch=>{
 fixture(patch);
 expect(await openHostedClassic('sample',18)).toBeNull();
 expect(getArchiveText).not.toHaveBeenCalled();
 expect(supabase.rpc).not.toHaveBeenCalled();
});
it('filters current verified hosting rights before limiting the result',async()=>{
 const grants=fixture({},{data:[{id:'current'}]});
 expect((await openHostedClassic('sample')).text.body_text).toBe('Synthetic eligible edition');
 expect(grants.eq.mock.calls).toEqual([['record_id','fixture'],['status','verified'],['permits_hosting',true]]);
 expect(grants.or.mock.calls.map(([value])=>value)).toEqual([expect.stringMatching(/^valid_from.is.null,valid_from.lte.\d{4}/),expect.stringMatching(/^valid_until.is.null,valid_until.gte.\d{4}/)]);
 expect(grants.limit).toHaveBeenCalledWith(1);
});
it('leaves a temporary rights lookup failure retryable without fetching any text',async()=>{
 fixture({},{error:Error('temporary error')});
 await expect(openHostedClassic('sample')).rejects.toThrow('temporary error');
 expect(getArchiveText).not.toHaveBeenCalled();
});
