import React,{useState} from 'react';
import {Link} from 'react-router-dom';
import {directClassicHref} from './directClassicModel';
import {isHistoricalFanfiction,MODERN_FANFICTION_LINKS} from './palaceFanfictionDiscovery';
import {
 MODERN_FANFICTION_GUIDES,FANFICTION_RATINGS,modernFanfictionGuide,historicFanfictionGuide,
 fanfictionRatingLabel,filterModernFanfiction
} from './fanfictionMetadata';
import './palace-fanfiction-shelf.css';

function FanfictionGuide({guide}){
 const visible=guide.tags.slice(0,4);
 return <div className="palace-fanfiction-meta">
  <span className={'palace-fanfiction-rating rating-'+guide.rating}
   title={guide.ratingBasis==='editorial'?'Provisional Palace editorial classification':guide.sourceRating||'No source rating recorded'}>
   {fanfictionRatingLabel(guide)}{guide.sourceRating&&guide.ratingBasis==='source'?<small> · {guide.sourceRating}</small>:null}
  </span>
  {guide.tags.length>0&&<div className="palace-fanfiction-tags" aria-label="Fandom, genre and trope tags">
   {visible.map(tag=><span className={'palace-ff-tag tag-'+tag.category} key={tag.category+':'+tag.name}>{tag.name}</span>)}
   {guide.tags.length>4&&<details className="palace-fanfiction-all-tags">
    <summary>+{guide.tags.length-4} tags</summary>
    <div>{guide.tags.slice(4).map(tag=><span className={'palace-ff-tag tag-'+tag.category} key={tag.category+':'+tag.name}>{tag.name}</span>)}</div>
   </details>}
  </div>}
  {guide.contentWarnings.length>0&&<p className="palace-fanfiction-warnings">
   <strong>Content notes:</strong> {guide.contentWarnings.join(' · ')}
  </p>}
 </div>;
}

