import {useEffect} from 'react';

const FOCUSABLE='a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

function availableControls(dialog){
 return [...dialog.querySelectorAll(FOCUSABLE)].filter(el=>{
  if(el.getAttribute('aria-hidden')==='true')return false;
  if(el.hasAttribute('hidden'))return false;
  if(el.closest('[hidden],[inert]'))return false;
  const css=typeof window==='undefined'?null:window.getComputedStyle(el);
  return !css||css.display!=='none'&&css.visibility!=='hidden';
 });
}

/**
 * Keep keyboard navigation inside an open Palace overlay.
 * Restore focus to the invoking control when the panel disappears.
 */
export function usePalaceDialogFocusTrap(isOpen,panelId,returnFocusSelector){
 useEffect(()=>{
  if(!isOpen||typeof document==='undefined')return;
  const panel=document.getElementById(panelId);
  if(!panel)return;
  // React may have already focused an autoFocus input during the mount commit.
  const active=document.activeElement;
  const previous=panel.contains(active)&&returnFocusSelector?document.querySelector(returnFocusSelector):active;
  const initial=panel.querySelector('[autofocus]')||availableControls(panel)[0];
  initial?.focus?.({preventScroll:true});
  const onTab=event=>{
   if(event.key!=='Tab')return;
   const controls=availableControls(panel);
   if(!controls.length){
    event.preventDefault();
    panel.focus?.({preventScroll:true});
    return;
   }
   const first=controls[0],last=controls[controls.length-1];
   const current=document.activeElement;
   if(event.shiftKey){
    if(current===first||!panel.contains(current)){
     event.preventDefault();last.focus({preventScroll:true});
    }
   }else if(current===last||!panel.contains(current)){
    event.preventDefault();first.focus({preventScroll:true});
   }
  };
  document.addEventListener('keydown',onTab);
  return()=>{
   document.removeEventListener('keydown',onTab);
   if(previous&&previous.isConnected)previous.focus?.({preventScroll:true});
  };
 },[isOpen,panelId,returnFocusSelector]);
}
