import React,{useMemo,useState} from 'react';
import {Link} from 'react-router-dom';
import {MODERN_FANFICTION_LINKS,isHostedFanfiction} from './palaceFanfictionDiscovery';
import {modernFanfictionGuide,historicFanfictionGuide,isAnimeFanfiction,FANFICTION_RATINGS,
 filterModernFanfiction} from './fanfictionMetadata';
import './unified-fanwork-catalogue.css';

/**
 * A single display-only catalogue for public Palace fanworks, hosted historical
 * fanfiction, and independently published author-source recommendations.
 * Never insert linked works into the member works DB: they have no Palace
 * chapters, reading progress, bookmarks or hosting clearance.
 */
const authorOf=work=>work.creator_name||work.profiles?.display_name||work.profiles?.username||'Palace writer';
const palaceTags=work=>(work.work_tags||[]).map(x=>x.tags).filter(t=>t?.name);
const normalized=s=>String(s||'').toLocaleLowerCase();
const ratedTag=rating=>(FANFICTION_RATINGS.find(x=>x.id===rating)?.label||'Not rated').replace(' (13+)','').replace(' (18+)','');
const memberUrl=work=>work.is_archive?'/classic/'+encodeURIComponent(work.slug):'/work/'+encodeURIComponent(work.slug);
const searchable=work=>[work.title,work.summary,authorOf(work),...palaceTags(work).map(t=>t.name)].filter(Boolean).join(' ').toLocaleLowerCase();
const sourceTag=(type)=>type==='link'?'Author-source link':type==='licensed'?'Palace-hosted fanwork':type==='historical'?'Palace-hosted classic':'Palace member work';
export function createUnifiedFanworks(works=[],external=MODERN_FANFICTION_LINKS){
 const seen=new Set();
 const all=[];
 for(const work of works){
  if(!work||!(work.work_type==='fanwork'||work.is_archive&&isHostedFanfiction(work)))continue;
  const key=work.is_archive?'archive:'+work.slug:'member:'+work.id;
  if(!key||seen.has(key))continue;
  seen.add(key);
  all.push({key,kind:work.is_archive?(work.archive_category==='licensed_fanfiction'?'licensed':'historical'):'member',title:work.title||'Untitled fanwork',author:authorOf(work),rating:work.rating||'not_rated',
   summary:work.summary||'',tags:palaceTags(work).map(t=>t.name),href:memberUrl(work),work});
 }
 for(const work of external){
  if(!work?.sourceUrl||!work?.id)continue;
  const key='external:'+work.id;if(seen.has(key))continue;seen.add(key);
  const guide=modernFanfictionGuide(work);
  all.push({key,kind:'link',title:work.title,author:work.creator,rating:guide.rating||'not_rated',
   summary:work.description||'',tags:guide.tags.map(t=>t.name),warnings:guide.contentWarnings,
   href:work.sourceUrl,permissionUrl:work.permissionUrl,permissionLabel:work.permissionLabel,work});
 }
 return all;
}
export function filterUnifiedFanworks(rows,{query='',rating='all',source='all',animeOnly=false,includeMature=false,
 fandomNames=[],fandomMatch='any',completion='all'}={}){
 const needle=normalized(query).trim();
 const matchedLinks=filterModernFanfiction(rows.filter(x=>x.kind==='link').map(x=>x.work),
  {query,rating,animeOnly,fandomNames,fandomMatch});
 const linkedIds=new Set(matchedLinks.map(x=>x.id));
 const selectedFandoms=fandomNames.map(normalized).filter(Boolean);
 return rows.filter(x=>{
  if(source==='hosted'&&x.kind==='link'||source==='linked'&&x.kind!=='link')return false;
  if(x.rating==='mature'||x.rating==='explicit'){if(!includeMature)return false}
  if(x.kind==='link'){
   if(completion!=='all')return false; // completion not verified consistently for external sources
   return linkedIds.has(x.work.id);
  }
  if(rating!=='all'&&x.rating!==rating)return false;
  if(animeOnly&&!palaceTags(x.work).some(t=>/naruto|one piece|bleach|anime|manga|yu.gi.oh|evangelion|cardcaptor|dur ar ara|dur arara|dur ar a ra|dur ar|durara|inuyasha|dragon ball|vampire knight/i.test(t.name)))return false;
  const fandoms=palaceTags(x.work).filter(t=>t.category==='fandom').map(t=>normalized(t.name));
  if(selectedFandoms.length){
   const matches=name=>fandoms.some(f=>f===name||f.startsWith(name+' ')||name.startsWith(f+' '));
   if(fandomMatch==='all'?!selectedFandoms.every(matches):!selectedFandoms.some(matches))return false;
  }
  if(completion!=='all'&&x.work.completion_status!==completion)return false;
  return !needle||searchable(x.work).includes(needle);
 });
}

