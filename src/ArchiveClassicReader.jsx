import React,{useEffect,useMemo,useRef,useState} from 'react';
import {structureClassicText} from './classicTextStructure';
import {paginateClassicBlocks,classicContents,clampClassicPage,classicPageKey} from './archiveReaderModel';
import {readPalaceChoice,readPalaceNumber,writePalacePreference,removePalacePreference} from './browserPreferences';
import './archive-classic-reader.css';

const FONT_KEY='palace-classic-font';
const TONE_KEY='palace-classic-tone';
const WIDTH_KEY='palace-classic-width';
const LEADING_KEY='palace-classic-leading';
const FONT_MIN=16,FONT_MAX=28;

export default function ArchiveClassicReader({record,text}){
 const blocks=useMemo(()=>structureClassicText(text?.body_text||''),[text?.body_text]);
 const pages=useMemo(()=>paginateClassicBlocks(blocks),[blocks]);
 const contents=useMemo(()=>classicContents(pages),[pages]);
 const pageKey=classicPageKey(record?.id);
 const [page,setPage]=useState(()=>clampClassicPage(readPalaceNumber(pageKey,0,0,Math.max(0,pages.length-1)),pages.length));
 const [fontSize,setFontSize]=useState(()=>readPalaceNumber(FONT_KEY,19,FONT_MIN,FONT_MAX));
 const [tone,setTone]=useState(()=>readPalaceChoice(TONE_KEY,['palace','paper','soft'],'palace'));
 const [width,setWidth]=useState(()=>readPalaceChoice(WIDTH_KEY,['narrow','standard','wide'],'standard'));
 const [leading,setLeading]=useState(()=>readPalaceChoice(LEADING_KEY,['compact','comfortable','airy'],'comfortable'));
 const readerRef=useRef(null);
 const pendingHeadingRef=useRef(null);
 const pendingPageTopRef=useRef(page>0);
 const [chosenHeading,setChosenHeading]=useState(null);
 const [editionOpen,setEditionOpen]=useState(false);
 const current=clampClassicPage(page,pages.length);
 const total=pages.length;
 const translations=(text?.translations||[]).filter(item=>item?.translator_name);
 const translators=[...new Set(translations.map(item=>String(item.translator_name).trim()).filter(Boolean))];
 const sourceUrl=String(text?.source_url||'');
 const safeSource=/^https:\/\/[^\s]+$/i.test(sourceUrl)?sourceUrl:null;
 useEffect(()=>{writePalacePreference(pageKey,current)},[pageKey,current]);
 useEffect(()=>{
  if(pendingHeadingRef.current!==null){
   const heading=readerRef.current?.querySelector('[data-classic-heading="'+pendingHeadingRef.current+'"]');
   if(heading&&typeof heading.scrollIntoView==='function')heading.scrollIntoView({block:'start',behavior:'auto'});
   pendingHeadingRef.current=null;
   pendingPageTopRef.current=false;
  }else if(pendingPageTopRef.current){
   const text=readerRef.current?.querySelector('.archive-classic-page');
   if(text&&typeof text.scrollIntoView==='function')text.scrollIntoView({block:'start',behavior:'auto'});
   pendingPageTopRef.current=false;
  }
 },[current,chosenHeading]);
 function changePage(next){
  const n=clampClassicPage(next,total);
  if(n===current)return;
  pendingPageTopRef.current=true;
  setChosenHeading(null);
  setPage(n);
 }
 function jumpToHeading(section){
  if(!section)return;
  pendingHeadingRef.current=section.sourceIndex;
  changePage(section.pageIndex);
  setChosenHeading(section.sourceIndex);
 }
 function changeSetting(kind,value){
  if(kind==='font'){const size=Math.max(FONT_MIN,Math.min(FONT_MAX,Number(value)));setFontSize(size);writePalacePreference(FONT_KEY,size)}
  if(kind==='tone'){setTone(value);writePalacePreference(TONE_KEY,value)}
  if(kind==='width'){setWidth(value);writePalacePreference(WIDTH_KEY,value)}
  if(kind==='leading'){setLeading(value);writePalacePreference(LEADING_KEY,value)}
 }
 function resetSettings(){
  setFontSize(19);setTone('palace');setWidth('standard');setLeading('comfortable');
  for(const key of [FONT_KEY,TONE_KEY,WIDTH_KEY,LEADING_KEY])removePalacePreference(key);
 }
 const activeHeading=[...contents].reverse().find(item=>item.pageIndex<=current);
 return <article ref={readerRef} className={'archive-reader-sheet archive-classic-experience tone-'+tone+' width-'+width+' leading-'+leading} style={{'--classic-font-size':fontSize+'px'}}>
  <header className="archive-classic-frontmatter">
   <p className="archive-classic-kicker">PALACE CLASSICS · {record?.host_mode==='excerpt'?'HOSTED EXCERPT':'HOSTED EDITION'}</p>
   <h3>{record?.title||'Untitled archive work'}</h3>
   <p>By <strong>{record?.creator_name||'Author not recorded'}</strong>{translators.length>0&&<> · Recorded translators: <strong>{translators.join(', ')}</strong></>}</p>
   <div className="archive-classic-brief">
    <span>{(Number(text?.word_count)||0).toLocaleString()} {record?.category==='original_language_classic'?'characters':'words'} recorded</span>
    {record?.original_language&&<span>{record.original_language}</span>}
    {text?.first_publication_year&&<span>Source publication: {text.first_publication_year}</span>}
   </div>
   {record?.host_mode==='excerpt'&&<p className="archive-classic-excerpt-note">Only the hosted excerpt is available in this reader. The complete work is not implied.</p>}
   <button type="button" className="archive-classic-edition-jump" onClick={()=>{
    setEditionOpen(true);
    const details=readerRef.current?.querySelector('.archive-classic-edition');
    if(details&&typeof details.scrollIntoView==='function')details.scrollIntoView({block:'start',behavior:'auto'});
   }}>✧ View edition, source and translator details ↓</button>
  </header>
  <div className="archive-classic-reader-toolbar" aria-label="Classic reading appearance">
   <label>Text size
    <span className="archive-classic-font-steps"><button type="button" aria-label="Decrease classic text size" disabled={fontSize<=FONT_MIN} onClick={()=>changeSetting('font',fontSize-1)}>A−</button><output>{fontSize}px</output><button type="button" aria-label="Increase classic text size" disabled={fontSize>=FONT_MAX} onClick={()=>changeSetting('font',fontSize+1)}>A＋</button></span>
   </label>
   <label>Page tone<select value={tone} onChange={e=>changeSetting('tone',e.target.value)}><option value="palace">Moonlit</option><option value="paper">Paper</option><option value="soft">Soft grey</option></select></label>
   <label>Text width<select value={width} onChange={e=>changeSetting('width',e.target.value)}><option value="narrow">Narrow</option><option value="standard">Book</option><option value="wide">Wide</option></select></label>
   <label>Line spacing<select value={leading} onChange={e=>changeSetting('leading',e.target.value)}><option value="compact">Compact</option><option value="comfortable">Comfortable</option><option value="airy">Airy</option></select></label>
   <button type="button" className="archive-classic-reset" onClick={resetSettings}>Reset appearance</button>
  </div>
  <div className="archive-classic-locator">
   {contents.length>0?<label>Contents
    <select aria-label="Jump to source chapter or section" value={chosenHeading!==null?String(chosenHeading):activeHeading?String(activeHeading.sourceIndex):''} onChange={e=>{const item=contents.find(section=>String(section.sourceIndex)===e.target.value);if(item)jumpToHeading(item)}}>
     {!activeHeading&&<option value="">Choose a section</option>}
     {contents.map(item=><option key={item.sourceIndex} value={String(item.sourceIndex)}>{item.title}</option>)}
    </select>
   </label>:<span className="archive-classic-no-contents">This edition has no detected chapter headings. Navigate by reading page.</span>}
   <label>Reading page
    <select aria-label="Jump to reading page" value={current} onChange={e=>changePage(e.target.value)}>{pages.map((_,index)=><option key={index} value={index}>{index+1} of {total}</option>)}</select>
   </label>
   <span className="archive-classic-progress" aria-live="polite">{total?Math.round(((current+1)/total)*100):0}% through this hosted text</span>
  </div>
  <section className="archive-reader-copy archive-classic-page" aria-label={'Hosted text — reading page '+(current+1)}>
   {(pages[current]||[]).map(block=>block.kind==='heading'?<h2 key={block.sourceIndex} data-classic-heading={block.sourceIndex}>{block.text}</h2>:block.kind==='verse'?<p key={block.sourceIndex} className="archive-classic-verse">{block.text}</p>:<p key={block.sourceIndex}>{block.text}</p>)}
   {total===0&&<p>There is no readable text in this edition yet.</p>}
  </section>
  <nav className="archive-classic-page-nav" aria-label="Classic reading pages">
   <button type="button" disabled={current===0} onClick={()=>changePage(current-1)}>← Previous page</button>
   <span aria-live="polite">Reading page {total?current+1:0} of {total}</span>
   <button type="button" disabled={current>=total-1} onClick={()=>changePage(current+1)}>Next page →</button>
  </nav>
  <p className="archive-classic-local-note">Your reading page and appearance are remembered on this device only. Reading pages are display sections, not pages from the original edition.</p>
  <details className="archive-classic-edition" open={editionOpen} onToggle={e=>setEditionOpen(e.currentTarget.open)}>
   <summary>Edition, translation &amp; source details</summary>
   <dl>
    <div><dt>Source</dt><dd>{text?.source_title||'Source title not recorded'}</dd></div>
    {text?.edition_note&&<div><dt>Edition notes</dt><dd>{text.edition_note}</dd></div>}
    {text?.first_publication_year&&<div><dt>First publication</dt><dd>{text.first_publication_year}</dd></div>}
    {translations.length>0&&<div><dt>Translation records</dt><dd><p>These are associated translation records; the hosted text may use a different edition. Consult the source to confirm the translation.</p>{translations.map((item,i)=><p key={i}>{item.translator_name}{item.language?' · '+item.language:''}{item.scope?' · '+item.scope:''}{item.notes?' — '+item.notes:''}</p>)}</dd></div>}
    {record?.provenance_summary&&<div><dt>Provenance</dt><dd>{record.provenance_summary}</dd></div>}
    {record?.known_gaps&&<div><dt>Known gaps</dt><dd>{record.known_gaps}</dd></div>}
    {text?.source_license&&<div><dt>Source license</dt><dd>{text.source_license}</dd></div>}
    {record?.rights_status&&<div><dt>Rights review</dt><dd>{String(record.rights_status).replaceAll('_',' ')}</dd></div>}
   </dl>
   {safeSource&&<a href={safeSource} rel="noopener noreferrer" target="_blank">View the source edition ↗</a>}
  </details>
 </article>;
}
