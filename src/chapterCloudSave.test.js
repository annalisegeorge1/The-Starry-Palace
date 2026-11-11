import {expect,it} from 'vitest';
import {createManuscriptSaveCoordinator} from './manuscriptSaveCoordinator';
import {writeChapterVersion} from './chapterCloudSave';

function chapterStore(){
 let row={id:'a',updated_at:'v1',body_html:'original'};
 const client={from:()=>({update:changes=>{
  const filters={};
  const query={
   eq(key,value){filters[key]=value;return query},
   select(){return query},
   async maybeSingle(){
    if(Object.entries(filters).some(([key,value])=>row[key]!==value))return {data:null};
    row={...row,...changes};
    return {data:{...row}};
   }
  };
  return query;
 }})};
 return {client,read:()=>({...row})};
}

it('keeps a second editor dirty when its last-read cloud version is stale',async()=>{
 const store=chapterStore();
 const editor=()=>createManuscriptSaveCoordinator((id,patch,version)=>writeChapterVersion(store.client,id,patch,version));
 const one=editor(),two=editor();
 const v1={chapterId:'a',updatedAt:'v1'},v2={...v1};
 const save=(queue,version,text,stamp)=>queue.persist('a',{body_html:text,updated_at:stamp},queue.markChanged('a'),version);
 const early=save(one,v1,'first','v2'),latest=save(one,v1,'second','v3');
 expect((await early).isCurrent).toBe(false);
 expect((await latest).isCurrent).toBe(true);
 await expect(save(two,v2,'stale','v4')).rejects.toThrow('Export your draft');
 expect(store.read().body_html).toBe('second');
 expect(two.isDirty('a')).toBe(true);
 expect(v2.updatedAt).toBe('v1');
});
