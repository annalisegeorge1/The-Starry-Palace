/* A member's home shelf must show only real, unfinished, published works. */
export function selectHomeReading(rows,limit=3){
 if(!Array.isArray(rows)||limit<=0)return [];
 const seen=new Set(),selected=[];
 for(const row of rows){
  const work=row?.works;
  if(!row?.work_id||row.completed===true||!work||work.publication_status!=='published'||typeof work.slug!=='string'||!work.slug.trim())continue;
  const id=String(row.work_id);
  if(seen.has(id))continue;
  seen.add(id);selected.push(row);
  if(selected.length>=limit)break;
 }
 return selected;
}
/* Also protects the frame between a change of account and the next effect. */
export function visibleHomeReading(shelf,memberId){
 return memberId&&shelf?.memberId===memberId&&Array.isArray(shelf.rows)?shelf.rows:[];
}
export function chapterReadingPercent(value){
 if(value===null||value===undefined||value==='')return null;
 const number=Number(value);
 return Number.isFinite(number)?Math.max(0,Math.min(100,Math.round(number))):null;
}
export function readingReturnPath(row){
 const base='/work/'+encodeURIComponent(String(row.works.slug));
 return row.chapter_id?base+'/chapter/'+encodeURIComponent(String(row.chapter_id)):base;
}
