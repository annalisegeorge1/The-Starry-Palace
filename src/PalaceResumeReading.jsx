import React,{useEffect,useState} from 'react';
import {Link} from 'react-router-dom';
import {supabase} from './supabase';
import {selectHomeReading,visibleHomeReading,chapterReadingPercent,readingReturnPath} from './readingHomeShelf';
import './palace-resume-reading.css';
import StoryRatingBadge from './StoryRatingBadge';

/** Reads only the current member's progress, protected by reading_progress RLS. */
export default function PalaceResumeReading({memberId}){
 const[shelf,setShelf]=useState({memberId:null,rows:[]});
 const[showAll,setShowAll]=useState(false);
 const[search,setSearch]=useState('');
 const[sortBy,setSortBy]=useState('recent');
 useEffect(()=>{
  if(!memberId||!supabase){setShelf({memberId:null,rows:[]});return;}
  let mounted=true;
  setShelf({memberId,rows:[]});
  supabase.from('reading_progress')
   .select('work_id,chapter_id,updated_at,completed,chapter_progress_percent,works(id,title,slug,publication_status,cover_url,rating)')
   .eq('user_id',memberId).eq('completed',false)
   .order('updated_at',{ascending:false}).limit(12)
   .then(({data,error})=>{
    if(!mounted)return;
    setShelf({memberId,rows:error?[]:selectHomeReading(data,12)});
   }).catch(()=>{if(mounted)setShelf({memberId,rows:[]})});
  return()=>{mounted=false};
 },[memberId]);
 // Never show the previous member's private shelf even for the frame before the effect runs.
 const rows=visibleHomeReading(shelf,memberId);
 if(!memberId||rows.length===0)return null;
 const matching=rows.filter(row=>row.works.title.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()));
 const sorted=[...matching].sort((a,b)=>sortBy==='title'?a.works.title.localeCompare(b.works.title):sortBy==='progress'?(chapterReadingPercent(b.chapter_progress_percent)??-1)-(chapterReadingPercent(a.chapter_progress_percent)??-1):0);
 const displayed=(showAll||search.trim()?sorted:sorted.slice(0,3));
 return <section className="palace-resume-reading" aria-label="Your unfinished reading history">
  <header><div><p className="eyebrow">YOUR BOOKMARK IN THE STARS</p><h2>Pick up where you left off.</h2>
   <p>Your own unfinished stories, in the order you last read them. Only you can see this shelf.</p></div><Link to="/library">My library →</Link></header>
  {rows.length>3&&<div className="palace-resume-controls"><label htmlFor="palace-resume-search">Find a saved story</label><input id="palace-resume-search" type="search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search your current reads" autoComplete="off"/><label htmlFor="palace-resume-sort">Sort saved stories</label><select id="palace-resume-sort" value={sortBy} onChange={e=>setSortBy(e.target.value)}><option value="recent">Recently read</option><option value="title">Title A–Z</option><option value="progress">Chapter progress</option></select><button type="button" aria-expanded={showAll} onClick={()=>setShowAll(v=>!v)}>{showAll?"Show recent three":"See all saved reads ("+rows.length+")"}</button></div>}
  {displayed.length===0&&<p className="palace-resume-empty" role="status">No matching saved stories. Try another title.</p>}
  <div className="palace-resume-shelf">{displayed.map(row=>{
   const work=row.works;
   const chapterPercent=chapterReadingPercent(row.chapter_progress_percent);
   const date=new Date(row.updated_at);
   const hasDate=Number.isFinite(date.getTime());
   const dateLabel=hasDate?'Last opened '+date.toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'}):'Your saved reading place';
   const resumeLabel=row.chapter_id?'Resume chapter':'View story';
   return <Link key={row.work_id} to={readingReturnPath(row)}>
    <span className="palace-resume-cover palace-rating-anchor">{work.cover_url?<img src={work.cover_url} alt="" loading="lazy" decoding="async"/>:<span aria-hidden="true">☾ ✦</span>}<StoryRatingBadge rating={work.rating}/></span>
    <span className="palace-resume-copy"><strong>{work.title}</strong><small>{dateLabel}</small>
     {chapterPercent!==null&&row.chapter_id&&<span className="palace-resume-progress">
      <span className="palace-resume-progress-track" role="progressbar" aria-label={'Chapter progress for '+work.title} aria-valuetext={chapterPercent+' percent through the chapter'} aria-valuemin={0} aria-valuemax={100} aria-valuenow={chapterPercent}><i style={{width:chapterPercent+'%'}}/></span>
      <small>{chapterPercent}% through chapter</small>
     </span>}
     <b>{resumeLabel} →</b></span>
   </Link>;
  })}</div>
 </section>;
}
