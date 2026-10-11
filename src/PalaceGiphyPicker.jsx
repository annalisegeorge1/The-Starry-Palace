import React,{useEffect,useState} from 'react';
import {GIPHY_REACTIONS,palaceGiphyEnabled,searchPalaceGiphy} from './palaceGiphy';
import './palace-giphy-picker.css';

/* An in-chat GIPHY search gallery. GIPHY requests are sent only after a
 * member deliberately opens the panel and types/picks a search term. */
export default function PalaceGiphyPicker({onSend,onClose,busy=false}){
 const[query,setQuery]=useState('');
 const[results,setResults]=useState([]);
 const[loading,setLoading]=useState(false);
 const[error,setError]=useState('');
 const enabled=palaceGiphyEnabled();
 useEffect(()=>{
  const q=query.trim();
  if(!enabled||q.length<2){setResults([]);setError('');setLoading(false);return}
  const controller=new AbortController();
  const timeout=setTimeout(()=>{
   setLoading(true);setError('');
   searchPalaceGiphy(q,{signal:controller.signal}).then(gifs=>{
    if(controller.signal.aborted)return;
    setResults(gifs);setLoading(false);
   }).catch(err=>{
    if(controller.signal.aborted)return;
    setError(err?.message||'GIF search is unavailable.');
    setResults([]);setLoading(false);
   });
  },500);
  return()=>{clearTimeout(timeout);controller.abort()};
 },[query,enabled]);
 return <section className="palace-giphy-picker" aria-label="Search GIFs with GIPHY">
  <header><div><strong>Find the right reaction</strong><small>GIFs for every mood</small></div><button type="button" onClick={onClose} aria-label="Close GIF search">×</button></header>
  {enabled?<>
   <input type="search" autoComplete="off" aria-label="Search GIPHY GIFs" value={query} onChange={e=>setQuery(e.target.value.slice(0,50))} placeholder="Search a feeling, moment, or reaction…" maxLength={50}/>
   <div className="palace-giphy-reactions" aria-label="GIF reaction shortcuts">{GIPHY_REACTIONS.map(q=><button type="button" key={q} onClick={()=>setQuery(q.toLowerCase())}>{q}</button>)}</div>
   {loading&&<p className="palace-giphy-state" role="status">Finding GIFs…</p>}
   {error&&<p className="palace-giphy-state is-error" role="alert">{error}</p>}
   {!loading&&!error&&query.trim().length>=2&&!results.length&&<p className="palace-giphy-state">No matching GIFs. Try another search.</p>}
   <div className="palace-giphy-results" aria-label="GIPHY results">
    {results.map(g=><button key={g.id} className="palace-giphy-result" type="button" disabled={busy||!g.url} onClick={()=>g.url&&onSend(g.url)} aria-label={'Send GIF: '+g.title}>
     {g.preview?<img src={g.preview} loading="lazy" alt={g.title||'Animated GIF'} referrerPolicy="no-referrer"/>:<span>GIF unavailable</span>}
    </button>)}
   </div>
  </>:<p className="palace-giphy-state">GIPHY search will be ready once the Palace's GIPHY Web developer key is added to the website build settings. No links to paste.</p>}
  <footer><a href="https://giphy.com/" target="_blank" rel="noreferrer noopener" aria-label="Powered by GIPHY">Powered by <strong>GIPHY</strong> ↗</a><small>GIFs load from GIPHY · PG results</small></footer>
 </section>;
}
