import React,{useState} from 'react';
import {PALACE_REACTIONS,reactionSummary} from './palaceChatV3';

/* Shown only when schema + security review enable Messenger V3. */
export default function PalaceChatReactionBar({message,rows,userId,disabled,onReact}){
 const[expanded,setExpanded]=useState(false);
 const {counts,mine}=reactionSummary(rows,message.id,userId);
 const used=PALACE_REACTIONS.filter(r=>counts[r.key]>0);
 return <div className="palace-chat-reactions" aria-label="Message reactions">
  {used.map(r=><button type="button" key={r.key} disabled={disabled} aria-pressed={mine===r.key}
    aria-label={r.label+' reaction, '+counts[r.key]} onClick={()=>onReact(message.id,r.key,mine)}
   ><span aria-hidden="true">{r.emoji}</span> {counts[r.key]}</button>)}
  <button type="button" aria-expanded={expanded} aria-label={expanded?'Close reaction choices':'React to message'}
    onClick={()=>setExpanded(v=>!v)} disabled={disabled}>{expanded?'✕':'＋'}</button>
  {expanded&&<div className="palace-chat-reaction-choices" role="group" aria-label="Choose a reaction">
   {PALACE_REACTIONS.map(r=><button type="button" key={r.key} disabled={disabled}
     aria-pressed={mine===r.key} aria-label={'React with '+r.label}
     onClick={()=>{onReact(message.id,r.key,mine);setExpanded(false)}}>{r.emoji}</button>)}
  </div>}
 </div>;
}
