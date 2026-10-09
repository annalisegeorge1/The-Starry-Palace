/**
 * Pagination is display-only: every paragraph, heading and verse block is
 * retained in source order. This is not a reconstruction of source pages.
 */
export const CLASSIC_READER_PAGE_SIZE=36;
export function paginateClassicBlocks(blocks=[],limit=CLASSIC_READER_PAGE_SIZE,breakBefore=-1){
 const source=Array.isArray(blocks)?blocks:[];
 const size=Math.max(2,Math.min(120,Number.isFinite(Number(limit))?Math.floor(Number(limit)):CLASSIC_READER_PAGE_SIZE));
 const pages=[];
 let index=0;
 while(index<source.length){
  let end=Math.min(source.length,index+size);
  if(index<breakBefore&&end>breakBefore)end=breakBefore;
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


/**
 * Find the narrative rather than the publisher title page / long contents list.
 * Conservative: never delete or rewrite source blocks. Recognise a chapter heading
 * only when it is followed by substantial lower-case prose, not TOC entries.
 * Blocks without convincing evidence retain their original opening.
 */
export function firstClassicStoryBlock(blocks=[]){
 if(!Array.isArray(blocks)||!blocks.length)return 0;
 const contentsAt=blocks.findIndex(block=>/^(?:table of\s+)?contents(?:\s*[:.])?$/i.test(String(block?.text||'').trim()));
 const start=contentsAt>=0?contentsAt+1:0;
 const candidates=[];
 for(let i=start;i<blocks.length;i++){
  const block=blocks[i];
  if(block?.kind!=='heading')continue;
  const heading=String(block.text||'').trim();
  const chapter=/^(?:chapter\s+(?:[ivxlcdm]+|\d+|one|two|three|four|five|six|seven|eight|nine|ten|first|second|third)\b|prologue\b|act\s+\w+|scene\s+\w+)/i.test(heading);
  const book=/^(?:book\s+\w+|part\s+\w+|volume\s+\w+)/i.test(heading);
  if(!chapter&&!book)continue;
  let meaningfulLength=0,paragraphs=0;
  for(let j=i+1;j<Math.min(blocks.length,i+11);j++){
   const next=blocks[j];
   if(next?.kind==='heading')break;
   if(next?.kind==='paragraph'||next?.kind==='verse'){
    const text=String(next.text||'');
    // A contents list commonly includes all-caps descriptions and short titles.
    const naturalWords=(text.match(/\b[a-z]{3,}\b/g)||[]).length;
    if(text.length>=75&&naturalWords>=10){
     meaningfulLength+=text.length;paragraphs++;
    }
   }
  }
  if(meaningfulLength>=180&&paragraphs>=1){
   candidates.push({index:i,chapter});
   if(chapter)break;
  }
  // Only inspect the first several chapters. Very late chapter-like headings
  // are not evidence that the beginning of this edition is front matter.
  if(i>Math.max(200,Math.floor(blocks.length*.14)))break;
 }
 const chapter=candidates.find(item=>item.chapter);
 return chapter?.index??candidates[0]?.index??0;
}
export function classicStoryPage(pages=[],storyBlock=0){
 const target=Math.max(0,Number(storyBlock)||0);
 if(!Array.isArray(pages)||!pages.length)return 0;
 const page=pages.findIndex(items=>(items||[]).some(item=>item?.sourceIndex===target));
 return Math.max(0,page);
}
