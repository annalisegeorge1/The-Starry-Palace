/** Small pure helpers for comic reading comfort and accessible controls. */
export const COMIC_READER_MODES=['pages','vertical'];

export function comicReaderMode(value){
 return COMIC_READER_MODES.includes(value)?value:'pages';
}

/** Typing, selecting controls, or using an open dialog must never turn a comic page. */
export function shouldTurnComicPageWithKey(event,modalOpen=false){
 if(!event||event.defaultPrevented||modalOpen||event.altKey||event.ctrlKey||event.metaKey)return false;
 if(event.key!=='ArrowLeft'&&event.key!=='ArrowRight')return false;
 const target=event.target;
 if(target?.isContentEditable)return false;
 if(typeof target?.closest==='function'&&target.closest('input,textarea,select,button,a,[contenteditable],[role="dialog"],[role="combobox"],[role="slider"]'))return false;
 return true;
}

/** Physical arrow direction changes with a right-to-left panel sequence. */
export function comicPageTurn(key,direction,index,total,previousEpisodeId=null,nextEpisodeId=null){
 const n=Number.isInteger(total)?total:0;
 if(n<=0||!Number.isInteger(index))return null;
 const forward=key===(direction==='rtl'?'ArrowLeft':'ArrowRight');
 if(key!=='ArrowLeft'&&key!=='ArrowRight')return null;
 if(forward)return index<n-1?{pageIndex:index+1}:nextEpisodeId?{episodeId:nextEpisodeId}:null;
 return index>0?{pageIndex:index-1}:previousEpisodeId?{episodeId:previousEpisodeId}:null;
}
