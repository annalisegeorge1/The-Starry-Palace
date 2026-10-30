import React,{useEffect,useMemo,useState} from 'react';
import {Link} from 'react-router-dom';
import {READING_SORT_OPTIONS,READING_FACET_ORDER,READING_FACET_NAMES} from './readingFacetModel';
import './reading-faceted-browse.css';

/** Guest-safe precision browsing, with a full tag directory in archive mode. */
export default function ReadingFacetSidebar({
 facets=[],sort='updated',onSort,rating='all',onRating,status='all',onStatus,
 included=[],excluded=[],onToggle,onClear,loadedCount=0,hasMore=false,
 archiveWide=false,onSearchTags,onTagIdentified
}){
 const [open,setOpen]=useState(false);
 const [search,setSearch]=useState('');
 const [globalTags,setGlobalTags]=useState([]);
 const [tagBusy,setTagBusy]=useState(false);
 const [tagError,setTagError]=useState('');
 const active=included.length+excluded.length+(rating!=='all'?1:0)+(status!=='all'?1:0);
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
 function pick(tag,mode){onToggle(tag.id,mode);onTagIdentified?.(tag)}
 return <aside className="reading-facet-sidebar" aria-label="Sort and filter stories">
  <button type="button" className="reading-facet-mobile-toggle" aria-controls="reading-facet-controls" aria-expanded={open} onClick={()=>setOpen(x=>!x)}>
   <span>☷ Sort &amp; Filter</span><span>{active?active+' active · ':''}{open?'Hide':'Show'} {open?'▴':'▾'}</span>
  </button>
  <div id="reading-facet-controls" className={'reading-facet-controls'+(open?' is-open':'')}>
   <header className="reading-facet-heading"><div><p className="eyebrow">FIND YOUR NEXT WORLD</p><h2>Sort &amp; Filter</h2></div><span aria-hidden="true">✦</span></header>
   <p className="reading-facet-scope">{archiveWide?'Searching all published stories':'Exploring loaded stories and classics'}</p>
   <label className="reading-facet-label" htmlFor="palace-story-sort">Sort by</label>
   <select id="palace-story-sort" value={sort} onChange={event=>onSort(event.target.value)}>{READING_SORT_OPTIONS.map(([id,label,scope])=><option key={id} value={id}>{label}{archiveWide&&scope==='loaded'?' · switches to loaded shelves':''}</option>)}</select>
   {archiveWide&&<p className="reading-facet-hint">Reverse and bookmark sorts use loaded shelves only. Choosing one switches scopes, not just the current page.</p>}
   <div className="reading-facet-refine">
    <label>Rating<select value={rating} onChange={event=>onRating(event.target.value)}><option value="all">All ratings</option><option value="general">General</option><option value="teen">Teen</option><option value="mature">Mature</option><option value="explicit">Explicit</option><option value="not_rated">Not rated</option></select></label>
    <label>Work status<select value={status} onChange={event=>onStatus(event.target.value)}><option value="all">All statuses</option><option value="in_progress">In progress</option><option value="complete">Complete</option><option value="hiatus">Hiatus</option><option value="abandoned">Abandoned</option></select></label>
   </div>
   <div className="reading-facet-precision"><div><strong>Include / Exclude</strong><small>{archiveWide?'Choose tags from the full Palace directory':'Build a constellation of tags'}</small></div>{active>0&&<button type="button" onClick={onClear}>Clear choices</button>}</div>
   {(included.length>0||excluded.length>0)&&<div className="reading-facet-selection-summary" aria-live="polite"><span>{included.length} included</span><span>{excluded.length} excluded</span></div>}
   <label className="reading-facet-label" htmlFor="palace-facet-tag-search">{archiveWide?'Search every tag in the Palace':'Find a tag within loaded stories'}</label>
   <input id="palace-facet-tag-search" className="reading-facet-search" type="search" value={search} onChange={event=>setSearch(event.target.value)} placeholder="Search fandoms, characters, relationships, tropes…"/>
   {archiveWide&&!q&&<p className="reading-facet-hint">Browse the tags in these story suggestions or search above to find any tag in the Palace, even one not shown here.</p>}
   {tagBusy&&<p className="reading-facet-hint" role="status">Gathering tags from the directory…</p>}
   {tagError&&<p className="reading-facet-hint" role="alert">{tagError}</p>}
   <div className="reading-facet-groups">
    {groups.map(group=><details key={group.category+(q?":search":"")} open={q?true:undefined} className="reading-facet-group">
     <summary><span>{group.label}</span><small>{group.tags.length}</small></summary>
     <div className="reading-facet-options">{group.tags.map(tag=>{
      const selectedIn=included.includes(tag.id),selectedOut=excluded.includes(tag.id);
      return <div className="reading-facet-option" key={tag.id}>
       <span className="reading-facet-option-name" title={tag.name}>{tag.name}{!tag.global&&tag.count!=null&&<small>{tag.count}</small>}</span>
       <div role="group" aria-label={'Filter '+tag.name}><button type="button" aria-label={'Include '+tag.name} title={'Include '+tag.name} aria-pressed={selectedIn} className={selectedIn?'selected include':''} onClick={()=>pick(tag,'include')}>＋</button><button type="button" aria-label={'Exclude '+tag.name} title={'Exclude '+tag.name} aria-pressed={selectedOut} className={selectedOut?'selected exclude':''} onClick={()=>pick(tag,'exclude')}>−</button></div>
      </div>
     })}</div>
    </details>)}
    {groups.length===0&&!tagBusy&&<p className="reading-facet-none">{archiveWide&&q?'No matching tags found in the directory. Try another phrase.':'No tags in this selection. Try a shorter search.'}</p>}
   </div>
   <div className="reading-facet-footer">
    {archiveWide?<p>Archive filters run against all published stories. Tag suggestions without a search reflect <strong>{loadedCount}</strong> loaded works, not the entire archive.</p>:<p>Filters and statistics cover <strong>{loadedCount}</strong> currently loaded works{hasMore?'. Load more stories to expand the selection.':'.'}</p>}
    <p>For word-count ranges and language, use <Link to="/reading?view=search">Advanced search</Link>.</p>
   </div>
  </div>
 </aside>;
}
