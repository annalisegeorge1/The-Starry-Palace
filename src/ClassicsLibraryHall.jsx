import React,{useRef,useState} from 'react';
import {Link,useNavigate} from 'react-router-dom';
import ClassicBookCover from './ClassicBookCover';
import PalaceInfoMark from './PalaceInfoMark';
import {CLASSIC_LIBRARY_COLLECTIONS,filterClassicShelf,pageClassicShelf} from './classicShelfBrowsing';
import './palace-classics-library.css';

/** Accessible and self-contained library wing. The full archive remains separate. */
export default function ClassicsLibraryHall({works=[],storyHref}){
 const navigate=useNavigate();
 const [lens,setLens]=useState('famous');
 const [query,setQuery]=useState('');
 const [order,setOrder]=useState('author');
 const [requestedPage,setPage]=useState(0);
 const listRef=useRef(null);
 const collection=CLASSIC_LIBRARY_COLLECTIONS.find(x=>x.id===lens)||CLASSIC_LIBRARY_COLLECTIONS[0];
 const matching=filterClassicShelf(works,collection,query,order);
 const shelf=pageClassicShelf(matching,requestedPage);
 const openPath=work=>storyHref?.(work)||('/lost-works?open='+encodeURIComponent(work.slug));
 const movePage=next=>{
  setPage(next);
  if(typeof window!=='undefined')window.requestAnimationFrame?.(()=>{
   listRef.current?.scrollIntoView?.({behavior:'auto',block:'start'});
  });
 };
 const reset=()=>{setLens('all');setQuery('');setOrder('author');setPage(0)};
 const editionLabel=work=>{
  const tags=(work.work_tags||[]).map(x=>x?.tags).filter(Boolean);
  return tags.some(t=>String(t.name||'').toLowerCase()==='original language classic')
   ?'Original Chinese'
   :work.language==='Chinese'?'English translation / adaptation':'Palace Classic';
 };
 if(!works?.length)return null;
 return <section className="reading-classics-hall palace-classics-library" aria-label="Palace Classics Hall">
  <header className="palace-classics-intro">
   <div>
    <p className="eyebrow">THE CLASSICS · A LIBRARY OF OLDER WORLDS</p>
    <h2>A library wing with older doors.</h2>
    <p>Choose an author, find an old favourite, or open a book whose story has been waiting for you.</p>
   </div>
   <div className="palace-classics-head-actions">
    <PalaceInfoMark title="About these Classic editions">
     <p>These are attributed historical works kept separate from member publications. Where possible, cover artwork comes from a cited Project Gutenberg edition—not necessarily the first printing.</p>
     <p>Some volumes and short stories only have a decorative title-and-author jacket. The rating “Not rated” means no separate content classification is recorded, not that the book is suitable for every age.</p>
    </PalaceInfoMark>
    <button type="button" className="quiet-button" disabled={!matching.length} onClick={()=>{
     const pick=matching[Math.floor(Math.random()*matching.length)];
     if(pick)navigate(openPath(pick));
    }}>✧ Wander a classic</button>
    <Link to="/lost-works">Open full archive →</Link>
   </div>
  </header>
  <nav className="classic-hall-lenses" aria-label="Browse Palace Classics shelves">
   {CLASSIC_LIBRARY_COLLECTIONS.map(item=><button key={item.id} type="button"
    className={lens===item.id?'active':''} aria-pressed={lens===item.id}
    onClick={()=>{setLens(item.id);setPage(0)}}>
    <span aria-hidden="true">{item.glyph}</span><strong>{item.label}</strong>
   </button>)}
  </nav>
  <div className="palace-classics-controls">
   <label className="palace-classics-search"><span>Find a classic</span>
    <input type="search" aria-label="Find Classics by book or author"
     value={query} onChange={e=>{setQuery(e.target.value);setPage(0)}}
     placeholder="Book title, author, or theme…" maxLength={130}/>
   </label>
   <label className="palace-classics-sort"><span>Arrange by</span>
    <select aria-label="Sort Classics" value={order} onChange={e=>{setOrder(e.target.value);setPage(0)}}>
     <option value="author">Author A–Z</option><option value="title">Book title A–Z</option>
    </select>
   </label>
   <div className="palace-classics-count" role="status" aria-live="polite">
    <strong>{matching.length}</strong> book{matching.length===1?'':'s'} in {collection.label}
   </div>
  </div>
  {matching.length>0?<>
   <div ref={listRef} className="classic-hall-rail palace-classics-bookcase">
    {shelf.items.map(work=><Link className="classic-hall-card" key={work.id||work.slug}
     to={openPath(work)}>
     <ClassicBookCover record={work} className="classic-hall-cover" showRating/>
     <div className="classic-hall-card-copy">
      <small>{work.profiles?.display_name||work.creator_name||'Historical author'} · {editionLabel(work)}</small>
      <h3>{work.title}</h3>
      <p>{work.summary||'A public-domain work gathered in the Palace Classics archive.'}</p>
      <b>Open this book <span aria-hidden="true">→</span></b>
     </div>
    </Link>)}
   </div>
   <footer className="palace-classics-footer">
    <span aria-live="polite">Showing {shelf.first}–{shelf.last} of {shelf.total} · Shelf {shelf.page+1} of {shelf.pages}</span>
    <nav aria-label="Classic books pages">
     <button type="button" aria-label="Previous classics page" disabled={!shelf.hasPrevious}
      onClick={()=>movePage(shelf.page-1)}>← Previous</button>
     <button type="button" aria-label="Next classics page" disabled={!shelf.hasNext}
      onClick={()=>movePage(shelf.page+1)}>Next books →</button>
    </nav>
   </footer>
  </>:<div className="palace-classics-empty" role="status">
   <span aria-hidden="true">⌁</span>
   <div><strong>No books match that shelf.</strong><p>Try another author, clear the search, or explore all Palace Classics.</p></div>
   <button type="button" onClick={reset}>Explore all Classics →</button>
  </div>}
  {lens!=='all'&&<button type="button" className="palace-classics-reset" onClick={reset}>Browse the complete Classics shelf →</button>}
 </section>;
}
