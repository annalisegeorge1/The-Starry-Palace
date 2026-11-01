import React from 'react';
import {Link} from 'react-router-dom';
import {directClassicHref} from './directClassicModel';
import {isHistoricalFanfiction,MODERN_FANFICTION_LINKS} from './palaceFanfictionDiscovery';
import './palace-fanfiction-shelf.css';

/*
 * Provenance-first Fandom shelf. Historical public-domain fanfiction is
 * readable on the Palace. Modern links open the writer's own edition.
 * No copy of modern fanfiction or its cover art is hosted here.
 */
export default function PalaceFanfictionShelf({archiveWorks=[]}){
 const historic=archiveWorks.filter(work=>work.is_archive&&isHistoricalFanfiction(work));
 return <section className="palace-fanfiction-shelf" aria-labelledby="palace-fanfiction-shelf-title">
  <header className="palace-fanfiction-shelf-head">
   <p className="eyebrow">FANFICTION · FROM EARLY FANWORKS TO LIVING WRITERS</p>
   <h2 id="palace-fanfiction-shelf-title">Follow the stories behind the stories.</h2>
   <p>Historical fanfiction lives in the Palace's verified public-domain library. Modern recommendations take you to the writers' own pages, with their names and reuse statements kept visible.</p>
  </header>
  {historic.length>0&&<div className="palace-fanfiction-group">
   <h3>Read here · historical fanfiction</h3>
   <div className="palace-fanfiction-grid">
    {historic.map(work=><Link key={work.id} className="palace-fanfiction-entry" to={directClassicHref(work)}>
     <small>PUBLIC DOMAIN · HOSTED ON THE PALACE</small>
     <strong>{work.title}</strong>
     <span>by {work.creator_name||work.profiles?.display_name||'Historical author'}</span>
     <p>{work.summary}</p>
     <b>Open the complete work →</b>
    </Link>)}
   </div>
  </div>}
  <div className="palace-fanfiction-group">
   <h3>Modern fanfiction · read at the author's source</h3>
   <p className="palace-fanfiction-license-note">These are curated recommendations, not reposted stories. Authors have published reuse terms for their own writing; those terms do not independently clear rights in the franchises. Check each original page for its content notes.</p>
   <div className="palace-fanfiction-grid">
    {MODERN_FANFICTION_LINKS.map(work=><article className="palace-fanfiction-entry" key={work.id}>
     <small>{work.fandom} · {work.published}</small>
     <strong>{work.title}</strong>
     <span>by {work.creator}</span>
     <p>{work.description}</p>
     <p className="palace-fanfiction-content-note">{work.contentNote}</p>
     <div className="palace-fanfiction-links">
      <a href={work.sourceUrl} target="_blank" rel="noopener noreferrer">Read on author's site ↗</a>
      <a href={work.permissionUrl} target="_blank" rel="noopener noreferrer" className="palace-fanfiction-terms">Reuse terms ↗</a>
     </div>
    </article>)}
   </div>
  </div>
 </section>;
}
