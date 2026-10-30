/**
 * Build inbox summaries in a single pass over the latest direct messages.
 * The actual messages and their visibility still come from the existing
 * RLS-protected data APIs; this only avoids repeated per-row scans and sorts.
 */
const timestamp=value=>{
 const parsed=Date.parse(value||'');
 return Number.isFinite(parsed)?parsed:0;
};

export function buildPalaceDirectPreviews(messages=[],{formatTime=()=>'',isGif=()=>false}={}){
 const latest=new Map();
 for(const message of Array.isArray(messages)?messages:[]){
  const id=message?.conversation_id;
  if(!id)continue;
  const previous=latest.get(id);
  // Preserve first-seen ordering for equal or missing timestamps.
  if(!previous||timestamp(message.created_at)>timestamp(previous.created_at))latest.set(id,message);
 }
 const previews=new Map();
 for(const [id,last] of latest){
  const text=last.media_path?'📷 Photo':isGif(last.body)?'🎞 GIF':String(last.body||'Message').replace(/\s+/g,' ').slice(0,82);
  previews.set(id,{text,time:formatTime(last.created_at)});
 }
 return previews;
}
