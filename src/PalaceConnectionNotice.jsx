import React,{useEffect,useState} from 'react';
import './palace-connection-notice.css';

/* A connection-loss notice never redirects or reloads a writing session. */
export default function PalaceConnectionNotice(){
 const [offline,setOffline]=useState(()=>typeof navigator!=='undefined'&&navigator.onLine===false);
 useEffect(()=>{
  const update=()=>setOffline(navigator.onLine===false);
  window.addEventListener('offline',update);
  window.addEventListener('online',update);
  return()=>{
   window.removeEventListener('offline',update);
   window.removeEventListener('online',update);
  };
 },[]);
 if(!offline)return null;
 return <aside className="palace-connection-notice" role="status" aria-live="polite">
  <span className="palace-connection-moon" aria-hidden="true">☾</span>
  <div><strong>The Palace has lost its moonlight.</strong>
   <small>It looks like you're offline. If you're writing, keep your draft open until you can reconnect and confirm it has saved.</small></div>
  <a href="/offline.html">Connection details</a>
 </aside>;
}
