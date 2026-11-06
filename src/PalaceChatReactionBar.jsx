import React,{useState} from 'react';
import {PALACE_REACTIONS,reactionSummary} from './palaceChatV3';
import './palace-chat-reactions.css';

export default function PalaceChatReactionBar({message,rows,userId,disabled,onReact,rankedReactions}){
 const [expanded,setExpanded]=useState(false);
 const {counts,mine}=reactionSummary(rows,message.id,userId);
 const choices=rankedReactions?.choices||PALACE_REACTIONS;
 const quick=rankedReactions?.quick||null;
 // Keep the reactions actually added to this message visible below its bubble.
 const used=PALACE_REACTIONS.filter(r=>counts[r.key]>0)
  .sort((a,b)=>counts[b.key]-counts[a.key]||PALACE_REACTIONS.indexOf(a)-PALACE_REACTIONS.indexOf(b));
 return <div className={'palace-chat-reactions'+(used.length?' has-reactions':' no-reactions')} aria-label="Message reactions" onKeyDown={e=>{if(e.key==='Escape'){e.stopPropagation();setExpanded(false)}}}>
  {used.length>0&&<div className="palace-chat-reaction-pills">{used.map(r=><button type="button" key={r.key} disabled={disabled} aria-pressed={mine===r.key}
    aria-label={r.label+' reaction, '+counts[r.key]} onClick={()=>onReact(message.id,r.key,mine)}
   ><span aria-hidden="true">{r.emoji}</span>{counts[r.key]>1&&<span className="palace-chat-reaction-count">{counts[r.key]}</span>}</button>)}</div>}
  {quick&&<button type="button" className="palace-chat-react-quick" aria-pressed={mine===quick.key}
    aria-label={'Quick react with '+quick.label+' (popular in this conversation)'}
    title={'Quick react with '+quick.label+' · popular in this conversation'}
    disabled={disabled} onClick={()=>onReact(message.id,quick.key,mine)}>
    <span aria-hidden="true">{quick.emoji}</span>
   </button>}
  <button type="button" className="palace-chat-react-trigger" aria-expanded={expanded} aria-label={expanded?'Close reaction choices':'React to message'}
    onClick={()=>setExpanded(v=>!v)} disabled={disabled}>
   <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M16 6a4.4 4.4 0 0 0-7-1 4.4 4.4 0 0 0-6 6.4L9 17l4-3.8"/><path d="M18 11v8M14 15h8"/></svg>
  </button>
  {expanded&&<div className="palace-chat-reaction-choices" role="group" aria-label="Choose a reaction" title="Most-used reactions in this conversation appear first">
   {choices.map(r=><button type="button" key={r.key} disabled={disabled}
     aria-pressed={mine===r.key} aria-label={'React with '+r.label}
     onClick={()=>{onReact(message.id,r.key,mine);setExpanded(false)}}>{r.emoji}</button>)}
  </div>}
 </div>;
}
