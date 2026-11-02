import React,{useEffect,useState} from 'react';
import {Link,useParams} from 'react-router-dom';
import ArchiveClassicReader from './ArchiveClassicReader';
import {openHostedClassic} from './directClassicApi';
import {isHostedFanfiction} from './palaceFanfictionDiscovery';
import {hostedFanfictionGuide,fanfictionRatingLabel} from './fanfictionMetadata';
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
 const fanwork=isHostedFanfiction(current.book?.record);
 return <Frame><section className="palace-direct-classic" aria-label={fanwork?'Fanfiction reading room':'Classic reading room'}>
  <nav className="palace-direct-classic-nav" aria-label="Reading navigation"><Link to="/reading">← Reading Rooms</Link><span aria-hidden="true">✦</span><Link to={fanwork?'/reading?section=fanfiction':'/lost-works'}>{fanwork?'Fanfiction':'Classic archive'}</Link></nav>
  {current.status==='loading'&&<div className="palace-direct-classic-status" role="status"><span aria-hidden="true">☾</span><h1>Opening your book…</h1><p>Preparing the hosted edition and its original chapters.</p></div>}
  {current.status==='missing'&&<div className="palace-direct-classic-status" role="status"><h1>This hosted edition isn't available to read here.</h1><p>It may be unavailable or awaiting publication and rights review.</p><Link to="/reading?section=fanfiction">Explore available fanfiction →</Link></div>}
  {current.status==='error'&&<div className="palace-direct-classic-status" role="alert"><h1>We couldn't open this edition.</h1><p>{current.error}</p><Link to="/reading">Return to Reading Rooms →</Link></div>}
  {current.status==='ready'&&current.book&&<><h1 className="palace-direct-classic-screenreader-title">{current.book.record.title}</h1>
   {isHostedFanfiction(current.book.record)&&<details className="palace-historic-fanfiction-notes">
    <summary>{current.book.record.category==='licensed_fanfiction'?'Licensed fan-made work':'Historical fanfiction'} · {fanfictionRatingLabel(hostedFanfictionGuide(current.book.record))} · Tags &amp; notes</summary>
    <div>
     <p>{current.book.record.category==='licensed_fanfiction'?'Hosted with the original fan writer’s recorded reuse terms. The underlying franchise remains the property of its respective rightsholders.':'Public-domain historical text.'} Ratings follow the recorded source or editorial classification.</p>
     <div aria-label="Fanfiction tags">{hostedFanfictionGuide(current.book.record).tags.map(tag=><span key={tag.category+tag.name}>{tag.name}</span>)}</div>
    </div>
   </details>}
   <ArchiveClassicReader key={current.book.record.id} record={current.book.record} text={current.book.text}/></>}
 </section></Frame>;
}
