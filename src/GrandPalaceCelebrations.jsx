import React,{useEffect,useState}from'react';
import{getGrandPalaceCelebrations,acknowledgeGrandPalaceCelebration}from'./grandPalaceCelebrationData';
import './grand-palace-celebrations.css';
export default function GrandPalaceCelebrations(){
 const[events,setEvents]=useState([]),[error,setError]=useState(''),[busy,setBusy]=useState(null),[hidden,setHidden]=useState([]);
 const refresh=()=>getGrandPalaceCelebrations().then(d=>{setEvents(d?.events||[]);setError('')}).catch(e=>setError(e.message));
 useEffect(()=>{refresh()},[]);
 const unseen=events.filter(e=>!e.seen&&!hidden.includes(e.id));
 const latest=unseen[0];
 async function dismiss(id){if(busy)return;setBusy(id);try{await acknowledgeGrandPalaceCelebration(id);setHidden(p=>[...p,id]);await refresh()}catch(e){setError(e.message)}finally{setBusy(null)}}
 const glyph=e=>e.kind==='season_victory'?'♛':e.stage==='sovereign'?'❖':e.stage==='regal'?'♛':e.stage==='starlit'?'☾':'✦';
 return <section className="grand-celebrations" aria-labelledby="court-celebrations-title">
 <header><div><p className="eyebrow">COURT TIDINGS · THE CEREMONIAL BELLS</p><h2 id="court-celebrations-title">When your Palace shines, everyone shares the moment.</h2><p>Verified milestones are recorded once, with no added points, lottery entries, or gifts. Your celebrations stay in your court’s history.</p></div></header>
 {error&&<p role="alert" className="grand-notice error">{error}</p>}
 {latest&&<div className="grand-celebration-spotlight" role="status"><div className="grand-celebration-sparks" aria-hidden="true"><span>✧</span><span>☾</span><span>✦</span></div><div className="grand-celebration-emblem" aria-hidden="true">{glyph(latest)}</div><p className="eyebrow">A NEW CHAPTER FOR YOUR COURT</p><h3>{latest.headline}</h3><p>{latest.message}</p><div className="grand-celebration-actions"><small>{new Date(latest.created_at).toLocaleDateString(undefined,{month:'long',day:'numeric',year:'numeric'})} · {unseen.length} unread</small><button type="button" onClick={()=>dismiss(latest.id)} disabled={!!busy}>{busy===latest.id?'Saving…':'Celebrate & remember ✦'}</button></div></div>}
 <div className="grand-celebration-archive"><h3>Our Book of Ceremonies</h3>{events.length?<div>{events.map(e=><article key={e.id} className={e.seen?'seen':''}><span className="grand-celebration-archive-glyph" aria-hidden="true">{glyph(e)}</span><div><strong>{e.headline}</strong><p>{e.message}</p><small>{new Date(e.created_at).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'})} · {e.kind==='season_victory'?'Quarterly victory':'Ceremonial standard'}</small></div>{!e.seen&&!hidden.includes(e.id)&&<button type="button" disabled={!!busy} onClick={()=>dismiss(e.id)}>Mark seen</button>}</article>)}</div>:<p className="grand-celebration-awaiting">The court has not reached its first recorded ceremonial milestone yet. The bells will ring when its members create one together.</p>}</div>
 </section>;
}
