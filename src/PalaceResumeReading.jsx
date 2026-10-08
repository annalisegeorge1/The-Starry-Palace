import React,{useEffect,useState} from 'react';
import {Link} from 'react-router-dom';
import {supabase} from './supabase';
import './palace-resume-reading.css';

/** Only reads current member's progress; protected by existing reading_progress RLS. */
export default function PalaceResumeReading({memberId}){
 const[rows,setRows]=useState([]);
 useEffect(()=>{
  if(!memberId||!supabase){setRows([]);return;}
  let mounted=true;setRows([]);
  supabase.from('reading_progress')
   .select('work_id,chapter_id,updated_at,progress_percent,works(id,title,slug,publication_status,cover_url)')
   .eq('user_id',memberId).order('updated_at',{ascending:false}).limit(6)
   .then(({data,error})=>{
    if(!mounted)return;
    if(error){setRows([]);return}
    setRows((data||[]).filter(x=>x.works?.slug&&x.works.publication_status==='published').slice(0,3));
   }).catch(()=>{if(mounted)setRows([])});
  return()=>{mounted=false};
 },[memberId]);
 if(!memberId||rows.length===0)return null;
 return <section className="palace-resume-reading" aria-label="Your real reading history">
  <header><div><p className="eyebrow">YOUR BOOKMARK IN THE STARS</p><h2>Pick up where you left off.</h2>
   <p>Saved from your own reading history. Only you can see this shelf.</p></div><Link to="/library">My library →</Link></header>
  <div className="palace-resume-shelf">{rows.map(row=>{
   const work=row.works;
   const path=row.chapter_id?'/work/'+encodeURIComponent(work.slug)+'/chapter/'+encodeURIComponent(row.chapter_id):'/work/'+encodeURIComponent(work.slug);
   return <Link key={row.work_id} to={path}>
    <span className="palace-resume-cover">{work.cover_url?<img src={work.cover_url} alt="" loading="lazy" decoding="async"/>:<span aria-hidden="true">☾ ✦</span>}</span>
    <span className="palace-resume-copy"><strong>{work.title}</strong><small>Last opened {new Date(row.updated_at).toLocaleDateString(undefined,{month:'short',day:'numeric'})}</small>
    <b>Continue reading →</b></span>
   </Link>;
  })}</div>
 </section>;
}
