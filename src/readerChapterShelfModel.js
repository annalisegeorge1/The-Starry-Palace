/** Reader-only chapter discovery. Never exposes chapters outside the caller's readable list. */
export const READER_CHAPTER_PAGE_SIZE=20;

export function orderedReaderChapters(chapters=[]){
 return (Array.isArray(chapters)?chapters:[])
  .filter(ch=>ch?.id)
  .slice()
  .sort((a,b)=>Number(a.position||0)-Number(b.position||0)||String(a.title||'').localeCompare(String(b.title||'')));
}
export function matchReaderChapters(chapters=[],phrase=''){
 const clean=String(phrase||'').trim().toLocaleLowerCase();
 const rows=orderedReaderChapters(chapters);
 if(!clean)return rows;
 const search=clean.replace(/^#\s*/, '').replace(/^chapter\s+/,'').trim();
 return rows.filter(ch=>{
  const number=String(ch.position??'');
  const title=String(ch.title||'').toLocaleLowerCase();
  return title.includes(clean)||number===search||('chapter '+number).includes(clean);
 });
}
export function initialReaderChapterPage(chapters=[],chapterId=null,size=READER_CHAPTER_PAGE_SIZE){
 const rows=orderedReaderChapters(chapters);
 const index=rows.findIndex(ch=>ch.id===chapterId);
 return Math.max(0,Math.floor(Math.max(0,index)/Math.max(1,Number(size)||READER_CHAPTER_PAGE_SIZE)));
}
export function readerChapterPage(chapters=[],page=0,size=READER_CHAPTER_PAGE_SIZE){
 const rows=Array.isArray(chapters)?chapters:[];
 const perPage=Math.max(1,Math.min(50,Math.floor(Number(size)||READER_CHAPTER_PAGE_SIZE)));
 const pages=Math.max(1,Math.ceil(rows.length/perPage));
 const current=Math.max(0,Math.min(pages-1,Math.floor(Number(page)||0)));
 return {items:rows.slice(current*perPage,(current+1)*perPage),
  page:current,pages,total:rows.length,
  start:rows.length?current*perPage+1:0,end:Math.min(rows.length,(current+1)*perPage)};
}

/** The chapter shelf opens automatically for short books or an explicit anchor visit. */
export function shouldOpenReaderChapterShelf(chapterCount,hash=''){
 return Number(chapterCount)<=12||hash==='#palace-reader-chapters';
}
