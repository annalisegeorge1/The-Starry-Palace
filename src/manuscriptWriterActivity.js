/** A truthful, modest summary based on available latest chapter saves.
 * Updated_at is NOT an event log and cannot prove a daily writing streak.
 */
export function manuscriptRecentActivity(chapters,limit=4) {
 return (Array.isArray(chapters)?chapters:[])
  .filter(ch=>ch?.id&&ch.updated_at&&Number.isFinite(new Date(ch.updated_at).getTime()))
  .sort((a,b)=>new Date(b.updated_at).getTime()-new Date(a.updated_at).getTime())
  .slice(0,Math.max(0,limit))
  .map(ch=>({id:ch.id,title:String(ch.title||'Untitled chapter'),at:ch.updated_at,status:ch.status||'draft'}));
}
export function manuscriptDraftReadiness(chapters){
 const list=Array.isArray(chapters)?chapters:[];
 const drafts=list.filter(ch=>ch.status!=='published');
 return {drafts:drafts.length,withWords:drafts.filter(ch=>Number(ch.word_count||0)>0).length};
}