/* Author-source recommendations are not hosted copies or member publications. */
export default function PalaceFanfictionShelf({archiveWorks=[]}){
 const [visibleModernCount,setVisibleModernCount]=useState(6);
 const [rating,setRating]=useState('all');
 const [query,setQuery]=useState('');
 const [includeMature,setIncludeMature]=useState(false);
 const needle=query.trim().toLowerCase();
 const historic=archiveWorks.filter(work=>work.is_archive&&isHistoricalFanfiction(work))
  .filter(work=>{
   const guide=historicFanfictionGuide(work);
   return (rating==='all'||guide.rating===rating)&&(!needle||
    [work.title,work.creator_name,work.summary,...guide.tags.map(t=>t.name)].filter(Boolean).join(' ').toLowerCase().includes(needle));
  });
 // The Palace's verified-age gate does not cover third-party destinations.
 // Keep 18+ external story links out of default public discovery.
 const modernMatches=filterModernFanfiction(MODERN_FANFICTION_LINKS,{rating,query});
 const allowedModern=modernMatches.filter(work=>includeMature||modernFanfictionGuide(work).rating!=='mature');
 const hiddenMature=modernMatches.length-allowedModern.length;
 const matureMatches=modernMatches.filter(work=>modernFanfictionGuide(work).rating==='mature').length;
 const visibleModern=allowedModern.slice(0,visibleModernCount);
 const reset=()=>{setQuery('');setRating('all');setVisibleModernCount(6)};
 return <section className="palace-fanfiction-shelf" aria-labelledby="palace-fanfiction-shelf-title">
  <header className="palace-fanfiction-shelf-head">
   <p className="eyebrow">FANFICTION · OLD WORLDS, NEW STORIES</p>
   <h2 id="palace-fanfiction-shelf-title">Follow the stories behind the stories.</h2>
   <p>Read the verified historical fanworks here, or discover modern stories at their authors' original sources. Ratings are labelled by source; tags are descriptive Palace guides.</p>
   <p className="palace-fanfiction-catalogue-total" role="status">{MODERN_FANFICTION_LINKS.length} modern recommendations · {archiveWorks.filter(work=>work.is_archive&&isHistoricalFanfiction(work)).length} hosted historical works · Browse by title, author, fandom or rating</p>
  </header>
  <div className="palace-fanfiction-filters" role="search" aria-label="Filter Fanfiction recommendations">
   <label><span>Find by title, writer or tag</span><input type="search"
    value={query} placeholder="Fandom, trope, character…" maxLength={120}
    onChange={event=>{setQuery(event.target.value);setVisibleModernCount(6)}}/></label>
   <label><span>Rating</span><select value={rating} onChange={event=>{setRating(event.target.value);setVisibleModernCount(6)}}>
    {FANFICTION_RATINGS.map(item=><option value={item.id} key={item.id}>{item.label}</option>)}
   </select></label>
   {(query||rating!=='all')&&<button type="button" className="palace-fanfiction-filter-reset" onClick={reset}>Clear</button>}
  </div>
  {historic.length>0&&<div className="palace-fanfiction-group">
   <h3>Read here · historical fanfiction</h3>
   <div className="palace-fanfiction-grid">
    {historic.map(work=><article key={work.id} className="palace-fanfiction-entry">
     <small>PUBLIC DOMAIN · HOSTED ON THE PALACE</small>
     <strong>{work.title}</strong>
     <span>by {work.creator_name||work.profiles?.display_name||'Historical author'}</span>
     <FanfictionGuide guide={historicFanfictionGuide(work)}/>
     <p>{work.summary}</p>
     <Link className="palace-fanfiction-historic-link" to={directClassicHref(work)}>Open the complete work →</Link>
    </article>)}
   </div>
  </div>}
  <div className="palace-fanfiction-group">
   <h3>Modern fanfiction · read at the author's source</h3>
   <p className="palace-fanfiction-result-count" role="status" aria-live="polite">Showing {visibleModern.length} of {allowedModern.length} matching recommendations</p>
   <p className="palace-fanfiction-license-note">These are curated links, not reposted stories. An author's reuse licence does not clear rights in a copyrighted franchise. Source ratings are mapped to Palace age bands; tags and warnings are editorial and may not be exhaustive.</p>
   <div className="palace-fanfiction-grid">
    {visibleModern.map(work=>{const guide=MODERN_FANFICTION_GUIDES[work.id]||modernFanfictionGuide(work);return <article className="palace-fanfiction-entry" key={work.id}>
     <small>{work.fandom} · {work.published}</small>
     <strong>{work.title}</strong>
     <span>by {work.creator}</span>
     <FanfictionGuide guide={guide}/>
     <p>{work.description}</p>
     <p className="palace-fanfiction-content-note">{work.contentNote}</p>
     <div className="palace-fanfiction-links">
      <a href={work.sourceUrl} target="_blank" rel="noopener noreferrer" aria-label={'Read '+work.title+' at the original source'}>Read original ↗</a>
      <a href={work.permissionUrl} target="_blank" rel="noopener noreferrer" className="palace-fanfiction-terms" title={work.permissionLabel} aria-label={'Reuse terms: '+work.permissionLabel}>Reuse terms ↗</a>
     </div>
    </article>})}
   </div>
   {matureMatches>0&&<div className="palace-fanfiction-age-notice">
    <p>{includeMature?'Mature-rated external recommendations are visible. Reader discretion is advised.':hiddenMature+' mature-rated external recommendation'+(hiddenMature===1?' is':'s are')+' hidden by default. These third-party sites are outside the Palace age checks.'}</p>
    <button type="button" onClick={()=>{setIncludeMature(!includeMature);setVisibleModernCount(6)}}>{includeMature?'Hide mature links':'I am 18+ · Show mature links'}</button>
   </div>}
   {!allowedModern.length&&<p className="palace-fanfiction-no-results">No sourced recommendations match these filters. Try another rating or remove a search term.</p>}
   {visibleModernCount<allowedModern.length&&<button type="button" className="palace-fanfiction-more" onClick={()=>setVisibleModernCount(current=>Math.min(current+12,allowedModern.length))}>Show more fanfiction ({allowedModern.length-visibleModernCount} remaining)</button>}
  </div>
 </section>;
}
