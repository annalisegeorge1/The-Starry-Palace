import React,{useEffect,useMemo,useState} from 'react';
import {Link} from 'react-router-dom';
import {getPalaceFandomDirectory} from './palaceData';
import {FANDOM_MEDIA_SHELVES} from './palaceFandomCatalogue';
import {visibleFandoms} from './fandomDirectoryModel';
import './palace-fandom-mini-picker.css';

/** Remains collapsed and makes no requests until the writer opens it. */
export default function PalaceFandomMiniPicker({onChoose,selectedIds=[]}){
 const [open,setOpen]=useState(false),[loading,setLoading]=useState(false),[error,setError]=useState('');
 const [rows,setRows]=useState([]),[media,setMedia]=useState('all'),[query,setQuery]=useState('');
 const [sort,setSort]=useState('alpha'),[limit,setLimit]=useState(16);
 useEffect(()=>{if(!open||rows.length)return;let alive=true;setLoading(true);
  getPalaceFandomDirectory().then(result=>{if(alive)setRows(result)})
   .catch(e=>{if(alive)setError(e.message)})
   .finally(()=>{if(alive)setLoading(false)});
  return()=>{alive=false};
 },[open]);
 const matching=useMemo(()=>visibleFandoms(rows,{media,query,sort}).filter(x=>!selectedIds.includes(x.id)),
  [rows,media,query,sort,selectedIds.join(',')]);
 const found=matching.slice(0,limit);
 return <details className="palace-fandom-mini-picker" onToggle={e=>setOpen(e.currentTarget.open)}>
  <summary>✧ Browse fandoms by media type <span>Anime, books, TV, games and more</span></summary>
  <div className="palace-fandom-mini-tools">
   <label>Media<select aria-label="Choose fandom media category" value={media} onChange={e=>{setMedia(e.target.value);setLimit(16)}}>
    {FANDOM_MEDIA_SHELVES.map(c=><option key={c.id} value={c.id}>{c.label}</option>)}
   </select></label>
   <label>Fandom or alternate name<input aria-label="Find a fandom to attach" value={query} onChange={e=>{setQuery(e.target.value);setLimit(16)}} placeholder="IWTV, Naruto, Arcane…"/></label>
   <label>Order<select aria-label="Sort fandom choices" value={sort} onChange={e=>setSort(e.target.value)}><option value="alpha">A–Z</option><option value="used">Most used</option></select></label>
  </div>
  {error&&<p role="alert">The fandom directory could not load: {error}</p>}
  <div className="palace-fandom-mini-options" role="group" aria-label="Attach a fandom to this work">
   {loading?<span>Gathering fandoms…</span>:found.length?found.map(tag=>
    <button type="button" key={tag.id} onClick={()=>onChoose?.(tag)}>
     <strong>＋ {tag.name}</strong><small>{tag.subcategory||'Palace fandom'}{tag.franchise&&tag.franchise!==tag.name?' · '+tag.franchise:''}</small>{tag.aliases?.length>0&&<em className="palace-fandom-mini-alias">Also: {tag.aliases.slice(0,2).join(' · ')}</em>}
    </button>
   ):<span>Try another media shelf or search phrase.</span>}
  </div>
  {matching.length>found.length&&<button type="button" className="palace-fandom-mini-more" onClick={()=>setLimit(n=>n+16)}>See more fandoms ({matching.length-found.length} remaining) →</button>}
  <p>Choose the correct world, then add character, relationship, and trope tags separately. Crossovers can include multiple fandoms.</p>
  <Link to="/fandoms" target="_blank" rel="noopener noreferrer">Explore the full Fandom Atlas ↗</Link>
 </details>;
}
