import React,{useEffect,useState} from 'react';
import {Link,useParams} from 'react-router-dom';
import ArchiveClassicReader from './ArchiveClassicReader';
import {openHostedClassic} from './directClassicApi';
import './direct-classic-reader.css';

/** Standalone reading doorway: no archive catalogue, modal, or extra title pages. */
export default function DirectClassicReader({Frame}){
 const {slug}=useParams();
 const [state,setState]=useState({slug:null,status:'loading',book:null,error:''});
 useEffect(()=>{
  let active=true;
  setState({slug,status:'loading',book:null,error:''});
  openHostedClassic(slug).then(book=>{
   if(active)setState({slug,status:book?'ready':'missing',book,error:''});
  }).catch(error=>{
   if(active)setState({slug,status:'error',book:null,error:error?.message||'This book could not be opened.'});
  });
  return()=>{active=false};
 },[slug]);
 const current=state.slug===slug?state:{status:'loading',book:null,error:''};
 return <Frame><section className="palace-direct-classic" aria-label="Classic reading room">
  <nav className="palace-direct-classic-nav" aria-label="Classic reading navigation"><Link to="/reading">← Reading Rooms</Link><span aria-hidden="true">✦</span><Link to="/lost-works">Classic archive</Link></nav>
  {current.status==='loading'&&<div className="palace-direct-classic-status" role="status"><span aria-hidden="true">☾</span><h1>Opening your book…</h1><p>Preparing the hosted edition and its original chapters.</p></div>}
  {current.status==='missing'&&<div className="palace-direct-classic-status" role="status"><h1>This classic isn't available to read here.</h1><p>It may be citation-only, unavailable, or awaiting publication review.</p><Link to="/lost-works">Explore the classic archive →</Link></div>}
  {current.status==='error'&&<div className="palace-direct-classic-status" role="alert"><h1>We couldn't open this edition.</h1><p>{current.error}</p><Link to="/reading">Return to Reading Rooms →</Link></div>}
  {current.status==='ready'&&current.book&&<><h1 className="palace-direct-classic-screenreader-title">{current.book.record.title}</h1><ArchiveClassicReader key={current.book.record.id} record={current.book.record} text={current.book.text}/></>}
 </section></Frame>;
}
