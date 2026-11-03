import React,{useEffect,useMemo,useRef,useState} from 'react';
import {
 listPalaceObservatoryIssues,getPalaceObservatoryIssueHistory,
 createPalaceObservatoryIssue,updatePalaceObservatoryIssue,transitionPalaceObservatoryIssue,
 attachPalaceObservatoryScreenshot,openPalaceObservatoryScreenshot,OBSERVATORY_SETUP_MESSAGE
} from './palaceObservatoryIssuesData';
import {
 OBSERVATORY_ISSUE_STATUSES,OBSERVATORY_SEVERITIES,observatoryNextStatuses,
 observatoryFindingDraft,observatoryValidateIssue,observatoryValidateScreenshot
} from './palaceObservatoryIssuesModel';

const blank=()=>({
 title:'',work_title:'',surface:'Fanfiction',severity:'Medium',expected:'',observed:'',
 steps:'',device:'',browser:'',source_url:'',fix_proposal:'',review_note:'',finding_key:null
});
const displayTime=value=>value?new Date(value).toLocaleString():'—';
const field=(label,value,setValue,{multiline=false,required=false,max=1200,placeholder=''}={})=><label className="palace-observatory-field" key={label}>
 <span>{label}</span>{multiline?
  <textarea rows={3} maxLength={max} required={required} value={value} placeholder={placeholder} onChange={e=>setValue(e.target.value)}/>:
  <input maxLength={max} required={required} value={value} placeholder={placeholder} onChange={e=>setValue(e.target.value)}/>}
</label>;

