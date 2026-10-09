/** Huge Gutenberg books need navigation without rendering thousands of native options. */
export const CLASSIC_CHAPTER_MENU_LIMIT=72;
export const CLASSIC_NUMERIC_PAGE_THRESHOLD=80;

export function classicChapterChoices(contents=[],query='',selectedSourceIndex=null,limit=CLASSIC_CHAPTER_MENU_LIMIT){
 const rows=Array.isArray(contents)?contents:[];
 const search=String(query||'').trim().toLocaleLowerCase();
 const selected=rows.find(item=>item?.sourceIndex===selectedSourceIndex);
 const matches=search?rows.filter(item=>String(item?.title||'').toLocaleLowerCase().includes(search)):rows;
 const max=Math.max(1,Math.min(200,Math.floor(Number(limit)||CLASSIC_CHAPTER_MENU_LIMIT)));
 const list=matches.slice(0,max);
 if(selected&&!list.some(x=>x.sourceIndex===selected.sourceIndex))list.push(selected);
 return {items:list,matched:matches.length,total:rows.length,hasMore:matches.length>max};
}
export function classicNumericPage(value,total){
 const entry=String(value??'').trim();
 if(!/^\d+$/.test(entry)||!Number.isSafeInteger(Number(entry))||Number(entry)<1||Number(entry)>total)return null;
 return Number(entry)-1;
}
