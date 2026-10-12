import React,{useState} from 'react';
import {Link} from 'react-router-dom';
import {READING_SORT_OPTIONS} from './readingFacetModel';
import './reading-faceted-browse.css';

/** A discovery control, not a gate: all sorting/filtering also works for guests. */
export default function ReadingFacetSidebar({
 facets=[],sort='updated',onSort,rating='all',onRating,status='all',onStatus,
 included=[],excluded=[],onToggle,onClear,loadedCount=0,hasMore=false
}){
 const [open,setOpen]=useState(false);
 const [search,setSearch]=useState('');
 const active=included.length+excluded.length+(rating!=='all'?1:0)+(status!=='all'?1:0);
 const q=search.trim().toLocaleLowerCase();
 const groups=facets.map(group=>({...group,tags:group.tags.filter(tag=>!q||tag.name.toLocaleLowerCase().includes(q))})).filter(group=>group.tags.length>0);
 return <aside className="reading-facet-sidebar" aria-label="Sort and filter stories">
  <button type="button" className="reading-facet-mobile-toggle" aria-controls="reading-facet-controls" aria-expanded={open} onClick={()=>setOpen(x=>!x)}>
   <span>☷ Sort &amp; Filter</span><span>{active?active+' active':''} {open?'▴':'▾'}</span>
  </button>
  <div id="reading-facet-controls" className={'reading-facet-controls'+(open?' is-open':'')}>
   <header className="reading-facet-heading"><div><p className="eyebrow">FIND YOUR NEXT WORLD</p><h2>Sort &amp; Filter</h2></div><span aria-hidden="true">✦</span></header>
   <label className="reading-facet-label" htmlFor="palace-story-sort">Sort by</label>
   <select id="palace-story-sort" value={sort} onChange={event=>onSort(event.target.value)}>{READING_SORT_OPTIONS.map(([id,label])=><option key={id} value={id}>{label}</option>)}</select>
   <div className="reading-facet-refine">
    <label>Rating<select value={rating} onChange={event=>onRating(event.target.value)}><option value="all">All ratings</option><option value="general">General</option><option value="teen">Teen</option><option value="mature">Mature</option><option value="explicit">Explicit</option><option value="not_rated">Not rated</option></select></label>
    <label>Work status<select value={status} onChange={event=>onStatus(event.target.value)}><option value="all">All statuses</option><option value="in_progress">In progress</option><option value="complete">Complete</option><option value="hiatus">Hiatus</option><option value="abandoned">Abandoned</option></select></label>
   </div>
   <div className="reading-facet-precision"><div><strong>Include / Exclude</strong><small>Build a constellation of tags</small></div>{active>0&&<button type="button" onClick={onClear}>Clear choices</button>}</div>
   {(included.length>0||excluded.length>0)&&<div className="reading-facet-selection-summary" aria-live="polite"><span>{included.length} included</span><span>{excluded.length} excluded</span></div>}
   <label className="reading-facet-label" htmlFor="palace-facet-tag-search">Find a tag within loaded stories</label>
   <input id="palace-facet-tag-search" className="reading-facet-search" type="search" value={search} onChange={event=>setSearch(event.target.value)} placeholder="Fandom, character, trope…"/>
   <div className="reading-facet-groups">
    {groups.map(group=><details key={group.category} className="reading-facet-group">
     <summary><span>{group.label}</span><small>{group.tags.length}</small></summary>
     <div className="reading-facet-options">{group.tags.map(tag=>{
      const selectedIn=included.includes(tag.id),selectedOut=excluded.includes(tag.id);
      return <div className="reading-facet-option" key={tag.id}>
       <span className="reading-facet-option-name" title={tag.name}>{tag.name}<small>{tag.count}</small></span>
       <div role="group" aria-label={'Filter '+tag.name}><button type="button" aria-label={'Include '+tag.name} title={'Include '+tag.name} aria-pressed={selectedIn} className={selectedIn?'selected include':''} onClick={()=>onToggle(tag.id,'include')}>＋</button><button type="button" aria-label={'Exclude '+tag.name} title={'Exclude '+tag.name} aria-pressed={selectedOut} className={selectedOut?'selected exclude':''} onClick={()=>onToggle(tag.id,'exclude')}>−</button></div>
      </div>
     })}</div>
    </details>)}
    {groups.length===0&&<p className="reading-facet-none">No tags in this selection. Try a shorter search.</p>}
   </div>
   <div className="reading-facet-footer">
    <p>Filters and statistics cover <strong>{loadedCount}</strong> currently loaded works{hasMore?'. Load more stories to expand the selection.':'.'}</p>
    <p>For deeper searches across published stories, use <Link to="/reading?view=search">Advanced search</Link>.</p>
   </div>
  </div>
 </aside>;
}
