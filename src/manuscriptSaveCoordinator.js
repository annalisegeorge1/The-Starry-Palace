/**
 * Serialize cloud chapter writes while tracking newer on-device edits.
 * An older response must never mark a newer draft as safely saved.
 * Local recovery copies remain the responsibility of the writing room.
 */
export function createManuscriptSaveCoordinator(send){
 if(typeof send!=='function')throw new TypeError('A chapter save function is required');
 let tail=Promise.resolve();
 const revisions=new Map();
 const committed=new Map();
 const inFlight=new Map();
 function markChanged(chapterId){
  const key=String(chapterId);
  const next=(revisions.get(key)||0)+1;
  revisions.set(key,next);
  return next;
 }
 function currentRevision(chapterId){return revisions.get(String(chapterId))||0}
 function isDirty(chapterId){
  const key=String(chapterId);
  return currentRevision(key)>(committed.get(key)||0);
 }
 function hasUnsavedChanges(){
  for(const key of revisions.keys())if(isDirty(key))return true;
  return false;
 }
 function isSaving(chapterId){return(inFlight.get(String(chapterId))||0)>0}
 function persist(chapterId,body,revision){
  const key=String(chapterId);
  inFlight.set(key,(inFlight.get(key)||0)+1);
  const write=tail.catch(()=>{}).then(()=>send(chapterId,body));
  tail=write.catch(()=>{});
  return write.then(saved=>{
   const isCurrent=currentRevision(key)===revision;
   if(isCurrent)committed.set(key,revision);
   return {saved,revision,isCurrent};
  }).finally(()=>{
   const count=(inFlight.get(key)||1)-1;
   if(count>0)inFlight.set(key,count);
   else inFlight.delete(key);
  });
 }
 return{markChanged,currentRevision,persist,isDirty,hasUnsavedChanges,isSaving};
}
