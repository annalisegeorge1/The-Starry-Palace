import React, {useState} from 'react';
import {saveCommentRevision} from './palaceData';

export default function CommentRevisionEditor({comment, close, reload}) {
 const [body,setBody]=useState(comment.body);
 const [spoiler,setSpoiler]=useState(comment.spoiler);
 const [error,setError]=useState('');
 const [busy,setBusy]=useState(false);
 const [saved,setSaved]=useState(false);
 async function submit(event) {
  event.preventDefault();
  if(busy||saved)return;
  setBusy(true);
  try {
   await saveCommentRevision(comment,body,spoiler);
  } catch(e) {
   setError(e.message || 'Could not save changes.');
   setBusy(false);
   return;
  }
  setSaved(true);
  try {await reload();close()}
  catch {setBusy(false);setError('Your edit was saved. Refresh the discussion to see its review status.')}
 }
 return <form onSubmit={submit}>
  <label>Edit your comment<textarea required value={body} disabled={busy||saved} onChange={e=>setBody(e.target.value)}/></label>
  <label><input type="checkbox" checked={spoiler} disabled={busy||saved} onChange={e=>setSpoiler(e.target.checked)}/> Contains spoilers</label>
  <p>Saving sends your changes back to the writer for review.</p>
  {error&&<p role="alert">{error}</p>}
  <button type="submit" disabled={busy||saved||!body.trim()||(body.trim()===comment.body&&spoiler===comment.spoiler)}>Save for review</button>
  <button type="button" disabled={busy} onClick={close}>{saved?'Close':'Cancel edit'}</button>
 </form>;
}
