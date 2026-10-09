/**
 * Keep public Forum discussions addressable after refreshing or sharing a link.
 * IDs are opaque; never put body text, personal drafts, or private messages
 * in a URL. Unknown IDs still open the ordinary Forum room.
 */
export function safeForumThreadId(value){
 const text=String(value||'').trim();
 return /^[a-zA-Z0-9-]{1,110}$/.test(text)?text:null;
}
export function palaceForumThreadUrl(id){
 const safe=safeForumThreadId(id);
 return '/palace-life?room=forum'+(safe?'&thread='+encodeURIComponent(safe):'');
}
export function palaceForumThreadFromSearch(search=''){
 try{
  const params=new URLSearchParams(search);
  return params.get('room')==='forum'?safeForumThreadId(params.get('thread')):null;
 }catch{return null}
}
export function pageForForumThread(threads=[],id,pageSize=12){
 const index=(Array.isArray(threads)?threads:[]).findIndex(thread=>String(thread?.id)===String(id));
 const perPage=Math.max(1,Math.floor(Number(pageSize)||12));
 return index<0?1:Math.floor(index/perPage)+1;
}
