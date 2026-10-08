/**
 * One selected manuscript request owns the editor at a time.
 * Cancelling a request stops its late results from touching the open page.
 * Revision history is helpful but never a prerequisite for opening a chapter.
 */
export function loadSelectedManuscript({chapterId,loadChapter,loadRevisions,onReady,onError,onSettled}){
 if(!chapterId)throw new TypeError('A selected chapter is required');
 let active=true;
 Promise.all([
  Promise.resolve().then(()=>loadChapter(chapterId)),
  Promise.resolve().then(()=>loadRevisions(chapterId)).catch(()=>[])
 ]).then(([result,revisions])=>{
  if(!active)return;
  const chapter=result?.chapter?.id===chapterId?result.chapter:null;
  onReady(chapter,Array.isArray(revisions)?revisions:[]);
 }).catch(error=>{
  if(active)onError(error);
 }).finally(()=>{
  if(active)onSettled();
 });
 return()=>{active=false};
}
