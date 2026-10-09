/**
 * History is loaded in bounded pages. Merge rather than replacing old messages
 * whenever the realtime or polling refresh fetches the latest ones.
 * Supabase RLS still determines which rows the member may read.
 */
export const GROUP_HISTORY_PAGE_SIZE=60;
export function mergePalaceGroupMessages(existing=[],incoming=[]){
 const byId=new Map();
 for(const row of [...existing,...incoming]){
  if(row?.id)byId.set(String(row.id),row);
 }
 return [...byId.values()].sort((a,b)=>{
  const at=String(a.created_at||'');
  const bt=String(b.created_at||'');
  return at<bt?-1:at>bt?1:String(a.id).localeCompare(String(b.id));
 });
}
export function oldestPalaceGroupMessage(items=[]){
 return (items||[]).reduce((oldest,row)=>{
  if(!row?.created_at)return oldest;
  return !oldest||row.created_at<oldest?row.created_at:oldest;
 },null);
}
export function palaceChatUnreadGroup(group){
 return Boolean(group?.lastMessageAt&&(!group.lastReadAt||Date.parse(group.lastMessageAt)>Date.parse(group.lastReadAt)));
}
export function palaceChatMatchesGroup(group,query=''){
 const text=String(query||'').trim().toLocaleLowerCase();
 if(!text)return true;
 const details=[group?.title,group?.description,...(group?.members||[]).flatMap(member=>[member?.display_name,member?.username])].filter(Boolean).join(' ').toLocaleLowerCase();
 return details.includes(text);
}
