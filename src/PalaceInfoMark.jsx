import React,{useCallback,useEffect,useId,useLayoutEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {palaceInfoPlacement} from './palaceInfoPlacement';
import './PalaceInfoMark.css';

/**
 * A small question or exclamation mark that works on touch, keyboard and mouse.
 * Help lives in a body-level portal, never inside the transformed/scrolling card.
 * Never use this alone for an error, consent requirement or essential warning.
 */
export default function PalaceInfoMark({title='How it works',variant='help',children,className=''}) {
 const id=useId();
 const root=useRef(null);
 const trigger=useRef(null);
 const panel=useRef(null);
 const leaveTimer=useRef(null);
 const [hovered,setHovered]=useState(false);
 const [focused,setFocused]=useState(false);
 const [pinned,setPinned]=useState(false);
 const [dismissed,setDismissed]=useState(false);
 const [placement,setPlacement]=useState(null);
 const open=!dismissed&&(hovered||focused||pinned);
 const daylight=Boolean(root.current?.closest('.palace-shell.daylight'));

 const cancelLeave=()=>{
  if(leaveTimer.current!==null){clearTimeout(leaveTimer.current);leaveTimer.current=null}
 };
 const close=useCallback(()=>{
  setDismissed(true);
  setPinned(false);
  setHovered(false);
  setFocused(false);
 },[]);
 const updatePlacement=useCallback(()=>{
  if(typeof window==='undefined'||!trigger.current)return;
  const rect=trigger.current.getBoundingClientRect();
  const viewport={width:window.innerWidth,height:window.innerHeight};
  const height=panel.current?.scrollHeight||360;
  const next=palaceInfoPlacement(rect,viewport,height);
  setPlacement(last=>last&&['left','top','width','maxHeight','placement'].every(key=>last[key]===next[key])?last:next);
 },[]);
 useLayoutEffect(()=>{if(open)updatePlacement();else setPlacement(null)},[open,children,updatePlacement]);
 useEffect(()=>{
  if(!open)return;
  const onOutside=event=>{
   if(!root.current?.contains(event.target)&&!panel.current?.contains(event.target))close();
  };
  const onKey=event=>{
   if(event.key==='Escape'){
    event.stopPropagation();
    cancelLeave();
    close();
    trigger.current?.focus();
   }
  };
  const reposition=()=>updatePlacement();
  document.addEventListener('pointerdown',onOutside);
  document.addEventListener('keydown',onKey);
  window.addEventListener('resize',reposition);
  window.addEventListener('scroll',reposition,true);
  window.visualViewport?.addEventListener('resize',reposition);
  window.visualViewport?.addEventListener('scroll',reposition);
  return()=>{
   document.removeEventListener('pointerdown',onOutside);
   document.removeEventListener('keydown',onKey);
   window.removeEventListener('resize',reposition);
   window.removeEventListener('scroll',reposition,true);
   window.visualViewport?.removeEventListener('resize',reposition);
   window.visualViewport?.removeEventListener('scroll',reposition);
  };
 },[open,close,updatePlacement]);
 useEffect(()=>()=>{if(leaveTimer.current!==null)clearTimeout(leaveTimer.current)},[]);
 const scheduleLeave=()=>{
  cancelLeave();
  leaveTimer.current=setTimeout(()=>{setHovered(false);leaveTimer.current=null},130);
 };
 const focusLeaving=event=>{
  if(!root.current?.contains(event.relatedTarget)&&!panel.current?.contains(event.relatedTarget)){
   setFocused(false);
   setDismissed(false);
  }
 };

 return <span ref={root} className={'palace-info-mark '+(variant==='warning'?'is-warning ':'')+className}>
  <button ref={trigger} type="button" className="palace-info-mark-trigger"
   aria-label={(variant==='warning'?'Important: ':'About: ')+title}
   aria-expanded={open}
   aria-controls={open?id:undefined}
   onPointerEnter={event=>{if(event.pointerType==='mouse'){cancelLeave();setDismissed(false);setHovered(true)}}}
   onPointerLeave={event=>{if(event.pointerType==='mouse')scheduleLeave()}}
   onFocus={()=>{if(!dismissed)setFocused(true)}}
   onBlur={focusLeaving}
   onClick={()=>{
    cancelLeave();
    const next=!pinned;
    setPinned(next);setHovered(false);setFocused(false);setDismissed(!next);
   }}>{variant==='warning'?'!':'?'}</button>
  {open&&typeof document!=='undefined'&&createPortal(
   <div id={id} ref={panel} role="group" aria-label={title}
    className={'palace-info-mark-popover palace-info-floating'+(daylight?' daylight':'')}
    style={{
     left:placement?.left??14,top:placement?.top??14,
     width:placement?.width??'min(360px, calc(100vw - 28px))',
     maxHeight:placement?.maxHeight??'min(460px, 65dvh)',
     visibility:placement?'visible':'hidden'
    }}
    onPointerEnter={event=>{if(event.pointerType==='mouse'){cancelLeave();setHovered(true)}}}
    onPointerLeave={event=>{if(event.pointerType==='mouse')scheduleLeave()}}
    onBlur={focusLeaving}>
    <div className="palace-info-popover-heading">
     <strong>{title}</strong>
     <button type="button" className="palace-info-close" aria-label={'Close '+title} onClick={()=>{cancelLeave();close();trigger.current?.focus()}}>×</button>
    </div>
    <div className="palace-info-mark-body">{children}</div>
   </div>,document.body)}
 </span>;
}
