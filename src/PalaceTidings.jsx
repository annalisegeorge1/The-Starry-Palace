import React,{useEffect,useState} from 'react';
import {Link} from 'react-router-dom';
import {getPalaceTidings} from './palaceTidingsApi';
import {normalizePalaceTidings} from './palaceTidingsModel';
import './palace-tidings.css';
const DISMISS_KEY='palace-tidings-hidden-session',POLL_MS=600000,ROTATE_MS=11000;
function getDismissed(){try{return window.sessionStorage?.getItem(DISMISS_KEY)==='1'}catch{return false}}
export default function PalaceTidings(){
 const[items,setItems]=useState([]),[index,setIndex]=useState(0),[dismissed,setDismissed]=useState(getDismissed),[paused,setPaused]=useState(false),[reducedMotion,setReducedMotion]=useState(false);
 useEffect(()=>{const query=window.matchMedia?.('(prefers-reduced-motion: reduce)');if(!query)return;const update=()=>setReducedMotion(query.matches);update();query.addEventListener?.('change',update);return()=>query.removeEventListener?.('change',update)},[]);
 useEffect(()=>{
  if(dismissed)return;
  let active=true;
  const refresh=()=>{if(document.visibilityState==='hidden')return;getPalaceTidings().then(data=>{if(active){setItems(normalizePalaceTidings(data));setIndex(0)}}).catch(()=>{if(active)setItems([])})};
  refresh();
  const interval=window.setInterval(refresh,POLL_MS);
  return()=>{active=false;window.clearInterval(interval)};
 },[dismissed]);
 useEffect(()=>{
  if(dismissed||paused||reducedMotion||items.length<2)return;
  const timer=window.setInterval(()=>{if(document.visibilityState==='visible')setIndex(i=>(i+1)%items.length)},ROTATE_MS);
  return()=>window.clearInterval(timer);
 },[items.length,dismissed,paused,reducedMotion]);
 if(dismissed||!items.length)return null;
 const current=items[index%items.length];
 function dismiss(){try{window.sessionStorage?.setItem(DISMISS_KEY,'1')}catch{}setDismissed(true)}
 return <aside className="palace-tidings-bar" aria-label="Palace Tidings: verified community announcements" onMouseEnter={()=>setPaused(true)} onMouseLeave={()=>setPaused(false)} onFocusCapture={()=>setPaused(true)} onBlurCapture={event=>{if(!event.currentTarget.contains(event.relatedTarget))setPaused(false)}}>
   <span className="palace-tidings-brand" aria-hidden="true">✦ <span>PALACE TIDINGS</span></span>
   <span className="palace-tidings-separator" aria-hidden="true"/>
   <span className="palace-tidings-kind">{current.label}</span>
   <Link className="palace-tidings-link" to={current.href} title={current.text}>{current.text}</Link>
   {items.length>1&&<button type="button" className="palace-tidings-next" aria-label="Next Palace announcement" onClick={()=>setIndex(i=>(i+1)%items.length)}>‹ <span>{index%items.length+1}/{items.length}</span> ›</button>}
   <button type="button" className="palace-tidings-close" aria-label="Hide Palace announcements for this session" onClick={dismiss}>×</button>
 </aside>
}
