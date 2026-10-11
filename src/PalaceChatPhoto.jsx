import React,{useEffect,useState} from 'react';
import {signedPalaceChatPhoto} from './palaceChatMedia';
/* Only RLS-authorized conversation members can request signed, expiring
 * photo URLs. Stored messages contain a path, not a public asset URL. */
export default function PalaceChatPhoto({path}){
 const[url,setUrl]=useState('');
 const[error,setError]=useState('');
 const[attempt,setAttempt]=useState(0);
 const[expanded,setExpanded]=useState(false);
 useEffect(()=>{
  let alive=true;setUrl('');setError('');
  if(!path)return;
  signedPalaceChatPhoto(path).then(result=>{if(alive)setUrl(result)}).catch(e=>{if(alive)setError(e.message||'Photo unavailable')});
  return()=>{alive=false};
 },[path,attempt]);
 if(!path)return null;
 if(error)return <div className="palace-chat-private-photo is-error" role="status"><span>Photo unavailable</span><button type="button" onClick={()=>setAttempt(a=>a+1)}>Retry</button></div>;
 return <div className={'palace-chat-private-photo'+(expanded?' is-expanded':'')}>
  {url?<button type="button" onClick={()=>setExpanded(v=>!v)} aria-label={expanded?'Collapse photo':'Enlarge photo'}><img src={url} alt="Photo shared in this conversation" loading="lazy" referrerPolicy="no-referrer"/></button>:<span role="status">Opening private photo…</span>}
 </div>;
}
