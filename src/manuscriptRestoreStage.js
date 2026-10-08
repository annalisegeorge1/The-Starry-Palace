/**
 * Restoring a recovery copy or prior snapshot creates a *new local edit*.
 * It must not be mistaken for cloud-saved text until the writer explicitly
 * saves it. This protects the manuscript from automatic stale responses.
 */
export function stageManuscriptRestore({chapterId,draft,storage,markChanged,savedAt}={}){
 if(!chapterId||typeof markChanged!=='function')throw new TypeError('An open chapter and revision tracker are required');
 const restored={
  title:String(draft?.title||''),
  body_html:String(draft?.body_html||''),
  revision_note:String(draft?.revision_note||''),
  saved_at:String(savedAt||new Date().toISOString())
 };
 const revision=markChanged(chapterId);
 let stored=false;
 try{
  if(storage&&typeof storage.setItem==='function'){
   storage.setItem('palace-recovery:'+chapterId,JSON.stringify(restored));
   stored=true;
  }
 }catch{}
 return {draft:restored,revision,stored};
}
