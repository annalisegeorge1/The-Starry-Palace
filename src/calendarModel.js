export function localDay(date){return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;}
export function monthDays(year,month){return Array.from({length:new Date(year,month+1,0).getDate()},(_,i)=>localDay(new Date(year,month,i+1)));}
export function eventOnDay(event,day){
 const start=new Date(event.starts_at);if(!Number.isFinite(start.getTime()))return false;
 const end=event.ends_at?new Date(event.ends_at):start;
 return day>=localDay(start)&&day<=localDay(Number.isFinite(end.getTime())&&end>=start?end:start);
}
export function heritageOnDay(item,day){
 const [year,month,date]=day.split('-').map(Number);
 if(!item.recurring&&item.year&&Number(item.year)!==year)return false;
 const start=Number(item.month)*100+Number(item.day||1);
 const endMonth=Number(item.end_month||item.month);
 const endDay=Number(item.end_day||(item.day?item.day:new Date(year,endMonth,0).getDate()));
 const end=endMonth*100+endDay;const current=month*100+date;
 return end>=start?current>=start&&current<=end:current>=start||current<=end;
}
