/**
 * Safe reorder preparation: compute a complete permutation without mutating
 * the current chapter list. An invalid drag never changes the manuscript.
 * All server writes use the existing owner-checked reorder_work_chapters RPC.
 */
export function moveManuscriptChapter(chapters,sourceId,targetId,placeAfter=false) {
 const list=Array.isArray(chapters)?chapters:[];
 const original=list.map(ch=>ch?.id);
 if(!sourceId||!targetId||sourceId===targetId||new Set(original).size!==list.length)return null;
 const source=original.indexOf(sourceId),target=original.indexOf(targetId);
 if(source<0||target<0)return null;
 const result=[...list];
 const [moving]=result.splice(source,1);
 const anchor=result.findIndex(ch=>ch.id===targetId);
 result.splice(anchor+(placeAfter?1:0),0,moving);
 return result.every((ch,i)=>ch.id===original[i])?null:result;
}
export function isManuscriptDragAvailable({isOwner=false,filtersActive=false,busy=false,chapterCount=0}={}) {
 return isOwner&&!filtersActive&&!busy&&chapterCount>1;
}
