import React,{useEffect,useMemo,useState} from 'react';
import {Link} from 'react-router-dom';
import {READING_SORT_OPTIONS,READING_FACET_ORDER,READING_FACET_NAMES} from './readingFacetModel';
import PalaceRelationshipFilters from './PalaceRelationshipFilters';
import './reading-faceted-browse.css';

/** Guest-safe precision browsing, with a full tag directory in archive mode. */
export default function ReadingFacetSidebar({
 facets=[],sort='updated',onSort,rating='all',onRating,status='all',onStatus,
 included=[],excluded=[],onToggle,onClear,relationshipIncluded=[],relationshipExcluded=[],onToggleRelationship=()=>{},loadedCount=0,hasMore=false,
 archiveWide=false,onSearchTags,onTagIdentified,resultsCount=null,onShowResults=()=>{}
}){
 const [open,setOpen]=useState(false);
 const [search,setSearch]=useState('');
 const [globalTags,setGlobalTags]=useState([]);
 const [tagBusy,setTagBusy]=useState(false);
 const [tagError,setTagError]=useState('');
 const [expandedGroups,setExpandedGroups]=useState({});
 const [moreTag,setMoreTag]=useState(null);
 const active=included.length+excluded.length+relationshipIncluded.length+relationshipExcluded.length+(rating!=='all'?1:0)+(status!=='all'?1:0);
 const q=search.trim().toLocaleLowerCase();
 useEffect(()=>{
  if(!archiveWide||!q||typeof onSearchTags!=='function'){
   setGlobalTags([]);setTagBusy(false);setTagError('');return;
  }
  let current=true;
  setTagBusy(true);setTagError('');
  const timer=setTimeout(()=>{
   Promise.resolve().then(()=>onSearchTags(q,'all',60)).then(results=>{
    if(current)setGlobalTags((results||[]).filter(tag=>tag?.id&&tag?.name&&['canonical','community'].includes(tag.status)));
   }).catch(()=>{if(current){setGlobalTags([]);setTagError('Tag suggestions are temporarily unavailable. Retry in a moment.')}})
    .finally(()=>{if(current)setTagBusy(false)});
  },260);
  return()=>{current=false;clearTimeout(timer)};
 },[archiveWide,q,onSearchTags]);
 const groups=useMemo(()=>{
  if(archiveWide&&q){
   const grouped=new Map();
   for(const tag of globalTags){
    const key=READING_FACET_ORDER.includes(tag.category)?tag.category:'other';
    const items=grouped.get(key)||[];
    items.push({id:String(tag.id),name:tag.name,category:key,global:true});
    grouped.set(key,items);
   }
   return [...READING_FACET_ORDER,'other'].filter((key,index,array)=>array.indexOf(key)===index&&grouped.has(key)).map(category=>({
    category,label:READING_FACET_NAMES[category]||'Other tags',tags:grouped.get(category)
   }));
  }
  return facets.map(group=>({...group,tags:group.tags.filter(tag=>!q||tag.name.toLocaleLowerCase().includes(q))}))
    .filter(group=>group.tags.length>0);
 },[archiveWide,q,globalTags,facets]);
 function pick(tag,mode){onToggle(tag.id,mode);onTagIdentified?.(tag);setMoreTag(null)}
 function showResults(){
  setOpen(false);setMoreTag(null);
  onShowResults();
 }

 return <aside className="reading-facet-sidebar" aria-label="Sort and filter stories">
  <button type="button" className="reading-facet-mobile-toggle" aria-controls="reading-facet-controls" aria-expanded={open} onClick={()=>setOpen(x=>!x)}>
   <span>☷ Sort &amp; Filter</span><span>{active?active+' active · ':''}{open?'Hide':'Show'} {open?'▴':'▾'}</span>
  </button>
  <div id="reading-facet-controls" className={'reading-facet-controls'+(open?' is-open':'')}>
   <header className="reading-facet-heading"><div><p className="eyebrow">FIND YOUR NEXT WORLD</p><h2>Sort &amp; Filter</h2></div><button type="button" className="reading-facet-close" onClick={()=>setOpen(false)} aria-label="Close Sort and Filter">✕ <span>Close</span></button></header>
   <p className="reading-facet-scope">{archiveWide?'Searching all published stories':'Exploring loaded stories and classics'}</p>
   <h3 className="reading-facet-order-head">1. Sort &amp; order</h3>
   <label className="reading-facet-label" htmlFor="palace-story-sort">Sort by</label>
   <select id="palace-story-sort" value={sort} onChange={event=>onSort(event.target.value)}>{READING_SORT_OPTIONS.map(([id,label,scope])=><option key={id} value={id}>{label}{archiveWide&&scope==='loaded'?' · switches to loaded shelves':''}</option>)}</select>
   {archiveWide&&<details className="reading-facet-sort-help"><summary>ⓘ About sort coverage</summary><p>Reverse and bookmark sorts use loaded shelves only. Choosing one switches from the full archive to loaded stories.</p></details>}
   <h3 className="reading-facet-order-head">2. Rating &amp; progress</h3>
   <div className="reading-facet-refine">
    <label>Rating<select value={rating} onChange={event=>onRating(event.target.value)}><option value="all">All ratings</option><option value="general">General</option><option value="teen">Teen</option><option value="mature">Mature</option><option value="explicit">Explicit</option><option value="not_rated">Not rated</option></select></label>
    <label>Work status<select value={status} onChange={event=>onStatus(event.target.value)}><option value="all">All statuses</option><option value="in_progress">In progress</option><option value="complete">Complete</option><option value="hiatus">Hiatus</option><option value="abandoned">Abandoned</option></select></label>
   </div>
   <h3 className="reading-facet-order-head">3. Relationships</h3>
   <PalaceRelationshipFilters included={relationshipIncluded} excluded={relationshipExcluded} onToggle={onToggleRelationship}/>
   <h3 className="reading-facet-order-head">4. Tag constellation</h3>
   <div className="reading-facet-precision"><div><strong>Include / Exclude Tags</strong><small>{archiveWide?'Choose tags from the full Palace directory':'Build a constellation of tags'}</small></div>{active>0&&<button type="button" onClick={onClear}>Clear choices</button>}</div>
   {(included.length>0||excluded.length>0)&&<div className="reading-facet-selection-summary" aria-live="polite"><span>{included.length} included</span><span>{excluded.length} excluded</span></div>}

   <div className="reading-facet-tag-search-dock">
    <label className="reading-facet-label" htmlFor="palace-facet-tag-search">{archiveWide?'Search all Palace tags':'Find a tag in these stories'}</label>
    <input id="palace-facet-tag-search" className="reading-facet-search" type="search" value={search} onChange={event=>{setSearch(event.target.value);setMoreTag(null)}} placeholder="Search fandoms, characters, tropes, warnings…"/>
   </div>
   {archiveWide&&!q&&<p className="reading-facet-hint">Browse the tags in these story suggestions or search above to find any tag in the Palace, even one not shown here.</p>}
   {tagBusy&&<p className="reading-facet-hint" role="status">Gathering tags from the directory…</p>}
   {tagError&&<p className="reading-facet-hint" role="alert">{tagError}</p>}
   <div className="reading-facet-groups">
    {groups.map(group=>{
     const expanded=Boolean(expandedGroups[group.category])||Boolean(q);
     const chosen=group.tags.filter(tag=>included.includes(tag.id)||excluded.includes(tag.id));
     const remaining=group.tags.filter(tag=>!included.includes(tag.id)&&!excluded.includes(tag.id));
     const visible=expanded?group.tags:[...chosen,...remaining.slice(0,Math.max(0,6-chosen.length))];
     const hasMore=group.tags.length>visible.length;
     const canCollapse=group.tags.length>6&&!q;
     return <details key={group.category+(q?":search":"")} open={q?true:undefined} className="reading-facet-group">
      <summary><span>{group.label}</span><small>{group.tags.length}</small></summary>
      <div className="reading-facet-options">
       {visible.map(tag=>{
        const selectedIn=included.includes(tag.id),selectedOut=excluded.includes(tag.id);
        const menuOpen=moreTag===String(tag.id);
        const actionId='reading-tag-more-'+String(tag.id).replace(/[^a-zA-Z0-9_-]/g,'');
        return <div className={"reading-facet-option"+(selectedIn?' is-included':'')+(selectedOut?' is-excluded':'')} key={tag.id}>
         <button type="button" className="reading-facet-option-pick" aria-label={'Include '+tag.name} aria-pressed={selectedIn}
          onClick={()=>pick(tag,'include')}>
          <span className="reading-facet-option-name" title={tag.name}>{tag.name}{!tag.global&&tag.count!=null&&<small>{tag.count}</small>}</span>
          <span className="reading-tag-selection-icon" aria-hidden="true">{selectedIn?'✓':selectedOut?'−':'＋'}</span>
         </button>
         <button type="button" className="reading-facet-option-more" aria-label={'More options for '+tag.name}
          aria-expanded={menuOpen} aria-controls={actionId}
          onClick={()=>setMoreTag(menuOpen?null:String(tag.id))}>···</button>
         {menuOpen&&<div id={actionId} className="reading-tag-more-actions">
          <button type="button" aria-label={'Exclude '+tag.name} onClick={()=>pick(tag,'exclude')}>{selectedOut?'Remove exclusion':'Exclude this tag'}</button>
          {(selectedIn||selectedOut)&&<button type="button" onClick={()=>pick(tag,selectedIn?'include':'exclude')}>Clear this choice</button>}
         </div>}
        </div>;
       })}
       {canCollapse&&<button type="button" className="reading-facet-expand" aria-expanded={expanded}
        onClick={()=>{setExpandedGroups(prev=>({...prev,[group.category]:!expanded}));setMoreTag(null)}}>
        {expanded?'Show fewer '+group.label.toLowerCase()+' ↑':'Show all '+group.tags.length+' '+group.label.toLowerCase()+' ↓'}
       </button>}
       {hasMore&&<span className="reading-facet-collapsed-hint">{group.tags.length-visible.length} more tags available</span>}
      </div>
     </details>;
    })}
    {groups.length===0&&!tagBusy&&<p className="reading-facet-none">{archiveWide&&q?'No matching tags found in the directory. Try another phrase.':'No tags in this selection. Try a shorter search.'}</p>}
   </div>
   <div className="reading-facet-footer">
    {archiveWide?<p>Archive filters run against all published stories. Tag suggestions without a search reflect <strong>{loadedCount}</strong> loaded works, not the entire archive.</p>:<p>Filters and statistics cover <strong>{loadedCount}</strong> currently loaded works{hasMore?'. Load more stories to expand the selection.':'.'}</p>}
    <p>For word-count ranges and language, use <Link to="/reading?view=search">Advanced search</Link>.</p>
   </div>
  </div>
  {open&&<div className="reading-filter-mobile-result-action">
   <button type="button" onClick={showResults}>{typeof resultsCount==='number'?'Show '+resultsCount.toLocaleString()+' matching '+(resultsCount===1?'story':'stories'):'Show Results'} <span aria-hidden="true">→</span></button>
  </div>}
 </aside>;
}
