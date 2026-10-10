import React,{useEffect,useState} from 'react';
import {PALACE_EMOJI_GROUPS} from './palaceEmoji';
import './palace-emoji-picker.css';

/* No external emoji API, no tracker and no remote font required. */
export default function PalaceEmojiPicker({onPick,label='Emoji'}){
 const[open,setOpen]=useState(false);
 const[query,setQuery]=useState('');
 useEffect(()=>{if(!open)return;const close=e=>{if(e.key==='Escape')setOpen(false)};document.addEventListener('keydown',close);return()=>document.removeEventListener('keydown',close)},[open]);
 return <div className="palace-emoji-picker">
  <button type="button" className="palace-emoji-toggle" aria-label={'Choose emoji for '+label} aria-expanded={open} onClick={()=>setOpen(v=>!v)}>😊 <span>Emoji</span></button>
  {open&&<div className="palace-emoji-panel" role="group" aria-label={'Emoji picker for '+label}>
   <header><strong>✧ Little expressions</strong><button type="button" aria-label="Close emoji picker" onClick={()=>setOpen(false)}>×</button></header>
   <input type="search" aria-label="Find emoji category" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Faces, hearts, nature…"/>
   <div className="palace-emoji-scroll">{PALACE_EMOJI_GROUPS.filter(group=>!query.trim()||group.name.toLowerCase().includes(query.trim().toLowerCase())||group.symbols.includes(query.trim())).map(group=><section key={group.name}><small>{group.name}</small><div className="palace-emoji-grid">{group.symbols.map((symbol,i)=><button type="button" key={symbol+'-'+i} aria-label={'Insert '+symbol} onClick={()=>{onPick(symbol);setOpen(false);setQuery('')}}>{symbol}</button>)}</div></section>)}{!PALACE_EMOJI_GROUPS.some(group=>!query.trim()||group.name.toLowerCase().includes(query.trim().toLowerCase())||group.symbols.includes(query.trim()))&&<p>No emoji found. Try a category name.</p>}</div>
  </div>}
 </div>;
}
