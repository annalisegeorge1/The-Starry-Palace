import React,{useRef} from 'react';

/** Deliberate post actions: the ellipsis opens a menu, never silently mutes. */
export default function CommonsThreadMenu({title,onMute}){
 const details=useRef(null);
 return <details className="social-thread-menu">
  <summary className="social-thread-more" aria-label={'More options for '+(title||'conversation')} title="Conversation options"><span aria-hidden="true">···</span></summary>
  <div className="social-thread-menu-options">
   <button type="button" onClick={()=>{details.current?.removeAttribute('open');onMute()}}>Mute conversation</button>
  </div>
 </details>;
}
