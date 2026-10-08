/**
 * Pick the last edited manuscript page, not the first chapter in a work.
 * Only pass works already returned for the signed-in member by getMyWorks().
 */
function dateValue(value){
 const n=Date.parse(value||'');
 return Number.isFinite(n)?n:0;
}
export function chooseWritingResumeTarget(works){
 if(!Array.isArray(works)||works.length===0)return null;
 const entries=works.filter(w=>w&&w.id&&w.slug).map(work=>{
  const chapters=Array.isArray(work.chapters)?work.chapters:[];
  const draftChapters=chapters.filter(c=>c&&c.id&&c.status!=='published');
  const readable=(draftChapters.length?draftChapters:chapters.filter(c=>c&&c.id));
  const chapter=[...readable].sort((a,b)=>
   dateValue(b.updated_at)-dateValue(a.updated_at) ||
   Number(b.position||0)-Number(a.position||0)
  )[0]||null;
  const lastEdit=Math.max(dateValue(work.updated_at),...chapters.map(c=>dateValue(c.updated_at)),0);
  return{work,chapter,lastEdit,hasDraft:draftChapters.length>0};
 });
 if(!entries.length)return null;
 entries.sort((a,b)=>b.lastEdit-a.lastEdit||Number(b.hasDraft)-Number(a.hasDraft));
 return entries[0];
}
export function resumeWritingPath(target){
 if(!target?.work?.slug)return '/writing';
 const path='/writing/'+encodeURIComponent(target.work.slug);
 return target.chapter?.id?path+'?chapter='+encodeURIComponent(target.chapter.id):path;
}
