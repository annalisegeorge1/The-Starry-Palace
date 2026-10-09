import React,{useEffect,useMemo,useState} from 'react';
import {Link,useLocation,useNavigate} from 'react-router-dom';
import {getPalaceFandomDirectory,getStoriesForFandoms} from './palaceData';
import {FANDOM_MEDIA_SHELVES} from './palaceFandomCatalogue';
import {visibleFandoms,pageFandoms,fandomMediaLabel,safeFandomSelection} from './fandomDirectoryModel';
import StoryRatingBadge from './StoryRatingBadge';
import PalaceInfoMark from './PalaceInfoMark';
import './palace-fandom-atlas.css';

export default function PalaceFandomAtlas(){
 const navigate=useNavigate(),location=useLocation();
 const params=new URLSearchParams(location.search);
 const selectedMedia=params.get('media')||'all',keyword=params.get('q')||'';
 const urlIds=(params.get('ids')||'').split(',').filter(Boolean);
 const mode=params.get('match')==='all'?'all':'any';
 const [rows,setRows]=useState([]);
 const [loading,setLoading]=useState(true),[error,setError]=useState('');
 const [page,setPage]=useState(0),[sort,setSort]=useState('alpha');
 const [stories,setStories]=useState([]),[storyBusy,setStoryBusy]=useState(false),[storyError,setStoryError]=useState('');
 const validMedia=FANDOM_MEDIA_SHELVES.some(x=>x.id===selectedMedia)?selectedMedia:'all';
 const selected=safeFandomSelection(urlIds,rows);
 const filtered=useMemo(()=>visibleFandoms(rows,{media:validMedia,query:keyword,sort}),[rows,validMedia,keyword,sort]);
 const list=pageFandoms(filtered,page);
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
 useEffect(()=>{setPage(0)},[keyword,validMedia,sort]);
 const selectionKey=selected.join(',')+'|'+mode;
 useEffect(()=>{let active=true;if(!selected.length){setStories([]);setStoryError('');setStoryBusy(false);return};
  setStoryBusy(true);setStoryError('');
  getStoriesForFandoms(selected,mode)
   .then(data=>{if(active)setStories(data)})
   .catch(e=>{if(active)setStoryError(e.message)})
   .finally(()=>{if(active)setStoryBusy(false)});
  return()=>{active=false};
 },[selectionKey]);
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
   </PalaceInfoMark>
  </header>
  <nav className="palace-fandom-media" aria-label="Fandom media shelves">
   {FANDOM_MEDIA_SHELVES.map(item=><button type="button" key={item.id} aria-pressed={validMedia===item.id}
    className={validMedia===item.id?'active':''}
    onClick={()=>changeParams({media:item.id==='all'?null:item.id})}>
    <span aria-hidden="true">{item.glyph}</span>{item.label}
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
   <span className="palace-fandom-total" role="status" aria-live="polite">{loading?'Gathering the directory…':filtered.length+' fandom'+(filtered.length===1?'':'s')}</span>
  </div>
  {error&&<div className="live-state error-state" role="alert">{error}<button type="button" onClick={()=>window.location.reload()}>Try again</button></div>}
  {!loading&&!error&&(filtered.length?<>
   <div className="palace-fandom-cardgrid">
    {list.items.map(f=><article key={f.id} className={'palace-fandom-card'+(selected.includes(f.id)?' picked':'')}>
     <div className="palace-fandom-card-top"><span aria-hidden="true">✧</span><small>{(f.media_categories||['uncategorized']).map(fandomMediaLabel).slice(0,2).join(' · ')}</small></div>
     <h2>{f.name}</h2>
     <p>{f.subcategory||'Member-created fandom'}</p>
     {f.franchise&&f.franchise!==f.name&&<small className="palace-fandom-franchise">World: {f.franchise}</small>}
     {f.aliases?.length>0&&<small className="palace-fandom-aliases">Also known as {f.aliases.slice(0,2).join(' · ')}</small>}
     <button type="button" aria-pressed={selected.includes(f.id)} onClick={()=>toggle(f)}
      disabled={!selected.includes(f.id)&&selected.length>=5}>
      {selected.includes(f.id)?'✓ In my constellation':'+ Select fandom'}
     </button>
    </article>)}
   </div>
   <footer className="palace-fandom-pages">
    <span>Showing {list.start}–{list.end} of {list.total} · Page {list.page+1}/{list.pages}</span>
    <div><button type="button" disabled={list.page===0} onClick={()=>setPage(list.page-1)}>← Previous</button>
     <button type="button" disabled={list.page===list.pages-1} onClick={()=>setPage(list.page+1)}>Next →</button></div>
   </footer>
  </>:<div className="palace-fandom-empty"><strong>No matching fandom on this shelf yet.</strong><p>Try a different name, return to All Fandoms, or create the community tag in the Tag Constellation.</p>
   <button type="button" onClick={()=>changeParams({q:null,media:null})}>All Fandoms →</button><Link to="/tags">Add a community tag →</Link>
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
     {storyBusy?<p role="status">Gathering tagged stories…</p>:storyError?<p role="alert">{storyError}</p>:stories.length?<><p>{stories.length} published {stories.length===1?'work':'works'} found</p>
      <div>{stories.map(story=><Link key={story.id} to={'/work/'+story.slug} className="palace-fandom-story">
       <span className="palace-fandom-story-cover palace-rating-anchor">{story.cover_url?<img alt="" loading="lazy" src={story.cover_url}/>:<span aria-hidden="true">✦</span>}<StoryRatingBadge rating={story.rating}/></span>
       <span><strong>{story.title}</strong><small>{story.profiles?.display_name||story.profiles?.username||'Palace writer'}</small><em>{story.summary||'Read this world in the Palace.'}</em></span>
      </Link>)}</div></>:<p>No published stories are attached to this constellation yet. Be the first to write one.</p>}
    </div>
   </>}
   <footer><Link to="/tags">Open Tag Constellation for characters, relationships, tropes and exclusions →</Link><Link to="/writing">Create a fanwork →</Link></footer>
  </section>
 </section>;
}