export default function UnifiedFanworkCatalogue({publishedWorks=[],externalWorks=MODERN_FANFICTION_LINKS,
 globalQuery='',globalRating='all',completion='all',fandomNames=[],fandomMatch='any',
 loading=false,loadError='',inFandomAtlas=false,hasMoreHosted=false,onMoreHosted}){
 const [search,setSearch]=useState('');
 const [rating,setRating]=useState('all');
 const [source,setSource]=useState('all');
 const [animeOnly,setAnimeOnly]=useState(false);
 const [includeMature,setIncludeMature]=useState(false);
 const [visibleCount,setVisibleCount]=useState(12);
 const [sort,setSort]=useState('title');
 const all=useMemo(()=>createUnifiedFanworks(publishedWorks,externalWorks),[publishedWorks,externalWorks]);
 const filtered=useMemo(()=>filterUnifiedFanworks(all,{
  query:[globalQuery,search].filter(Boolean).join(' '),rating:rating==='all'?globalRating:rating,source,animeOnly,includeMature,
  fandomNames,fandomMatch,completion
 }),[all,globalQuery,search,rating,globalRating,source,animeOnly,includeMature,fandomNames,fandomMatch,completion]);
 const ordered=useMemo(()=>[...filtered].sort((a,b)=>sort==='source'?
  (a.kind==='link'?1:0)-(b.kind==='link'?1:0)||a.title.localeCompare(b.title):
  a.title.localeCompare(b.title)),[filtered,sort]);
 const shown=ordered.slice(0,visibleCount);
 const externalCount=all.filter(x=>x.kind==='link').length;
 const hostedCount=all.length-externalCount;
 const restricted=all.filter(x=>(x.rating==='mature'||x.rating==='explicit')).length;
 const reset=()=>{setSearch('');setRating('all');setSource('all');setAnimeOnly(false);setVisibleCount(12);setSort('title')};
 return <section className="palace-unified-fanworks" aria-labelledby="palace-unified-fanworks-title">
  <header className="palace-unified-fanworks-head">
   <p className="eyebrow">FANFICTION · ONE SHARED DISCOVERY SHELF</p>
   <h2 id="palace-unified-fanworks-title">Fanworks across the Palace and beyond</h2>
   <p>Find Palace-hosted licensed fanfiction, member fanworks, historical fanfiction and independently published author-source recommendations together. Every card shows where its story can be read.</p>
   <p className="palace-unified-totals" role="status"><strong>{hostedCount} Palace-hosted works loaded</strong> · <strong>{externalCount} author-source links</strong>{hasMoreHosted?' · More Palace works available':''}</p>
  </header>
  <div className="palace-unified-filterbar" role="search" aria-label="Search all fanworks">
   <label><span>Find a fanwork</span><input type="search" value={search} maxLength={120} placeholder="Title, author, fandom or trope…" onChange={e=>{setSearch(e.target.value);setVisibleCount(12)}}/></label>
   <label><span>Rating</span><select value={rating} onChange={e=>{setRating(e.target.value);setVisibleCount(12)}}>{FANFICTION_RATINGS.map(x=><option key={x.id} value={x.id}>{x.label}</option>)}</select></label>
   <label><span>Read from</span><select value={source} onChange={e=>{setSource(e.target.value);setVisibleCount(12)}}><option value="all">All sources</option><option value="hosted">On the Palace</option><option value="linked">Author's site</option></select></label>
   <button type="button" aria-pressed={animeOnly} className={'palace-unified-anime'+(animeOnly?' active':'')} onClick={()=>{setAnimeOnly(x=>!x);setVisibleCount(12)}}>Anime &amp; manga</button>
   {(search||rating!=='all'||source!=='all'||animeOnly||sort!=='title')&&<button type="button" className="palace-unified-clear" onClick={reset}>Clear filters</button>}
  </div>
  <div className="palace-unified-toolbar">
   <span role="status" aria-live="polite">Showing {shown.length} of {ordered.length} matching works</span>
   <label>Order <select value={sort} onChange={e=>{setSort(e.target.value);setVisibleCount(12)}}><option value="title">Title A–Z</option><option value="source">Palace works first</option></select></label>
  </div>
  {loading&&<p className="palace-unified-note" role="status">Gathering the Palace-hosted stories. Original-author recommendations are still available.</p>}
  {loadError&&<p className="palace-unified-note" role="alert">Some Palace-hosted stories could not be loaded. The original-author links remain available.</p>}
  <div className="palace-unified-results">
   {shown.map(entry=><article className="palace-unified-card" key={entry.key}>
    <div className="palace-unified-card-top">
     <span className={'palace-unified-source '+(entry.kind==='link'?'external':'hosted')}>{sourceTag(entry.kind)}</span>
     <span className="palace-unified-rating">Rating: {ratedTag(entry.rating)}</span>
    </div>
    <div className="palace-unified-card-body">
     <div className="palace-unified-card-copy">
      <h3>{entry.kind==='link'?<a href={entry.href} target="_blank" rel="noopener noreferrer">{entry.title}</a>:<Link to={entry.href}>{entry.title}</Link>}</h3>
      <p className="palace-unified-author">by {entry.author}</p>
      {entry.summary&&<p className="palace-unified-summary">{entry.summary}</p>}
      {entry.tags.length>0&&<div className="palace-unified-tags" aria-label="Fanwork tags">{entry.tags.slice(0,4).map((tag,i)=><span key={tag+':'+i}>{tag}</span>)}{entry.tags.length>4&&<details><summary>+{entry.tags.length-4} tags</summary><div>{entry.tags.slice(4).map((tag,i)=><span key={tag+':'+i}>{tag}</span>)}</div></details>}</div>}
      {entry.warnings?.length>0&&<p className="palace-unified-warning"><strong>Content notes:</strong> {entry.warnings.join(' · ')}</p>}
     </div>
     <div className="palace-unified-card-actions">
      {entry.kind==='link'?<><a className="palace-unified-read" href={entry.href} target="_blank" rel="noopener noreferrer">Read at original source ↗</a><a className="palace-unified-terms" href={entry.permissionUrl} title={entry.permissionLabel} target="_blank" rel="noopener noreferrer">Author's reuse statement ↗</a></>:<Link className="palace-unified-read" to={entry.href}>Read on the Palace →</Link>}
     </div>
    </div>
   </article>)}
  </div>
  {ordered.length===0&&<p className="palace-unified-empty">No fanworks match these choices. Try another title, rating or source.</p>}
  {visibleCount<ordered.length&&<button className="palace-unified-more" type="button" onClick={()=>setVisibleCount(n=>n+12)}>Show more fanworks ({ordered.length-shown.length} remaining)</button>}
  {restricted>0&&<div className="palace-unified-age"><p>{includeMature?'Mature and explicit recommendations are now shown. This acknowledgement is not age verification.':'Mature and explicit entries are hidden from this unified catalogue by default.'}</p><button type="button" onClick={()=>{setIncludeMature(v=>!v);setVisibleCount(12)}}>{includeMature?'Hide mature works':'I am 18+ · Show mature works'}</button></div>}
  {hasMoreHosted&&onMoreHosted&&<button className="palace-unified-more-hosted" type="button" onClick={onMoreHosted}>Load additional Palace-published works</button>}
  <p className="palace-unified-rights">Externally linked works are not hosted or copied by the Palace. Their authors retain attribution; a licence for an author's original contribution does not necessarily clear rights in the underlying franchise. Site reading progress and downloads apply only to Palace-hosted works.</p>
  {!inFandomAtlas&&<p className="palace-unified-fandom-link"><Link to="/fandoms?section=fanfiction">Explore fanworks by fandom →</Link></p>}
 </section>;
}
