import React,{useEffect,useMemo,useRef,useState} from 'react';
import {Link,useParams} from 'react-router-dom';
import {getPublishedWorkForReading} from './palaceData';
import {safeReaderHtml} from './readerHtmlSanitizer';
import {readPalaceChoice,readPalaceNumber,writePalacePreference} from './browserPreferences';
import {readerFlow} from './readerFlowModel';
import PalacePagedReader from './PalacePagedReader';
import {PalaceTopicHelp} from './PalaceGuidebookHints';

const layoutOptions=['book','full','journal','compact'];
const escapeHeading=s=>String(s||'Untitled chapter').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');

/** "Read Full Work" intentionally includes published chapters only.
 * Readers can open chapters individually for praise, private notes, rewards
 * and precise cross-device chapter progress. Whole-work position is local.
 */
export default function FullWorkReader({Frame}){
 const {slug}=useParams();
 const [result,setResult]=useState(undefined),[error,setError]=useState('');
 const [flow,setFlow]=useState(()=>readerFlow(readPalaceChoice('palace-reader-flow',['scroll','pages'],'scroll')));
 const [layout,setLayout]=useState(()=>readPalaceChoice('palace-reader-layout',layoutOptions,'full'));
 const [tone,setTone]=useState(()=>readPalaceChoice('palace-reader-tone',['palace','paper','soft'],'palace'));
 const [fontSize,setFontSize]=useState(()=>readPalaceNumber('palace-reader-font',20,16,28));
 const [place,setPlace]=useState(0),[controls,setControls]=useState(false);
 const contentRef=useRef(null),restored=useRef(false),placeRef=useRef(0);
 const key='palace-full-work-place:'+slug;
 useEffect(()=>{
  let active=true;
  restored.current=false;
  setResult(undefined);setError('');setPlace(0);placeRef.current=0;
  getPublishedWorkForReading(slug).then(rows=>{
   if(!active)return;
   setResult(rows);
   try{const v=Number(localStorage.getItem(key));if(Number.isFinite(v))setPlace(Math.max(0,Math.min(100,v)))}catch{}
  }).catch(e=>{if(active)setError(e.message||'Unable to open the full work')});
  return()=>{active=false};
 },[slug,key]);
 const html=useMemo(()=>result?.chapters?.map((ch,i)=>'<section class="palace-full-chapter" id="full-chapter-'+ch.id+'"><h2>'+(i+1)+'. '+escapeHeading(ch.title)+'</h2><div class="chapter-text restored">'+safeReaderHtml(ch.body_html||'')+'</div></section>').join('')||'',[result]);
 function remember(pct){
  const v=Math.max(0,Math.min(100,Number(pct)||0));placeRef.current=v;
  try{localStorage.setItem(key,String(Math.round(v)))}catch{}
 }
 useEffect(()=>{
  if(!result||flow!=='scroll')return;
  let delay=0;
  const restore=()=>{
   const el=contentRef.current;if(!el||restored.current)return;
   restored.current=true;
   if(place>0){
    const top=window.scrollY+el.getBoundingClientRect().top;
    const usable=Math.max(1,el.offsetHeight-window.innerHeight*.6);
    window.scrollTo({top:top+usable*(place/100),behavior:'auto'});
   }
  };
  delay=window.setTimeout(restore,180);
  function onScroll(){
   if(!restored.current||!contentRef.current)return;
   const el=contentRef.current;
   const top=window.scrollY+el.getBoundingClientRect().top;
   const progress=((window.scrollY+window.innerHeight*.45-top)/Math.max(1,el.offsetHeight))*100;
   remember(progress);
  }
  window.addEventListener('scroll',onScroll,{passive:true});
  window.addEventListener('pagehide',onScroll);
  return()=>{window.clearTimeout(delay);window.removeEventListener('scroll',onScroll);window.removeEventListener('pagehide',onScroll)};
 },[result,flow]);
 function chooseFlow(value){
  const next=readerFlow(value);setFlow(next);restored.current=false;
  writePalacePreference('palace-reader-flow',next);
 }
 function chooseLayout(value){if(layoutOptions.includes(value)){setLayout(value);writePalacePreference('palace-reader-layout',value)}}
 const work=result?.work, chapters=result?.chapters||[];
 return <Frame>
  {error&&<div className="live-state error-state" role="alert">{error}</div>}
  {result===undefined&&!error&&<div className="live-state">Opening all published chapters…</div>}
  {result===null&&<div className="live-state">This full work is not available.</div>}
  {work&&<article className={'reader-page restored palace-full-work-reader measure-wide tone-'+tone+' layout-'+layout}>
   <header className="palace-full-reader-heading">
    <Link to={'/work/'+work.slug}>← Story overview</Link>
    <p className="eyebrow">READ THE FULL WORK <PalaceTopicHelp id="reading-modes"/></p>
    <h1>{work.title}</h1>
    <p>{chapters.length} published chapter{chapters.length===1?'':'s'} · {chapters.reduce((n,ch)=>n+(Number(ch.word_count)||0),0).toLocaleString()} words</p>
    <p>Read the published chapters together without changing the author's work. Drafts and scheduled chapters are excluded.</p>
   </header>
   <div className="palace-full-reader-actions">
    <button type="button" className="quiet-button" onClick={()=>chooseFlow(flow==='scroll'?'pages':'scroll')}>{flow==='scroll'?'Turn pages':'Continuous scrolling'}</button>
    <button type="button" className="quiet-button" aria-expanded={controls} onClick={()=>setControls(x=>!x)}>Aa Appearance</button>
    <label>Jump to chapter <select defaultValue="" onChange={e=>{const ch=chapters.find(x=>x.id===e.target.value);if(!ch)return;if(flow==='pages'){window.location.href='/work/'+encodeURIComponent(work.slug)+'/chapter/'+ch.id;return}document.getElementById('full-chapter-'+ch.id)?.scrollIntoView({behavior:'smooth',block:'start'})}}><option value="">Choose…</option>{chapters.map((ch,i)=><option key={ch.id} value={ch.id}>{i+1}. {ch.title}</option>)}</select></label>
   </div>
   {controls&&<section className="reader-controls-panel enhanced palace-full-work-settings" aria-label="Full work reading appearance">
    <div className="reader-flow-select"><span>Reading flow</span><div><button type="button" className={flow==='scroll'?'active':''} aria-pressed={flow==='scroll'} onClick={()=>chooseFlow('scroll')}>Scroll</button><button type="button" className={flow==='pages'?'active':''} aria-pressed={flow==='pages'} onClick={()=>chooseFlow('pages')}>Turn pages</button></div></div>
    <div><span>Text size</span><div><button type="button" onClick={()=>{setFontSize(x=>{const v=Math.max(16,x-1);writePalacePreference('palace-reader-font',v);return v})}}>A−</button><strong>{fontSize}px</strong><button type="button" onClick={()=>{setFontSize(x=>{const v=Math.min(28,x+1);writePalacePreference('palace-reader-font',v);return v})}}>A＋</button></div></div>
    <div><span>Page layout</span><div>{layoutOptions.map(v=><button type="button" key={v} className={layout===v?'active':''} aria-pressed={layout===v} onClick={()=>chooseLayout(v)}>{v==='full'?'Full Page':v[0].toUpperCase()+v.slice(1)}</button>)}</div></div>
    <div><span>Reading tone</span><div>{['palace','paper','soft'].map(v=><button type="button" key={v} className={tone===v?'active':''} aria-pressed={tone===v} onClick={()=>{setTone(v);writePalacePreference('palace-reader-tone',v)}}>{v==='soft'?'Soft grey':v[0].toUpperCase()+v.slice(1)}</button>)}</div></div>
   </section>}
   {chapters.length?flow==='pages'?
    <PalacePagedReader key={slug+':full'} html={html} fontSize={fontSize} initialPercent={place} onPositionChange={remember} label="Turn pages through the full published work"/>:
    <div ref={contentRef} className="palace-full-reader-content" style={{fontSize:fontSize+'px'}} dangerouslySetInnerHTML={{__html:html}}/>:
    <p>No published chapters are available to read.</p>}
   <footer className="reader-nav"><Link to={'/work/'+work.slug}>← Back to the story</Link><p>For chapter-specific notes, reactions, and reading rewards, open an individual chapter.</p></footer>
  </article>}
 </Frame>;
}
