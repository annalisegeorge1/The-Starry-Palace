/**
 * Open the selected manuscript as soon as its chapter text arrives.
 * Optional revision history never delays the editor or becomes required.
 * Late requests are ignored when the writer switches chapters.
 */
export function loadSelectedManuscript({chapterId,loadChapter,loadRevisions,onReady,onRevisions,onError,onSettled}){
 if(!chapterId)throw new TypeError('A selected chapter is required');
 let active=true;
 Promise.resolve().then(()=>loadChapter(chapterId)).then(result=>{
  if(!active)return;
  const chapter=result?.chapter?.id===chapterId?result.chapter:null;
  onReady(chapter,[]);
  // Revisions are an enhancement, not a prerequisite for writing.
  if(chapter&&typeof loadRevisions==='function'){
   Promise.resolve().then(()=>loadRevisions(chapterId))
    .then(rows=>{if(active)onRevisions?.(Array.isArray(rows)?rows:[])})
    .catch(()=>{if(active)onRevisions?.([])});
  }
 }).catch(error=>{
  if(active)onError(error);
 }).finally(()=>{
  if(active)onSettled();
 });
 return()=>{active=false};
}
