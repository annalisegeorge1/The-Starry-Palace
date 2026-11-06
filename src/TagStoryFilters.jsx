import React from 'react';
import {READING_SORT_OPTIONS} from './readingFacetModel';
import './tag-story-filters.css';

export const DEFAULT_TAG_STORY_FILTERS=Object.freeze({rating:'all',status:'all',language:'all',minWords:'',maxWords:''});
export function hasTagStoryFilters(filters={}){
 return Object.entries(DEFAULT_TAG_STORY_FILTERS).some(([key,value])=>(filters[key]??value)!==value);
}
export default function TagStoryFilters({text,onText,filters,onFilters,sort,onSort,busy,onSubmit}){
 const change=(key,value)=>onFilters({...filters,[key]:value});
 return <form className="tag-story-filter-desk" onSubmit={onSubmit} aria-label="Sort and filter matching stories">
  <div className="tag-story-filter-heading"><h2>Find matching stories</h2><span>Across the published archive</span></div>
  <div className="tag-story-filter-main">
   <label><span>Story title, writer or phrase</span><input type="search" value={text} onChange={e=>onText(e.target.value)} placeholder="Optional text search…"/></label>
   <label><span>Sort stories</span><select value={sort} onChange={e=>onSort(e.target.value)}>{READING_SORT_OPTIONS.filter(([, ,scope])=>scope==='archive').map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></label>
  </div>
  <details className="tag-story-filter-more"><summary>Rating, completion, language &amp; length{hasTagStoryFilters(filters)?' · Active':''}</summary>
   <div className="tag-story-filter-fields">
    <label><span>Rating</span><select value={filters.rating} onChange={e=>change('rating',e.target.value)}>{[['all','All ratings'],['general','General'],['teen','Teen'],['mature','Mature'],['explicit','Explicit'],['not_rated','Not rated']].map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></label>
    <label><span>Completion</span><select value={filters.status} onChange={e=>change('status',e.target.value)}>{[['all','All statuses'],['in_progress','In progress'],['complete','Complete'],['hiatus','Hiatus'],['abandoned','Abandoned']].map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></label>
    <label><span>Language</span><input value={filters.language==='all'?'':filters.language} onChange={e=>change('language',e.target.value||'all')} placeholder="Any language"/></label>
    <label><span>Minimum words</span><input type="number" min="0" max="100000000" step="1" value={filters.minWords} onChange={e=>change('minWords',e.target.value)} placeholder="No minimum"/></label>
    <label><span>Maximum words</span><input type="number" min={filters.minWords||0} max="100000000" step="1" value={filters.maxWords} onChange={e=>change('maxWords',e.target.value)} placeholder="No maximum"/></label>
   </div>
  </details>
  <div className="tag-story-filter-actions"><p>Every included tag must match. Any excluded tag removes a story. All ratings are included unless you choose one; reading age checks still apply.</p><button disabled={busy} type="submit">{busy?'Finding stories…':'Show matching stories →'}</button></div>
 </form>;
}
