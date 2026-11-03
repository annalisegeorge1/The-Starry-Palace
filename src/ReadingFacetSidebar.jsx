import React,{useEffect,useMemo,useRef,useState} from 'react';
import {Link} from 'react-router-dom';
import {createPortal} from 'react-dom';
import {READING_SORT_OPTIONS,READING_FACET_ORDER,READING_FACET_NAMES} from './readingFacetModel';
import PalaceRelationshipFilters from './PalaceRelationshipFilters';

// The quick checklist ends at Genres. All later categories remain searchable.
const QUICK_TAG_CATEGORIES=new Set(['fandom','character','relationship','warning','genre']);
import './reading-faceted-browse.css';

/**
 * Compact archive filters. Both lanes use the same real tag IDs, so a chosen
 * include or exclude always reaches the published archive/loaded shelf filter.
 * Names are looked up in the canonical Palace directory before selection.
 */
export default function ReadingFacetSidebar({
 facets=[],sort='updated',onSort,rating='all',onRating,status='all',onStatus,
 included=[],excluded=[],onToggle,onClear,relationshipIncluded=[],relationshipExcluded=[],
 onToggleRelationship=()=>{},loadedCount=0,hasMore=false,archiveWide=false,
 onSearchTags,onTagIdentified,selectedTagNames={},resultsCount=null,onShowResults=()=>{}
}){
 const [open,setOpen]=useState(false);
 const sidebarRef=useRef(null);
 const [footerPosition,setFooterPosition]=useState({visible:true,bottom:88});
 // Match the real dock instead of guessing at its height. Hide this fixed
 // action once the reader has scrolled past the filter to the story cards.
 useEffect(()=>{
  if(!open)return;
  const root=sidebarRef.current;
  if(!root)return;
  const dock=document.querySelector('.mobile-palace-dock');
  const update=()=>{
   const rect=root.getBoundingClientRect();
   const dockRect=dock?.getBoundingClientRect();
   const hasDock=Boolean(dockRect&&dockRect.width>0&&dockRect.height>0
    &&window.getComputedStyle(dock).display!=='none');
   const viewportHeight=window.innerHeight||document.documentElement.clientHeight;
   const dockTop=hasDock?dockRect.top:viewportHeight;
   const bottom=hasDock?Math.max(16,Math.ceil(viewportHeight-dockTop+10)):16;
   // Zero-size rectangles are returned in non-layout test environments.
   const measurable=rect.width>0||rect.height>0;
   const visible=!measurable||(rect.bottom>80&&rect.top<dockTop-68);
   setFooterPosition(prev=>prev.visible===visible&&prev.bottom===bottom?prev:{visible,bottom});
  };
  update();
  window.addEventListener('scroll',update,{passive:true});
  window.addEventListener('resize',update);
  document.addEventListener('scroll',update,true);
  window.visualViewport?.addEventListener('resize',update);
  const observer=typeof ResizeObserver==='function'?new ResizeObserver(update):null;
  if(observer){observer.observe(root);if(dock)observer.observe(dock)}
  return()=>{
   window.removeEventListener('scroll',update);
   window.removeEventListener('resize',update);
   document.removeEventListener('scroll',update,true);
   window.visualViewport?.removeEventListener('resize',update);
   observer?.disconnect();
  };
 },[open]);
 const [expandedModes,setExpandedModes]=useState({include:true,exclude:false});
 const [searches,setSearches]=useState({include:'',exclude:''});
 const [directory,setDirectory]=useState({include:[],exclude:[]});
 const [busy,setBusy]=useState({include:false,exclude:false});
 const [errors,setErrors]=useState({include:'',exclude:''});
 const [expandedGroups,setExpandedGroups]=useState({});
 const active=included.length+excluded.length+relationshipIncluded.length+relationshipExcluded.length+(rating!=='all'?1:0)+(status!=='all'?1:0);
 const modes=['include','exclude'];
 const includeQ=searches.include.trim().toLocaleLowerCase();
 const excludeQ=searches.exclude.trim().toLocaleLowerCase();

 useEffect(()=>{
  const timeouts=[];
  const pending=[];
  for(const mode of modes){
   const q=mode==='include'?includeQ:excludeQ;
   if(!archiveWide||!q||typeof onSearchTags!=='function'){
    setDirectory(prev=>({...prev,[mode]:[]}));
    setBusy(prev=>({...prev,[mode]:false}));
    setErrors(prev=>({...prev,[mode]:''}));
    continue;
   }
   let alive=true;
   pending.push(()=>{alive=false});
   setBusy(prev=>({...prev,[mode]:true}));
   setErrors(prev=>({...prev,[mode]:''}));
   timeouts.push(setTimeout(()=>{
    Promise.resolve().then(()=>onSearchTags(q,'all',60)).then(rows=>{
     if(alive)setDirectory(prev=>({...prev,[mode]:(rows||[]).filter(t=>t?.id&&t?.name&&['canonical','community'].includes(t.status))}));
    }).catch(()=>{
     if(alive){setDirectory(prev=>({...prev,[mode]:[]}));setErrors(prev=>({...prev,[mode]:'Tag suggestions are temporarily unavailable. Try again.'}));}
    }).finally(()=>{if(alive)setBusy(prev=>({...prev,[mode]:false}))});
   },260));
  }
  return()=>{pending.forEach(stop=>stop());timeouts.forEach(clearTimeout)};
 },[archiveWide,includeQ,excludeQ,onSearchTags]);

 const groupsByMode=useMemo(()=>{
  const result={include:[],exclude:[]};
  for(const mode of modes){
   const q=mode==='include'?includeQ:excludeQ;
   if(archiveWide&&q){
    const grouped=new Map();
    for(const tag of directory[mode]||[]){
     const category=READING_FACET_ORDER.includes(tag.category)?tag.category:'other';
     const tags=grouped.get(category)||[];
     tags.push({id:String(tag.id),name:tag.name,category,global:true});
     grouped.set(category,tags);
    }
    result[mode]=[...READING_FACET_ORDER,'other'].filter((key,i,arr)=>arr.indexOf(key)===i&&grouped.has(key))
      .map(category=>({category,label:READING_FACET_NAMES[category]||'Other tags',tags:grouped.get(category)}));
   }else{
    result[mode]=facets
      .filter(group=>q||QUICK_TAG_CATEGORIES.has(group.category))
      .map(group=>({...group,tags:group.tags.filter(tag=>!q||tag.name.toLocaleLowerCase().includes(q))}))
      .filter(group=>group.tags.length>0);
   }
  }
  return result;
 },[archiveWide,includeQ,excludeQ,directory,facets]);

 // A hidden category must never make an active filter impossible to remove.
 const availableTags=useMemo(()=>{
  const tags=new Map();
  for(const group of facets)for(const tag of group.tags)tags.set(String(tag.id),tag);
  for(const mode of modes)for(const tag of directory[mode]||[])tags.set(String(tag.id),tag);
  return tags;
 },[facets,directory]);

 function pick(tag,mode){
  onToggle(tag.id,mode);
  onTagIdentified?.(tag);
  
 }
 function showResults(){
  setOpen(false);
  onShowResults();
 }
 function exactTagOnEnter(event,mode){
  if(event.key!=='Enter')return;
  const name=searches[mode].trim().toLocaleLowerCase();
  const matches=groupsByMode[mode].flatMap(g=>g.tags).filter(tag=>tag.name.toLocaleLowerCase()===name);
  if(matches.length!==1)return;
  event.preventDefault();
  pick(matches[0],mode);
  setSearches(prev=>({...prev,[mode]:''}));
 }
 function renderTagCheckbox(tag,mode){
  const selected=mode==='include'?included:excluded;
  const selectedHere=selected.includes(String(tag.id));
  const selectedOpposite=(mode==='include'?excluded:included).includes(String(tag.id));
  return <label className={'reading-facet-check-row'+(selectedHere?(mode==='include'?' is-included':' is-excluded'):'')} key={String(tag.id)}>
   <input type="checkbox" checked={selectedHere}
    aria-label={(mode==='include'?'Include ':'Exclude ')+tag.name} onChange={()=>pick(tag,mode)}/>
   <span className="reading-facet-check-label" title={tag.name}>
    {tag.name}{!tag.global&&tag.count!=null&&<small>({tag.count})</small>}
   </span>
   {!selectedHere&&selectedOpposite&&<span className="reading-facet-opposite-selected">
    {mode==='include'?'Excluded':'Included'}
   </span>}
  </label>;
 }
 function tagGroups(mode){
  const q=mode==='include'?includeQ:excludeQ;
  const selected=mode==='include'?included:excluded;
  const selectedRelationships=mode==='include'?relationshipIncluded:relationshipExcluded;
  // Search results are individual tags, never a second list of category accordions.
  // Deduplicate exact tag IDs if a directory suggestion appears in more than one group.
  const matchingTags=q?[...new Map(groupsByMode[mode].flatMap(group=>group.tags)
   .filter(tag=>tag.name.toLocaleLowerCase().includes(q))
   .map(tag=>[String(tag.id),tag])).values()]
   .sort((a,b)=>{
    const rank=tag=>tag.name.toLocaleLowerCase()===q?0:tag.name.toLocaleLowerCase().startsWith(q)?1:2;
    return rank(a)-rank(b)||a.name.localeCompare(b.name);
   }):[];
  const savedHiddenTags=!q?selected.map(id=>{
   const tag=availableTags.get(String(id));
   return {id:String(id),name:selectedTagNames[String(id)]||tag?.name||'Selected tag',
    category:tag?.category||null};
  }).filter(tag=>!tag.category||!QUICK_TAG_CATEGORIES.has(tag.category)):[];
  return <div className="reading-facet-mode-body" id={'reading-mode-'+mode}>
   <div className="reading-facet-relationship-cluster">
    <h4>Relationship categories</h4>
    <PalaceRelationshipFilters mode={mode} included={relationshipIncluded} excluded={relationshipExcluded} onToggle={onToggleRelationship}/>
   </div>
   <div className="reading-facet-tag-search-dock">
    <label className="reading-facet-label" htmlFor={'palace-facet-tag-'+mode}>Other tags to {mode}</label>
    <input id={'palace-facet-tag-'+mode} type="search" className="reading-facet-search"
     aria-label={'Other tags to '+mode} value={searches[mode]}
     onChange={e=>{setSearches(prev=>({...prev,[mode]:e.target.value}));}}
     onKeyDown={e=>exactTagOnEnter(e,mode)}
     placeholder={mode==='include'?'Search fandoms, characters, relationships, tropes…':'Search tags to exclude…'}/>
    <small className="reading-facet-search-caption">{q?'Select an individual matching tag below.':'Browse common categories below, or search for any tag, including tropes and additional tags.'}</small>
   </div>
   {busy[mode]&&<p className="reading-facet-hint" role="status">Finding matching tags…</p>}
   {errors[mode]&&<p className="reading-facet-hint" role="alert">{errors[mode]}</p>}
   {savedHiddenTags.length>0&&<div className="reading-facet-hidden-choices" aria-label={'Selected extra tags to '+mode}>
    <small>{mode==='include'?'Included':'Excluded'} extra tags</small>
    <div>{savedHiddenTags.map(tag=><button type="button" key={tag.id}
     aria-label={'Remove '+tag.name+' from '+mode+' tags'} onClick={()=>onToggle(tag.id,mode)}>
      {tag.name}<span aria-hidden="true">×</span>
     </button>)}</div>
   </div>}
   <div className="reading-facet-groups">
    {q?<div className="reading-facet-direct-matches" role="group" aria-label={(mode==='include'?'Include':'Exclude')+' matching tags'}>
     <p className="reading-facet-match-count" role="status">{busy[mode]?'Searching…':matchingTags.length+' matching '+(matchingTags.length===1?'tag':'tags')}</p>
     <div className="reading-facet-direct-list">{matchingTags.map(tag=>renderTagCheckbox(tag,mode))}</div>
     {!busy[mode]&&matchingTags.length===0&&<p className="reading-facet-none">No matching tags. Try a different name.</p>}
    </div>:groupsByMode[mode].map(group=>{
     const key=mode+':'+group.category;
     const expanded=Boolean(expandedGroups[key])||Boolean(q);
     const chosen=group.tags.filter(tag=>selected.includes(tag.id));
     const remaining=group.tags.filter(tag=>!selected.includes(tag.id));
     const visible=expanded?group.tags:[...chosen,...remaining.slice(0,Math.max(0,6-chosen.length))];
     const hasMore=group.tags.length>visible.length;
     const canCollapse=group.tags.length>6&&!q;
     return <details className="reading-facet-group" key={key+(q?':search':'')} open={q?true:undefined}>
      <summary><span>{group.label}</span><small>{group.tags.length}</small></summary>
      <div className="reading-facet-options">
       {visible.map(tag=>renderTagCheckbox(tag,mode))}
       {canCollapse&&<button type="button" className="reading-facet-expand" aria-expanded={expanded}
         onClick={()=>{setExpandedGroups(prev=>({...prev,[key]:!expanded}));}}>
         {expanded?'Show fewer '+group.label.toLowerCase()+' ↑':'Show all '+group.tags.length+' '+group.label.toLowerCase()+' ↓'}
       </button>}
       {hasMore&&<span className="reading-facet-collapsed-hint">{group.tags.length-visible.length} more tags available</span>}
      </div>
     </details>;
    })}
    {!q&&groupsByMode[mode].length===0&&<p className="reading-facet-none">No tags to show in this selection.</p>}
   </div>
   {selected.length+selectedRelationships.length>0&&<p className="reading-facet-selection-summary" aria-live="polite">{selected.length} tags and {selectedRelationships.length} relationship categories {mode==='include'?'included':'excluded'}</p>}
  </div>;
 }
 return <aside ref={sidebarRef} className="reading-facet-sidebar" aria-label="Sort and filter stories">
  <button type="button" className={'reading-facet-mobile-toggle'+(open?' is-open':'')} aria-label={open?'Close Sort & Filter':'Open Sort & Filter'} aria-controls="reading-facet-controls" aria-expanded={open} onClick={()=>{setOpen(v=>!v);}}>
   <span className="reading-facet-top-title">☷ Sort &amp; Filter</span>
   <span className="reading-facet-top-action">{open?<><span aria-hidden="true">✕</span> Close</>:<>{active?active+' active · ':''} Show <span aria-hidden="true">▾</span></>}</span>
  </button>
  <div id="reading-facet-controls" className={'reading-facet-controls'+(open?' is-open':'')}>
   <p className="reading-facet-scope">{archiveWide?'Searching all published stories':'Exploring loaded stories and classics'}</p>
   <h3 className="reading-facet-order-head">1. Sort &amp; order</h3>
   <label className="reading-facet-label" htmlFor="palace-story-sort">Sort by</label>
   <select id="palace-story-sort" value={sort} onChange={e=>onSort(e.target.value)}>
    {READING_SORT_OPTIONS.map(([id,label,scope])=><option key={id} value={id}>{label}{archiveWide&&scope==='loaded'?' · switches to loaded shelves':''}</option>)}
   </select>
   {archiveWide&&<details className="reading-facet-sort-help"><summary>ⓘ About sort coverage</summary><p>Reverse and bookmark sorts use loaded shelves only. Choosing one switches from the full archive to loaded stories.</p></details>}
   <h3 className="reading-facet-order-head">2. Rating &amp; progress</h3>
   <div className="reading-facet-refine">
    <label>Rating<select value={rating} onChange={e=>onRating(e.target.value)}><option value="all">All ratings</option><option value="general">General</option><option value="teen">Teen</option><option value="mature">Mature</option><option value="explicit">Explicit</option><option value="not_rated">Not rated</option></select></label>
    <label>Work status<select value={status} onChange={e=>onStatus(e.target.value)}><option value="all">All statuses</option><option value="in_progress">In progress</option><option value="complete">Complete</option><option value="hiatus">Hiatus</option><option value="abandoned">Abandoned</option></select></label>
   </div>
   <div className="reading-facet-precision"><div><strong>Include &amp; Exclude</strong><small>Choose what to see and what to leave out</small></div>{active>0&&<button type="button" onClick={onClear}>Clear choices</button>}</div>
   {modes.map((mode,index)=>{
    const isExpanded=expandedModes[mode];
    const count=mode==='include'?included.length+relationshipIncluded.length:excluded.length+relationshipExcluded.length;
    return <section key={mode} className={'reading-facet-mode reading-facet-mode-'+mode}>
     <button type="button" className="reading-facet-mode-trigger" aria-expanded={isExpanded} aria-controls={'reading-mode-'+mode}
      onClick={()=>{setExpandedModes(prev=>({...prev,[mode]:!prev[mode]}));}}>
      <span className="reading-facet-mode-title"><b>{index+3}. {mode==='include'?'Include':'Exclude'}</b><small>{mode==='include'?'Must-have tags and categories':'Tags and categories you do not want'}</small></span>
      <span className="reading-facet-mode-status">{count>0&&<em>{count} chosen</em>}<span aria-hidden="true">{isExpanded?'▴':'▾'}</span></span>
     </button>
     {isExpanded&&tagGroups(mode)}
    </section>;
   })}
   <div className="reading-facet-footer">
    {archiveWide?<p>Archive tag filters search all published stories. Tag suggestions without a search reflect <strong>{loadedCount}</strong> loaded works, not the entire archive. Relationship categories use the loaded shelves.</p>:<p>Filters and statistics cover <strong>{loadedCount}</strong> currently loaded works{hasMore?'. Load more stories to expand the selection.':'.'}</p>}
    <p>For word-count ranges and language, use <Link to="/reading?view=search">Advanced search</Link>.</p>
   </div>
  </div>
  {open&&footerPosition.visible&&typeof document!=='undefined'&&createPortal(
   <div className="reading-filter-mobile-result-action" role="region" aria-label="Reading filter results action" style={{'--reading-filter-dock-bottom':footerPosition.bottom+'px'}}>
    <button type="button" onClick={showResults}>{typeof resultsCount==='number'?'Show '+resultsCount.toLocaleString()+' '+(resultsCount===1?'Result':'Results'):'Show Results'} <span aria-hidden="true">→</span></button>
   </div>,document.body
  )}
 </aside>;
}
