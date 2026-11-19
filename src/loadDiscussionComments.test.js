import {expect,it,vi} from 'vitest';
import {loadDiscussionComments} from './loadDiscussionComments';

it('loads the next page after the last timestamp and ID, including same-time replies',async()=>{
 const timestamp='2026-11-01T00:00:00.123456+00:00';
 const records=Array.from({length:251},(_,i)=>({id:String(i),created_at:timestamp}));
 const filters=[];
 const client={from:vi.fn(()=>{
  let page=0;
  return {
   select(){return this},eq(){return this},order(){return this},limit(){return this},
   or(filter){filters.push(filter);page=1;return this},
   then(resolve){resolve({data:page?records.slice(250):records.slice(0,250)})}
  };
 })};
 expect(await loadDiscussionComments(client,'work')).toEqual(records);
 expect(filters).toEqual(['created_at.gt."'+timestamp+'",and(created_at.eq."'+timestamp+'",id.gt.249)']);
});
