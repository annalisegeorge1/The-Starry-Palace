/* Private, short-lived note drafts. Never cross user or chapter boundaries.
   The saved note itself still lives in the Palace only after an explicit Save. */
const PREFIX='palace-reading-note-draft-v1';
const MAX_AGE_MS=7*24*60*60*1000;
export const emptyReaderNoteDraft=()=>({body:'',label:''});

export function readerNoteDraftKey(userId,chapterId){
 if(!userId||!chapterId)return null;
 return PREFIX+':'+encodeURIComponent(String(userId))+':'+encodeURIComponent(String(chapterId));
}

export function readReaderNoteDraft(store,userId,chapterId,now=Date.now()){
 const key=readerNoteDraftKey(userId,chapterId);
 if(!key||!store)return emptyReaderNoteDraft();
 try{
  const raw=store.getItem(key);
  if(!raw)return emptyReaderNoteDraft();
  const saved=JSON.parse(raw);
  const when=Number(saved?.updated_at);
  if(!Number.isFinite(when)||when>now||now-when>MAX_AGE_MS){
   store.removeItem(key);
   return emptyReaderNoteDraft();
  }
  return {
   body:typeof saved?.body==='string'?saved.body.slice(0,4000):'',
   label:typeof saved?.label==='string'?saved.label.slice(0,80):''
  };
 }catch{return emptyReaderNoteDraft()}
}

export function writeReaderNoteDraft(store,userId,chapterId,draft,now=Date.now()){
 const key=readerNoteDraftKey(userId,chapterId);
 if(!key||!store)return false;
 try{
  const body=String(draft?.body||'').slice(0,4000);
  const label=String(draft?.label||'').slice(0,80);
  if(!body&&!label){store.removeItem(key);return true}
  store.setItem(key,JSON.stringify({body,label,updated_at:now}));
  return true;
 }catch{return false}
}
