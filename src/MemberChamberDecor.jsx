import React,{useEffect,useState}from'react';
import{getMemberChamberDecor,saveMemberChamberDecor}from'./memberChamberDecorData';
import './member-chamber-decor.css';
export const CHAMBER_BACKDROPS=[['midnight','Midnight Velvet','☾','Included'],['moonwater','Moonwater Glass','≈','Included'],['violet-dusk','Violet Hour','✧','Included'],['aurora','Aurora Veil','⌁','Publish 3 chapters'],['star-garden','Star Garden','✿','Publish 1,000 words'],['crystal-sky','Crystal Sky','◇','Reach 150 lifetime points']];
export const CHAMBER_ORNAMENTS=[['none','Unadorned','·','Included'],['stars','Falling Stars','✧','Included'],['crescent','Crescent Halo','☾','Publish 1 chapter'],['ink-vines','Ink Vines','❦','Publish 500 words'],['silver-branches','Silver Branches','♧','Read 5 rewarded chapters'],['royal-constellation','Royal Constellation','♛','Reach 300 lifetime points']];
export const CHAMBER_LAYOUTS=[['classic','Classic Gallery','▦','Included'],['compact','Collector’s Cabinet','▤','Included'],['spotlight','Spotlight Gallery','✦','Publish 1 chapter']];
const unlocked=(type,key,achievements)=>key==='midnight'||key==='moonwater'||key==='violet-dusk'||key==='none'||key==='stars'||key==='classic'||key==='compact'||!!achievements?.[key];
export function useChamberDecor(memberId){
 const[decor,setDecor]=useState(null);
 useEffect(()=>{let active=true;setDecor(null);if(memberId)getMemberChamberDecor(memberId).then(x=>{if(active)setDecor(x)}).catch(()=>{});return()=>{active=false}},[memberId]);
 return[decor,setDecor];
}
export default function MemberChamberDecor({decor,onSaved,own}){
 const[open,setOpen]=useState(false),[draft,setDraft]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState('');
 useEffect(()=>{if(decor)setDraft({backdrop:decor.backdrop,ornament:decor.ornament,gallery_layout:decor.gallery_layout})},[decor?.backdrop,decor?.ornament,decor?.gallery_layout]);
 if(!own||!decor)return null;
 const previews=[['backdrop',CHAMBER_BACKDROPS,'Background moods'],['ornament',CHAMBER_ORNAMENTS,'Decorative details'],['gallery_layout',CHAMBER_LAYOUTS,'Collection layout']];
 async function save(){if(!draft||busy)return;setBusy(true);setError('');try{const updated=await saveMemberChamberDecor(draft.backdrop,draft.ornament,draft.gallery_layout);onSaved(updated);setOpen(false)}catch(e){setError(e.message)}finally{setBusy(false)}}
 return <section className="chamber-decorator"><header><div><p className="eyebrow">THE CHAMBER ATELIER</p><h2>Make your room feel like you.</h2><p>Choose a moonlit atmosphere, ceremonial ornaments and how your treasures are displayed. More styles unlock as you write and read.</p></div><button onClick={()=>{setOpen(v=>!v);setError('')}} type="button">{open?'Close Atelier':'Decorate my chamber ✧'}</button></header>
 {open&&draft&&<div className="chamber-decorator-workspace">{previews.map(([key,options,name])=><fieldset key={key}><legend>{name}</legend><div className="chamber-decor-choices">{options.map(([id,label,glyph,requirement])=>{const available=unlocked(key,id,decor.unlocks);return <button type="button" key={id} disabled={!available||busy} className={'chamber-decor-option '+(draft[key]===id?'chosen ':'')+'decor-'+id} aria-pressed={draft[key]===id} onClick={()=>setDraft(current=>({...current,[key]:id}))}><span aria-hidden="true">{glyph}</span><strong>{label}</strong><small>{available?'Available':'🔒 '+requirement}</small></button>})}</div></fieldset>)}
 {error&&<p role="alert">{error}</p>}<footer><button type="button" onClick={()=>{setDraft({backdrop:decor.backdrop,ornament:decor.ornament,gallery_layout:decor.gallery_layout});setOpen(false)}}>Cancel</button><button type="button" disabled={busy||!draft} onClick={save}>{busy?'Saving…':'Apply to my chamber ✦'}</button></footer></div>}
 </section>;
}
