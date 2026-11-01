import React,{useEffect,useState} from 'react';
import PalaceIcon from './PalaceIcon';
import {Link} from 'react-router-dom';
import './honour-room-compact.css';
import {useAuth} from './auth';
import {PalaceDialog} from './PalaceLivePrimitives';
import {getHonour,createHonourRecommendation,withdrawHonourRecommendation} from './palaceData';

// Independent Throne of Honour room. Keep its data, styling and routes
// unchanged while reducing the shared liveRooms module's responsibilities.
export default function HonourRoom({Frame}){
 const{session}=useAuth();const[data,setData]=useState(null);const[error,setError]=useState('');const[recommendOpen,setRecommendOpen]=useState(false);const[recommendForm,setRecommendForm]=useState({authorName:'',workTitle:'',reason:''});const[busy,setBusy]=useState(false);
 const curated=[
  {author:'Toni Morrison',work:'Beloved',note:'For language, memory, history and the ways a novel can make the unseen impossible to ignore.'},
  {author:'Octavia E. Butler',work:'Parable of the Sower',note:'For speculative fiction that remains intimate, political and startlingly human.'},
  {author:'James Baldwin',work:'Giovanni’s Room',note:'For emotional precision, interiority and the courage to write desire without simplification.'}
 ];
 const load=()=>getHonour(session?.user?.id).then(setData).catch(e=>setError(e.message));useEffect(()=>{load()},[session?.user?.id]);
 async function submitRecommendation(){try{setBusy(true);setError('');await createHonourRecommendation(session.user.id,recommendForm);setRecommendForm({authorName:'',workTitle:'',reason:''});setRecommendOpen(false);await load()}catch(e){setError(e.message)}finally{setBusy(false)}}
 async function withdraw(id){try{await withdrawHonourRecommendation(session.user.id,id);await load()}catch(e){setError(e.message)}}
 const published=data?.recommendations?.filter(x=>x.status==='published')||[];
 const mine=session?(data?.recommendations?.filter(x=>x.nominator_id===session.user.id)||[]):[];
 const latestPeriods=(data?.periods||[]).slice(0,4);
 return <Frame><section className="legacy-throne-page">
  <section className="legacy-throne-intro"><p className="eyebrow">BEYOND THE PALACE</p><h1>The Throne of Honour.</h1><p>Community tributes to published authors and novels beyond the site. Tribute never implies that the honoured creator participates here.</p></section>
  <section className="honour-curated-list" aria-label="Honoured creators beyond the Palace">
   <h2 className="honour-list-kicker">HONOURED BEYOND THE PALACE</h2>
   <div className="legacy-throne-gallery">{[...curated,...published.map(x=>({author:x.author_name,work:x.work_title||'Selected work',note:x.reason}))].map((item,index)=><article key={item.author+'-'+item.work} className="honour-list-item"><div className="legacy-throne-medallion" aria-hidden="true"><PalaceIcon name="regal-crown" size={23} strokeWidth={1.8}/><small>{String(index+1).padStart(2,'0')}</small></div><div className="honour-list-copy"><h3 className="honour-author">{item.author}</h3><p className="honour-work"><cite>{item.work}</cite></p><p className="honour-note">{item.note}</p></div></article>)}</div>
  </section>
  <section className="legacy-throne-nomination real"><div className="honour-nomination-copy"><p className="eyebrow">COMMUNITY RECOMMENDATION</p><h2>Who belongs on the next throne?</h2><p>Recommendations are reviewed before publication and should explain the work, not speculate about the author.</p></div>{session?<button type="button" onClick={()=>setRecommendOpen(true)}>Recommend an author</button>:<Link className="button" to="/login">Sign in to recommend</Link>}</section>
  {mine.length>0&&<section className="honour-my-recommendations"><div className="section-heading"><div><p className="eyebrow">MY RECOMMENDATIONS</p><h2>Recommendations you have sent for review.</h2><p>Submitted recommendations can be withdrawn until Council begins review.</p></div></div><div>{mine.map(x=><article key={x.id}><div><small>{x.status.replaceAll('_',' ')}</small><strong>{x.author_name}</strong><span>{x.work_title||'No single work named'}</span><p>{x.reason}</p>{x.council_note&&<blockquote>{x.council_note}</blockquote>}</div>{x.status==='submitted'&&<button className="quiet-button" onClick={()=>withdraw(x.id)}>Withdraw</button>}</article>)}</div></section>}
  <section className="honour-monthly-courts"><div className="section-heading"><div><p className="eyebrow">INSIDE THE PALACE</p><h2>Monthly Palace courts.</h2><p>Recognition can celebrate contribution without controlling discovery. These rankings remain separate from Reading Room shelves.</p></div><Link to="/treasury?tab=rankings">Ranking preferences →</Link></div>{latestPeriods.length?<div>{latestPeriods.map(period=>{const rows=(data?.rankings||[]).filter(r=>r.period_id===period.id).slice(0,5);return <article key={period.id}><header><span>{new Date(period.month_start+'T00:00:00').toLocaleDateString(undefined,{month:'long',year:'numeric'})}</span><strong>{String(period.category||'Palace court').replaceAll('_',' ')}</strong></header>{rows.length?<ol>{rows.map(r=><li key={r.user_id}><span>{r.rank}</span>{r.profiles?.username?<Link to={'/member/'+encodeURIComponent(r.profiles.username)}>{r.profiles.display_name||r.profiles.username}</Link>:<strong>Palace member</strong>}</li>)}</ol>:<p>No finalized names in this court yet.</p>}</article>})}</div>:<p className="honour-courts-empty"><PalaceIcon name="regal-crown" size={20} strokeWidth={1.85}/><span><strong>No monthly courts are published yet.</strong> Recognition periods will appear here when they are ready.</span></p>}</section>
  {error&&<div className="save-note life-action-error" role="alert">{error}</div>}
  <PalaceDialog open={recommendOpen} title="Recommend an author or creator" eyebrow="THRONE OF HONOUR" onClose={()=>setRecommendOpen(false)} actions={<><button className="quiet-button" onClick={()=>setRecommendOpen(false)}>Cancel</button><button disabled={busy} onClick={submitRecommendation}>{busy?'Sending…':'Send for review'}</button></>}>
   <label>Author or creator<input maxLength="120" value={recommendForm.authorName} onChange={e=>setRecommendForm(v=>({...v,authorName:e.target.value}))} autoFocus/></label>
   <label>Work title <small>optional</small><input maxLength="180" value={recommendForm.workTitle} onChange={e=>setRecommendForm(v=>({...v,workTitle:e.target.value}))}/></label>
   <label>Why should this work be honoured?<textarea rows="6" maxLength="2000" value={recommendForm.reason} onChange={e=>setRecommendForm(v=>({...v,reason:e.target.value}))} placeholder="Explain the creative significance of the work or author. Avoid speculation about their private life."/></label>
   <small>{recommendForm.reason.length}/2000 · Recommendations are reviewed before publication.</small>
  </PalaceDialog>
 </section></Frame>
}
