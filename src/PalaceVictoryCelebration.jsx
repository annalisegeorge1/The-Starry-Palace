import React,{useEffect,useState} from 'react';
import {Link} from 'react-router-dom';
import {getMyGrandPalaceVictory} from './palaceVictoryApi';
import {palaceVictorySeenKey,validatedPalaceVictory,isPalaceTextInputActive} from './palaceVictoryModel';
import './palace-victory.css';

const PARTICLES=Array.from({length:24},(_,i)=>({
 left:(i*43+7)%98,
 delay:(i*7%17)*.13,
 duration:3.5+(i%4)*.55,
 color:['#b8cbff','#bda5fc','#d8f9ff','#d8c8f5','#e6d6ff'][i%5],
 shape:i%3===0?'star':'confetti'
}));
function safeGet(key){try{return window.localStorage?.getItem(key)}catch{return null}}
function safeSet(key){try{window.localStorage?.setItem(key,'1')}catch{}}

export default function PalaceVictoryCelebration({userId}){
 const [victory,setVictory]=useState(null);
 const [reducedMotion,setReducedMotion]=useState(false);
 useEffect(()=>{
  const media=window.matchMedia?.('(prefers-reduced-motion: reduce)');
  if(!media)return;
  const update=()=>setReducedMotion(media.matches);
  update();media.addEventListener?.('change',update);
  return()=>media.removeEventListener?.('change',update);
 },[]);
 useEffect(()=>{
  setVictory(null);
  if(!userId)return;
  let alive=true,lastCheck=0;
  const check=async()=>{
   if(!alive||document.visibilityState==='hidden'||Date.now()-lastCheck<60000)return;
   lastCheck=Date.now();
   try{
    const candidate=validatedPalaceVictory(await getMyGrandPalaceVictory());
    if(!alive||!candidate||document.visibilityState==='hidden')return;
    const seen=palaceVictorySeenKey(userId,candidate.season);
    if(safeGet(seen)||isPalaceTextInputActive(document.activeElement))return;
    // Once per signed-in member, winning quarter, and browser. Never re-launch after refresh.
    safeSet(seen);
    setVictory(candidate);
   }catch{
    // Missing network / unfinalized season => no fake congratulations.
   }
  };
  check();
  const onVisible=()=>{if(document.visibilityState==='visible')check()};
  document.addEventListener('visibilitychange',onVisible);
  const poll=window.setInterval(check,30*60*1000);
  return()=>{alive=false;document.removeEventListener('visibilitychange',onVisible);window.clearInterval(poll)};
 },[userId]);
 useEffect(()=>{
  if(!victory)return;
  const timer=window.setTimeout(()=>setVictory(null),11500);
  return()=>window.clearTimeout(timer);
 },[victory]);
 if(!victory)return null;
 return <div className="palace-victory-celebration">
  {!reducedMotion&&<div className="palace-victory-particles" aria-hidden="true">
   {PARTICLES.map((p,i)=><span key={i} className={'palace-victory-particle '+p.shape}
    style={{'--x':p.left+'%','--delay':p.delay+'s','--duration':p.duration+'s','--spark':p.color}}>{p.shape==='star'?'✦':''}</span>)}
  </div>}
  <aside className="palace-victory-card" role="status" aria-live="polite" style={{'--court-accent':victory.accent}}>
   <span className="palace-victory-glyph" aria-hidden="true">✦ {reducedMotion?'✧':'♛'} ✧</span>
   <div className="palace-victory-copy"><small>THE QUARTERLY CROWN · VICTORIOUS COURT</small>
    <strong>{victory.name} has won!</strong>
    <p>Your Palace is this season's champion. Congratulations to your entire court!</p>
    <Link to="/grand-palaces?tab=courts" onClick={()=>setVictory(null)}>Visit the Hall of Champions →</Link>
   </div>
   <button type="button" className="palace-victory-close" aria-label="Dismiss Palace victory celebration" onClick={()=>setVictory(null)}>×</button>
  </aside>
 </div>;
}
