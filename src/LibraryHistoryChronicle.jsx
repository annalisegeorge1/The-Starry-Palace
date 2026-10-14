import React,{useEffect,useMemo,useState} from 'react';
import {Link} from 'react-router-dom';
import {getPalaceHistoryMoments,getPublishedWorks,getStoryHistoryMetadata} from './palaceData';
import {selectStoryHistory} from './storyHistoryModel';
import {buildLibraryHistoryEntries,filterLibraryHistory,groupLibraryHistory,LIBRARY_HISTORY_CATEGORIES} from './libraryHistoryChronicleModel';
import './library-history-chronicle.css';

const pageSize=18;
const niceDate=n=>n?new Date(n).toLocaleString(undefined,{month:'short',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit'}):'Date not recorded';

export default function LibraryHistoryChronicle({userId,library,historyChapters={}}){
 const[category,setCategory]=useState('all');
 const[query,setQuery]=useState('');
 const[period,setPeriod]=useState('any');
 const[sort,setSort]=useState('newest');
 const[limit,setLimit]=useState(pageSize);
 const[reload,setReload]=useState(0);
 const[shared,setShared]=useState({status:'loading',community:{},stories:[],chaptersReady:false,errors:[]});
 useEffect(()=>{
  if(!userId)return;
  let alive=true;
  setShared({status:'loading',community:{},stories:[],chaptersReady:false,errors:[]});
  Promise.allSettled([
   getPalaceHistoryMoments(userId),
   getPublishedWorks({limit:48})
  ]).then(async results=>{
   if(!alive)return;
   const community=results[0].status==='fulfilled'?results[0].value:{};
   const works=results[1].status==='fulfilled'?results[1].value:[];
   const errors=[];
   if(results[0].status==='rejected')errors.push('Community moments could not be loaded.');
   if(results[1].status==='rejected')errors.push('Published story updates could not be loaded.');
   let metadata={},chaptersReady=false;
   if(works.length)try{
    metadata=await getStoryHistoryMetadata(works.map(w=>w.id));
    chaptersReady=true;
   }catch{errors.push('Verified chapter totals are unavailable.')}
   if(!alive)return;
   setShared({
    status:errors.length?'partial':'ready',community,
    stories:selectStoryHistory(works,metadata,'all',''),
    chaptersReady,errors
   });
  }).catch(()=>{
   if(alive)setShared({status:'partial',community:{},stories:[],chaptersReady:false,errors:['Recent Palace activity is temporarily unavailable.']});
  });
  return()=>{alive=false};
 },[userId,reload]);
 const entries=useMemo(()=>buildLibraryHistoryEntries({
  progress:library?.progress||[],comicProgress:library?.comicProgress||[],
  historyChapters,stories:shared.stories,community:shared.community,
  chaptersReady:shared.chaptersReady
 }),[library,historyChapters,shared]);
 const visible=useMemo(()=>filterLibraryHistory(entries,{category,query,period,sort}),[entries,category,query,period,sort]);
 const groups=useMemo(()=>groupLibraryHistory(visible.slice(0,limit),sort),[visible,limit,sort]);
 const counts=useMemo(()=>({
  all:entries.length,
  reading:entries.filter(e=>e.category==='reading').length,
  updates:entries.filter(e=>e.category==='updates').length,
  community:entries.filter(e=>e.category==='community').length
 }),[entries]);
 useEffect(()=>setLimit(pageSize),[category,query,period,sort]);
 const hasFilter=category!=='all'||query.trim()||period!=='any';
 function clear(){setCategory('all');setQuery('');setPeriod('any');setSort('newest')}
 return <section className="library-chronicle" aria-label="My Library combined History">
  <header className="library-chronicle-hero">
   <div><p className="eyebrow">MY LIBRARY · HISTORY</p><h2>Your journey through the Palace.</h2><p>Follow your reading, recent story changes and the Palace moments that brought us together—all in one chronological archive.</p></div>
   <details className="library-chronicle-help"><summary title="About History" aria-label="How My Library History works">?</summary><div>
    <strong>About your History</strong><p><b>My reading</b> is private to your account. It shows saved reading positions, not a complete log of every page visit.</p>
    <p><b>Story updates and Palace activity</b> are shared published or community-visible moments. Showing them here never shares your personal reading records.</p>
    <p>Use the filters to find something you read or a recent update. Private chats and messages do not appear here.</p>
   </div></details>
  </header>
  <nav className="library-chronicle-shortcuts" aria-label="Other history shelves">
   <Link to="/library?tab=continue">☾ Continue reading ↗</Link>
   <Link to="/library?tab=saved">☆ Saved for later ↗</Link>
   <Link to="/palace-life?room=history">✦ Shared chronicle ↗</Link>
  </nav>
  <div className="library-chronicle-counts" aria-label="Your history at a glance">
   <span><b>{counts.reading}</b><small>your reading paths</small></span>
   <span><b>{counts.updates}</b><small>recent story updates</small></span>
   <span><b>{counts.community}</b><small>community moments</small></span>
   <span><b>{counts.all}</b><small>all records</small></span>
  </div>
  <nav className="library-chronicle-tabs" aria-label="History sections">
   {LIBRARY_HISTORY_CATEGORIES.map(([id,label])=><button key={id} type="button" aria-pressed={category===id} onClick={()=>setCategory(id)}>{label}<span>{counts[id]}</span></button>)}
  </nav>
  <div className="library-chronicle-tools" role="search" aria-label="Search and sort Library history">
   <label><span>Search history</span><input aria-label="Search combined Library history" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Stories, chapters, creators, conversations…"/></label>
   <label><span>When</span><select aria-label="Filter Library History by date" value={period} onChange={e=>setPeriod(e.target.value)}><option value="any">All dates</option><option value="week">Past week</option><option value="month">Past 30 days</option><option value="year">Past year</option></select></label>
   <label><span>Sort</span><select aria-label="Sort combined Library history" value={sort} onChange={e=>setSort(e.target.value)}><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="title">Title A–Z</option></select></label>
  </div>
  <div className="library-chronicle-results"><span role="status">{visible.length} of {entries.length} records{shared.status==='loading'?' · gathering recent Palace activity':''}</span>
   <div>{hasFilter&&<button type="button" onClick={clear}>Clear filters ×</button>}<button type="button" onClick={()=>setReload(n=>n+1)} disabled={shared.status==='loading'}>{shared.status==='loading'?'Loading…':'↻ Refresh updates'}</button></div>
  </div>
  {shared.status==='loading'&&<p className="library-chronicle-status" role="status">Your saved reading history is ready. Gathering recent published and community moments…</p>}
  {shared.errors.length>0&&<p className="library-chronicle-status" role="alert">{shared.errors.join(' ')} Your private reading history remains available. <button type="button" onClick={()=>setReload(n=>n+1)}>Try again</button></p>}
  {groups.length?<div className="library-chronicle-groups">{groups.map(group=><section key={group.key} className="library-chronicle-date">
   <header><h3>{group.label}</h3><small>{group.items.length} shown</small></header>
   <div className="library-chronicle-list">{group.items.map(item=><article key={item.id} className={'library-chronicle-item is-'+item.category}>
    <div className="library-chronicle-cover">{item.cover?<img src={item.cover} alt="" loading="lazy" decoding="async"/>:<span aria-hidden="true">{item.kind==='comic'?'▤':item.category==='reading'?'☾':item.category==='updates'?'✦':item.kind==='forum'?'✎':'♛'}</span>}</div>
    <div className="library-chronicle-copy">
     <div className="library-chronicle-eyebrow"><span className={'library-chronicle-privacy '+(item.private?'is-private':'is-shared')}>{item.private?'◈ PRIVATE · YOUR HISTORY':'✦ PALACE MOMENT'}</span><span>{item.label}</span></div>
     <h4><Link to={item.href||('/palace-life?room='+encodeURIComponent(item.room||'history'))}>{item.title}</Link></h4>
     {item.byline&&<small className="library-chronicle-byline">by {item.byline}</small>}
     {item.summary&&<p className="library-chronicle-summary">{item.summary}</p>}
     {item.private&&item.kind==='reading'&&<div className="library-chronicle-reading">
      <span>{item.completed?'Completed':item.newer?'New story update available':item.progress+'% of story · saved position'}</span>
      {!item.newer&&<div className="library-chronicle-progress" role="progressbar" aria-label={'Saved reading progress for '+item.title} aria-valuemin={0} aria-valuemax={100} aria-valuenow={item.progress}><i style={{width:item.progress+'%'}}/></div>}
     </div>}
     {item.private&&item.kind==='reading'&&item.newer&&item.resumeHref&&item.href!==item.resumeHref&&<Link className="library-chronicle-update-link" to={item.href}>See latest story updates ↗</Link>}
     {(item.chapterCount!==null||item.wordCount!==null||item.chapterTitle)&&<div className="library-chronicle-stats">
      {item.chapterTitle&&<span>Latest: {item.chapterTitle}</span>}
      {item.chapterCount!==null&&<span>{item.chapterCount} chapters</span>}
      {item.wordCount!==null&&<span>{item.wordCount.toLocaleString()} words</span>}
     </div>}
     {item.private&&item.kind==='reading'&&item.lastPublishedAt&&<time className="library-chronicle-publication" dateTime={new Date(item.lastPublishedAt).toISOString()}>Last story publication: {niceDate(item.lastPublishedAt)}</time>}
     <time dateTime={item.at?new Date(item.at).toISOString():undefined}>{item.private?'Saved reading activity: ':'Recorded: '}{niceDate(item.at)}</time>
    </div>
    <div className="library-chronicle-action"><Link to={item.newer&&item.resumeHref?item.resumeHref:item.href||('/palace-life?room='+encodeURIComponent(item.room||'history'))}>{item.category==='reading'?(item.newer?(item.resumeHref?'Resume saved chapter ↗':item.kind==='comic'?'See new episode ↗':'See story update ↗'):item.completed?'Read again ↗':'Resume ↗'):item.category==='updates'?'Read story ↗':'View room ↗'}</Link></div>
   </article>)}</div>
  </section>)}</div>:
  <div className="library-chronicle-empty"><span aria-hidden="true">☾</span><h3>{hasFilter?'Nothing matches these filters.':'Your story is still unfolding.'}</h3><p>{hasFilter?'Try a different search, date or activity type.':shared.status==='loading'?'More shared moments are being gathered.':'Read a story or visit the Palace to build your history.'}</p>{hasFilter&&<button type="button" onClick={clear}>See all history</button>}</div>}
  {visible.length>limit&&<div className="library-chronicle-more"><button type="button" onClick={()=>setLimit(n=>n+pageSize)}>Show more history · {visible.length-limit} remaining ↓</button></div>}
  <p className="library-chronicle-note">Your personal reading entries are only visible inside your account. Published updates and community entries show a recent selection; older shared moments remain accessible from Palace Life.</p>
 </section>;
}