export default function PalaceObservatoryIssues({seed=null}){
 const [items,setItems]=useState([]);
 const [loading,setLoading]=useState(true);
 const [configured,setConfigured]=useState(false);
 const [failure,setFailure]=useState('');
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState('');
 const [openForm,setOpenForm]=useState(false);
 const [editingId,setEditingId]=useState(null);
 const [draft,setDraft]=useState(blank);
 const [selectedId,setSelectedId]=useState(null);
 const [history,setHistory]=useState({events:[],evidence:[]});
 const [historyError,setHistoryError]=useState('');
 const [statusFilter,setStatusFilter]=useState('all');
 const [search,setSearch]=useState('');
 const [transitionTo,setTransitionTo]=useState('');
 const [transitionNote,setTransitionNote]=useState('');
 const [file,setFile]=useState(null);
 const [fileKey,setFileKey]=useState(0);
 const [previewUrl,setPreviewUrl]=useState('');
 const selectedIdRef=useRef(null);
 selectedIdRef.current=selectedId;
 const [refresh,setRefresh]=useState(0);
 useEffect(()=>{
  if(!previewUrl)return;
  const timeout=setTimeout(()=>setPreviewUrl(''),110000);
  return()=>clearTimeout(timeout);
 },[previewUrl]);

 useEffect(()=>{
  let active=true;setLoading(true);setFailure('');
  listPalaceObservatoryIssues().then(result=>{
   if(!active)return;
   setConfigured(result.configured);setItems(result.issues);
   if(result.configured)setSelectedId(id=>result.issues.some(r=>r.id===id)?id:null);
  }).catch(e=>{if(active)setFailure(e?.message||'Unable to load private issues.')})
   .finally(()=>{if(active)setLoading(false)});
  return()=>{active=false};
 },[refresh]);

 useEffect(()=>{
  if(!seed?.id)return;
  setDraft(observatoryFindingDraft(seed));
  setEditingId(null);setOpenForm(true);setMessage('');
 },[seed?.id,seed?.requestId]);
 const selected=items.find(x=>x.id===selectedId)||null;
 useEffect(()=>{
  let active=true;setHistory({events:[],evidence:[]});setHistoryError('');setPreviewUrl('');
  if(!selectedId||!configured)return()=>{active=false};
  getPalaceObservatoryIssueHistory(selectedId).then(data=>{if(active)setHistory(data)})
   .catch(e=>{if(active)setHistoryError(e?.message||'Issue history could not be loaded.')});
  return()=>{active=false};
 },[selectedId,configured,refresh]);
 const filtered=useMemo(()=>items.filter(issue=>
  (statusFilter==='all'||issue.status===statusFilter)&&
  (!search.trim()||[issue.title,issue.work_title,issue.surface,issue.expected,issue.observed]
   .some(s=>String(s||'').toLowerCase().includes(search.trim().toLowerCase())))),[items,statusFilter,search]);

 function setField(name,value){setDraft(prev=>({...prev,[name]:value}))}
 function startNew(){setEditingId(null);setOpenForm(true);setDraft(blank());setMessage('')}
 function startEdit(issue){
  setEditingId(issue.id);setOpenForm(true);setDraft({...blank(),...issue});setMessage('');
 }
 async function save(e){
  e.preventDefault();if(busy||!configured)return;
  const check=observatoryValidateIssue(draft);
  if(!check.valid){setFailure(check.errors.join(' '));return}
  setBusy(true);setFailure('');setMessage('');
  try{
   if(editingId){
    const original=items.find(r=>r.id===editingId);
    if(!original)throw Error('Reload this issue before editing.');
    await updatePalaceObservatoryIssue(original,draft);
    setMessage('Changes recorded. The issue history contains an audit entry.');
   }else{
    await createPalaceObservatoryIssue(draft);
    setMessage('Private review issue created; no work or deployment changed.');
   }
   setOpenForm(false);setRefresh(n=>n+1);
  }catch(err){setFailure(err?.message||'Issue could not be saved.')}
  finally{setBusy(false)}
 }
 async function transition(){
  if(!selected||!transitionTo||busy)return;
  setBusy(true);setFailure('');setMessage('');
  try{
   await transitionPalaceObservatoryIssue(selected,transitionTo,transitionNote);
   setMessage('Review status recorded. This does not publish any code.');
   setTransitionTo('');setTransitionNote('');setRefresh(n=>n+1);
  }catch(e){setFailure(e?.message||'Issue status was not changed.')}
  finally{setBusy(false)}
 }
 async function upload(){
  if(!selected||!file||busy)return;
  const checked=observatoryValidateScreenshot(file);
  if(!checked.valid){setFailure(checked.error);return}
  setBusy(true);setFailure('');
  try{
   await attachPalaceObservatoryScreenshot(selected,file);
   setMessage('Screenshot saved in private storage.');
   setFile(null);setFileKey(n=>n+1);setRefresh(n=>n+1);
  }catch(e){setFailure(e?.message||'Screenshot could not be saved.')}
  finally{setBusy(false)}
 }
 async function preview(item){
  const requestedIssue=selectedId;
  setPreviewUrl('');setFailure('');
  try{
   const signed=await openPalaceObservatoryScreenshot(item);
   if(selectedIdRef.current===requestedIssue)setPreviewUrl(signed);
  }catch(e){
   if(selectedIdRef.current===requestedIssue)
    setFailure(e?.message||'Could not generate a private screenshot preview.');
  }
 }

 if(loading)return <p role="status">Opening the private issue tracker…</p>;
 if(failure&&!configured)return <p role="alert" className="palace-observatory-warning">{failure}</p>;
 if(!configured)return <div className="palace-observatory-denied" role="status">
  <h2>Issue storage pending review</h2>
  <p>{OBSERVATORY_SETUP_MESSAGE}</p>
  <p>UI and the proposed Owner-only database/storage policies are prepared on this draft branch. No issue records, screenshots, or member data have been written to the production database.</p>
 </div>;
 return <section className="palace-observatory-issues" aria-label="Observatory issue tracker">
  <div className="palace-observatory-issues-head"><div>
   <h2>Private issue register</h2><p>{items.length} recorded issues · Fixed means reviewed, not deployed</p>
  </div><div className="palace-observatory-issues-actions">
   <button type="button" onClick={startNew}>New issue</button>
   <button type="button" onClick={()=>setRefresh(n=>n+1)} disabled={busy}>Reload</button>
  </div></div>
  {failure&&<p role="alert" className="palace-observatory-warning">{failure}</p>}
  {message&&<p role="status">{message}</p>}
  {openForm&&<form className="palace-observatory-editor" onSubmit={save}>
   <div className="palace-observatory-row-head"><h3>{editingId?'Edit issue details':'Create review issue'}</h3>
    <button type="button" onClick={()=>setOpenForm(false)}>Close</button></div>
   <p>Describe a reproducible problem. Audit candidates are not confirmed bugs until you record an actual observation. Do not paste unpublished manuscript text or member private details.</p>
   {field('Issue title',draft.title,v=>setField('title',v),{required:true,max:160})}
   <div className="palace-observatory-inline">
    {field('Affected section',draft.surface,v=>setField('surface',v),{required:true,max:100})}
    <label className="palace-observatory-field"><span>Severity</span>
     <select value={draft.severity} onChange={e=>setField('severity',e.target.value)}>
      {OBSERVATORY_SEVERITIES.map(s=><option key={s}>{s}</option>)}
     </select></label>
   </div>
   {field('Related work (optional)',draft.work_title,v=>setField('work_title',v),{max:160})}
   {field('Expected result',draft.expected,v=>setField('expected',v),{multiline:true,required:true,max:1800})}
   {field('Observed result',draft.observed,v=>setField('observed',v),{multiline:true,required:true,max:1800})}
   {field('Steps to reproduce',draft.steps,v=>setField('steps',v),{multiline:true,max:2400})}
   <div className="palace-observatory-inline">
    {field('Device / screen width',draft.device,v=>setField('device',v),{max:120,placeholder:'Android, 390 px'})}
    {field('Browser',draft.browser,v=>setField('browser',v),{max:120,placeholder:'Chrome / Firefox'})}
   </div>
   {field('Relevant HTTPS link',draft.source_url||'',v=>setField('source_url',v),{max:750})}
   {field('Proposed fix (for review only)',draft.fix_proposal,v=>setField('fix_proposal',v),{multiline:true,max:2400})}
   {field('Review note',draft.review_note,v=>setField('review_note',v),{multiline:true,max:2400})}
   <div className="palace-observatory-issues-actions">
    <button type="submit" disabled={busy}>{busy?'Saving…':editingId?'Save issue changes':'Save private issue'}</button>
    <button type="button" onClick={()=>setOpenForm(false)}>Cancel</button></div>
  </form>}
  <div className="palace-observatory-issue-tools">
   <label>Search issues <input type="search" value={search} onChange={e=>setSearch(e.target.value)}
    placeholder="Title, work, section, evidence…"/></label>
   <label>Status <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}>
    <option value="all">All statuses</option>
    {OBSERVATORY_ISSUE_STATUSES.map(s=><option key={s}>{s}</option>)}
   </select></label>
  </div>
  <div className="palace-observatory-issue-layout">
   <div className="palace-observatory-list" role="list" aria-label="Saved issues">
    {filtered.map(issue=><div className="palace-observatory-row" key={issue.id} role="listitem">
     <button className="palace-observatory-issue-select" type="button" aria-pressed={selectedId===issue.id}
      onClick={()=>{setSelectedId(issue.id);setTransitionTo('');setTransitionNote('')}}>
      <strong>{issue.title}</strong><span>{issue.severity} · {issue.status}</span>
      <small>{issue.surface} · {displayTime(issue.updated_at)}</small>
     </button></div>)}
    {!filtered.length&&<p>No saved issues match these filters.</p>}
   </div>
   {selected&&<div className="palace-observatory-issue-detail" aria-label="Selected issue detail">
    <div className="palace-observatory-row-head"><h3>{selected.title}</h3>
     <button type="button" onClick={()=>startEdit(selected)}>Edit details</button></div>
    <p>{selected.severity} · {selected.status}</p>
    <p><b>Expected:</b> {selected.expected}</p><p><b>Observed:</b> {selected.observed}</p>
    {selected.steps&&<p><b>Steps:</b> {selected.steps}</p>}
    {selected.fix_proposal&&<p><b>Fix proposal:</b> {selected.fix_proposal}</p>}
    {selected.source_url&&<p><a href={selected.source_url} rel="noopener noreferrer" target="_blank">Open reference link</a></p>}
    <div className="palace-observatory-transitions">
     <h4>Advance review</h4>
     <label>Next status <select value={transitionTo} onChange={e=>setTransitionTo(e.target.value)}>
      <option value="">Choose a status</option>
      {observatoryNextStatuses(selected.status).map(s=><option key={s}>{s}</option>)}
     </select></label>
     <label>Evidence / review note
      <textarea rows={3} value={transitionNote} maxLength={2400} onChange={e=>setTransitionNote(e.target.value)}
       placeholder="Required for Fixed, Rechecked and Reopened"/></label>
     <button type="button" disabled={!transitionTo||busy} onClick={transition}>Record status change</button>
     <small>Changing an issue status never merges, publishes, imports, or deploys a website update.</small>
    </div>
    <div className="palace-observatory-screenshots"><h4>Private screenshots</h4>
     <p>Attach only images you are permitted to retain. Crop or redact personal information before uploading. No AI image processing is used.</p>
     <input key={fileKey} type="file" aria-label="Choose a private screenshot" accept="image/png,image/jpeg,image/webp"
      onChange={e=>setFile(e.target.files?.[0]||null)}/>
     <button type="button" disabled={!file||busy} onClick={upload}>Save screenshot privately</button>
     {history.evidence.map(item=><div key={item.id} className="palace-observatory-evidence-item">
      <span>{item.file_name} · {displayTime(item.created_at)}</span>
      <button type="button" onClick={()=>preview(item)}>Preview</button>
     </div>)}
     {previewUrl&&<div className="palace-observatory-evidence-preview">
      <img alt="Selected private issue screenshot" src={previewUrl} referrerPolicy="no-referrer"/>
      <div className="palace-observatory-evidence-preview-actions">
       <small>Preview auto-hides before the two-minute link expiry. Hiding it does not revoke a previously shared link.</small>
       <button type="button" onClick={()=>setPreviewUrl('')}>Close preview</button>
      </div>
     </div>}
    </div>
    <h4>Immutable review history</h4>
    {historyError&&<p role="alert">{historyError}</p>}
    {history.events.length?history.events.map(event=><p className="palace-observatory-history-item" key={event.id}>
     <strong>{event.action}</strong> · {displayTime(event.created_at)}
     {event.status_before||event.status_after?<span> · {event.status_before||'—'} → {event.status_after}</span>:null}
     {Array.isArray(event.changed_fields)&&event.changed_fields.length>0&&<span> · Fields: {event.changed_fields.join(', ')}</span>}
     {event.review_note&&<span> · {event.review_note}</span>}
    </p>):<p>No history returned for this issue.</p>}
   </div>}
  </div>
 </section>;
}
