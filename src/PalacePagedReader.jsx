import React,{useEffect,useLayoutEffect,useRef,useState} from 'react';
import {readerPageNumber,readerPagePercent} from './readerFlowModel.js';

/** Responsive CSS-column pagination preserves the sanitized chapter HTML
 * without cutting words into arbitrary character chunks. Works with touch,
 * next/previous buttons and keyboard arrow keys. Page controls don't award
 * points or claim chapter completion.
 */
export default function PalacePagedReader({html='',fontSize=20,initialPercent=0,onPositionChange,label='Reading pages'}){
 const viewportRef=useRef(null);
 const columnRef=useRef(null);
 const touchedRef=useRef(false);
 const initialRef=useRef(false);
 const touchRef=useRef(null);
 const [geometry,setGeometry]=useState({width:0,height:0,pages:1});
 const [page,setPage]=useState(1);
 useLayoutEffect(()=>{
  const viewport=viewportRef.current,column=columnRef.current;
  if(!viewport||!column)return;
  let raf=0;
  function measure(){
   cancelAnimationFrame(raf);
   raf=requestAnimationFrame(()=>{
    if(!viewportRef.current||!columnRef.current)return;
    const width=Math.max(1,Math.floor(viewport.clientWidth));
    const height=Math.max(260,Math.floor(Math.min(Math.max(320,window.innerHeight-220),830)));
    column.style.setProperty('--palace-page-width',width+'px');
    column.style.setProperty('--palace-page-height',height+'px');
    // After styles settle, the columns' scroll width is the page count.
    requestAnimationFrame(()=>{
     if(!columnRef.current||!viewportRef.current)return;
     const total=Math.max(1,Math.ceil((column.scrollWidth-1)/width));
     setGeometry({width,height,pages:total});
     setPage(current=>initialRef.current?Math.min(Math.max(1,current),total):readerPageNumber(initialPercent,total));
     initialRef.current=true;
    });
   });
  }
  const resize=typeof ResizeObserver==='function'?new ResizeObserver(measure):null;
  resize?.observe(viewport);
  window.addEventListener('resize',measure);
  measure();
  return()=>{cancelAnimationFrame(raf);resize?.disconnect();window.removeEventListener('resize',measure)};
 },[html,fontSize]);
 useEffect(()=>{
  if(touchedRef.current||!initialRef.current)return;
  setPage(readerPageNumber(initialPercent,geometry.pages));
 },[initialPercent,geometry.pages]);
 function toPage(next){
  const n=Math.max(1,Math.min(geometry.pages,Math.floor(next)));
  if(n===page)return;
  touchedRef.current=true;
  setPage(n);
  onPositionChange?.(readerPagePercent(n,geometry.pages));
 }
 function keys(e){
  if(e.target!==e.currentTarget)return;
  if(e.key==='ArrowRight'||e.key==='PageDown'){e.preventDefault();toPage(page+1)}
  if(e.key==='ArrowLeft'||e.key==='PageUp'){e.preventDefault();toPage(page-1)}
 }
 function touchStart(e){touchRef.current={x:e.touches[0]?.clientX,y:e.touches[0]?.clientY}}
 function touchEnd(e){const start=touchRef.current;touchRef.current=null;if(!start)return;
  const dx=(e.changedTouches[0]?.clientX||0)-start.x;
  const dy=(e.changedTouches[0]?.clientY||0)-start.y;
  if(Math.abs(dx)>55&&Math.abs(dx)>Math.abs(dy)*1.3)toPage(page+(dx<0?1:-1));
 }
 return <section className="palace-page-turn" aria-label={label}>
  <div className="palace-page-viewport" ref={viewportRef} tabIndex={0} onKeyDown={keys} onTouchStart={touchStart} onTouchEnd={touchEnd}>
   <div ref={columnRef} className="palace-page-columns" style={{fontSize:fontSize+'px',transform:'translate3d('+(-Math.max(0,page-1)*geometry.width)+'px,0,0)'}} dangerouslySetInnerHTML={{__html:html}}/>
  </div>
  <nav className="palace-page-nav" aria-label="Turn reading pages">
   <button type="button" onClick={()=>toPage(page-1)} disabled={page<=1}>← Previous page</button>
   <span aria-live="polite">Page {page} of {geometry.pages}</span>
   <button type="button" onClick={()=>toPage(page+1)} disabled={page>=geometry.pages}>Next page →</button>
  </nav>
  <p className="palace-page-hint">Swipe horizontally on a phone, or use the arrow keys while the page is focused.</p>
 </section>;
}
