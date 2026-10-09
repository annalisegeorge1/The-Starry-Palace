import React,{useEffect,useMemo,useState} from 'react';
import {Link} from 'react-router-dom';
import {getPalaceFandomDirectory} from './palaceData';
import {FANDOM_MEDIA_SHELVES} from './palaceFandomCatalogue';
import {visibleFandoms,pageFandoms,fandomFacetOptions} from './fandomDirectoryModel';
import './palace-fandom-mini-picker.css';

/** Remains collapsed and makes no requests until the writer opens it. */
export default function PalaceFandomMiniPicker({onChoose,selectedIds=[]}){
 const [open,setOpen]=useState(false),[loading,setLoading]=useState(false),[error,setError]=useState('');
 const [rows,setRows]=useState([]),[media,setMedia]=useState('all'),[query,setQuery]=useState('');
 const [subcategory,setSubcategory]=useState('all'),[franchise,setFranchise]=useState('all'),[page,setPage]=useState(0);
 useEffect(()=>{if(!open||rows.length)return;let alive=true;setLoading(true);
  getPalaceFandomDirectory().then(result=>{if(alive)setRows(result)})
   .catch(e=>{if(alive)setError(e.message)})
   .finally(()=>{if(alive)setLoading(false)});
  return()=>{alive=false};
 },[open]);
 const facets=useMemo(()=>fandomFacetOptions(rows,media),[rows,media]);
 const found=useMemo(()=>visibleFandoms(rows,{media,query,subcategory,franchise}).filter(x=>!selectedIds.includes(x.id)),
  [rows,media,query,subcategory,franchise,selectedIds.join(',')]);
 const shelf=useMemo(()=>pageFandoms(found,page,12),[found,page]);
 const resetPage=()=>setPage(0);
 return <details className="palace-fandom-mini-picker" onToggle={e=>setOpen(e.currentTarget.open)}>
  <summary>✧ Browse fandoms by media type <span>Anime, books, TV, games and more</span></summary>
  <div className="palace-fandom-mini-tools">
   <label>Media<select aria-label="Choose fandom media category" value={media} onChange={e=>{setMedia(e.target.value);setSubcategory('all');setFranchise('all');resetPage()}}>
    {FANDOM_MEDIA_SHELVES.map(c=><option key={c.id} value={c.id}>{c.label}</option>)}
   </select></label>
   <label>Fandom or alternate name<input aria-label="Find a fandom to attach" value={query} onChange={e=>{setQuery(e.target.value);resetPage()}} placeholder="IWTV, Naruto, Arcane…"/></label>
   <label>Kind of fandom<select aria-label="Filter fandoms by subcategory" value={subcategory} onChange={e=>{setSubcategory(e.target.value);resetPage()}}><option value="all">Every kind</option>{facets.categories.map(c=><option key={c} value={c}>{c}</option>)}</select></label>
   <label>Universe or franchise<select aria-label="Filter fandoms by franchise" value={franchise} onChange={e=>{setFranchise(e.target.value);resetPage()}}><option value="all">Every universe</option>{facets.franchises.map(c=><option key={c} value={c}>{c}</option>)}</select></label>
  </div>
  {error&&<p role="alert">The fandom directory could not load: {error}</p>}
  <div className="palace-fandom-mini-options" role="group" aria-label="Attach a fandom to this work">
   {loading?<span>Gathering fandoms…</span>:shelf.items.length?shelf.items.map(tag=>
    <button type="button" key={tag.id} onClick={()=>onChoose?.(tag)}>
     <strong>＋ {tag.name}</strong><small>{tag.subcategory||'Palace fandom'}</small>
    </button>
   ):<span>Try another media shelf or search phrase.</span>}
  </div>
  {!loading&&shelf.total>0&&<nav className="palace-fandom-mini-pages" aria-label="Fandom picker pages"><span>Showing {shelf.start}–{shelf.end} of {shelf.total}</span><button type="button" disabled={shelf.page===0} onClick={()=>setPage(x=>Math.max(0,x-1))}>← Previous</button><button type="button" disabled={shelf.page>=shelf.pages-1} onClick={()=>setPage(x=>Math.min(shelf.pages-1,x+1))}>Next →</button></nav>}
  <p>Crossovers may have more than one fandom. Each selected fandom becomes a real Palace tag.</p>
  <Link to="/fandoms" target="_blank" rel="noopener noreferrer">Explore the full Fandom Atlas ↗</Link>
 </details>;
}
