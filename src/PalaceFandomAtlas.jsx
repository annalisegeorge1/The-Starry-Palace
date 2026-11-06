import React,{useEffect,useMemo,useRef,useState} from 'react';
import {Link,useLocation,useNavigate} from 'react-router-dom';
import {getPalaceFandomDirectory,getStoriesForFandomsPage,getPublishedWorks,getArchive,searchPalaceTags} from './palaceData';
import {FANDOM_MEDIA_SHELVES} from './palaceFandomCatalogue';
import {FANDOM_STORY_PAGE_SIZE} from './fandomPublishedPages';
import {visibleFandoms,pageFandoms,fandomMediaLabel,safeFandomSelection,fandomFacetOptions,matchesFandomStoryQuery,resolveFandomDirectoryName} from './fandomDirectoryModel';
import StoryRatingBadge from './StoryRatingBadge';
import StoryCoverImage from './StoryCoverImage';
import UnifiedFanworkCatalogue from './UnifiedFanworkCatalogue';
import {isHostedFanfiction,canDisplayHostedArchive} from './palaceFanfictionDiscovery';
import {toHostedReadingWork} from './hostedReadingWork';
import {MODERN_FANFICTION_LINKS} from './palaceFanfictionDiscovery';
import PalaceInfoMark from './PalaceInfoMark';
import {tagWorldPath} from './tagWorldRoutes';
import {fanworkFandomFromSearch} from './fanworkFandomNavigation';
import './palace-fandom-atlas.css';

