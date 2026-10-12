import React from 'react';
/** Standalone full-archive pagination; never shows loaded-shelf totals as archive-wide. */
export default function ReadingArchivePager({page=0,total=0,pending=false,onPage}){
 const pages=Math.max(1,Math.ceil(total/20));
 if(total===0)return null;
 const first=page*20+1,last=Math.min(total,(page+1)*20);
 return <nav className="reading-archive-pager" aria-label="Published archive result pages">
  <span>Showing <strong>{first}–{last}</strong> of <strong>{total.toLocaleString()}</strong> published {total===1?'story':'stories'}</span>
  <div>
   <button type="button" disabled={pending||page<=0} onClick={()=>onPage(page-1)}>← Previous</button>
   <span aria-live="polite">Page {page+1} of {pages}</span>
   <button type="button" disabled={pending||(page+1)>=pages} onClick={()=>onPage(page+1)}>Next →</button>
  </div>
 </nav>;
}
