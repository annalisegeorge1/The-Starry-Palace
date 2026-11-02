import React,{useEffect,useState} from 'react';
import {useAuth} from './auth';
import {getCuratorFanworkQueue,stageCuratorFanworkManuscript,getCuratorFanworkManuscriptPreview} from './curatorFanworkIntakeData';
import {fanworkQueueOverview,fanworkReviewStatus,inspectStagedFanwork,fanworkAuthorRequest} from './fanworkIntakeReviewModel';
import {validateFanworkManuscript,FANWORK_IMPORT_MAX_FILE_BYTES} from './fanworkManuscriptIntakeModel';
import './curator-fanwork-intake.css';

/** Visible only when the signed-in account can query private archive drafts.
 * Supabase RLS is the real access control; this is only the curator interface.
 * Manuscripts are staged directly from the signed-in browser to the private archive.
 */
export default function CuratorFanworkIntake(){
 const {session}=useAuth();
 const [queue,setQueue]=useState([]);
 const [loading,setLoading]=useState(false);
 const [loadError,setLoadError]=useState('');
 const [selectedId,setSelectedId]=useState('');
 const [body,setBody]=useState('');
 const [sourceUrl,setSourceUrl]=useState('');
 const [method,setMethod]=useState('');
 const [evidence,setEvidence]=useState('');
 const [consent,setConsent]=useState(false);
 const [busy,setBusy]=useState(false);
 const [notice,setNotice]=useState('');
 const [error,setError]=useState('');
 const [open,setOpen]=useState(false);
 const [preview,setPreview]=useState(null);
 const [previewBusy,setPreviewBusy]=useState(false);
 const [requestDraft,setRequestDraft]=useState('');
 useEffect(()=>{
  if(!session?.user?.id){setQueue([]);return}
  let active=true;
  setLoading(true);setLoadError('');
  getCuratorFanworkQueue().then(rows=>{if(active)setQueue(rows||[])})
   .catch(err=>{if(active)setLoadError(err?.message||'The private intake queue could not be loaded.')})
   .finally(()=>{if(active)setLoading(false)});
  return()=>{active=false};
 },[session?.user?.id]);
 const chosen=queue.find(item=>item.id===selectedId)||null;
 const overview=fanworkQueueOverview(queue);
 const readiness=chosen?fanworkReviewStatus(chosen):null;
 const activePreview=preview?.recordId===chosen?.id?preview:null;
 const validation=validateFanworkManuscript({body,sourceUrl,deliveryMethod:method,evidenceNote:evidence});
 function chooseRecord(id){
  const item=queue.find(row=>row.id===id);
  setSelectedId(id);setBody('');setSourceUrl(item?.sourceUrl||'');setMethod('');
  setEvidence('');setConsent(false);setError('');setNotice('');setPreview(null);setRequestDraft('');
 }
 async function uploadFile(file){
  setError('');setNotice('');
  if(!file)return;
  if(file.size>FANWORK_IMPORT_MAX_FILE_BYTES){
   setError('This file is too large. Choose a plain-text document under 2.5 MB.');return;
  }
  if(!/\.txt$/i.test(file.name)||file.type&&!['text/plain','application/octet-stream'].includes(file.type)){
   setError('Only original plain-text (.txt) manuscript files are accepted.');return;
  }
  try{setBody(await file.text())}catch{setError('The manuscript could not be read on this device.')}
 }
 async function save(e){
  e.preventDefault();setError('');setNotice('');
  if(!chosen)return setError('Choose a fanfiction draft first.');
  if(!consent)return setError('Confirm that this manuscript was supplied or independently authorized for staging.');
  if(!validation.valid)return setError(validation.errors.join(' '));
  if(chosen.stagedWords&&!window.confirm('Replace the previously staged draft manuscript? This overwrites its text.'))return;
  setBusy(true);
  try{
   const result=await stageCuratorFanworkManuscript({
    record:chosen,body,sourceUrl,deliveryMethod:method,evidenceNote:evidence
   });
   setQueue(current=>current.map(item=>item.id===chosen.id?{
    ...item,stagedWords:result.word_count,lastStagedAt:result.updated_at
   }:item));
   setNotice('Manuscript staged privately. '+result.word_count.toLocaleString()+
    ' words saved. Its rights and publication status are unchanged.');
   setBody('');setConsent(false);setEvidence('');setMethod('');setPreview(null);
   getCuratorFanworkQueue().then(setQueue).catch(()=>{});
  }catch(err){setError(err?.message||'Unable to stage this manuscript.')}
  finally{setBusy(false)}
 }
 async function reviewManuscript(){
  if(!chosen)return;
  setPreviewBusy(true);setError('');
  const id=chosen.id;
  try{
   const text=await getCuratorFanworkManuscriptPreview(chosen);
   if(!text){setPreview({recordId:id,empty:true});return}
   const chapters=inspectStagedFanwork(text.body,chosen.expectedChapters);
   setPreview({recordId:id,empty:false,words:text.words,updatedAt:text.updatedAt,
    excerpt:text.body.slice(0,1200),...chapters});
  }catch(err){setError(err?.message||'Unable to inspect the private manuscript.')}
  finally{setPreviewBusy(false)}
 }
 async function prepareAuthorRequest(){
  if(!chosen)return;
  const message=fanworkAuthorRequest(chosen);
  setRequestDraft(message);setError('');
  try{
   if(typeof navigator!=='undefined'&&navigator.clipboard?.writeText){
    await navigator.clipboard.writeText(message);
    setNotice('Permission request copied. You can send it through the author’s own contact channel.');
   }else setNotice('Permission request ready below for manual copying.');
  }catch{setNotice('Permission request ready below for manual copying.')}
 }
 // Non-curators receive zero draft records under RLS, not an imitation admin screen.
 if(!session||loading&&!queue.length||!queue.length)return null;
 return <section className="curator-fanwork-intake" aria-label="Private fanfiction manuscript intake">
  <details open={open} onToggle={e=>setOpen(e.currentTarget.open)}>
   <summary><span>Curator tools · Author-supplied fanfiction</span><small>{overview.staged} received / {overview.total} candidates</small></summary>
   <div className="curator-fanwork-intake-body">
    <p>Stage a complete manuscript provided directly by its author or another authorized source. Do not scrape or copy stories from external fanfiction websites. Staging never publishes a work or approves its rights.</p>
    <div className="curator-fanwork-overview" aria-label="Private manuscript review progress">
     <span><strong>{overview.total}</strong><small>Intake candidates</small></span>
     <span><strong>{overview.staged}</strong><small>Manuscripts received</small></span>
     <span><strong>{overview.rightsPending}</strong><small>Staged, awaiting rights</small></span>
     <span><strong>{overview.editorialReview}</strong><small>Ready for editorial review</small></span>
    </div>
    {loadError&&<p role="alert">{loadError}</p>}
    <form onSubmit={save}>
     <label>Private fanfiction draft
      <select value={selectedId} onChange={e=>chooseRecord(e.target.value)} required>
       <option value="">Choose a draft…</option>
       {queue.map(item=><option key={item.id} value={item.id}>{item.title} — {item.creator}{item.stagedWords?' ('+item.stagedWords+' staged words)':''}</option>)}
      </select>
     </label>
     {chosen&&<div className="curator-fanwork-source"><strong>{chosen.fandom||'Fandom not tagged'}</strong><span>{chosen.originalRating} · {chosen.rightsStatus.replaceAll('_',' ')} · {chosen.status}</span>
       {chosen.sourceUrl&&<a href={chosen.sourceUrl} target="_blank" rel="noopener noreferrer">View original source</a>}
       {chosen.permissionUrl&&<a href={chosen.permissionUrl} target="_blank" rel="noopener noreferrer">View recorded author terms</a>}
       <span>Source licence statement: {chosen.sourceLicense||'Unverified'}</span>
      </div>}
     {chosen&&readiness&&<section className="curator-fanwork-review-card" aria-label="Publication readiness checklist">
       <div className="curator-fanwork-review-heading"><strong>{readiness.label}</strong>
        <span>{readiness.wordCount.toLocaleString()} staged words</span>
       </div>
       <p>Review checklist only. A rights statement or staged text does not itself grant hosting permission, and nothing here publishes a story.</p>
       <ul>{readiness.issues.map(issue=><li key={issue}>{issue}</li>)}</ul>
       {readiness.hasVerifiedGrant&&<p>An active hosting grant has been recorded; the underlying franchise rights and editorial checks still need independent review.</p>}
       <div className="curator-fanwork-review-actions">
        <button type="button" onClick={prepareAuthorRequest}>Copy author permission request</button>
        <button type="button" onClick={reviewManuscript} disabled={!chosen.stagedWords||previewBusy}>
         {previewBusy?'Checking chapters…':'Inspect staged chapters'}
        </button>
       </div>
       {requestDraft&&<label>Permission request to send to the author
        <textarea readOnly rows={7} value={requestDraft} onFocus={e=>e.target.select()} aria-label="Copyable author permission request"/>
       </label>}
       {activePreview&&<div className="curator-fanwork-preview" aria-label="Private manuscript chapter preview">
        {activePreview.empty?<p>No staged manuscript has been saved for this record.</p>:<>
         <p><strong>{activePreview.words?.toLocaleString()} saved words</strong> · {activePreview.detectedChapters} detected chapter headings
          {activePreview.expectedChapters?' of '+activePreview.expectedChapters+' expected':''}</p>
         {activePreview.issues.map(issue=><p className="curator-fanwork-warning" key={issue}>{issue}</p>)}
         <p>{activePreview.note}</p>
         {activePreview.sections.length>0&&<ol>{activePreview.sections.slice(0,18).map((section,i)=><li key={section+':'+i}>{section}</li>)}</ol>}
         <details><summary>View beginning of private manuscript</summary>
          <pre>{activePreview.excerpt}</pre>
         </details>
        </>}
       </div>}
      </section>}
     <label>Original edition URL (HTTPS)
      <input type="url" required value={sourceUrl} maxLength={1800} placeholder="https://…" onChange={e=>setSourceUrl(e.target.value)}/>
     </label>
     <label>How was the text supplied?
      <select value={method} onChange={e=>setMethod(e.target.value)} required>
       <option value="">Choose a source…</option>
       <option value="author_supplied">Provided directly by the fanfic author</option>
       <option value="rights_holder_supplied">Provided directly by an authorized rights holder</option>
       <option value="separately_authorized_copy">Separately authorized original manuscript</option>
      </select>
     </label>
     <label>Source and permission evidence
      <textarea rows={3} maxLength={1200} value={evidence} onChange={e=>setEvidence(e.target.value)}
       required placeholder="Describe how the author or rights holder supplied this file and the scope of permission. Do not include private contact details, addresses, or correspondence."/>
     </label>
     <label>Paste complete plain-text manuscript
      <textarea className="curator-fanwork-manuscript" rows={7} value={body}
       onChange={e=>setBody(e.target.value)} placeholder="Paste text with original chapter headings and line breaks. Preserve the author's original text."/>
     </label>
     <label>Or select author-provided .txt file
      <input type="file" accept=".txt,text/plain" onChange={e=>uploadFile(e.target.files?.[0])}/>
     </label>
     <small>{validation.wordCount.toLocaleString()} words in this manuscript · private draft only</small>
     <label className="curator-fanwork-confirm"><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)}/>
      <span>I have received this text directly or through separately documented authorization, and understand that staging does not authorize publication or clear underlying franchise rights.</span>
     </label>
     {error&&<p role="alert" className="curator-fanwork-error">{error}</p>}
     {notice&&<p role="status" className="curator-fanwork-notice">{notice}</p>}
     <button type="submit" disabled={!chosen||!validation.valid||!consent||busy}>
      {busy?'Saving private manuscript…':chosen?.stagedWords?'Replace private staged manuscript':'Stage manuscript privately'}
     </button>
    </form>
   </div>
  </details>
 </section>;
}
