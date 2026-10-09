import React,{useEffect,useState} from 'react';
import {Link} from 'react-router-dom';
import {configured,supabase} from './supabase';
import './palace-home-stories.css';
import StoryRatingBadge from './StoryRatingBadge';

/** An honest, chronological public shelf—not a popularity ranking. */
export default function PalaceNewStories(){
 const[works,setWorks]=useState([]);
 const[status,setStatus]=useState('loading');
 useEffect(()=>{
  let active=true;
  if(!configured||!supabase){setStatus('error');return;}
  async function load(){
   try{
    const{data,error}=await supabase.from('works')
     .select('id,title,slug,summary,rating,cover_url,last_published_at,profiles!works_author_id_fkey(username,display_name)')
     .eq('publication_status','published')
     .order('last_published_at',{ascending:false}).limit(4);
    if(!active)return;
    if(error)throw error;
    setWorks((data||[]).filter(w=>w.slug));setStatus('ready');
   }catch{if(active)setStatus('error')}
  }
  load();
  return()=>{active=false};
 },[]);
 return <section className="home-live-worlds palace-first-shelf" aria-label="Newly published stories">
  <div className="section-heading"><div><p className="eyebrow">NEWLY OPENED WORLDS</p>
   <h2>Fresh from the Reading Rooms.</h2>
   <p>A small live shelf of published work, shown by newest publication—not a popularity ranking.</p>
  </div><Link to="/reading">Browse all stories →</Link></div>
  {status==='loading'&&<p className="palace-story-shelf-feedback" role="status">Opening the latest story shelf…</p>}
  {status==='error'&&<div className="palace-story-shelf-feedback">
   <strong>The story shelf could not be opened right now.</strong>
   <p>The Reading Rooms are still available. You can explore them directly.</p>
   <Link to="/reading">Explore stories →</Link>
  </div>}
  {status==='ready'&&works.length===0&&<div className="palace-story-shelf-feedback">
   <span aria-hidden="true" className="palace-first-story-mark">✦</span>
   <div><strong>This shelf is waiting for its next story.</strong>
    <p>There are no newly published works on this shelf yet. Explore the Reading Rooms, or bring a story of your own.</p>
    <div className="palace-first-story-actions"><Link to="/reading">Explore Reading Rooms →</Link><Link to="/writers">Write something wonderful →</Link></div>
   </div>
  </div>}
  {status==='ready'&&works.length>0&&<div className="home-world-grid">
   {works.map(w=><Link to={'/work/'+w.slug} key={w.id}>
    <div className="home-world-cover palace-rating-anchor">{w.cover_url?<img loading="lazy" decoding="async" src={w.cover_url} alt=""/>:<span aria-hidden="true">☾<b>✦</b></span>}<StoryRatingBadge rating={w.rating}/></div>
    <div><small>{w.last_published_at?new Date(w.last_published_at).toLocaleDateString(undefined,{month:'short',day:'numeric'}):'New'}</small>
     <h3>{w.title}</h3><p>{w.summary||'Enter this world to begin reading.'}</p>
     <b>by {w.profiles?.display_name||w.profiles?.username||'Palace writer'} →</b></div>
   </Link>)}
  </div>}
 </section>;
}