export default function PalaceFandomAtlas(){
 const navigate=useNavigate(),location=useLocation();
 const params=new URLSearchParams(location.search);
 const selectedMedia=params.get('media')||'all',keyword=params.get('q')||'';
 const subcategory=params.get('kind')||'all',franchise=params.get('world')||'all';
 const atlasSection=params.get('section')==='fanfiction'?'fanfiction':'directory';
 const exactFandom=atlasSection==='fanfiction'?fanworkFandomFromSearch(location.search):'';
 const urlIds=(params.get('ids')||'').split(',').filter(Boolean);
 const mode=params.get('match')==='all'?'all':'any';
 const [rows,setRows]=useState([]);
 const [loading,setLoading]=useState(true),[error,setError]=useState('');
 const [page,setPage]=useState(0),[sort,setSort]=useState('alpha');
 const [stories,setStories]=useState([]),[storyBusy,setStoryBusy]=useState(false),[storyError,setStoryError]=useState('');
 const [storyResultKey,setStoryResultKey]=useState(''),[storyHasMore,setStoryHasMore]=useState(false);
 const [storyOffset,setStoryOffset]=useState(FANDOM_STORY_PAGE_SIZE);
 const [storyLoadingMore,setStoryLoadingMore]=useState(false),[storyLoadError,setStoryLoadError]=useState('');
 const [withinFandom,setWithinFandom]=useState('');
 const [relatedTags,setRelatedTags]=useState([]);
 const [fanworkRows,setFanworkRows]=useState([]),[historicFanworks,setHistoricFanworks]=useState([]);
 const [fetchedPublished,setFetchedPublished]=useState(0),[fanworksHasMore,setFanworksHasMore]=useState(false);
 const [fanworksLoadingMore,setFanworksLoadingMore]=useState(false);
 const [fanworksBusy,setFanworksBusy]=useState(false),[fanworksError,setFanworksError]=useState('');
 const validMedia=FANDOM_MEDIA_SHELVES.some(x=>x.id===selectedMedia)?selectedMedia:'all';
 const selected=safeFandomSelection(urlIds,rows);
 // Fanwork tag links use a fandom name. Canonicalize a registered exact name
 // or a unique alias, but never guess between unrelated fandoms.
 const namedFandom=atlasSection==='fanfiction'&&exactFandom?
  resolveFandomDirectoryName(rows,exactFandom):null;
 const exactFandomId=namedFandom?.id||null;
 const queryFandomIds=selected.length?selected:exactFandomId?[exactFandomId]:[];
 const resolvingNamedFandom=Boolean(exactFandom&&!selected.length&&loading);
 const unrecognizedNamedFandom=Boolean(exactFandom&&!selected.length&&!loading&&!error&&!exactFandomId);
 const selectedNames=selected.map(id=>rows.find(row=>row.id===id)?.name).filter(Boolean);
 const activeFandomNames=selectedNames.length?selectedNames:namedFandom?[namedFandom.name]:exactFandom?[exactFandom]:[];
 const facets=useMemo(()=>fandomFacetOptions(rows,validMedia),[rows,validMedia]);
 const validSubcategory=facets.categories.includes(subcategory)?subcategory:'all';
 const validFranchise=facets.franchises.includes(franchise)?franchise:'all';
 const filtered=useMemo(()=>visibleFandoms(rows,{media:validMedia,query:keyword,sort,subcategory:validSubcategory,franchise:validFranchise}),[rows,validMedia,keyword,sort,validSubcategory,validFranchise]);
 const list=pageFandoms(filtered,page);
 const matchingSelectedStories=useMemo(()=>
  (storyResultKey===queryFandomIds.join(',')+'|'+mode?stories:[])
   .filter(story=>matchesFandomStoryQuery(story,withinFandom)),
  [stories,withinFandom,storyResultKey,queryFandomIds.join(','),mode]);
 const mediaCounts=useMemo(()=>Object.fromEntries(FANDOM_MEDIA_SHELVES.map(item=>
  [item.id,visibleFandoms(rows,{media:item.id}).length])),[rows]);
 function changeParams(patch,{replace=true}={}){
  const next=new URLSearchParams(location.search);
  Object.entries(patch).forEach(([key,value])=>value?next.set(key,value):next.delete(key));
  navigate({pathname:'/fandoms',search:'?'+next.toString()},{replace,preventScrollReset:true});
 }
 useEffect(()=>{let active=true;setLoading(true);setError('');
  getPalaceFandomDirectory().then(data=>{if(active)setRows(data)})
    .catch(e=>{if(active)setError(e.message)})
    .finally(()=>{if(active)setLoading(false)});
  return()=>{active=false};
 },[]);
 useEffect(()=>{setPage(0)},[keyword,validMedia,sort,validSubcategory,validFranchise]);
 useEffect(()=>{
  if(atlasSection!=='directory'||keyword.trim().length<2||loading||filtered.length){
   setRelatedTags([]);return;
  }
  let active=true;
  const timer=setTimeout(()=>{
   searchPalaceTags(keyword.trim(),'all',12)
    .then(tags=>{if(active)setRelatedTags((tags||[]).filter(tag=>tagWorldPath(tag)&&['relationship','character','trope'].includes(tag.category)&&['canonical','community'].includes(tag.status)).slice(0,4))})
    .catch(()=>{if(active)setRelatedTags([])});
  },250);
  return()=>{active=false;clearTimeout(timer)};
 },[atlasSection,keyword,loading,filtered.length]);

 const selectionKey=queryFandomIds.join(',')+'|'+mode;
 const selectionKeyRef=useRef(selectionKey);
 selectionKeyRef.current=selectionKey;
 useEffect(()=>setWithinFandom(''),[selectionKey]);
 useEffect(()=>{
  let active=true;
  setStories([]);setStoryResultKey('');setStoryHasMore(false);
  setStoryOffset(FANDOM_STORY_PAGE_SIZE);setStoryLoadError('');setStoryLoadingMore(false);
  if(!queryFandomIds.length){setStoryError('');setStoryBusy(false);return()=>{active=false}};
  setStoryBusy(true);setStoryError('');
  getStoriesForFandomsPage(queryFandomIds,mode,{offset:0,limit:FANDOM_STORY_PAGE_SIZE})
   .then(data=>{if(active){
    setStories(data.results);setStoryHasMore(data.hasMore);setStoryResultKey(selectionKey);
   }})
   .catch(e=>{if(active)setStoryError(e?.message||'Selected fandom results are unavailable.')})
   .finally(()=>{if(active)setStoryBusy(false)});
  return()=>{active=false};
 },[selectionKey]);
 async function loadMoreSelectedFandomWorks(){
  if(storyBusy||storyLoadingMore||!storyHasMore||storyResultKey!==selectionKey)return;
  const requestKey=selectionKey;
  setStoryLoadingMore(true);setStoryLoadError('');
  try{
   const page=await getStoriesForFandomsPage(queryFandomIds,mode,
    {offset:storyOffset,limit:FANDOM_STORY_PAGE_SIZE});
   if(selectionKeyRef.current!==requestKey)return;
   setStories(old=>{
    const ids=new Set(old.map(row=>String(row.id)));
    return [...old,...page.results.filter(row=>!ids.has(String(row.id)))];
   });
   setStoryHasMore(page.hasMore);
   setStoryOffset(old=>old+FANDOM_STORY_PAGE_SIZE);
  }catch(e){
   if(selectionKeyRef.current===requestKey)
    setStoryLoadError(e?.message||'Additional fandom results could not be loaded.');
  }finally{
   if(selectionKeyRef.current===requestKey)setStoryLoadingMore(false);
  }
 }
 useEffect(()=>{
  if(atlasSection!=='fanfiction')return;
  let active=true;setFanworksBusy(true);setFanworksError('');
  Promise.allSettled([getPublishedWorks({limit:48}),getArchive(null)]).then(([published,archive])=>{
   if(!active)return;
   if(published.status==='fulfilled'){
    const page=published.value||[];
    setFanworkRows(page.filter(w=>w.work_type==='fanwork'&&w.visibility==='public'));
    setFetchedPublished(page.length);
    setFanworksHasMore(page.length===48);
   }
   if(archive.status==='fulfilled')setHistoricFanworks((archive.value||[]).filter(r=>isHostedFanfiction(r)&&canDisplayHostedArchive(r)).map(toHostedReadingWork));
   if(published.status==='rejected'||archive.status==='rejected')setFanworksError('Part of the Palace-hosted collection is temporarily unavailable.');
  }).finally(()=>{if(active)setFanworksBusy(false)});
  return()=>{active=false};
 },[atlasSection]);
 async function loadMoreFanworks(){
  if(fanworksBusy||fanworksLoadingMore||!fanworksHasMore)return;
  setFanworksLoadingMore(true);setFanworksError('');
  try{
   const page=await getPublishedWorks({offset:fetchedPublished,limit:48});
   const publicFanworks=page.filter(w=>w.work_type==='fanwork'&&w.visibility==='public');
   setFanworkRows(old=>{
    const seen=new Set(old.map(w=>String(w.id)));
    return [...old,...publicFanworks.filter(w=>!seen.has(String(w.id)))];
   });
   // Offset counts all published works fetched, not just fanworks.
   setFetchedPublished(old=>old+page.length);
   setFanworksHasMore(page.length===48);
  }catch{
   setFanworksError('Older public works could not be loaded. You can retry.');
  }finally{
   setFanworksLoadingMore(false);
  }
 }
 function toggle(tag){
  const next=selected.includes(tag.id)?selected.filter(id=>id!==tag.id):[...selected,tag.id].slice(0,5);
  changeParams({ids:next.join(',')},{replace:false});
 }
 return <section className="palace-fandom-atlas" aria-label="Palace fandom directory">
  <header className="palace-fandom-hero">
   <div><p className="eyebrow">THE PALACE FANDOM ATLAS</p><h1>A thousand worlds. A door for each.</h1>
    <p>Browse fandoms by the stories, screens, games and stages they come from. Search by title or alternate name, and gather up to five fandoms into a crossover constellation.</p>
   </div>
   <PalaceInfoMark title="About fandoms and media shelves">
    <p>A fandom can appear on more than one media shelf. For example, a book adapted for television can be found in both places. These are browsing categories—not age ratings or content warnings.</p>
    <p>Community-made fandoms remain visible while they await media classification. Character names, relationships and story tropes live in the Tag Constellation instead.</p>
    <p>To find crossovers, select several fandoms and choose whether stories must match any or all of them. No story or existing author tag is moved by browsing here.</p>
    <p>Use the subcategory and franchise filters to distinguish an adaptation, a spin-off, or a game from its parent universe. Alternate names help find the correct fandom but do not automatically merge different canons.</p>
   </PalaceInfoMark>
  </header>
  <nav className="palace-fandom-mode-switch" aria-label="Fandom Atlas sections">
   <button type="button" aria-pressed={atlasSection==='directory'} onClick={()=>changeParams({section:null})}>Fandom directory</button>
   <button type="button" aria-pressed={atlasSection==='fanfiction'} onClick={()=>changeParams({section:'fanfiction'})}>Fanfiction · {MODERN_FANFICTION_LINKS.length} linked works</button>
  </nav>
  {atlasSection==='directory'&&<>
  <nav className="palace-fandom-media" aria-label="Fandom media shelves">
   {FANDOM_MEDIA_SHELVES.map(item=><button type="button" key={item.id} aria-pressed={validMedia===item.id}
    className={validMedia===item.id?'active':''}
    onClick={()=>changeParams({media:item.id==='all'?null:item.id,kind:null,world:null})}>
    <span aria-hidden="true">{item.glyph}</span>{item.label}<small className="palace-fandom-media-count" aria-label={mediaCounts[item.id]+' fandoms'}>{loading?'·':mediaCounts[item.id]||0}</small>
   </button>)}
  </nav>
  <div className="palace-fandom-searchbar">
   <label><span>Find your fandom</span>
    <input type="search" value={keyword} aria-label="Search fandom titles and alternate names"
     placeholder="Naruto, TWD, IWTV, Bridgerton…" onChange={e=>changeParams({q:e.target.value})}/>
   </label>
   <label><span>Order</span><select aria-label="Sort fandom directory" value={sort} onChange={e=>setSort(e.target.value)}>
    <option value="alpha">A–Z</option><option value="used">Used in stories</option>
   </select></label>
   <label><span>Type of fandom</span><select aria-label="Narrow fandoms by type" value={validSubcategory}
    onChange={e=>changeParams({kind:e.target.value==='all'?null:e.target.value})}>
    <option value="all">Every type</option>{facets.categories.map(kind=><option key={kind} value={kind}>{kind}</option>)}
   </select></label>
   <label><span>Franchise / world</span><select aria-label="Narrow fandoms by franchise" value={validFranchise}
    onChange={e=>changeParams({world:e.target.value==='all'?null:e.target.value})}>
    <option value="all">Every world</option>{facets.franchises.map(world=><option key={world} value={world}>{world}</option>)}
   </select></label>
   <span className="palace-fandom-total" role="status" aria-live="polite">{loading?'Gathering the directory…':filtered.length+' fandom'+(filtered.length===1?'':'s')}</span>
  </div>
  {error&&<div className="live-state error-state" role="alert">{error}<button type="button" onClick={()=>window.location.reload()}>Try again</button></div>}
  {!loading&&!error&&(filtered.length?<>
   <div className="palace-fandom-cardgrid">
    {list.items.map(f=><article key={f.id} className={'palace-fandom-card'+(selected.includes(f.id)?' picked':'')}>
     <div className="palace-fandom-card-top"><span aria-hidden="true">✧</span><small>{(f.media_categories||['uncategorized']).map(fandomMediaLabel).slice(0,2).join(' · ')}</small></div>
     <h2><Link to={tagWorldPath(f)||'/tags?q='+encodeURIComponent(f.name)}>{f.name}</Link></h2>
     <p>{f.subcategory||'Member-created fandom'}</p>
     {f.franchise&&f.franchise!==f.name&&<small className="palace-fandom-franchise">World: {f.franchise}</small>}
     {f.aliases?.length>0&&<small className="palace-fandom-aliases">Also known as {f.aliases.slice(0,2).join(' · ')}</small>}
     <button type="button" aria-pressed={selected.includes(f.id)} onClick={()=>toggle(f)}
      disabled={!selected.includes(f.id)&&selected.length>=5}>
      {selected.includes(f.id)?'✓ In my constellation':'+ Select fandom'}
     </button>
     {tagWorldPath(f)&&<Link className="palace-fandom-browse-door" to={tagWorldPath(f)}>Browse Palace-published stories →</Link>}
     <Link className="palace-fandom-fanfic-door" to={'/fandoms?section=fanfiction&ids='+encodeURIComponent(f.id)}>Browse fanfiction →</Link>
    </article>)}
   </div>
   <footer className="palace-fandom-pages">
    <span>Showing {list.start}–{list.end} of {list.total} · Page {list.page+1}/{list.pages}</span>
    <div><button type="button" disabled={list.page===0} onClick={()=>setPage(list.page-1)}>← Previous</button>
     <button type="button" disabled={list.page===list.pages-1} onClick={()=>setPage(list.page+1)}>Next →</button></div>
   </footer>
  </>:<div className="palace-fandom-empty"><strong>No fandom by that name on this shelf.</strong>
   <p>Looking for a pairing, ship or character? Those are relationship and character tags, not separate fandoms. You can open the matching tag directly without browsing the parent fandom first.</p>
   {relatedTags.length>0&&<div className="palace-fandom-related-tags" aria-label="Matching story tags">
    {relatedTags.map(tag=><Link key={tag.id} to={tagWorldPath(tag)}><span>#{tag.name}</span><small>{tag.category} · Browse tagged stories</small></Link>)}
   </div>}
   {keyword.trim()&&<Link to={'/search?q='+encodeURIComponent(keyword.trim())}>Search all Palace stories for “{keyword.trim()}” →</Link>}
   <button type="button" onClick={()=>changeParams({q:null,media:null,kind:null,world:null})}>All Fandoms →</button><Link to="/tags">Tag Constellation →</Link>
  </div>)}
  <section className="palace-fandom-crossovers" aria-label="Fandom crossover search">
   <div className="palace-fandom-crossovers-head"><div><small>YOUR FANDOM CONSTELLATION</small><h2>{selected.length?'Find works between worlds.':'Choose a world to begin.'}</h2>
    <p>Select up to five fandoms above. Changing these selections never changes a writer’s tags.</p></div>
    {selected.length>0&&<button type="button" onClick={()=>changeParams({ids:null,match:null})}>Clear selection</button>}
   </div>
   {selected.length>0&&<>
    <div className="palace-fandom-selected">{selected.map(id=>{const f=rows.find(row=>row.id===id);return f?<button type="button" key={id} onClick={()=>toggle(f)}>{f.name} ×</button>:null})}</div>
    {selected.length>1&&<fieldset className="palace-fandom-match"><legend>Find stories matching</legend>
     <label><input type="radio" name="fandom-match" checked={mode==='any'} onChange={()=>changeParams({match:'any'})}/>Any selected fandom</label>
     <label><input type="radio" name="fandom-match" checked={mode==='all'} onChange={()=>changeParams({match:'all'})}/>All selected fandoms (crossovers)</label>
    </fieldset>}
    <div className="palace-fandom-stories">
     <label className="palace-fandom-within-search">Find a relationship, character, trope or title inside loaded fandom stories
      <input type="search" value={withinFandom} onChange={event=>setWithinFandom(event.target.value)} placeholder="Try Richonne, slow burn, a character…" aria-label="Search within selected fandom stories"/>
     </label>
     {storyBusy?<p role="status">Gathering tagged stories…</p>:storyError?<p role="alert">{storyError}</p>:matchingSelectedStories.length?<><p>{matchingSelectedStories.length} published {matchingSelectedStories.length===1?'work':'works'} loaded{withinFandom.trim()?' in this local search':''}{storyHasMore?' · More available':''}</p>
      <div>{matchingSelectedStories.map(story=><Link key={story.id} to={'/work/'+story.slug} className="palace-fandom-story">
       <span className="palace-fandom-story-cover palace-rating-anchor">{<StoryCoverImage src={story.cover_url}/>}<StoryRatingBadge rating={story.rating}/></span>
       <span><strong>{story.title}</strong><small>{story.profiles?.display_name||story.profiles?.username||'Palace writer'}</small><em>{story.summary||'Read this world in the Palace.'}</em></span>
      </Link>)}</div></>:<p role="status">{storyHasMore
      ?withinFandom.trim()?'No matches among the stories loaded so far. More fandom pages remain; load additional works or clear this search.':'No public works in the pages checked so far. More fandom pages remain to be checked.'
      :withinFandom.trim()?'No loaded public stories match this character, relationship or tag. Try a shorter term or clear this search.':'No public published stories were returned for this constellation.'}</p>}
     {storyLoadError&&<p role="alert">{storyLoadError}</p>}
     {storyHasMore&&storyResultKey===selectionKey&&<button type="button"
      disabled={storyLoadingMore} onClick={loadMoreSelectedFandomWorks}>
      {storyLoadingMore?'Loading older fandom works…':'Load more matching published works'}
     </button>}
     <small className="palace-fandom-access-note">All published public works can appear here, including Mature and Explicit. Story text still follows reader age restrictions; private or members-only works retain their visibility settings.</small>
    </div>
   </>}
   <footer><Link to="/tags?category=relationship">Explore relationship tags →</Link><Link to="/tags">Open Tag Constellation for characters, relationships, tropes and exclusions →</Link><Link to="/writing">Create a fanwork →</Link></footer>
  </section>
  </>}
  {atlasSection==='fanfiction'&&<section className="palace-fandom-linked-section" aria-label="Fanfiction by fandom">
   {activeFandomNames.length>0&&<div className="palace-fandom-selection-note"><span>Fandom{activeFandomNames.length>1?'s':''}: <strong>{activeFandomNames.join(' · ')}</strong></span><button type="button" onClick={()=>changeParams({ids:null,match:null,fandom:null})}>All fanfiction</button><button type="button" onClick={()=>changeParams({section:null,fandom:null})}>Choose different fandoms</button></div>}
   {unrecognizedNamedFandom&&<p className="palace-fandom-access-note" role="status">This fandom name or alias is not currently matched to a unique Palace directory tag. Matching author-source links may still appear below, but the hosted results cannot be verified from this name alone.</p>}
   <UnifiedFanworkCatalogue key={activeFandomNames.join(',')+'|'+mode} publishedWorks={[...(queryFandomIds.length&&storyResultKey===selectionKey?stories:[]),...fanworkRows,...historicFanworks]} globalQuery={activeFandomNames.length?'':keyword} fandomNames={activeFandomNames} fandomMatch={mode} loading={fanworksBusy||fanworksLoadingMore||resolvingNamedFandom||queryFandomIds.length>0&&storyBusy} loadError={fanworksError||queryFandomIds.length>0&&storyError||exactFandom&&error} inFandomAtlas={true} defaultSource="all" hasMoreHosted={queryFandomIds.length>0?storyHasMore:fanworksHasMore}
     loadingMoreHosted={queryFandomIds.length>0?storyLoadingMore:fanworksLoadingMore}
     onMoreHosted={queryFandomIds.length>0?loadMoreSelectedFandomWorks:loadMoreFanworks}/>
   <p className="palace-fandom-complete-archive"><Link to="/reading?section=fanfiction">Browse the full Palace-hosted and linked Fanwork catalogue →</Link></p>
  </section>}
 </section>;
}
