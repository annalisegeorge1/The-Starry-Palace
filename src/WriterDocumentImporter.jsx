import React,{useState} from 'react';
import {convertDocumentFile} from './documentImportModel';

/** The local conversion is only staged until the writer explicitly imports. */
export default function WriterDocumentImporter({onImport,disabled=false}){
 const [draft,setDraft]=useState(null),[error,setError]=useState(''),[busy,setBusy]=useState(false),[notice,setNotice]=useState('');
 async function pick(e){
  const file=e.target.files?.[0];e.target.value='';
  setError('');setNotice('');setDraft(null);
  if(!file)return;
  setBusy(true);
  try{setDraft(await convertDocumentFile(file))}
  catch(err){setError(err.message||'Could not read this document.')}
  finally{setBusy(false)}
 }
 async function apply(){
  if(!draft||disabled||busy)return;
  setError('');setBusy(true);
  try{await onImport(draft);setDraft(null);setNotice('The manuscript was imported as a new private chapter. Review the formatting before publishing.')}
  catch(err){setError(err.message||'The document could not be saved. Your current chapter was not replaced.')}
  finally{setBusy(false)}
 }
 return <section className="writer-document-import" aria-label="Import a document into a private chapter">
  <header><div><small>FROM YOUR DEVICE</small><strong>Import a manuscript</strong></div></header>
  <p>Upload a Word .docx, text, Markdown or HTML document. We convert it on your device and create a <strong>new private chapter</strong> only after you approve. Your current chapter stays intact.</p>
  <label>Choose document <input type="file" disabled={disabled||busy} accept=".docx,.txt,.md,.html,.htm,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/html" onChange={pick}/></label>
  {busy&&<p role="status">Reading your document…</p>}
  {draft&&<div className="writer-document-import-staged">
    <div className="writer-import-summary"><strong>{draft.title}</strong><small>{draft.words.toLocaleString()} words · private local preview</small></div>
    <div className="writer-import-preview" aria-label="Converted manuscript preview" dangerouslySetInnerHTML={{__html:draft.html}}/>
    {draft.warnings.map((warning,i)=><p className="writer-import-warning" key={i}>{warning}</p>)}
    <div className="writer-import-actions">
     <button type="button" onClick={apply} disabled={disabled||busy}>{busy?'Importing…':'Create private chapter from document'}</button>
     <button type="button" className="quiet-button" onClick={()=>setDraft(null)} disabled={busy}>Cancel</button>
    </div>
   </div>}
  {notice&&<p role="status">{notice}</p>}
  {error&&<p role="alert" className="writer-import-error">{error}</p>}
  <small>Never automatically publishes. Old .doc files need conversion to .docx. Decorative fonts, images and exact page layouts may need manual adjustment.</small>
 </section>;
}
