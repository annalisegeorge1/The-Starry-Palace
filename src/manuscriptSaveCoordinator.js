/**
 * Serializes chapter writes and tracks local edits. Saving an earlier draft must
 * never mark a newer unsaved edit as safely stored in the cloud.
 *
 * This coordinator is scoped to an open writing room. It does not persist
 * chapter text itself; the existing on-device recovery system still does that.
 */
export function createManuscriptSaveCoordinator(send){
 if(typeof send!=='function')throw new TypeError('A chapter save function is required');
 let tail=Promise.resolve();
 const revisions=new Map();
 function markChanged(chapterId){
  const key=String(chapterId);
  const next=(revisions.get(key)||0)+1;
  revisions.set(key,next);
  return next;
 }
 function currentRevision(chapterId){return revisions.get(String(chapterId))||0}
 function persist(chapterId,body,revision){
  const key=String(chapterId);
  const write=tail.catch(()=>{}).then(()=>send(chapterId,body));
  tail=write.catch(()=>{});
  return write.then(saved=>({
   saved,revision,
   isCurrent:currentRevision(key)===revision
  }));
 }
 return{markChanged,currentRevision,persist};
}
