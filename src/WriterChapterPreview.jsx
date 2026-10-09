import React from 'react';
import './writer-chapter-preview.css';

/** Read-only local rendering of the editor, never a publication or cloud write. */
export default function WriterChapterPreview({preview}){
 if(!preview)return null;
 const title=String(preview.title||'').trim()||'Untitled chapter';
 const words=Math.max(0,Number(preview.wordCount)||0);
 return <section className="writer-private-preview" aria-label="Private chapter reading preview">
  <header className="writer-private-preview-cover">
   <small>✦ THE STARRY PALACE · WRITER'S VIEW</small>
   <p className="writer-private-preview-status">Private preview · not published</p>
   <h3>{title}</h3>
   <p className="writer-private-preview-work">{preview.workTitle||'Untitled work'} · {words.toLocaleString()} {words===1?'word':'words'}</p>
  </header>
  <div className="writer-private-preview-prose" aria-label="Chapter content" dangerouslySetInnerHTML={{__html:preview.html||'<p>No chapter text yet.</p>'}}/>
  <footer>Only you can see this preview. It shows the text currently in the editor, including changes that may not have finished saving to the Palace. This preview does not publish or save your chapter.</footer>
 </section>;
}
