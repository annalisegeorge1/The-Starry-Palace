import React,{useEffect,useMemo,useState} from 'react';
import {Link} from 'react-router-dom';
import {buildPalaceChronicle,filterPalaceChronicle,groupPalaceChronicle,PALACE_CHRONICLE_TYPES} from './palaceHistoryArchiveModel';
import './palace-history-archive.css';

const formatDate=value=>value?new Date(value).toLocaleString(undefined,{
 month:'short',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit'
}):'Date not recorded';
const pageSize=18;
export default function PalaceHistoryArchive({life,stories=[],loadState='idle',onRefresh,onVisitRoom}){
 const[kind,setKind]=useState('all');
 const[query,setQuery]=useState('');
 const[period,setPeriod]=useState('any');
 const[sort,setSort]=useState('newest');
 const[limit,setLimit]=useState(pageSize);
 const chaptersReady=loadState==='ready';
 const archive=useMemo(()=>buildPalaceChronicle({
  threads:life?.threads, introductions:life?.communityIntroductions,
  highlights:life?.highlights,stories:loadState==='ready'||loadState==='partial'?stories:[],
  chaptersReady
 }),[life,stories,loadState,chaptersReady]);
 const visible=useMemo(()=>filterPalaceChronicle(archive,{kind,query,period,sort}),[archive,kind,query,period,sort]);
 const groups=useMemo(()=>sort==='title'?[{key:'alphabetic',label:'A–Z',items:visible.slice(0,limit)}].filter(g=>g.items.length):groupPalaceChronicle(visible.slice(0,limit)),[visible,limit,sort]);
 const counts=useMemo(()=>Object.fromEntries(PALACE_CHRONICLE_TYPES.map(([type])=>[
  type,type==='all'?archive.length:archive.filter(e=>e.kind===type).length
 ])),[archive]);
 useEffect(()=>setLimit(pageSize),[kind,query,period,sort]);
 const filtered=!!(query.trim()||kind!=='all'||period!=='any');
 const loading=loadState==='loading'||loadState==='idle';
 return <section className="life-room palace-life-history palace-chronicle" aria-label="History of Palace Life">
  <header className="life-room-intro palace-chronicle-intro">
   <div><p className="eyebrow">PALACE LIFE · THE SHARED CHRONICLE</p>
    <h2>History · The days we gathered.</h2>
    <p>Stories, conversations and milestones, recorded in the order they happened. Return to what changed, without losing your place.</p>
   </div>
   <details className="palace-chronicle-info"><summary title="About Palace history" aria-label="How Palace history works">?</summary>
    <div><strong>How this history works</strong><p>This chronicle brings together published story updates and community activity visible to you. Use the tabs, search and date filters to narrow the list.</p><p>Your own reading progress and visited stories are private in <b>My Library → History</b>. Private letters and chat are not recorded here.</p></div>
   </details>
  </header>
  <nav className="palace-chronicle-doors" aria-label="Your reading history and Palace archives">
   <Link to="/library?tab=history"><span aria-hidden="true">☾</span> My reading history ↗</Link>
   <Link to="/library?tab=continue"><span aria-hidden="true">▤</span> Continue reading ↗</Link>
   <Link to="/events?tab=heritage">Cultural histories ↗</Link>
   <Link to="/lost-works">Literary archive ↗</Link>
  </nav>
  <section className="palace-chronicle-summary" aria-label="Recorded Palace history counts">
   <span><strong>{counts.all}</strong><small>recorded moments</small></span>
   <span><strong>{counts.stories}</strong><small>published stories</small></span>
   <span><strong>{counts.forum}</strong><small>conversations</small></span>
   <span><strong>{counts.stars+counts.highlights}</strong><small>introductions & honours</small></span>
  </section>
  <nav className="palace-chronicle-tabs" aria-label="Filter history by type">
   {PALACE_CHRONICLE_TYPES.map(([key,label])=><button type="button" key={key} aria-pressed={kind===key} onClick={()=>setKind(key)}>{label}<small>{counts[key]}</small></button>)}
  </nav>
  <div className="palace-chronicle-toolbar" role="search" aria-label="Search and sort Palace history">
   <label className="palace-chronicle-query"><span>Search history</span><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Story, author, chapter, discussion…" aria-label="Search Palace Life history"/></label>
   <label><span>Date</span><select aria-label="History time range" value={period} onChange={e=>setPeriod(e.target.value)}><option value="any">Any time</option><option value="week">Past 7 days</option><option value="month">Past 30 days</option><option value="year">Past year</option></select></label>
   <label><span>Order</span><select aria-label="Sort Palace Life history" value={sort} onChange={e=>setSort(e.target.value)}><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="title">Title A–Z</option></select></label>
  </div>
  <div className="palace-chronicle-results"><span role="status" aria-live="polite">{visible.length} of {archive.length} recorded moments{loading?' · gathering story updates':''}</span>
   {filtered&&<button type="button" onClick={()=>{setQuery('');setKind('all');setPeriod('any')}}>Clear filters ×</button>}
  </div>
  {loading&&<p className="palace-chronicle-state" role="status">Gathering published story and chapter updates. Community moments are available below.</p>}
  {loadState==='error'&&<p className="palace-chronicle-state" role="alert">Story updates could not be loaded. Other recorded activity is still available. <button type="button" onClick={onRefresh}>Retry story updates</button></p>}
  {loadState==='partial'&&<p className="palace-chronicle-state" role="status">Story titles are available, but verified chapter and word totals could not be loaded. <button type="button" onClick={onRefresh}>Retry chapter details</button></p>}
  {loadState==='ready'&&<div className="palace-chronicle-refresh"><button type="button" onClick={onRefresh}>↻ Refresh story updates</button></div>}
  {groups.length?<div className="palace-chronicle-sections">{groups.map(group=><section key={group.key} className="palace-chronicle-month">
    <header><h3>{group.label}</h3><span>{group.items.length} shown</span></header>
    <div className="palace-chronicle-list">{group.items.map(item=><article className={'palace-chronicle-record is-'+item.kind} key={item.id}>
     <div className="palace-chronicle-marker" aria-hidden="true">{item.kind==='stories'?'▤':item.kind==='forum'?'✎':item.kind==='stars'?'✦':'♛'}</div>
     <div className="palace-chronicle-record-body">
      <div className="palace-chronicle-meta"><span className="palace-chronicle-label">{item.kind==='stories'?'STORY · ':item.kind==='forum'?'COMMONS · ':item.kind==='stars'?'INTRODUCTION · ':'RECOGNITION · '}{item.label}</span><time dateTime={item.at?new Date(item.at).toISOString():undefined}>{formatDate(item.at)}</time></div>
      <h4>{item.href?<Link to={item.href}>{item.title}</Link>:item.title}</h4>
      {item.byline&&<p className="palace-chronicle-byline">{item.kind==='stories'?'by ':'Featuring '}{item.byline}</p>}
      {item.summary&&<p className="palace-chronicle-excerpt">{item.summary}</p>}
      {item.kind==='stories'&&<div className="palace-chronicle-story-stats">
       {item.chapterTitle&&<span>Latest: {item.chapterTitle}</span>}
       <span>{item.chapterCount!==null?item.chapterCount+' '+(item.chapterCount===1?'chapter':'chapters'):'Chapters not verified'}</span>
       <span>{item.wordCount!==null?item.wordCount.toLocaleString()+' words':'Words not verified'}</span>
      </div>}
     </div>
     <div className="palace-chronicle-record-actions">{item.href?<Link to={item.href}>Read story <span aria-hidden="true">↗</span></Link>:<button type="button" onClick={()=>onVisitRoom(item.room)}>View room <span aria-hidden="true">↗</span></button>}</div>
    </article>)}</div>
   </section>)}</div>:
   <div className="palace-chronicle-empty"><span aria-hidden="true">☾</span><h3>{filtered?'No moments match your filters.':loading?'The chronicle is still gathering.':'No recorded moments yet.'}</h3>
    <p>{filtered?'Try another search or a wider date range.':'Published stories and shared Palace moments will appear here as they are recorded.'}</p>
    {filtered&&<button type="button" onClick={()=>{setQuery('');setKind('all');setPeriod('any')}}>Show all moments</button>}
   </div>}
  {visible.length>limit&&<div className="palace-chronicle-more"><button type="button" onClick={()=>setLimit(n=>n+pageSize)}>Show more moments · {visible.length-limit} remaining ↓</button></div>}
 </section>;
}
