import React, {useEffect, useRef, useState} from 'react';
import {supabase} from './supabase';

const enabled=import.meta.env.VITE_DISCUSSION_INTERACTIONS==='true';
const empty={items:{},closed:false};
async function result(request) {
 const {data,error}=await request;
 if(error)throw error;
 return data;
}

export function useDiscussionInteractions(comments,work,chapter,viewer) {
 const scope=JSON.stringify([work,chapter,viewer]);
 const [state,setState]=useState(null);
 const [refresh,setRefresh]=useState(0);
 const [notice,setNotice]=useState('');
 const [busy,setBusy]=useState(false);
 const inFlight=useRef(false);
 useEffect(()=>{
  if(!enabled)return;
  let current=true;
  async function read(){
   const ids=comments.filter(c=>c.status==='approved'&&(c.chapter_id||null)===chapter).map(c=>c.id);
   const batches=[];
   for(let start=0;start<ids.length;start+=100){
    batches.push(result(supabase.rpc('discussion_interaction_state',{response_ids:ids.slice(start,start+100)})));
   }
   const [flags,closed]=await Promise.all([Promise.all(batches),chapter?
    result(supabase.from('discussion_closed_chapters').select('chapter').eq('chapter',chapter).maybeSingle()):null]);
   if(current)setState({scope,items:Object.assign({},...flags),closed:Boolean(closed)});
  }
  read().catch(()=>{if(current)setNotice('Discussion controls could not be loaded.')});
  return ()=>{current=false};
 },[comments,chapter,scope,refresh]);
 async function change(name,params){
  if(inFlight.current)return;
  inFlight.current=true;setBusy(true);
  try{await result(supabase.rpc(name,params));setNotice('Discussion updated.');setRefresh(n=>n+1)}
  catch(error){setNotice(error.message||'The change could not be saved.')}
  finally{inFlight.current=false;setBusy(false)}
 }
 const values=state?.scope===scope?state:empty;
 return {...values,available:enabled&&state?.scope===scope,notice,busy,
  retry:()=>setRefresh(n=>n+1),
  setClosed:closed=>change('set_discussion_chapter_closed',{chapter_id:chapter,closed}),
  setChoice:(id,kind,choice)=>change('set_discussion_interaction',{response_id:id,kind,choice})};
}

export function CommentInteractionMenu({comment,tools,owner,signedIn}) {
 const item=tools.items[comment.id];
 if(!item)return null;
 const total=Object.values(item.counts||{}).reduce((n,count)=>n+count,0);
 if(!signedIn)return total?<small>{total} reaction{total===1?'':'s'}</small>:null;
 return <details className="response-menu"><summary>Response options{total?' · '+total+' reactions':''}</summary>
  <label>Reaction <select disabled={tools.busy} value={item.reaction||'off'} onChange={e=>tools.setChoice(comment.id,'reaction',e.target.value)}>
   <option value="off">No reaction</option>
   {['heart','laugh','surprise'].map(k=><option key={k} value={k}>{k[0].toUpperCase()+k.slice(1)} ({item.counts?.[k]||0})</option>)}
  </select></label>
  <label>Thread notifications <select disabled={tools.busy} value={item.preference||'off'} onChange={e=>tools.setChoice(comment.id,'preference',e.target.value)}>
   <option value="off">Replies and mentions</option><option value="following">Follow thread</option><option value="muted">Mute thread</option>
  </select></label>
  {owner&&!comment.parent_comment_id&&<button disabled={tools.busy} type="button" aria-pressed={item.pinned}
   onClick={()=>tools.setChoice(comment.id,'pin',item.pinned?'off':'on')}>{item.pinned?'Unpin thread':'Pin thread'}</button>}
 </details>;
}
