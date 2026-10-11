import React,{useEffect,useState} from 'react';
import {useAuth} from './auth';
import {ChamberFrameArt} from './PaintedPalaceArt';
import {getPaintedMemberFrame} from './memberChamberDecorData';
import './member-avatar.css';
const frames=new Map(),lifetime=60000;
function lookup(viewer,id){
 const key=viewer+':'+id,old=frames.get(key);
 if(old&&old.expires>Date.now())return old.promise;
 const entry={expires:Date.now()+lifetime,promise:null};
 entry.promise=getPaintedMemberFrame(id).then(data=>data?.chamber_frame||'').catch(()=>{frames.delete(key);return ''});
 frames.set(key,entry);if(frames.size>500)frames.delete(frames.keys().next().value);
 return entry.promise;
}
export default function MemberAvatar({profile,memberId,frame,className='',as:Tag='span',children,...props}){
 const viewer=useAuth()?.session?.user?.id,id=memberId||profile?.id;
 const [resolved,setResolved]=useState({key:'',slug:''});
 const key=(viewer||'')+':'+(id||'');
 useEffect(()=>{
  let active=true,revision=0;
  const refresh=()=>{const version=revision;if(viewer&&id&&frame===undefined)lookup(viewer,id).then(slug=>{if(active&&version===revision)setResolved({key,slug})})};
  const changed=e=>{if(e.detail?.user_id===id){revision++;const slug=e.detail.chamber_frame||'';frames.set(key,{expires:Date.now()+lifetime,promise:Promise.resolve(slug)});if(active)setResolved({key,slug})}};
  refresh();window.addEventListener('palace:frame-changed',changed);window.addEventListener('focus',refresh);
  return()=>{active=false;window.removeEventListener('palace:frame-changed',changed);window.removeEventListener('focus',refresh)};
 },[viewer,id,frame,key]);
 const slug=frame!==undefined?frame:(resolved.key===key?resolved.slug:'');
 return <Tag {...props} data-frame={slug||undefined} className={'member-avatar '+className+(slug?' member-avatar-framed':'')}>
  <span className="member-avatar-photo">{profile?.avatar_url?<img src={profile.avatar_url} alt="" loading="lazy" decoding="async"/>:<span aria-hidden="true">{(profile?.display_name||profile?.username||'☾').slice(0,1).toUpperCase()}</span>}</span>
  {slug&&<ChamberFrameArt slug={slug}/>}{children}
 </Tag>;
}
