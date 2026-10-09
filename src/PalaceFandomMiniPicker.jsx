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
 useEffect(()=>{if(!open||rows.length)return;let alive=true;setLoading(true);
  getPalaceFandomDirectory().then(result=>{if(alive)setRows(result)})
   .catch(e=>{if(alive)setError(e.message)})
   .finally(()=>{if(alive)setLoading(false)});
  return()=>{alive=false};
 },[open]);
 const found=useMemo(()=>visibleFandoms(rows,{media,query}).filter(x=>!selectedIds.includes(x.id)).slice(0,16),
  [rows,media,query,selectedIds.join(',')]);
 return <details className="palace-fandom-mini-picker" onToggle={e=>setOpen(e.currentTarget.open)}>
  <summary>✧ Browse fandoms by media type <span>Anime, books, TV, games and more</span></summary>
  <div className="palace-fandom-mini-tools">
   <label>Media<select aria-label="Choose fandom media category" value={media} onChange={e=>setMedia(e.target.value)}>
    {FANDOM_MEDIA_SHELVES.map(c=><option key={c.id} value={c.id}>{c.label}</option>)}
   </select></label>
   <label>Fandom or alternate name<input aria-label="Find a fandom to attach" value={query} onChange={e=>setQuery(e.target.value)} placeholder="IWTV, Naruto, Arcane…"/></label>
  </div>
  {error&&<p role="alert">The fandom directory could not load: {error}</p>}
  <div className="palace-fandom-mini-options" role="group" aria-label="Attach a fandom to this work">
   {loading?<span>Gathering fandoms…</span>:found.length?found.map(tag=>
    <button type="button" key={tag.id} onClick={()=>onChoose?.(tag)}>
     <strong>＋ {tag.name}</strong><small>{tag.subcategory||'Palace fandom'}</small>
    </button>
   ):<span>Try another media shelf or search phrase.</span>}
  </div>
  <p>Crossovers may have more than one fandom. Each selected fandom becomes a real Palace tag.</p>
  <Link to="/fandoms" target="_blank" rel="noopener noreferrer">Explore the full Fandom Atlas ↗</Link>
 </details>;
}
