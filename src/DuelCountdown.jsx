import React,{useEffect,useState} from 'react';

export function formatDuelCountdown(target,now=Date.now()){
 const until=new Date(target).getTime();
 if(!Number.isFinite(until))return '—';
 const total=Math.ceil(Math.max(0,until-Number(now||0))/1000);
 const h=Math.floor(total/3600),m=Math.floor(total%3600/60),s=total%60;
 return h?String(h)+'h '+String(m).padStart(2,'0')+'m':String(m).padStart(2,'0')+':'+String(s).padStart(2,'0');
}
/** Local one-second clock: updating this never re-renders the entire Writing Chamber. */
function DuelCountdown({target}){
 const[now,setNow]=useState(Date.now);
 useEffect(()=>{
  setNow(Date.now());
  const timer=window.setInterval(()=>{if(document.visibilityState==='visible')setNow(Date.now())},1000);
  const sync=()=>{if(document.visibilityState==='visible')setNow(Date.now())};
  document.addEventListener('visibilitychange',sync);
  return()=>{window.clearInterval(timer);document.removeEventListener('visibilitychange',sync)};
 },[target]);
 return <span role="timer" aria-label="Time remaining">{formatDuelCountdown(target,now)}</span>;
}
export default React.memo(DuelCountdown);
