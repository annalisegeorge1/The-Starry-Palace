import React,{useEffect,useId,useRef,useState} from 'react';
import './PalaceInfoMark.css';

/**
 * Progressive information for Palace features and competitions.
 * Mouse: hover. Touch: tap to pin. Keyboard: focus, Enter/Space, Escape.
 * Never use for the ONLY presentation of consent, legal notices or a submission error.
 */
export default function PalaceInfoMark({title='How it works',variant='help',children,className=''}) {
 const id=useId();
 const root=useRef(null);
 const [hovered,setHovered]=useState(false);
 const [focused,setFocused]=useState(false);
 const [pinned,setPinned]=useState(false);
 const open=hovered||focused||pinned;
 useEffect(()=>{
  if(!pinned)return;
  const closeOutside=event=>{if(root.current&&!root.current.contains(event.target))setPinned(false)};
  document.addEventListener('pointerdown',closeOutside);
  return()=>document.removeEventListener('pointerdown',closeOutside);
 },[pinned]);
 const close=()=>{setPinned(false);setHovered(false);setFocused(false)};
 return <div ref={root} className={'palace-info-mark '+(variant==='warning'?'is-warning ':'')+className}
  onPointerEnter={event=>{if(event.pointerType==='mouse')setHovered(true)}}
  onPointerLeave={event=>{if(event.pointerType==='mouse')setHovered(false)}}
  onFocus={()=>setFocused(true)}
  onBlur={event=>{if(!event.currentTarget.contains(event.relatedTarget))setFocused(false)}}
  onKeyDown={event=>{if(event.key==='Escape'){event.stopPropagation();close();root.current?.querySelector('button')?.focus()}}}>
  <button type="button" className="palace-info-mark-trigger"
   aria-label={(variant==='warning'?'Important: ':'About: ')+title}
   aria-expanded={open}
   aria-controls={id}
   onClick={()=>setPinned(value=>!value)}>{variant==='warning'?'!':'?'}</button>
  {open&&<div id={id} role="group" aria-label={title} className="palace-info-mark-popover">
   <strong>{title}</strong><div className="palace-info-mark-body">{children}</div>
  </div>}
 </div>;
}
