const validDate=value=>{const t=Date.parse(value||'');return Number.isFinite(t)?t:0};
export function storyHistoryDetails(work,chapters=[]){
 const published=chapters.filter(c=>c.status==='published');
 const wordCount=published.reduce((sum,c)=>sum+Math.max(0,Number(c.word_count)||0),0);
 const events=published.flatMap(c=>{
  const first=validDate(c.published_at),changed=validDate(c.updated_at);
  const rows=[];
  if(first)rows.push({at:first,kind:'chapter',chapter:c.title||'Chapter'});
  // Small timestamp differences can be automatic; require >1 minute.
  if(first&&changed>first+60000)rows.push({at:changed,kind:'updated',chapter:c.title||'Chapter'});
  return rows;
 });
 events.sort((a,b)=>b.at-a.at);
 const event=events[0]||null;
 const last=event?.at||validDate(work?.last_published_at)||0;
 return {chapterCount:published.length,wordCount,lastChangedAt:last?new Date(last).toISOString():null,
  changeKind:event?.kind||'unknown',chapterTitle:event?.chapter||null};
}
export const storyHistoryLabel=details=>details.changeKind==='updated'?'Chapter updated':details.changeKind==='chapter'?'New chapter published':'Latest change not recorded';
