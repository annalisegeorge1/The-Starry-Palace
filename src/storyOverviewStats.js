/**
 * Public-facing story totals. Owner-visible draft chapters must never inflate
 * figures that visitors see on story cards or overview pages.
 */
export function storyOverviewStats(work,comments=null,bookmarkCount=null){
 const published=(work?.chapters||[]).filter(ch=>ch?.status==='published');
 const words=published.reduce((sum,ch)=>sum+Math.max(0,Number(ch.word_count)||0),0);
 const approved=Array.isArray(comments)?comments.filter(comment=>comment?.status==='approved').length:null;
 const count=bookmarkCount===null||bookmarkCount===undefined?null:Math.max(0,Number(bookmarkCount)||0);
 return {words,chapters:published.length,comments:approved,bookmarks:count};
}
