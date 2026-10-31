import React,{useEffect,useState} from 'react';
import {downloadPalaceChatPhoto} from './palaceChatMedia';

/* Fetch private photos with the current member session, rather than exposing
 * a reusable signed Storage URL in the page. Only RLS-authorized conversation
 * members can download the object. Local object URLs must be revoked when
 * the path changes or this photo leaves the screen. */
export default function PalaceChatPhoto({path}){
 const[url,setUrl]=useState('');
 const[error,setError]=useState('');
 const[attempt,setAttempt]=useState(0);
 const[expanded,setExpanded]=useState(false);
 useEffect(()=>{
  let alive=true;
  let objectUrl='';
  setUrl('');setError('');
  if(!path)return;
  downloadPalaceChatPhoto(path).then(blob=>{
   if(!alive)return;
   if(typeof URL.createObjectURL!=='function')throw new Error('Private photo preview is unavailable in this browser.');
   objectUrl=URL.createObjectURL(blob);
   setUrl(objectUrl);
  }).catch(e=>{if(alive)setError(e.message||'Photo unavailable')});
  return()=>{
   alive=false;
   if(objectUrl)URL.revokeObjectURL(objectUrl);
  };
 },[path,attempt]);
 if(!path)return null;
 if(error)return <div className="palace-chat-private-photo is-error" role="status"><span>Photo unavailable</span><button type="button" onClick={()=>setAttempt(a=>a+1)}>Retry</button></div>;
 return <div className={'palace-chat-private-photo'+(expanded?' is-expanded':'')}>
  {url?<button type="button" onClick={()=>setExpanded(v=>!v)} aria-label={expanded?'Collapse photo':'Enlarge photo'}><img src={url} alt="Photo shared in this conversation" loading="lazy" referrerPolicy="no-referrer"/></button>:<span role="status">Opening private photo…</span>}
 </div>;
}
