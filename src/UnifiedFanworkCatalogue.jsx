import React,{useMemo,useState} from 'react';
import {Link} from 'react-router-dom';
import {fanworkFandomHref} from './fanworkFandomNavigation';
import {MODERN_FANFICTION_LINKS,isHostedFanfiction} from './palaceFanfictionDiscovery';
import {matchesReadingRelationships} from './readingFacetModel';
import {modernFanfictionGuide,hostedFanfictionGuide,FANFICTION_RATINGS,
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
const sourceTag=(type)=>type==='link'?'Original author’s site':type==='licensed'?'Hosted with author licence':type==='historical'?'Hosted historical fanwork':'Palace member fanwork';
export function createUnifiedFanworks(works=[],external=MODERN_FANFICTION_LINKS){
 const seen=new Set();
 const all=[];
 const sourceIdentity=url=>{
  const value=String(url||'');
  const ffn=value.match(/fanfiction\.net\/s\/(\d+)/i);
  if(ffn)return 'ffn:'+ffn[1];
  const ao3=value.match(/(?:archiveofourown\.org|archive\.transformativeworks\.org)\/works\/(\d+)/i);
  if(ao3)return 'ao3:'+ao3[1];
  return value.trim().toLowerCase().replace(/\/$/,'');
 };
 const hostedSources=new Set(works.filter(w=>w?.is_archive&&w?.archive_source_url)
  .map(w=>sourceIdentity(w.archive_source_url)));
 for(const work of works){
  if(!work||!(work.work_type==='fanwork'||work.is_archive&&isHostedFanfiction(work)))continue;
  const key=work.is_archive?'archive:'+work.slug:'member:'+work.id;
  if(!key||seen.has(key))continue;
  seen.add(key);
  all.push({key,kind:work.is_archive?(work.archive_category==='licensed_fanfiction'?'licensed':'historical'):'member',title:work.title||'Untitled fanwork',author:authorOf(work),rating:work.rating||'not_rated',
   summary:work.summary||'',tags:palaceTags(work).map(t=>t.name),tagDetails:palaceTags(work),warnings:work.is_archive?hostedFanfictionGuide(work).contentWarnings:[],href:memberUrl(work),work});
 }
 for(const work of external){
  if(!work?.sourceUrl||!work?.id||hostedSources.has(sourceIdentity(work.sourceUrl)))continue;
  const key='external:'+work.id;if(seen.has(key))continue;seen.add(key);
  const guide=modernFanfictionGuide(work);
  all.push({key,kind:'link',title:work.title,author:work.creator,rating:guide.rating||'not_rated',
   summary:work.description||'',tags:guide.tags.map(t=>t.name),tagDetails:guide.tags,warnings:guide.contentWarnings,
   href:work.sourceUrl,permissionUrl:work.permissionUrl,permissionLabel:work.permissionLabel,work});
 }
 return all;
}
export function filterUnifiedFanworks(rows,{query='',rating='all',source='all',animeOnly=false,
 fandomNames=[],fandomMatch='any',completion='all',includeTags=[],excludeTags=[],tagNames={},
 relationshipIncluded=[],relationshipExcluded=[]}={}){
 const needle=normalized(query).trim();
 const matchedLinks=filterModernFanfiction(rows.filter(x=>x.kind==='link').map(x=>x.work),
  {query,rating,animeOnly,fandomNames,fandomMatch});
 const linkedIds=new Set(matchedLinks.map(x=>x.id));
 const selectedFandoms=fandomNames.map(normalized).filter(Boolean);
 // Reading Rooms supplies canonical tag IDs and the names of selected tags.
 // Source-linked works have descriptive tag names but no Palace tag IDs.
 // Compare by ID when possible and by an exact tag name otherwise.
 const hasTag=(entry,selected)=>{
  const id=String(selected??'');
  const name=normalized(tagNames?.[id]||id).trim();
  return (entry.tagDetails||[]).some(tag=>
   tag?.id!=null&&String(tag.id)===id||Boolean(name)&&normalized(tag?.name).trim()===name);
 };
 return rows.filter(x=>{
  if(source==='hosted'&&x.kind==='link'||source==='linked'&&x.kind!=='link')return false;
  // Published metadata is searchable at every rating; the actual reader
  // route independently enforces chapter access and minimum reader age.
  if(!includeTags.every(tag=>hasTag(x,tag))||excludeTags.some(tag=>hasTag(x,tag)))return false;
  if(!matchesReadingRelationships({...x.work,work_tags:(x.tagDetails||[]).map(tag=>({tags:tag}))},
   relationshipIncluded,relationshipExcluded))return false;
  if(x.kind==='link'){
   if(completion!=='all')return false; // completion not verified consistently for external sources
   return linkedIds.has(x.work.id);
  }
  if(rating!=='all'&&x.rating!==rating)return false;
  if(animeOnly&&!palaceTags(x.work).some(t=>t.category==='format'&&t.name==='Anime & Manga'||/naruto|one piece|bleach|anime|manga|yu.gi.oh|evangelion|cardcaptor|durara|inuyasha|dragon ball|vampire knight/i.test(t.name)))return false;
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
 includeTags=[],excludeTags=[],tagNames={},relationshipIncluded=[],relationshipExcluded=[],
 loading=false,loadError='',inFandomAtlas=false,hasMoreHosted=false,onMoreHosted,defaultSource='all'}){
 const [search,setSearch]=useState('');
 const [rating,setRating]=useState('all');
 const [source,setSource]=useState(defaultSource);
 const [animeOnly,setAnimeOnly]=useState(false);
 const [visibleCount,setVisibleCount]=useState(24);
 const [sort,setSort]=useState('source');
 const all=useMemo(()=>createUnifiedFanworks(publishedWorks,externalWorks),[publishedWorks,externalWorks]);
 const filtered=useMemo(()=>filterUnifiedFanworks(all,{
  query:[globalQuery,search].filter(Boolean).join(' '),rating:rating==='all'?globalRating:rating,source,animeOnly,
  fandomNames,fandomMatch,completion,includeTags,excludeTags,tagNames,relationshipIncluded,relationshipExcluded
 }),[all,globalQuery,search,rating,globalRating,source,animeOnly,fandomNames,fandomMatch,completion,
  includeTags,excludeTags,tagNames,relationshipIncluded,relationshipExcluded]);
 const ordered=useMemo(()=>[...filtered].sort((a,b)=>sort==='source'?
  (a.kind==='link'?1:0)-(b.kind==='link'?1:0)||a.title.localeCompare(b.title):
  a.title.localeCompare(b.title)),[filtered,sort]);
 const shown=ordered.slice(0,visibleCount);
 const externalCount=all.filter(x=>x.kind==='link').length;
 const hostedCount=all.length-externalCount;
 const reset=()=>{setSearch('');setRating('all');setSource(defaultSource);setAnimeOnly(false);setVisibleCount(24);setSort('source')};
 return <section className="palace-unified-fanworks" aria-labelledby="palace-unified-fanworks-title">
  <header className="palace-unified-fanworks-head">
   <p className="eyebrow">FANFICTION · ONE SHARED DISCOVERY SHELF</p>
   <h2 id="palace-unified-fanworks-title">Fan-made works</h2>
   <p>Read published fanfiction here, or discover more works on their authors’ original sites. Each card clearly shows where the story can be read.</p>
   <p className="palace-unified-totals" role="status"><strong>{hostedCount} Palace-hosted works loaded</strong>{source!=='hosted'&&<> · <strong>{externalCount} author-source links</strong></>}{hasMoreHosted?' · More Palace works available':''}</p>
  </header>
  <div className="palace-unified-filterbar" role="search" aria-label="Search all fanworks">
   <label className="palace-unified-search"><span>Find a fanwork</span><input type="search" value={search} maxLength={120} placeholder="Title, author, fandom or trope…" onChange={e=>{setSearch(e.target.value);setVisibleCount(24)}}/></label>
   <label className="palace-unified-source-choice"><span>Read from</span><select value={source} onChange={e=>{setSource(e.target.value);setVisibleCount(24)}}><option value="all">All sources</option><option value="hosted">On the Palace</option><option value="linked">Author’s site</option></select></label>
   <details className="palace-unified-advanced-filters">
    <summary>More filters{rating!=='all'||animeOnly?' · Active':''}</summary>
    <div>
     <label><span>Rating</span><select value={rating} onChange={e=>{setRating(e.target.value);setVisibleCount(24)}}>{FANFICTION_RATINGS.map(x=><option key={x.id} value={x.id}>{x.label}</option>)}</select></label>
     <button type="button" aria-pressed={animeOnly} className={'palace-unified-anime'+(animeOnly?' active':'')} onClick={()=>{setAnimeOnly(x=>!x);setVisibleCount(24)}}>Anime &amp; manga</button>
     {(search||rating!=='all'||source!==defaultSource||animeOnly||sort!=='source')&&<button type="button" className="palace-unified-clear" onClick={reset}>Clear filters</button>}
    </div>
   </details>
  </div>
  <div className="palace-unified-toolbar">
   <span role="status" aria-live="polite">Showing {shown.length} of {ordered.length} matching works</span>
   <label>Order <select value={sort} onChange={e=>{setSort(e.target.value);setVisibleCount(24)}}><option value="source">Read here first</option><option value="title">Title A–Z</option></select></label>
  </div>
  {loading&&<p className="palace-unified-note" role="status">Gathering the Palace-hosted stories. Original-author recommendations are still available.</p>}
  {loadError&&<p className="palace-unified-note" role="alert">Some Palace-hosted stories could not be loaded. The original-author links remain available.</p>}
  <div className="palace-unified-results">
   {shown.map((entry,i)=><React.Fragment key={entry.key}>
    {sort==='source'&&(i===0||(shown[i-1].kind==='link')!==(entry.kind==='link'))&&<div className="palace-unified-group-heading"><h3>{entry.kind==='link'?'Explore original author sites':'Read here on the Palace'}</h3><span>{entry.kind==='link'?'These stories open on their creators’ websites; no copies are hosted here.':'Published fanworks you can read without leaving the Palace.'}</span></div>}
    <article className={'palace-unified-card '+(entry.kind==='link'?'source-external':'source-hosted')}>
    <div className="palace-unified-card-top">
     <span className={'palace-unified-source '+(entry.kind==='link'?'external':'hosted')}>{sourceTag(entry.kind)}</span>
     <span className="palace-unified-rating">Rating: {ratedTag(entry.rating)}</span>
    </div>
    <div className="palace-unified-card-body">
     <div className="palace-unified-card-copy">
      <h3>{entry.kind==='link'?<a href={entry.href} target="_blank" rel="noopener noreferrer">{entry.title}</a>:<Link to={entry.href}>{entry.title}</Link>}</h3>
      <p className="palace-unified-author">by {entry.author}</p>
      {entry.summary&&<p className="palace-unified-summary">{entry.summary}</p>}
      {entry.tagDetails?.length>0&&<div className="palace-unified-tags" aria-label="Fanwork tags">{entry.tagDetails.slice(0,4).map((tag,i)=>tag.category==='fandom'?<Link key={tag.name+':'+i} to={fanworkFandomHref(tag.name)} title={'Browse '+tag.name+' fanfiction'}>{tag.name}</Link>:<span key={tag.name+':'+i}>{tag.name}</span>)}{entry.tagDetails.length>4&&<details><summary>+{entry.tagDetails.length-4} tags</summary><div>{entry.tagDetails.slice(4).map((tag,i)=>tag.category==='fandom'?<Link key={tag.name+':'+i} to={fanworkFandomHref(tag.name)} title={'Browse '+tag.name+' fanfiction'}>{tag.name}</Link>:<span key={tag.name+':'+i}>{tag.name}</span>)}</div></details>}</div>}
      {entry.warnings?.length>0&&<p className="palace-unified-warning"><strong>Content notes:</strong> {entry.warnings.join(' · ')}</p>}
     </div>
     <div className="palace-unified-card-actions">
      {entry.kind==='link'?<><a className="palace-unified-read" href={entry.href} target="_blank" rel="noopener noreferrer">Read at original source ↗</a><a className="palace-unified-terms" href={entry.permissionUrl} title={entry.permissionLabel} target="_blank" rel="noopener noreferrer">Author notes &amp; reuse terms ↗</a></>:<Link className="palace-unified-read" to={entry.href}>Read on the Palace →</Link>}
     </div>
    </div>
    </article></React.Fragment>)}
  </div>
  {ordered.length===0&&<p className="palace-unified-empty">No fanworks match these choices. Try another title, rating or source.</p>}
  {visibleCount<ordered.length&&<button className="palace-unified-more" type="button" onClick={()=>setVisibleCount(n=>n+24)}>Show more fanworks ({ordered.length-shown.length} remaining)</button>}
  <p className="palace-unified-age">Published Mature and Explicit work information may appear in search results. Ratings and content notes help readers choose; protected chapter access still follows the Palace's age and visibility rules.</p>
  {hasMoreHosted&&onMoreHosted&&<button className="palace-unified-more-hosted" type="button" onClick={onMoreHosted}>Load additional Palace-published works</button>}
  <p className="palace-unified-rights">Works labeled “Read on the Palace” have a published hosted edition. Author-source links open the original website and are not hosted or copied here. Fanfiction authors' reuse terms do not automatically clear the underlying franchise rights.</p>
  {!inFandomAtlas&&<p className="palace-unified-fandom-link"><Link to="/fandoms?section=fanfiction">Explore fanworks by fandom →</Link></p>}
 </section>;
}
