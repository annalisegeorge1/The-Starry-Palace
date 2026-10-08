import React,{useState} from 'react';
import {Link} from 'react-router-dom';
import {
 PALACE_BETA_CHECKS,PALACE_BETA_TRACKS,BETA_RESULTS,BETA_SEVERITY,
 betaChecksFor,betaCounts,nextBetaCheck,betaIssueHasContent,cleanBetaIssue,buildBetaReport
} from './palaceBetaData';
import './palace-beta.css';
import './palace-beta-ready.css';

export {PALACE_BETA_CHECKS} from './palaceBetaData';

const KEY='palace-beta-feedback-v2';
const EMPTY_ISSUE={page:'',steps:'',expected:'',actual:'',severity:'major',frequency:'unknown'};
const validRoles=Object.keys(PALACE_BETA_TRACKS);
function stored(){
 try{
  const recent=JSON.parse(localStorage.getItem(KEY)||'null');
  const older=recent||JSON.parse(localStorage.getItem('palace-beta-checks-v1')||'{}');
  return{
   role:validRoles.includes(older.role)?older.role:'reader',
   device:typeof older.device==='string'?older.device.slice(0,120):'',
   showAll:older.showAll===true,
   showRemaining:older.showRemaining===true,
   results:recent?.results&&typeof recent.results==='object'
    ?recent.results:Object.fromEntries(Object.entries(older.checked||{}).filter(([,v])=>v).map(([k])=>[k,'passed'])),
   notes:typeof older.notes==='string'?older.notes.slice(0,7000):'',
   issues:Array.isArray(older.issues)?older.issues.slice(0,30).map(cleanBetaIssue):[],
   issueDraft:cleanBetaIssue(older.issueDraft||EMPTY_ISSUE)
  };
 }catch{return{role:'reader',device:'',showAll:false,showRemaining:false,results:{},notes:'',issues:[],issueDraft:{...EMPTY_ISSUE}}}
}
function store(next){try{localStorage.setItem(KEY,JSON.stringify(next))}catch{}}
export default function PalaceBetaGuide({Frame}){
 const[state,setState]=useState(stored);
 const[message,setMessage]=useState('');
 const checks=betaChecksFor(state.role,state.showAll);
 const counts=betaCounts(checks,state.results);
 const report=buildBetaReport(state,checks);
 const nextCheck=nextBetaCheck(checks,state.results);
 const visibleChecks=state.showRemaining?checks.filter(item=>!['passed','stuck','skipped'].includes(state.results[item.id])):checks;
 const groups=[...new Set(visibleChecks.map(x=>x.group))];
 function update(patch){setState(prev=>{const next={...prev,...(typeof patch==='function'?patch(prev):patch)};store(next);return next})}
 function updateIssue(patch){update(prev=>({issueDraft:{...prev.issueDraft,...patch}}))}
 function jumpTo(id){
  const target=document.getElementById(id);
  if(!target)return;
  const reducedMotion=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  target.scrollIntoView?.({block:'center',behavior:reducedMotion?'auto':'smooth'});
  target.focus?.({preventScroll:true});
 }
 function saveIssue(){
  const issue=cleanBetaIssue(state.issueDraft);
  if(!betaIssueHasContent(issue)){setMessage('Please describe at least the page or what happened before adding an issue.');return}
  if(state.issues.length>=30){setMessage('This report holds up to 30 issues. Copy or save it, then begin a new report.');return}
  update({issues:[...state.issues,issue],issueDraft:{...EMPTY_ISSUE}});
  setMessage('Issue added to your private report on this device.');
 }
 function troubleHere(item){
  updateIssue({page:item.url});
  jumpTo('palace-beta-issue-form');
 }
 async function copyText(text,what){
  try{
   if(!navigator.clipboard?.writeText)throw new Error('Clipboard unavailable');
   await navigator.clipboard.writeText(text);
   setMessage(what+' copied. It has not been sent to anyone.');
  }catch{setMessage('Clipboard access was blocked. Open “Preview my report”, select the text, and copy it manually.')}
 }
 async function shareReport(){
  try{
   if(typeof navigator.share!=='function'){await copyText(report,'Report');return}
   await navigator.share({title:'The Starry Palace — beta feedback',text:report});
   setMessage('Share sheet closed. Please confirm with your recipient that they received the report.');
  }catch(err){if(err?.name!=='AbortError')setMessage('Sharing was unavailable. Try copying or saving your report instead.')}
 }
 function downloadReport(){
  try{
   const blob=new Blob([report],{type:'text/plain;charset=utf-8'});
   const url=URL.createObjectURL(blob),a=document.createElement('a');
   a.href=url;a.download='starry-palace-beta-report.txt';
   document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);
   setMessage('Text report prepared for download on your device. No information was uploaded.');
  }catch{setMessage('Your browser could not create the report file. Try copying the report instead.')}
 }
 function clearAll(){
  if(!window.confirm('Clear your checklist, issue notes and locally saved feedback on this device?'))return;
  const empty={role:'reader',device:'',showAll:false,showRemaining:false,results:{},notes:'',issues:[],issueDraft:{...EMPTY_ISSUE}};
  update(empty);setMessage('Your local beta feedback was cleared.');
 }
 const invite='Would you like to help test The Starry Palace, a new home for stories? Try a few reader or writer tasks at https://the-starry-palace.onrender.com/beta. No experience needed, no pressure to publish, and please use disposable text when testing drafts. Your notes stay on your device until you choose to share them.';
 return <Frame><main className="palace-beta-guide">
  <header className="palace-beta-hero">
   <p className="eyebrow">THE PALACE TEST KITCHEN · FRIENDLY EARLY ACCESS</p>
   <h1>Help make the Palace feel effortless.</h1>
   <p>You don't need to be technical or finish every task. Tell us what felt lovely, what felt confusing, and where you got stuck.</p>
   <p className="palace-beta-privacy">✦ Nothing on this page is automatically sent. Your notes stay on this device until you choose to share a report.</p>
   <div className="palace-beta-progress"><strong>{counts.marked}/{checks.length}</strong><span>checkpoints marked in your track</span><div role="progressbar" aria-valuemin={0} aria-valuemax={checks.length} aria-valuenow={counts.marked} aria-label="Beta checklist progress"><i style={{width:(checks.length?counts.marked/checks.length*100:0)+'%'}}/></div></div>
   <div className="palace-beta-compass">
    <span className="palace-beta-compass-sigil" aria-hidden="true">✧</span>
    <div><strong>{nextCheck?'A little further along':'Your track is marked'}</strong>
     <p role="status">{nextCheck?'Next up: '+nextCheck.name:'Every checkpoint has a result. Review your answers or prepare your report below.'}</p></div>
    <button type="button" onClick={()=>jumpTo(nextCheck?'palace-beta-task-'+nextCheck.id:'palace-beta-final-report')}>
     {nextCheck?'Go to next checkpoint':'Review my report'} <span aria-hidden="true">↓</span>
    </button>
   </div>
  </header>
  <section className="palace-beta-intro" aria-label="How to test">
   <div><span aria-hidden="true">01</span><strong>Choose what you enjoy</strong><p>Reader, writer, artist, or community tester.</p></div>
   <div><span aria-hidden="true">02</span><strong>Try the tasks</strong><p>Choose Worked, Had trouble, or Skipped. Stop whenever you like.</p></div>
   <div><span aria-hidden="true">03</span><strong>Share what happened</strong><p>Copy, share or save a private text report. Nothing is submitted automatically.</p></div>
  </section>
  <section className="palace-beta-controls" aria-label="Test preferences">
   <label>I'm testing as<select value={state.role} onChange={e=>{update({role:e.target.value});setMessage('')}}>{Object.entries(PALACE_BETA_TRACKS).map(([value,info])=><option key={value} value={value}>{info.label}</option>)}</select></label>
   <label>Device and browser (optional)<input value={state.device} maxLength={120} placeholder="e.g. Samsung tablet · Chrome" onChange={e=>update({device:e.target.value})}/></label>
   <p className="palace-beta-track-description">{PALACE_BETA_TRACKS[state.role].description}</p>
   <label className="palace-beta-all-checks"><input type="checkbox" checked={state.showAll} onChange={e=>update({showAll:e.target.checked})}/> Show all Palace checkpoints instead of just my track</label>
   <label className="palace-beta-all-checks"><input type="checkbox" checked={state.showRemaining} onChange={e=>update({showRemaining:e.target.checked})}/> Show only checkpoints I haven't marked yet</label>
  </section>
  <section className="palace-beta-safety" aria-label="Testing safety"><strong>Use a test story, not a treasured manuscript.</strong> Avoid private messages, passwords and personal information in screenshots or reports. Don't change live Council votes or moderation actions just to test them. If a task needs an account and you'd rather not register, choose Skipped.</section>
  {groups.length===0&&<section className="palace-beta-finished"><strong>All caught up for this track.</strong><p>Your answers are saved on this device. Uncheck the unfinished-only filter to revisit any checkpoint.</p><button type="button" onClick={()=>update({showRemaining:false})}>Review all checkpoints</button></section>}
  {groups.map(group=><section className="palace-beta-group" key={group}><h2>{group}</h2><div className="palace-beta-checks">
   {visibleChecks.filter(x=>x.group===group).map(item=><article key={item.id} id={'palace-beta-task-'+item.id} tabIndex={-1} className={state.results[item.id]==='stuck'?'palace-beta-had-trouble':''}>
    <strong className="palace-beta-task-name">{item.name}</strong>
    <p>{item.hint}</p>
    <Link to={item.url}>Open this part of the Palace →</Link>
    <fieldset className="palace-beta-result"><legend>How did this go?</legend><div>{BETA_RESULTS.map(option=><label key={option.value} className={state.results[item.id]===option.value?'selected':''}><input type="radio" name={'beta-result-'+item.id} value={option.value} checked={state.results[item.id]===option.value} onChange={()=>update(prev=>({results:{...prev.results,[item.id]:option.value}}))}/>{option.label}</label>)}</div></fieldset>
    {state.results[item.id]==='stuck'&&<button type="button" className="palace-beta-report-link" onClick={()=>troubleHere(item)}>Describe what happened →</button>}
   </article>)}
   </div></section>)}
  <section id="palace-beta-issue-form" tabIndex={-1} className="palace-beta-report palace-beta-issue-form"><p className="eyebrow">WHEN SOMETHING GOES WRONG</p><h2>Tell us about a problem</h2>
   <p>A short description is enough. The best reports say which page, what you tried, what you expected, and what happened instead. Add separate issues when useful.</p>
   <div className="palace-beta-issue-grid">
    <label>Where was it?<input value={state.issueDraft.page} maxLength={180} placeholder="/writing, /reading or page title" onChange={e=>updateIssue({page:e.target.value})}/></label>
    <label>How serious was it?<select value={state.issueDraft.severity||'major'} onChange={e=>updateIssue({severity:e.target.value})}>{BETA_SEVERITY.map(x=><option key={x.value} value={x.value}>{x.label}</option>)}</select></label>
    <label>What did you try?<textarea rows={2} maxLength={1800} value={state.issueDraft.steps} placeholder="I opened Chapter 2 and began typing…" onChange={e=>updateIssue({steps:e.target.value})}/></label>
    <label>What should have happened?<textarea rows={2} maxLength={1800} value={state.issueDraft.expected} placeholder="My draft should open and save normally…" onChange={e=>updateIssue({expected:e.target.value})}/></label>
    <label>What actually happened?<textarea rows={3} maxLength={1800} value={state.issueDraft.actual} placeholder="The page stayed blank until I refreshed…" onChange={e=>updateIssue({actual:e.target.value})}/></label>
    <label>Does it happen again?<select value={state.issueDraft.frequency||'unknown'} onChange={e=>updateIssue({frequency:e.target.value})}><option value="unknown">Not sure</option><option value="once">Once</option><option value="sometimes">Sometimes</option><option value="always">Every time</option></select></label>
   </div>
   <button type="button" className="palace-beta-save-issue" onClick={saveIssue}>＋ Add this issue to my report</button>
   {state.issues.length>0&&<div className="palace-beta-saved-issues"><h3>{state.issues.length} issue{state.issues.length===1?'':'s'} in this report</h3>
    {state.issues.map((item,index)=><div key={index}><div><strong>{index+1}. {item.page||'Untitled page'}</strong><small>{item.severity||'Unrated'} · {item.actual||item.steps||'Issue details included'}</small></div><button type="button" onClick={()=>update(prev=>({issues:prev.issues.filter((_,i)=>i!==index)}))} aria-label={'Remove reported issue '+(index+1)}>Remove</button></div>)}
   </div>}
  </section>
  <section id="palace-beta-final-report" tabIndex={-1} className="palace-beta-report"><p className="eyebrow">YOUR NOTES</p><h2>What should feel better?</h2>
   <p>Share anything you noticed, including what worked beautifully. You can leave this blank.</p>
   <label htmlFor="palace-beta-notes">Comments and suggestions</label>
   <textarea id="palace-beta-notes" value={state.notes} rows={4} maxLength={7000} placeholder="I loved… / I had trouble finding… / On my phone…" onChange={e=>update({notes:e.target.value})}/>
   <h3>Your report is ready when you are.</h3>
   <div className="palace-beta-actions">
    <button type="button" onClick={()=>copyText(report,'Report')}>Copy my report</button>
    <button type="button" onClick={shareReport}>Share report</button>
    <button type="button" onClick={downloadReport}>Save as text file</button>
    <button type="button" className="quiet" onClick={clearAll}>Clear my local feedback</button>
   </div>
   <details className="palace-beta-preview"><summary>Preview my full report</summary><textarea readOnly value={report} rows={12} aria-label="Complete beta report to copy manually" onFocus={e=>e.target.select()}/></details>
   {message&&<p className="palace-beta-message" role="status">{message}</p>}
   <small>Share the report privately with the person who invited you. Copying or opening the share sheet does not guarantee delivery. All notes and checklist results are stored only in this browser.</small>
  </section>
  <section className="palace-beta-invitation"><div><p className="eyebrow">INVITING A FRIEND?</p><h2>Make room for another voice.</h2><p>Anyone can explore the beta guide. You can share this invitation with someone who enjoys reading, writing, comics or thoughtful communities.</p></div><button type="button" onClick={()=>copyText(invite,'Invitation')}>Copy a friendly tester invitation</button></section>
 </main></Frame>;
}
