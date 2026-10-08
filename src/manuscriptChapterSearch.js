/** Compact, predictable chapter finding for the Writing Studio. */
export function matchesManuscriptChapter(chapter,query=''){
 const q=String(query||'').trim().toLowerCase();
 if(!q)return true;
 const number=q.match(/^(?:#|ch(?:apter)?\.?\s*)0*(\d+)$/i);
 if(number)return Number(chapter?.position)===Number(number[1]);
 return String(chapter?.title||'').toLowerCase().includes(q);
}
export function hasActiveManuscriptFilters({query='',status='all',folder='all'}={}){
 return Boolean(String(query||'').trim()||status!=='all'||folder!=='all');
}
