/**
 * Find genuine conversations without popularity scores, synthetic engagement,
 * or server-side changes. Filters preserve the existing chronological order.
 */
export const COMMONS_MOMENTS=[
 {id:'all',label:'All conversations',hint:'Every conversation in this view'},
 {id:'first',label:'First replies',hint:'Be the first to welcome someone'},
 {id:'talking',label:'In conversation',hint:'Discussions with replies'},
 {id:'polls',label:'Open polls',hint:'Real choices awaiting votes'}
];
export function commonsMoment(value){
 return COMMONS_MOMENTS.some(x=>x.id===value)?value:'all';
}
export function matchesCommonsMoment(thread,moment){
 const selected=commonsMoment(moment);
 if(selected==='all')return true;
 if(selected==='first')return Number(thread?.reply_count||0)===0;
 if(selected==='talking')return Number(thread?.reply_count||0)>0;
 if(selected==='polls')return thread?.poll?.status==='open';
 return true;
}
export function commonsVisiblePage(threads,page=1,pageSize=12){
 const size=Math.max(1,Math.floor(Number(pageSize)||12));
 const count=Math.max(1,Math.floor(Number(page)||1));
 return (Array.isArray(threads)?threads:[]).slice(0,size*count);
}
