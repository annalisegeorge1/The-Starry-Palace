import React,{useEffect,useState} from 'react';
import {Link} from 'react-router-dom';
import {supabase} from './supabase';
import {selectHomeReading,visibleHomeReading,chapterReadingPercent,readingReturnPath} from './readingHomeShelf';
import './palace-resume-reading.css';

/** Reads only the current member's progress, protected by reading_progress RLS. */
export default function PalaceResumeReading({memberId}){
 const[shelf,setShelf]=useState({memberId:null,rows:[]});
 useEffect(()=>{
  if(!memberId||!supabase){setShelf({memberId:null,rows:[]});return;}
  let mounted=true;
  setShelf({memberId,rows:[]});
  supabase.from('reading_progress')
   .select('work_id,chapter_id,updated_at,completed,chapter_progress_percent,works(id,title,slug,publication_status,cover_url)')
   .eq('user_id',memberId).eq('completed',false)
   .order('updated_at',{ascending:false}).limit(12)
   .then(({data,error})=>{
    if(!mounted)return;
    setShelf({memberId,rows:error?[]:selectHomeReading(data)});
   }).catch(()=>{if(mounted)setShelf({memberId,rows:[]})});
  return()=>{mounted=false};
 },[memberId]);
 // Never show the previous member's private shelf even for the frame before the effect runs.
 const rows=visibleHomeReading(shelf,memberId);
 if(!memberId||rows.length===0)return null;
 return <section className="palace-resume-reading" aria-label="Your unfinished reading history">
  <header><div><p className="eyebrow">YOUR BOOKMARK IN THE STARS</p><h2>Pick up where you left off.</h2>
   <p>Your own unfinished stories, in the order you last read them. Only you can see this shelf.</p></div><Link to="/library">My library →</Link></header>
  <div className="palace-resume-shelf">{rows.map(row=>{
   const work=row.works;
   const chapterPercent=chapterReadingPercent(row.chapter_progress_percent);
   const date=new Date(row.updated_at);
   const dateLabel=Number.isFinite(date.getTime())?'Last opened '+date.toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'}):'Your saved reading place';
   return <Link key={row.work_id} to={readingReturnPath(row)}>
    <span className="palace-resume-cover">{work.cover_url?<img src={work.cover_url} alt="" loading="lazy" decoding="async"/>:<span aria-hidden="true">☾ ✦</span>}</span>
    <span className="palace-resume-copy"><strong>{work.title}</strong><small>{dateLabel}</small>
     {chapterPercent!==null&&row.chapter_id&&<span className="palace-resume-progress">
      <span className="palace-resume-progress-track" role="progressbar" aria-label={'Chapter progress for '+work.title} aria-valuemin={0} aria-valuemax={100} aria-valuenow={chapterPercent}><i style={{width:chapterPercent+'%'}}/></span>
      <small>{chapterPercent}% through chapter</small>
     </span>}
     <b>Continue reading →</b></span>
   </Link>;
  })}</div>
 </section>;
}
