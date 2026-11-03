import React,{useEffect,useMemo,useState} from 'react';
import {Link} from 'react-router-dom';
import {useAuth} from './auth';
import {getPalaceObservatoryAccess,readPalaceObservatoryMetadata} from './palaceObservatoryData';
import {buildPalaceObservatorySnapshot,filterPalaceObservatoryRows} from './palaceObservatoryModel';
import {MODERN_FANFICTION_LINKS} from './palaceFanfictionDiscovery';
import './palace-observatory.css';

const sections=['Catalogue','Findings','Release review'];
const roles=['all','Member fanfiction','Original work','Archive fanfiction','Archive / classic','Original-source link'];
const statuses=['all','published','draft','review','linked'];
function Metric({label,value}){return <div className="palace-observatory-metric"><strong>{value}</strong><span>{label}</span></div>}
export default function PalaceObservatory(){
 const {session,loading:authLoading}=useAuth();
 const userId=session?.user?.id;
 const [access,setAccess]=useState('checking');
 const [accessError,setAccessError]=useState('');
 const [snapshot,setSnapshot]=useState(null);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const [active,setActive]=useState('Catalogue');
 const [query,setQuery]=useState('');
 const [kind,setKind]=useState('all');
 const [status,setStatus]=useState('all');
 const [severity,setSeverity]=useState('all');
 const [reload,setReload]=useState(0);

 useEffect(()=>{
  let valid=true;
  setAccess('checking');setAccessError('');setSnapshot(null);
  if(authLoading)return()=>{valid=false};
  if(!userId){setAccess('denied');return()=>{valid=false}};
  getPalaceObservatoryAccess(userId).then(allowed=>{
   if(valid)setAccess(allowed?'allowed':'denied');
  }).catch(e=>{if(valid){setAccessError(e?.message||'Unable to verify permissions.');setAccess('error')}});
  return()=>{valid=false};
 },[userId,authLoading]);

 useEffect(()=>{
  if(access!=='allowed')return;
  let valid=true;setBusy(true);setError('');
  readPalaceObservatoryMetadata().then(data=>{
   if(valid)setSnapshot(buildPalaceObservatorySnapshot({...data,linked:MODERN_FANFICTION_LINKS}));
  }).catch(e=>{if(valid){setSnapshot(null);setError(e?.message||'Audit records could not be loaded.')}})
   .finally(()=>{if(valid)setBusy(false)});
  return()=>{valid=false};
 },[access,reload]);

 const rows=useMemo(()=>filterPalaceObservatoryRows(snapshot?.rows||[],{query,kind,status}),
  [snapshot,query,kind,status]);
 const findings=useMemo(()=>(snapshot?.findings||[]).filter(f=>
  (severity==='all'||f.severity===severity)&&
  (!query||[f.title,f.detail,f.workTitle].join(' ').toLowerCase().includes(query.toLowerCase()))),
  [snapshot,severity,query]);

 if(authLoading||access==='checking')return <section className="palace-observatory"><p role="status">Checking private Observatory access…</p></section>;
 if(access!=='allowed')return <section className="palace-observatory">
  <p className="eyebrow">PRIVATE ADMINISTRATION</p><h1>The Palace Observatory</h1>
  <div className="palace-observatory-denied" role={access==='error'?'alert':'status'}>
   <h2>{access==='error'?'Access could not be verified':'Owner access required'}</h2>
   <p>{access==='error'?accessError:'This administration room is available only to accounts with the verified Owner role. No catalogue records have been loaded.'}</p>
   <Link to="/reading">Return to Reading Rooms</Link>
  </div>
 </section>;
 return <section className="palace-observatory" aria-label="Private Palace Observatory">
  <header className="palace-observatory-header">
   <div><p className="eyebrow">PRIVATE ADMINISTRATION · PHASE 1</p><h1>The Palace Observatory</h1>
    <p>One catalogue. Read-only checks. Nothing here publishes, imports, merges or deploys.</p></div>
   <span className="palace-observatory-lock">Owner only · Review mode</span>
  </header>
  <div className="palace-observatory-metrics" aria-label="Catalogue summary">
   <Metric label="Catalogue entries" value={snapshot?.totals.records??'—'}/>
   <Metric label="Published records" value={snapshot?.totals.published??'—'}/>
   <Metric label="Private archive intake" value={snapshot?.totals.privateIntake??'—'}/>
   <Metric label="Audit candidates" value={snapshot?.totals.reviewNeeded??'—'}/>
  </div>
  <div className="palace-observatory-actions">
   <nav className="palace-observatory-tabs" aria-label="Observatory areas">{sections.map(section=>
    <button type="button" key={section} aria-pressed={active===section} className={active===section?'selected':''}
     onClick={()=>setActive(section)}>{section}</button>)}</nav>
   <button type="button" onClick={()=>setReload(x=>x+1)} disabled={busy}>Refresh audit</button>
  </div>
  {busy&&<p role="status">Checking live catalogue metadata…</p>}
  {error&&<p role="alert" className="palace-observatory-warning">{error}</p>}
  {snapshot&&<><div className="palace-observatory-filters">
    {active!=='Release review'&&<label>Find a title, author or tag
     <input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search loaded records"/></label>}
    {active==='Catalogue'&&<><label>Source
     <select value={kind} onChange={e=>setKind(e.target.value)}>{roles.map(r=><option value={r} key={r}>{r==='all'?'All sources':r}</option>)}</select></label>
     <label>Publication
      <select value={status} onChange={e=>setStatus(e.target.value)}>{statuses.map(s=><option key={s} value={s}>{s==='all'?'All statuses':s}</option>)}</select>
     </label></>}
    {active==='Findings'&&<label>Severity
     <select value={severity} onChange={e=>setSeverity(e.target.value)}>{['all','High','Medium'].map(v=><option value={v} key={v}>{v==='all'?'All priorities':v}</option>)}</select></label>}
   </div>
   {active==='Catalogue'&&<><p className="palace-observatory-subtitle" role="status">{rows.length} matching entries · Expected sections are predictions, not confirmed visibility tests.</p>
    <div className="palace-observatory-list">{rows.map(row=><article className="palace-observatory-row" key={row.key}>
     <div className="palace-observatory-row-head"><strong>{row.title}</strong><span>{row.publication}</span></div>
     <p>{row.author} · {row.kind} · {row.rating}</p>
     <p><b>Rights:</b> {row.rights} · <b>Hosting:</b> {row.hosting}</p>
     {row.fandom.length>0&&<p><b>Fandom:</b> {row.fandom.join(', ')}</p>}
     <p><b>Expected:</b> {row.expected.join(' · ')}</p>
     <small>{row.verification}</small>
     {row.sourceUrl&&<p><a href={row.sourceUrl} rel="noopener noreferrer" target="_blank">Original source</a></p>}
    </article>)}</div></>}
   {active==='Findings'&&<><p className="palace-observatory-subtitle" role="status">{findings.length} candidates · These are metadata checks, not verified live-site failures.</p>
    <div className="palace-observatory-list">{findings.map(issue=><article className="palace-observatory-row" key={issue.id}>
     <div className="palace-observatory-row-head"><strong>{issue.title}</strong><span>{issue.severity} · {issue.status}</span></div>
     <p>{issue.workTitle}</p><p>{issue.detail}</p>
     <p><b>Expected:</b> {issue.expected}</p>
     <small>Observed: {issue.observed} · Status changes and screenshots are planned for Phase 3.</small>
    </article>)}</div></>}
   {active==='Release review'&&<div className="palace-observatory-denied">
    <h2>Release actions are unavailable in Phase 1</h2>
    <p>This phase only reads source data. Metadata editing, issue persistence, approvals and release actions are not implemented or enabled. Nothing is connected to publishing or deployment.</p>
    <p>Next: independently test public search, relationship filtering, age-appropriate discovery, and section placement before proposing any fixes.</p>
   </div>}
  </>}
 </section>;
}
