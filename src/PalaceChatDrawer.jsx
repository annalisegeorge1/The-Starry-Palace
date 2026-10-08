import React,{useEffect,useState} from 'react';
import {Link} from 'react-router-dom';
import {getLetters,sendLetter} from './palaceData';
import './palace-chat-drawer.css';

const draftKey=(user,id)=>'palace-chat-draft:'+user+':'+id;
export default function PalaceChatDrawer({userId}){
 const[open,setOpen]=useState(false);
 const[data,setData]=useState(null);
 const[selected,setSelected]=useState('');
 const[drafts,setDrafts]=useState({});
 const[busy,setBusy]=useState(false);
 const[error,setError]=useState('');
 const[search,setSearch]=useState('');
 const[quiet,setQuiet]=useState(false);
 const[chatPaused,setChatPaused]=useState(false);
 useEffect(()=>{setOpen(false);setData(null);setSelected('');setDrafts({});setError('');},[userId]);
 useEffect(()=>{
  if(!userId)return;
  let live=true;
  const refresh=()=>{
   getLetters(userId).then(next=>{
    if(!live)return;
    setData(next);setError('');
    setSelected(previous=>next.conversations.some(c=>c.conversation_id===previous)?previous:(next.conversations.find(c=>!c.preference?.archived)?.conversation_id||''));
   }).catch(err=>{if(live)setError(err.message||'Messages could not be loaded.')});
  };
  refresh();
  const timer=window.setInterval(()=>{if(document.visibilityState==='visible')refresh()},open?20000:60000);
  return()=>{live=false;window.clearInterval(timer)};
 },[open,userId]);
 useEffect(()=>{const update=()=>setQuiet(document.body.classList.contains('reader-focus-mode')||document.body.classList.contains('writer-focus-mode'));update();const observer=new MutationObserver(update);observer.observe(document.body,{attributes:true,attributeFilter:['class']});return()=>observer.disconnect()},[]);
 if(!userId)return null;
 const visible=(data?.conversations||[]).filter(c=>!c.preference?.archived&&c.conversations?.kind==='direct'&&
  [c.correspondent?.username,c.correspondent?.display_name].join(' ').toLowerCase().includes(search.toLowerCase()));
 const active=(data?.conversations||[]).find(c=>c.conversation_id===selected&&!c.preference?.archived&&c.conversations?.kind==='direct');
 const messages=(data?.messages||[]).filter(m=>m.conversation_id===active?.conversation_id).slice().reverse();
 const unread=(data?.conversations||[]).filter(c=>c.unread&&!c.preference?.archived&&!c.preference?.muted).length;
 const currentDraft=active?(drafts[active.conversation_id]??(()=>{try{return localStorage.getItem(draftKey(userId,active.conversation_id))||''}catch{return ''}})()):'';
 function setDraft(value){if(!active)return;setDrafts(p=>({...p,[active.conversation_id]:value}));try{value?localStorage.setItem(draftKey(userId,active.conversation_id),value):localStorage.removeItem(draftKey(userId,active.conversation_id))}catch{}}
 async function send(e){
  e.preventDefault();
  if(!active||!currentDraft.trim()||busy)return;
  setBusy(true);setError('');
  try{
   await sendLetter(userId,active.conversation_id,currentDraft.trim());
   setDraft('');setData(await getLetters(userId));
  }catch(err){setError(err.message||'Your letter could not be sent. Your draft is preserved.')}
  finally{setBusy(false)}
 }
 if(quiet&&!open)return null;
 return <div className={'palace-chat-dock'+(open?' is-open':'')+(chatPaused?' is-quiet':'')}>
  {!open?<button type="button" className="palace-chat-launch" aria-label={'Open Palace chat'+(chatPaused?' · quiet mode':'')+(unread?' · '+unread+' unread':'')} aria-expanded={false} onClick={()=>setOpen(true)}><span aria-hidden="true">✉</span><span>Chat</span>{unread>0&&<b>{unread>99?'99+':unread}</b>}</button>:
   <section className="palace-chat-panel" aria-label="Palace quick chat">
    <header><div><small>PRIVATE PALACE LETTERS</small><strong>Chat while you wander</strong></div><div className="palace-chat-header-actions"><button type="button" onClick={()=>setChatPaused(v=>!v)} aria-pressed={chatPaused} title="Toggle quiet launcher" aria-label={chatPaused?'Restore full chat launcher':'Use small quiet chat launcher'}>{chatPaused?'◉':'◌'}</button><button type="button" onClick={()=>setOpen(false)} aria-label="Minimize Palace chat">−</button></div></header>
    <div className="palace-chat-tools"><input aria-label="Find a conversation" placeholder="Find a conversation…" value={search} onChange={e=>setSearch(e.target.value)}/><Link to="/letters" onClick={()=>setOpen(false)}>All letters ↗</Link></div>
    <div className="palace-chat-people" aria-label="Conversations">{visible.map(c=><button type="button" key={c.conversation_id} onClick={()=>setSelected(c.conversation_id)} aria-pressed={active?.conversation_id===c.conversation_id}>{c.unread?'● ':''}{c.correspondent?.display_name||c.correspondent?.username||'Palace member'}</button>)}</div>
    {error&&<p className="palace-chat-error" role="alert">{error}</p>}
    {!data&&!error?<p className="palace-chat-empty">Opening your letters…</p>:active?<><div className="palace-chat-correspondent"><strong>{active.correspondent?.display_name||active.correspondent?.username||'Private conversation'}</strong><small>Private correspondence · Palace boundaries apply</small></div>
     <div className="palace-chat-messages" role="log" aria-label="Conversation messages" aria-live="polite">{messages.length?messages.map(m=><div key={m.id} className={'palace-chat-bubble'+(m.sender_id===userId?' mine':'')}><p>{m.body}</p><small>{m.created_at?new Date(m.created_at).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}):''}</small></div>):<p className="palace-chat-empty">No messages yet. Begin with a hello.</p>}</div>
     <form className="palace-chat-compose" onSubmit={send}><textarea aria-label="Write a private message" placeholder="Write a little note…" rows={2} maxLength={3000} value={currentDraft} onChange={e=>setDraft(e.target.value)}/><button type="submit" disabled={busy||!currentDraft.trim()}>{busy?'Sending…':'Send ✦'}</button></form></>:
     <div className="palace-chat-empty"><p>No open conversations yet.</p><p>Start or accept a correspondence in Palace Letters, then chat here as you explore.</p><Link to="/letters" onClick={()=>setOpen(false)}>Open Palace Letters →</Link></div>}
    <footer><small>{chatPaused?'Quiet mode: the launcher stays small when minimised.':'Messages remain private. Minimise the drawer whenever you want to focus.'}</small></footer>
   </section>}
 </div>;
}
