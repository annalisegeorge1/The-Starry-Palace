import {describe,it,expect,vi} from 'vitest';
import {loadSelectedManuscript} from './chapterLoadController';

function deferred(){
 let resolve,reject;
 const promise=new Promise((yes,no)=>{resolve=yes;reject=no});
 return{promise,resolve,reject};
}
async function flush(){for(let n=0;n<9;n++)await Promise.resolve()}
describe('selected chapter request isolation',()=>{
 it('ignores an earlier response after a writer chooses another chapter',async()=>{
  const old=deferred(),next=deferred();
  const onReady=vi.fn(),onError=vi.fn(),onSettled=vi.fn();
  const args={loadRevisions:async()=>[],onReady,onError,onSettled};
  const cancelOld=loadSelectedManuscript({...args,chapterId:'old',loadChapter:()=>old.promise});
  await flush();
  cancelOld();
  loadSelectedManuscript({...args,chapterId:'new',loadChapter:()=>next.promise});
  await flush();
  next.resolve({chapter:{id:'new',title:'Latest chosen page'}});await flush();
  old.resolve({chapter:{id:'old',title:'Stale page'}});await flush();
  expect(onReady).toHaveBeenCalledTimes(1);
  expect(onReady).toHaveBeenCalledWith({id:'new',title:'Latest chosen page'},[]);
  expect(onError).not.toHaveBeenCalled();
  expect(onSettled).toHaveBeenCalledTimes(1);
 });
 it('opens a chapter even if its optional revision history fails',async()=>{
  const ready=vi.fn(),error=vi.fn(),settled=vi.fn();
  loadSelectedManuscript({chapterId:'chapter',loadChapter:async()=>({chapter:{id:'chapter'}}),loadRevisions:async()=>{throw new Error('history offline')},onReady:ready,onError:error,onSettled:settled});
  await flush();
  expect(ready).toHaveBeenCalledWith({id:'chapter'},[]);
  expect(error).not.toHaveBeenCalled();expect(settled).toHaveBeenCalledOnce();
 });
 it('opens chapter text before optional revision history finishes',async()=>{
  const slowHistory=deferred();
  const onReady=vi.fn(),onRevisions=vi.fn(),onSettled=vi.fn();
  loadSelectedManuscript({
   chapterId:'chapter-9',
   loadChapter:async()=>({chapter:{id:'chapter-9',body_html:'<p>Begin writing.</p>'}}),
   loadRevisions:()=>slowHistory.promise,
   onReady,onRevisions,onError:vi.fn(),onSettled
  });
  await flush();
  expect(onReady).toHaveBeenCalledWith({id:'chapter-9',body_html:'<p>Begin writing.</p>'},[]);
  expect(onSettled).toHaveBeenCalledOnce();
  expect(onRevisions).not.toHaveBeenCalled();
  slowHistory.resolve([{id:'revision-1'}]);
  await flush();
  expect(onRevisions).toHaveBeenCalledWith([{id:'revision-1'}]);
 });
 it('ignores late revision-history responses after the writer switches chapters',async()=>{
  const slowHistory=deferred(),onRevisions=vi.fn();
  const cancel=loadSelectedManuscript({
   chapterId:'old',loadChapter:async()=>({chapter:{id:'old'}}),
   loadRevisions:()=>slowHistory.promise,
   onReady:vi.fn(),onRevisions,onError:vi.fn(),onSettled:vi.fn()
  });
  await flush();
  cancel();
  slowHistory.resolve([{id:'old-snapshot'}]);
  await flush();
  expect(onRevisions).not.toHaveBeenCalled();
 });
 it('rejects mismatched server data instead of showing another manuscript',async()=>{
  const ready=vi.fn();
  loadSelectedManuscript({chapterId:'one',loadChapter:async()=>({chapter:{id:'other'}}),loadRevisions:async()=>[],onReady:ready,onError:vi.fn(),onSettled:vi.fn()});
  await flush();
  expect(ready).toHaveBeenCalledWith(null,[]);
 });
 it('does not report a cancelled network failure to the next chapter',async()=>{
  const old=deferred(),onError=vi.fn();
  const cancel=loadSelectedManuscript({chapterId:'old',loadChapter:()=>old.promise,loadRevisions:async()=>[],onReady:vi.fn(),onError,onSettled:vi.fn()});
  await flush();cancel();old.reject(new Error('slow old request failed'));await flush();
  expect(onError).not.toHaveBeenCalled();
 });
});
