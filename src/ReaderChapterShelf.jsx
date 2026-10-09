import React,{useMemo,useState} from 'react';
import {Link} from 'react-router-dom';
import {initialReaderChapterPage,matchReaderChapters,readerChapterPage,READER_CHAPTER_PAGE_SIZE} from './readerChapterShelfModel';
import './reader-chapter-shelf.css';

/** Calm, searchable chapter shelf after the text. Pages only the chapters already allowed by the reader. */
export default function ReaderChapterShelf({chapters=[],chapterId,workSlug}){
 const [open,setOpen]=useState(()=>chapters.length<=12);
 const [query,setQuery]=useState('');
 const [page,setPage]=useState(()=>initialReaderChapterPage(chapters,chapterId));
 const matches=useMemo(()=>matchReaderChapters(chapters,query),[chapters,query]);
 const shelf=useMemo(()=>readerChapterPage(matches,page,READER_CHAPTER_PAGE_SIZE),[matches,page]);
 const currentIndex=chapters.findIndex(ch=>ch.id===chapterId);
 const readableTotal=chapters.length;
 return <section id="palace-reader-chapters" className="reader-chapter-shelf" aria-label="Browse this story's chapters">
  <details open={open} onToggle={event=>setOpen(event.currentTarget.open)}>
   <summary><span className="reader-chapter-shelf-icon" aria-hidden="true">▤</span><span className="reader-chapter-shelf-heading"><small>THIS WORK · CHAPTERS</small><strong>Find another place in this story</strong><em>{readableTotal} readable {readableTotal===1?'chapter':'chapters'} · Your place: {Math.max(1,currentIndex+1)} of {readableTotal}</em></span><span className="reader-chapter-shelf-open" aria-hidden="true">{open?'Close −':'Explore +'}</span></summary>
   <div className="reader-chapter-shelf-body">
    <label className="reader-chapter-shelf-search"><span>Find a chapter by title or number</span><input type="search" aria-label="Search chapters in this story" value={query} placeholder="Try Chapter 12 or a chapter title…" onChange={event=>{setQuery(event.target.value);setPage(0)}}/></label>
    <div className="reader-chapter-shelf-results" role="status" aria-live="polite">{matches.length?'Showing '+shelf.start+'–'+shelf.end+' of '+matches.length+' chapters':'No chapters match this search.'}</div>
    {shelf.items.length>0?<nav className="reader-chapter-shelf-grid" aria-label="Chapter links">
     {shelf.items.map(ch=><Link to={'/work/'+workSlug+'/chapter/'+ch.id} key={ch.id} className={ch.id===chapterId?'active':''} aria-current={ch.id===chapterId?'page':undefined}>
      <span className="reader-chapter-shelf-number">{String(ch.position).padStart(2,'0')}</span>
      <span className="reader-chapter-shelf-title"><strong>{ch.title||'Untitled chapter'}</strong><small>{ch.status==='published'?'Published':'Draft · visible to you'} · {Math.max(0,Number(ch.word_count)||0).toLocaleString()} words</small></span>
      <span className="reader-chapter-shelf-arrow" aria-hidden="true">{ch.id===chapterId?'Reading ✓':'→'}</span>
     </Link>)}
    </nav>:<div className="reader-chapter-shelf-empty"><p>Try a different chapter title or number.</p><button type="button" onClick={()=>{setQuery('');setPage(initialReaderChapterPage(chapters,chapterId))}}>Show all chapters</button></div>}
    {shelf.pages>1&&<nav className="reader-chapter-shelf-pages" aria-label="Chapter shelf pages">
     <button type="button" disabled={shelf.page===0} onClick={()=>setPage(p=>Math.max(0,p-1))}>← Previous</button>
     <span>Page {shelf.page+1} of {shelf.pages}</span>
     <button type="button" disabled={shelf.page>=shelf.pages-1} onClick={()=>setPage(p=>Math.min(shelf.pages-1,p+1))}>Next →</button>
    </nav>}
   </div>
  </details>
 </section>;
}
