// Each page instance owns its writes. Reloaded and duplicated tabs discover
// prior copies by chapter, including the original single-key format.
let pageId;
export function recoveryWriteKey(chapterId){
 pageId ??= crypto.randomUUID();
 return 'palace-recovery:'+chapterId+':'+pageId;
}

export function chapterRecoveryCopies(storage,chapter){
 const legacy='palace-recovery:'+chapter.id;
 const copies=[];
 for(let i=0;i<storage.length;i++){
  const key=storage.key(i);
  if(key!==legacy&&!key?.startsWith(legacy+':'))continue;
  try{
   const raw=storage.getItem(key);
   const copy=JSON.parse(raw);
   if(typeof copy?.body_html!=='string')continue;
   if(copy.body_html===chapter.body_html&&copy.title===chapter.title&&(copy.revision_note||'')===(chapter.revision_note||''))continue;
   copies.push({...copy,key,raw});
  }catch{} // One unreadable copy must not hide the other tabs' drafts.
 }
 return copies.sort((a,b)=>String(b.saved_at).localeCompare(String(a.saved_at)));
}

export function discardDisplayedCopy(storage,copy){
 if(storage.getItem(copy.key)!==copy.raw)return false;
 storage.removeItem(copy.key);
 return true;
}
