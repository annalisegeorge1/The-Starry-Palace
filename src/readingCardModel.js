/** Presentation-only helpers for concise, truthful Reading Room cards. */
export function readingSummaryPreview(summary='',limit=165){
 const full=String(summary||'').trim();
 const length=Math.max(50,Math.floor(Number(limit)||165));
 if(full.length<=length)return {preview:full,truncated:false};
 const cut=full.lastIndexOf(' ',length);
 const end=cut>Math.floor(length*.6)?cut:length;
 return {preview:full.slice(0,end).trimEnd()+'…',truncated:true};
}
export function readingCardTagItems(tags=[],expanded=false,limit=3){
 const usable=(Array.isArray(tags)?tags:[]).filter(t=>t?.name);
 const cap=Math.max(1,Math.floor(Number(limit)||3));
 return {visible:expanded?usable:usable.slice(0,cap),hidden:expanded?0:Math.max(0,usable.length-cap),total:usable.length};
}
