import React,{useEffect,useMemo,useState} from 'react';
import {Link,useParams} from 'react-router-dom';
import {getPalaceTagById,searchPalaceTags} from './palaceData';
import usePublishedBrowse from './usePublishedBrowse';
import ReadingArchivePager from './ReadingArchivePager';
import ReadingStoryContext from './ReadingStoryContext';
import ReadingStoryStats from './ReadingStoryStats';
import ReadingCardTags from './ReadingCardTags';
import StoryRatingBadge from './StoryRatingBadge';
import {TAG_UUID,TAG_WORLD_LABELS,tagWorldPath} from './tagWorldRoutes';
import './palace-tag-world.css';

const SORTS=[
 ['updated','Recently updated'],['published','Newest published'],['oldest','Oldest published'],
 ['title','Title A–Z'],['words','Most words'],['chapters','Most chapters'],['comments','Most comments']
];
const RATINGS=[['all','Any rating'],['general','General'],['teen','Teen'],['mature','Mature'],['explicit','Explicit'],['not_rated','Not rated']];
const STATUSES=[['all','Any status'],['complete','Complete'],['in_progress','In progress'],['hiatus','On hiatus'],['abandoned','Abandoned']];
const SUGGESTION_CATEGORIES=['fandom','relationship','character','trope','genre','warning','theme','mood'];
function Selector({label,value,options,onChange}){
 return <label><span>{label}</span><select value={value} onChange={e=>onChange(e.target.value)}>
  {options.map(([key,name])=><option key={key} value={key}>{name}</option>)}
 </select></label>;
}
/** Every tag page is a public reading destination. Writing and interactions stay gated. */
export default function PalaceTagWorld(){
 const {tagId}=useParams();
 const valid=TAG_UUID.test(String(tagId||''));
 const [tag,setTag]=useState(null);
 const [tagBusy,setTagBusy]=useState(true);
 const [tagError,setTagError]=useState('');
 const [text,setText]=useState('');
 const [rating,setRating]=useState('all');
 const [status,setStatus]=useState('all');
 const [sort,setSort]=useState('updated');
 const [origin,setOrigin]=useState('all');
 const [extraInclude,setExtraInclude]=useState([]);
 const [extraExclude,setExtraExclude]=useState([]);
 const [searchTags,setSearchTags]=useState('');
 const [suggestions,setSuggestions]=useState([]);
 const [suggestBusy,setSuggestBusy]=useState(false);
 const [suggestError,setSuggestError]=useState('');
 const [retryTag,setRetryTag]=useState(0);
 useEffect(()=>{
  if(!valid){setTag(null);setTagBusy(false);setTagError('This tag address is not valid.');return}
  let active=true;setTagBusy(true);setTagError('');setTag(null);
  getPalaceTagById(tagId).then(result=>{
   if(active){setTag(result);if(!result)setTagError('This tag could not be found in the public Palace directory.')}
  }).catch(()=>{if(active)setTagError('This tag could not be gathered. Please try again.')})
   .finally(()=>{if(active)setTagBusy(false)});
  return()=>{active=false};
 },[tagId,valid,retryTag]);
 useEffect(()=>{
  setText('');setRating('all');setStatus('all');setSort('updated');
  setOrigin('all');setExtraInclude([]);setExtraExclude([]);setSearchTags('');
 },[tagId]);
 useEffect(()=>{
  const term=searchTags.trim();
  if(!term){setSuggestions([]);setSuggestBusy(false);setSuggestError('');return}
  let active=true;setSuggestBusy(true);setSuggestError('');
  const timer=setTimeout(()=>{
   searchPalaceTags(term,'all',35).then(rows=>{
    if(active)setSuggestions((rows||[]).filter(row=>tagWorldPath(row)&&row.id!==tagId&&['canonical','community'].includes(row.status)));
   }).catch(()=>{if(active){setSuggestions([]);setSuggestError('Tag suggestions are unavailable. Please try again.')}})
    .finally(()=>{if(active)setSuggestBusy(false)});
  },240);
  return()=>{active=false;clearTimeout(timer)};
 },[searchTags,tagId]);
 const enabled=Boolean(tag)&&valid;
 const include=useMemo(()=>enabled?[tag.id,...extraInclude.filter(id=>id!==tag.id)]:[],[enabled,tag?.id,extraInclude]);
 const archive=usePublishedBrowse({enabled,identity:'public-tag-'+tagId,text,include,exclude:extraExclude,rating,status,origin,sort});
 function choose(id,mode){
  if(mode==='include'){
   setExtraExclude(prev=>prev.filter(item=>item!==id));
   setExtraInclude(prev=>prev.includes(id)?prev.filter(item=>item!==id):[...prev,id].slice(0,12));
  }else{
   setExtraInclude(prev=>prev.filter(item=>item!==id));
   setExtraExclude(prev=>prev.includes(id)?prev.filter(item=>item!==id):[...prev,id].slice(0,12));
  }
 }
 function reset(){
  setText('');setRating('all');setStatus('all');setSort('updated');setOrigin('all');
  setExtraInclude([]);setExtraExclude([]);
 }
 const total=archive.snapshot?.total||0;
 const results=archive.snapshot?.results||[];
 const categoryName=TAG_WORLD_LABELS[tag?.category]||'Tag';
 const canBrowse=Boolean(tag);
 const changed=Boolean(text||rating!=='all'||status!=='all'||sort!=='updated'||origin!=='all'||extraInclude.length||extraExclude.length);
 return <section className="palace-tag-world" aria-label="Tag story archive">
  <nav className="tag-world-crumbs" aria-label="Breadcrumb"><Link to="/reading">Reading Rooms</Link><span aria-hidden="true">›</span>
   <Link to={tag?.category==='fandom'?'/fandoms':'/tags'}>{tag?.category==='fandom'?'Fandom Atlas':'Tag Constellation'}</Link>
   <span aria-hidden="true">›</span><span>{tag?.name||'Tag'}</span></nav>
  {tagBusy&&<div className="tag-world-loading" role="status">Gathering this constellation…</div>}
  {!tagBusy&&!canBrowse&&<section className="tag-world-unavailable" role="alert">
   <h1>This constellation is out of view.</h1><p>{tagError}</p>
   <button type="button" onClick={()=>setRetryTag(n=>n+1)}>Try again</button>
   <Link to="/tags">Explore all tags</Link>
  </section>}
  {canBrowse&&<>
   <header className="tag-world-hero">
    <div><p className="eyebrow">THE STARry PALACE · {categoryName.toUpperCase()} ARCHIVE</p>
     <h1>{tag.name}</h1>
     <p>Every published story bearing this {categoryName.toLowerCase()} tag, gathered into one constellation. Browse freely; sign in only when you want to take part.</p>
     <div className="tag-world-hero-actions"><Link to="/reading">Explore all stories →</Link>
      <Link to={tag.category==='fandom'?'/fandoms':'/tags'}>{tag.category==='fandom'?'Other fandoms':'Other tags'} →</Link></div>
    </div><span className="tag-world-hero-symbol" aria-hidden="true">{tag.category==='relationship'?'∞':tag.category==='fandom'?'✧':tag.category==='character'?'♙':'✦'}</span>
   </header>
   <div className="tag-world-layout">
    <main className="tag-world-results">
     <div className="tag-world-results-head"><div><p className="eyebrow">PUBLISHED WORKS</p>
      <h2>{archive.snapshot?total.toLocaleString()+' '+(total===1?'story':'stories'):'Gathering stories…'}</h2>
      <p>Archive-wide results · filters apply before pages are counted</p>
     </div>{changed&&<button type="button" onClick={reset}>Clear refinements ×</button>}</div>
     {archive.loading&&<div className="tag-world-loading" role="status">Searching published stories…</div>}
     {archive.error&&<section className="tag-world-unavailable" role="alert"><h3>Search is unavailable right now.</h3>
      <p>{archive.error}</p><button type="button" onClick={archive.retry}>Try the search again</button></section>}
     {archive.snapshot&&total===0&&<section className="tag-world-empty" role="status">
      <span aria-hidden="true">✧</span><h3>No matching stories yet.</h3>
      <p>{changed?'Try fewer filters, or return to this tag’s complete story shelf.':'This tag is ready for its first published story.'}</p>
      {changed&&<button type="button" onClick={reset}>Show all stories under this tag</button>}
     </section>}
     {archive.snapshot&&results.length>0&&<div className="tag-world-story-list">{results.map(work=>
      <article className="tag-world-story" key={work.id}>
       <Link className="tag-world-story-cover palace-rating-anchor" to={'/work/'+work.slug}>
        {work.cover_url?<img src={work.cover_url} loading="lazy" decoding="async" alt=""/>:<span aria-hidden="true">☾</span>}
        <StoryRatingBadge rating={work.rating}/></Link>
       <div className="tag-world-story-body">
        <div className="tag-world-story-meta"><span>{work.profiles?.display_name||work.profiles?.username||'Palace writer'}</span>
         {work.last_published_at&&<time dateTime={work.last_published_at}>{new Date(work.last_published_at).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'})}</time>}</div>
        <h3><Link to={'/work/'+work.slug}>{work.title}</Link></h3>
        <ReadingStoryContext work={work} compact previewLength={290}/>
        <ReadingCardTags tags={(work.work_tags||[]).map(item=>item.tags).filter(Boolean)} limit={7}/>
        <ReadingStoryStats work={work}/>
        <Link className="tag-world-story-enter" to={'/work/'+work.slug}>Read this story →</Link>
       </div>
      </article>)}</div>}
     {archive.snapshot&&<ReadingArchivePager page={archive.page} total={total} pending={archive.pending} onPage={archive.goPage}/>}
    </main>
    <aside className="tag-world-filters" aria-label="Filter tagged stories">
     <div className="tag-world-filter-head"><p className="eyebrow">REFINE THE CONSTELLATION</p><h2>Sort &amp; Filter</h2></div>
     <label className="tag-world-search-label"><span>Search within these stories</span><input type="search" value={text} onChange={e=>setText(e.target.value)} placeholder="Title, writer, another tag…"/></label>
     <div className="tag-world-selectors">
      <Selector label="Sort by" value={sort} onChange={setSort} options={SORTS}/>
      <Selector label="Rating" value={rating} onChange={setRating} options={RATINGS}/>
      <Selector label="Completion" value={status} onChange={setStatus} options={STATUSES}/>
      <Selector label="Story type" value={origin} onChange={setOrigin} options={ [['all','All types'],['fandom','Fanworks'],['original','Original and other works']]}/>
     </div>
     <div className="tag-world-more-tags"><h3>Combine more tags</h3><p>Include all the tags you want. Exclude any you don't. Your current {categoryName.toLowerCase()} stays included.</p>
      <label><span>Search the full tag directory</span><input type="search" value={searchTags} onChange={e=>setSearchTags(e.target.value)} placeholder="Relationship, character, warning…"/></label>
      {suggestBusy&&<p role="status">Finding tags…</p>}
      {suggestError&&<p role="alert">{suggestError}</p>}
      {extraInclude.length+extraExclude.length>0&&<div className="tag-world-selected-tags" aria-label="Selected extra tag filters">
       <span>{extraInclude.length} included · {extraExclude.length} excluded</span>
       <button type="button" onClick={()=>{setExtraInclude([]);setExtraExclude([])}}>Clear extra tags</button></div>}
      {searchTags.trim()&&<div className="tag-world-suggestions">{suggestions.map(item=><div key={item.id} className="tag-world-suggestion">
       <Link to={tagWorldPath(item)} title={'Browse '+item.name}>{item.name}</Link>
       <div><button type="button" aria-label={'Include '+item.name} aria-pressed={extraInclude.includes(item.id)} onClick={()=>choose(item.id,'include')}>＋</button>
        <button type="button" aria-label={'Exclude '+item.name} aria-pressed={extraExclude.includes(item.id)} onClick={()=>choose(item.id,'exclude')}>−</button></div>
      </div>)}
      {!suggestBusy&&!suggestError&&!suggestions.length&&<p>No matching tags found.</p>}</div>}
     </div>
     <div className="tag-world-filter-footer"><Link to="/reading?view=search">Advanced search →</Link><Link to="/tags?category=relationship">Browse relationships →</Link></div>
    </aside>
   </div>
  </>}
 </section>;
}
