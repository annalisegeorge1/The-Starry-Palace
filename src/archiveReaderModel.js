/**
 * Pagination is display-only: every paragraph, heading and verse block is
 * retained in source order. This is not a reconstruction of source pages.
 */
export const CLASSIC_READER_PAGE_SIZE=36;
export function paginateClassicBlocks(blocks=[],limit=CLASSIC_READER_PAGE_SIZE){
 const source=Array.isArray(blocks)?blocks:[];
 const size=Math.max(2,Math.min(120,Number.isFinite(Number(limit))?Math.floor(Number(limit)):CLASSIC_READER_PAGE_SIZE));
 const pages=[];
 let index=0;
 while(index<source.length){
  let end=Math.min(source.length,index+size);
  // Never strand a heading at the foot of a page.
  if(end<source.length&&end-index>1&&source[end-1]?.kind==='heading')end--;
  pages.push(source.slice(index,end).map((block,offset)=>({...block,sourceIndex:index+offset})));
  index=end;
 }
 return pages;
}
export function classicContents(pages=[]){
 const items=[];
 pages.forEach((page,pageIndex)=>{
  (page||[]).forEach(block=>{
   if(block?.kind==='heading'&&String(block.text||'').trim())
    items.push({title:String(block.text).trim(),pageIndex,sourceIndex:block.sourceIndex});
  });
 });
 return items;
}
export function clampClassicPage(page,count){
 if(!Number.isFinite(Number(page))||count<1)return 0;
 return Math.max(0,Math.min(count-1,Math.floor(Number(page))));
}
export function classicPageKey(recordId){
 return 'palace-classic-reading-page:'+String(recordId||'unknown').replace(/[^a-zA-Z0-9_-]/g,'').slice(0,90);
}
