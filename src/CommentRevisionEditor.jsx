import React, {useState} from 'react';
import {saveCommentRevision} from './palaceData';

export default function CommentRevisionEditor({comment, close, reload}) {
 const [body,setBody]=useState(comment.body);
 const [spoiler,setSpoiler]=useState(comment.spoiler);
 const [error,setError]=useState('');
 const [busy,setBusy]=useState(false);
 async function submit(event) {
  event.preventDefault();
  if(busy)return;
  setBusy(true);
  try {
   await saveCommentRevision(comment,body,spoiler);
  } catch(e) {
   setError(e.message || 'Could not save changes.');
   setBusy(false);
   return;
  }
  close();
  try {await reload()} catch { /* The caller reports refresh failures independently. */ }
 }
 return <form onSubmit={submit}>
  <label>Edit your comment<textarea required value={body} disabled={busy} onChange={e=>setBody(e.target.value)}/></label>
  <label><input type="checkbox" checked={spoiler} disabled={busy} onChange={e=>setSpoiler(e.target.checked)}/> Contains spoilers</label>
  <p>Saving sends your changes back to the writer for review.</p>
  {error&&<p role="alert">{error}</p>}
  <button type="submit" disabled={busy||!body.trim()||(body.trim()===comment.body&&spoiler===comment.spoiler)}>Save for review</button>
  <button type="button" disabled={busy} onClick={close}>Cancel edit</button>
 </form>;
}
