/* Pure inbox presentation helpers. All source data remains RLS-protected. */
const fold=v=>String(v??'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase().replace(/\s+/g,' ').trim();
const stamp=v=>{const n=Date.parse(v||'');return Number.isFinite(n)?n:0};
export function filterPalaceDirectInbox(rows=[],query='',mode='all',previews=new Map()){
 const needle=fold(query);
 return (Array.isArray(rows)?rows:[]).filter(row=>{
  if(!row||row.preference?.archived||row.conversations?.kind!=='direct')return false;
  if(mode==='unread'&&!row.unread)return false;
  if(mode==='starred'&&!row.preference?.starred)return false;
  const details=[row.correspondent?.username,row.correspondent?.display_name,previews.get(row.conversation_id)?.text].map(fold).join(' ');
  return !needle||details.includes(needle);
 }).sort((a,b)=>{
  const aStar=Number(Boolean(a.preference?.starred)),bStar=Number(Boolean(b.preference?.starred));
  if(aStar!==bStar)return bStar-aStar;
  const aTime=stamp(a.last_message_at||a.conversations?.updated_at);
  const bTime=stamp(b.last_message_at||b.conversations?.updated_at);
  return bTime-aTime;
 });
}
export function findPalaceChatMessages(messages=[],query=''){
 const needle=fold(query);
 return needle?(Array.isArray(messages)?messages:[]).filter(m=>fold(m?.body).includes(needle)):[];
}
