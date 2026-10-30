import React from 'react';
import PalaceIcon from './PalaceIcon';
import {Link} from 'react-router-dom';
import {buildLibraryOverview} from './libraryOverviewModel';
import './library-overview.css';

const libraryTab=tab=>'/library?tab='+encodeURIComponent(tab);
const librarySectionIcons={continue:'book-open',saved:'bookmark',comics:'panels',finished:'check',collections:'folder',lists:'file-text',following:'bell',writers:'users',notes:'scroll',history:'history'};
const shortcuts=[
 ['continue','Continue Reading','☾','Your saved reading positions'],
 ['saved','Saved Stories','☆','Your kept stories'],
 ['comics','Comics Shelf','▤','Illustrated worlds'],
 ['finished','Finished','✓','Stories and comics completed'],
 ['collections','Collections','✧','Your own curated shelves'],
 ['lists','Reading Lists','✎','Reading plans and recommendations'],
 ['following','Subscriptions','✦','Stories and comics you follow'],
 ['writers','Writers I Follow','♛','People behind the stories'],
 ['notes','Notes & Bookmarks','◇','Your private thoughts'],
 ['history','History','◷','Your reading and Palace moments']
];
function BookStrip({title,description,items,tab,empty,emptyHref,emptyAction}){
 return <section className="library-overview-section" aria-label={title}>
  <div className="library-overview-section-head"><div><h3>{title}</h3><p>{description}</p></div><Link to={libraryTab(tab)}>Open shelf →</Link></div>
  {items.length?<div className="library-overview-books">{items.map(item=><Link className="library-overview-book" key={item.key} to={item.href}>
   <span className="library-overview-cover">{item.cover?<img src={item.cover} alt="" loading="lazy" decoding="async"/>:<span aria-hidden="true"><PalaceIcon name={item.type==='comic'?"panels":"book-open"}/></span>}</span>
   <span className="library-overview-book-copy"><strong>{item.title}</strong><small>{item.subtitle}</small><b>{item.type==='comic'?'Open comic':'Open story'} →</b></span>
  </Link>)}</div>:<div className="library-overview-empty"><p>{empty}</p><Link to={emptyHref}>{emptyAction} →</Link></div>}
 </section>;
}
export default function LibraryOverview({library,organizers}){
 const view=buildLibraryOverview(library,organizers);
 const {counts}=view;
 const hasPreviewItems=view.continueReading.length>0||view.savedForLater.length>0;
 const heroAction=counts.reading>0?{url:libraryTab('continue'),label:'Continue reading'}:counts.finished>0?{url:libraryTab('finished'),label:'Revisit finished stories'}:{url:'/reading',label:'Find a story'};
 return <div className="library-overview" aria-label="My Library overview">
  <header className="library-overview-hero"><div>
   <p className="eyebrow">YOUR PRIVATE LIBRARY · AT A GLANCE</p>
   <h2>A home for every story you keep.</h2>
   <p>Return to your chapters, rediscover something you saved, and keep your collections close. Your reading activity is private to you.</p>
  </div><Link className="library-overview-hero-action" to={heroAction.url}>{heroAction.label} <span aria-hidden="true"><PalaceIcon name="arrow-up-right"/></span></Link></header>
  <nav className="library-overview-pulse" aria-label="Library at a glance">
   <Link to={libraryTab('continue')}><strong>{counts.reading}</strong><span>In progress</span></Link>
   <Link to={libraryTab('saved')}><strong>{counts.later}</strong><span>Saved for later</span></Link>
   <Link to={libraryTab('finished')}><strong>{counts.finished}</strong><span>Finished</span></Link>
   <Link to={libraryTab('following')}><strong>{counts.subscriptions}</strong><span>Subscriptions</span></Link>
  </nav>
  {hasPreviewItems?<div className="library-overview-feature-grid">
   <BookStrip title="Your place in the story" description="Unfinished stories and comics, most recently opened first."
    items={view.continueReading} tab="continue" empty="Your next reading journey begins here."
    emptyHref="/reading" emptyAction="Discover stories"/>
   <BookStrip title="Saved for another night" description="Saved works that have no recorded reading position yet."
    items={view.savedForLater} tab="saved" empty="No unread saved stories or comics are in this shelf yet."
    emptyHref="/reading" emptyAction="Browse Reading Rooms"/>
  </div>:<section className="library-overview-start" aria-label="Find your next reading journey">
    <div className="library-overview-start-mark" aria-hidden="true"><PalaceIcon name="book-open" size={38}/></div>
    <div className="library-overview-start-copy">
      <p className="eyebrow">YOUR NEXT CHAPTER</p><h3>A new world is only a page away.</h3>
      <p>You have no unfinished or unread saved works at the moment. Explore a story, or revisit something you already love.</p>
      <nav aria-label="Choose where to read next"><Link to="/reading">Discover stories →</Link>
        {counts.finished>0&&<Link to={libraryTab('finished')}>Finished works ({counts.finished}) →</Link>}
        {counts.subscriptions>0&&<Link to={libraryTab('following')}>Following ({counts.subscriptions}) →</Link>}
      </nav>
    </div>
  </section>}
  <section className={"library-overview-updates"+(view.updates.length?"":" is-quiet")} aria-label="Followed story updates">
   <div><p className="eyebrow">FROM WORLDS YOU FOLLOW</p><h3>New since your last reading <span>{counts.updates}</span></h3>
    <p>Published chapters and episodes checked against your recorded reading dates.</p></div>
   {view.updates.length?<ul>{view.updates.map(item=><li key={item.key}><Link to={item.href}><span aria-hidden="true"><PalaceIcon name="sparkles"/></span><strong>{item.title}</strong><small>{item.subtitle}</small><span aria-hidden="true">↗</span></Link></li>)}</ul>:<p className="library-overview-update-empty">Nothing new is confirmed against your recorded reading positions.</p>}
   <Link className="library-overview-updates-link" to={libraryTab('following')}>View subscriptions →</Link>
  </section>
  <section className="library-overview-discover" aria-label="Explore your Library shelves">
   <div className="library-overview-section-head"><div><h3>Every shelf has its place.</h3><p>Go straight to the part of your Library you need.</p></div></div>
   <nav className="library-overview-shortcuts" aria-label="My Library destinations">{shortcuts.map(([tab,label,symbol,hint])=><Link key={tab} to={libraryTab(tab)}><span className="library-overview-shortcut-icon" aria-hidden="true"><PalaceIcon name={librarySectionIcons[tab]||"library"}/></span><span><strong>{label}</strong><small>{hint}</small></span><span aria-hidden="true"><PalaceIcon name="arrow-up-right"/></span></Link>)}</nav>
  </section>
  {(view.collectionPreview.length>0||view.listPreview.length>0)&&<section className="library-overview-organizers" aria-label="Your named collections and reading lists">
   <h3>Made by you</h3>
   <p>Your existing shelves and lists, right where you left them.</p>
   <div>{view.collectionPreview.map(c=><Link to={libraryTab('collections')} key={'c'+c.id}><span aria-hidden="true"><PalaceIcon name="folder"/></span> {c.name}</Link>)}
    {view.listPreview.map(l=><Link to={libraryTab('lists')} key={'l'+l.id}><span aria-hidden="true"><PalaceIcon name="file-text"/></span> {l.name}</Link>)}</div>
  </section>}
 </div>;
}
