import React,{useEffect,useMemo,useState} from 'react';
import {Link} from 'react-router-dom';
import {useAuth} from './auth';
import {getPalaceObservatoryAccess,readPalaceObservatoryMetadata} from './palaceObservatoryData';
import {buildPalaceObservatorySnapshot,filterPalaceObservatoryRows} from './palaceObservatoryModel';
import {MODERN_FANFICTION_LINKS} from './palaceFanfictionDiscovery';
import {readPalaceAnonymousPlacement,runPalaceGuestTagScenarios} from './palaceObservatoryGuest';
import {makePalacePlacementChecks,makePalaceTagScenarioChecks,makePalaceFanfictionCatalogueChecks,makePalaceFanfictionExclusionCheck} from './palaceObservatoryVerificationModel';
import {createUnifiedFanworks,filterUnifiedFanworks} from './UnifiedFanworkCatalogue';
import PalaceObservatoryIssues from './PalaceObservatoryIssues';
import './palace-observatory.css';

const sections=['Catalogue','Findings','Verification','Issues','Release review'];
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
 const [verification,setVerification]=useState(null);
 const [verifying,setVerifying]=useState(false);
 const [verificationError,setVerificationError]=useState('');
 const [checkFilter,setCheckFilter]=useState('mismatch');
 const [issueSeed,setIssueSeed]=useState(null);

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
  let valid=true;setBusy(true);setError('');setVerification(null);setVerificationError('');
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
 const visibleChecks=useMemo(()=>{
  const checks=verification?.checks||[];
  return checks.filter(item=>checkFilter==='all'||(checkFilter==='mismatch'?item.status==='Mismatch':item.status==='Pass'));
 },[verification,checkFilter]);

 async function runPlacementVerification(){
  if(access!=='allowed'||verifying||busy)return;
  setVerifying(true);setVerificationError('');setCheckFilter('mismatch');
  try{
   // Re-check Owner privileges and expected public records before each audit.
   const expectedData=await readPalaceObservatoryMetadata();
   const expected=buildPalaceObservatorySnapshot({...expectedData,linked:MODERN_FANFICTION_LINKS});
   const actual=await readPalaceAnonymousPlacement();
   const base=makePalacePlacementChecks(expected,actual);
   const catalogue=makePalaceFanfictionCatalogueChecks(actual.guestWorks,createUnifiedFanworks,filterUnifiedFanworks);
   const tagParity=makePalaceFanfictionExclusionCheck(actual.guestWorks,createUnifiedFanworks,filterUnifiedFanworks);
   let checks=[...base.checks,...catalogue,...tagParity];
   setVerification({checks,tagStatus:'Checking sample tag scenarios…',completedAt:new Date().toISOString()});
   try{
    const scenarios=await runPalaceGuestTagScenarios(actual.guestWorks,8);
    checks=[...checks,...makePalaceTagScenarioChecks(actual.guestWorks,scenarios)];
    setVerification({checks,tagStatus:'Completed',completedAt:new Date().toISOString()});
   }catch(e){
    setVerification({checks,tagStatus:'Partial — tag tests could not finish',completedAt:new Date().toISOString()});
    setVerificationError(e?.message||'Unable to complete tag scenarios.');
   }
  }catch(e){
   setVerification(null);
   setVerificationError(e?.message||'Guest verification was not completed. No missing-work finding was inferred.');
  }finally{setVerifying(false)}
 }
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
   <div><p className="eyebrow">PRIVATE ADMINISTRATION · REVIEW BUILD</p><h1>The Palace Observatory</h1>
    <p>Unified catalogue, on-demand verification and Owner-reviewed issues. Nothing here automatically publishes, imports, merges or deploys.</p></div>
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
  {active==='Issues'&&<PalaceObservatoryIssues seed={issueSeed}/>}
  {snapshot&&<><div className="palace-observatory-filters">
    {(active==='Catalogue'||active==='Findings')&&<label>Find a title, author or tag
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
     <small>Observed: {issue.observed} · Finding candidates are never automatically saved as issues.</small>
     <button type="button" onClick={()=>{setIssueSeed(issue);setActive('Issues')}}>Review as issue</button>
    </article>)}</div></>}
   {active==='Verification'&&<div className="palace-observatory-verification">
    <p className="palace-observatory-subtitle">Compare expected public records with a separate anonymous client, the actual published-reading search RPC, and the current fanfiction filter. Results do not prove browser rendering or age-gate behaviour.</p>
    <button type="button" onClick={runPlacementVerification} disabled={verifying||busy}>{verifying?'Running checks…':'Run anonymous visibility checks'}</button>
    {verificationError&&<p role="alert" className="palace-observatory-warning">{verificationError}</p>}
    {verification&&<>
     <p className="palace-observatory-subtitle" role="status">{verification.checks.filter(x=>x.status==='Pass').length} passed · {verification.checks.filter(x=>x.status==='Mismatch').length} mismatches · {verification.tagStatus}. Candidates require independent browser rechecking.</p>
     <div className="palace-observatory-check-controls"><strong>Works missing from expected public results</strong>
      <label>Show checks <select value={checkFilter} onChange={e=>setCheckFilter(e.target.value)}>
       <option value="mismatch">Mismatches only</option><option value="all">All checks</option><option value="pass">Passed checks</option>
      </select></label></div>
     {visibleChecks.length===0&&<p role="status">No results in this view. Passing data checks do not establish that browser cards, mobile navigation or age gates work correctly.</p>}
     <div className="palace-observatory-list">{visibleChecks.map(item=><article className="palace-observatory-row" key={item.id}>
      <div className="palace-observatory-row-head"><strong>{item.title}</strong><span>{item.status} · {item.surface}</span></div>
      <p><b>Expected:</b> {item.expect}</p><p><b>Observed:</b> {item.observed}</p>
      <p>{item.detail}</p><small>{item.evidence}</small>
      {item.status==='Mismatch'&&<button type="button" onClick={()=>{setIssueSeed({...item,workTitle:item.title,title:item.surface+' — '+item.title,observed:item.observed,expected:item.expect,severity:'High'});setActive('Issues')}}>Review as issue</button>}
     </article>)}</div>
    </>}
   </div>}
   {active==='Release review'&&<div className="palace-observatory-denied">
    <h2>Release actions are unavailable in this review build</h2>
    <p>The Issue Register is an Owner-only proposal with database and private storage setup awaiting separate approval. Release approvals, publishing and deployment actions are not implemented. Nothing here can deploy or modify works.</p>
    <p>Public backend and code-path verification can be run from the Verification tab. Browser navigation, age-gate and mobile parity still require separate manual acceptance tests.</p>
   </div>}
  </>}
 </section>;
}
