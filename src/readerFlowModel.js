/** Flow is a presentation preference. Keep Full Page as the layout default. */
export const READER_FLOWS=Object.freeze(['scroll','pages']);
export function readerFlow(value){return READER_FLOWS.includes(value)?value:'scroll'}
export function readerPageNumber(percent,total){
 const n=Math.max(1,Math.floor(Number(total)||1));
 const p=Math.max(0,Math.min(100,Number(percent)||0));
 return Math.max(1,Math.min(n,Math.round((p/100)*(n-1))+1));
}
export function readerPagePercent(page,total){
 const n=Math.max(1,Math.floor(Number(total)||1));
 return n<=1?0:Math.round((Math.max(1,Math.min(n,Number(page)||1))-1)/(n-1)*100);
}
