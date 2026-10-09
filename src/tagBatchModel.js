/** Lightweight writer tag queue, held locally until the writer applies it. */
export const TAG_BATCH_PAGE_SIZE=18;
export function toggleQueuedTag(current=[],tag){
 const queue=Array.isArray(current)?current.filter(item=>item?.id):[];
 if(!tag?.id)return queue;
 return queue.some(item=>item.id===tag.id)
  ?queue.filter(item=>item.id!==tag.id)
  :[...queue,tag];
}
export function pendingTagBatch(queue=[],attached=[]){
 const attachedIds=new Set((attached||[]).map(item=>item?.tags?.id||item?.id).filter(Boolean));
 const seen=new Set();
 return (Array.isArray(queue)?queue:[]).filter(item=>{
  if(!item?.id||attachedIds.has(item.id)||seen.has(item.id))return false;
  seen.add(item.id);
  return true;
 });
}
export function visibleTagSuggestions(rows=[],limit=TAG_BATCH_PAGE_SIZE){
 return (Array.isArray(rows)?rows:[]).slice(0,Math.max(TAG_BATCH_PAGE_SIZE,Number(limit)||TAG_BATCH_PAGE_SIZE));
}
