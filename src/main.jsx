import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Link, NavLink, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, ProtectedRoute, useAuth } from './auth';
import { configured, supabase } from './supabase';
import './style.css';
import './polish.css';
import './palace-next.css';
import {
 ChamberLive,OnboardingLive,ReadingLive,ClubLive,WritingLive,SettingsLive,ActivityLive,LibraryLive,
 PalaceLifeLive,LettersLive,EventsLive,TreasuryLive,LostWorksLive,MemberProfileLive,SearchLive,
 WorkLive,ChapterLive,WorkStudioLive,TagSearchLive,HonourLive,CouncilLive,CodeLive,ComicsLive,
 ComicLive,ComicEpisodeLive,ComicStudioLive,SeriesLive
} from './liveRooms';


const chunkErrorPattern=/dynamically imported module|importing a module script failed|failed to fetch|chunkloaderror|loading chunk|room load timeout|networkerror/i;
const ROOM_IMPORT_TIMEOUT_MS=12000;
function safeSessionGet(key){try{return window.sessionStorage?.getItem(key)??null}catch{return null}}
function safeSessionSet(key,value){try{window.sessionStorage?.setItem(key,String(value));return true}catch{return false}}
function safeLocalGet(key){try{return window.localStorage?.getItem(key)??null}catch{return null}}
function safeLocalSet(key,value){try{window.localStorage?.setItem(key,String(value));return true}catch{return false}}
function schedulePalaceReload(key,delay=40){
 if(typeof window==='undefined')return false;
 const last=Number(safeSessionGet(key)||0);
 if(Date.now()-last<=15000)return false;
 safeSessionSet(key,Date.now());
 window.setTimeout(()=>window.location.reload(),delay);
 return true;
}
function reloadForStaleChunk(error){
 const message=String(error?.message||error||'');
 if(typeof window==='undefined'||!chunkErrorPattern.test(message))throw error;
 const refreshing=schedulePalaceReload('palace-chunk-auto-reload',40);
 throw new Error(refreshing?'Palace room refresh requested after a stale bundle: '+message:message);
}
function importWithRecovery(importer){
 let timer;
 const timeout=new Promise((_,reject)=>{timer=window.setTimeout(()=>reject(new Error('Palace room load timeout')),ROOM_IMPORT_TIMEOUT_MS)});
 return Promise.race([Promise.resolve().then(importer),timeout]).finally(()=>window.clearTimeout(timer)).catch(reloadForStaleChunk);
}

if(typeof window!=='undefined'){
 window.addEventListener('vite:preloadError',event=>{
  event.preventDefault();
  schedulePalaceReload('palace-preload-reload',40);
 });
 window.addEventListener('unhandledrejection',event=>{
  const message=String(event.reason?.message||event.reason||'');
  if(!chunkErrorPattern.test(message))return;
  event.preventDefault();
  schedulePalaceReload('palace-rejected-chunk-reload',60);
 });
 window.addEventListener('error',event=>{
  const message=String(event?.message||event?.error?.message||'');
  if(!chunkErrorPattern.test(message))return;
  schedulePalaceReload('palace-script-error-reload',60);
 });
}

function loadedPalaceAssetPath(){
 if(typeof document==='undefined')return'';
 const script=[...document.querySelectorAll('script[type="module"][src]')].find(node=>/\/assets\/index-[^/]+\.js(?:\?|$)/.test(node.getAttribute('src')||node.src||''));
 return script?.getAttribute('src')||script?.src||''
}
async function newestPalaceAssetPath(){
 try{
  const response=await fetch('/index.html?palace-fresh='+Date.now(),{cache:'no-store',headers:{'Cache-Control':'no-cache'}});
  if(!response.ok)return'';
  const html=await response.text();
  const match=html.match(/<script[^>]+src=["']([^"']*\/assets\/index-[^"']+\.js)["'][^>]*>/i);
  return match?.[1]||''
 }catch{return''}
}
function PalaceBuildFreshnessWatch(){
 const location=useLocation();
 React.useEffect(()=>{
  let alive=true;
  const check=async()=>{
   if(document.visibilityState==='hidden')return;
   const focused=document.activeElement;
   if(focused&&(focused.isContentEditable||/^(INPUT|TEXTAREA|SELECT)$/.test(focused.tagName)))return;
   const last=Number(safeSessionGet('palace-build-last-check')||0);
   if(Date.now()-last<20000)return;
   safeSessionSet('palace-build-last-check',Date.now());
   const current=loadedPalaceAssetPath();const newest=await newestPalaceAssetPath();
   if(!alive||!current||!newest)return;
   const currentPath=new URL(current,window.location.origin).pathname;
   const newestPath=new URL(newest,window.location.origin).pathname;
   if(currentPath!==newestPath)schedulePalaceReload('palace-new-build-reload',80);
  };
  const routeTimer=window.setTimeout(check,900);
  const onVisible=()=>{if(document.visibilityState==='visible')window.setTimeout(check,250)};
  const interval=window.setInterval(check,180000);
  document.addEventListener('visibilitychange',onVisible);
  window.addEventListener('pageshow',onVisible);
  return()=>{alive=false;window.clearTimeout(routeTimer);window.clearInterval(interval);document.removeEventListener('visibilitychange',onVisible);window.removeEventListener('pageshow',onVisible)}
 },[location.pathname,location.search]);
 return null
}

const TreasuryCatalogueLazy=React.lazy(()=>importWithRecovery(()=>import('./Treasury')));
// Core Palace rooms are imported eagerly for navigation reliability.

const rooms=[
  ['Reading Rooms','/reading','Read, discover and return to the stories waiting for you.'],
  ['Comics Gallery','/comics','Sequential art with creator-controlled rights, accessibility and reading direction.'],
  ['Writing Chamber','/writing','Draft, publish and tend the worlds you are creating.'],
  ['Palace Life','/palace-life','Clubs, Commons, Moonlight Chat and kindred stars.'],
  ['Events & Heritage','/events','Creative gatherings and carefully sourced heritage observances.'],
  ['Royal Treasury','/treasury','Achievements, gifts, court honours and your collection.'],
  ['Lost Works','/lost-works','A rights-conscious preservation archive for works at risk of being lost.']
];

function PalaceRoomIcon({name}) {
 const common={viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:'1.7',strokeLinecap:'round',strokeLinejoin:'round','aria-hidden':'true'};
 const spark=<><path d="M18.5 3.5v4M16.5 5.5h4"/><path d="M20 14v3M18.5 15.5h3"/></>;
 if(name==='palace')return <svg {...common}><path d="M15.8 3.4a8.8 8.8 0 1 0 4.8 13.8A7.2 7.2 0 0 1 15.8 3.4Z"/>{spark}</svg>;
 if(name==='reading')return <svg {...common}><path d="M3.5 5.5c3.1-.8 5.5-.2 8.5 1.7v11.3c-3-1.9-5.4-2.5-8.5-1.7Z"/><path d="M20.5 5.5c-3.1-.8-5.5-.2-8.5 1.7v11.3c3-1.9 5.4-2.5 8.5-1.7Z"/><path d="m17.5 9 .5 1.1 1.2.5-1.2.5-.5 1.1-.5-1.1-1.2-.5 1.2-.5Z"/></svg>;
 if(name==='library')return <svg {...common}><path d="M5 4.5h4v14H5zM10.5 6h4v12.5h-4zM16 3.8l3.3.7-2.7 14-3.3-.7Z"/><path d="M3.5 20h17"/></svg>;
 if(name==='writing')return <svg {...common}><path d="M19.5 3.5C13 4.2 8.4 7.7 6.8 13.8l3.4 3.4c6.1-1.6 9.6-6.2 10.3-12.7Z"/><path d="m6.8 13.8-3.3 6.7 6.7-3.3M11.2 12.8l3-3"/></svg>;
 if(name==='life')return <svg {...common}><circle cx="5" cy="8" r="1.5"/><circle cx="12" cy="4.5" r="1.5"/><circle cx="19" cy="8" r="1.5"/><circle cx="8" cy="16.5" r="1.5"/><circle cx="16" cy="16.5" r="1.5"/><path d="m6.3 7.2 4.3-2M13.4 5.2l4.3 2M6 9.3l1.4 5.8M18 9.3l-1.4 5.8M9.5 16.5h5"/></svg>;
 if(name==='events')return <svg {...common}><rect x="3.5" y="5.5" width="17" height="15" rx="2"/><path d="M7 3.5v4M17 3.5v4M3.5 9.5h17"/><path d="m12 12.2.65 1.4 1.55.65-1.55.65L12 16.3l-.65-1.4-1.55-.65 1.55-.65Z"/></svg>;
 if(name==='treasury')return <svg {...common}><path d="m4 8 4.2 3 3.8-6 3.8 6L20 8l-1.5 9H5.5Z"/><path d="M6 20h12"/><path d="m12 11 1.2 1.7L12 15l-1.2-2.3Z"/></svg>;
 if(name==='settings')return <svg {...common}><path d="M12 3.5 14 5l2.5-.2.8 2.4 2.1 1.3-1 2.3 1 2.3-2.1 1.3-.8 2.4-2.5-.2-2 1.5-2-1.5-2.5.2-.8-2.4-2.1-1.3 1-2.3-1-2.3 2.1-1.3.8-2.4L10 5Z"/><circle cx="12" cy="10.8" r="2.5"/></svg>;
 if(name==='council')return <svg {...common}><path d="M12 3.5v16M7 6h10M5 20h14"/><path d="m7 6-3 5h6Zm10 0-3 5h6Z"/></svg>;
 return <svg {...common}>{spark}<circle cx="12" cy="12" r="7"/></svg>
}

const fullPalaceRooms=[
 {id:'palace',icon:'☾',label:'My Palace',path:'/chamber',private:true,sections:[
  ['Home','/chamber'],['My chamber','/member'],['Notifications','/activity'],['Messages','/letters'],['Invitations','/events?tab=calendar']
 ]},
 {id:'reading',icon:'◈',label:'Reading Rooms',path:'/reading',sections:[
  ['All works','/reading'],['Advanced search','/reading?view=search'],['Comics','/comics'],['Lost Works','/lost-works'],['Series','/series'],['Tags room','/tags']
 ]},
 {id:'library',icon:'▧',label:'My Library',path:'/library',private:true,sections:[
  ['Saved Stories','/library'],['Comics Shelf','/library?tab=comics'],['Collections & Readers’ Choice','/library?tab=collections'],['Reading lists','/library?tab=lists'],['History','/library?tab=history'],['Notes & Bookmarks','/library?tab=notes'],['Lost Works Shelf','/lost-works'],['Subscriptions','/library?tab=following'],['Writers I Follow','/library?tab=writers']
 ]},
 {id:'writing',icon:'✎',label:'Writing Chamber',path:'/writing',private:true,sections:[
  ['Editor & drafts','/writing'],['Comic studio','/comics/studio'],['Co-writing','/writing?tab=collab'],['Comment review','/writing?tab=comments'],['Requests & permissions','/writing?tab=permissions']
 ]},
 {id:'life',icon:'♢',label:'Palace Life',path:'/palace-life',sections:[
  ['Commons','/palace-life?room=commons'],['Clubs','/palace-life?room=clubs'],['Forum','/palace-life?room=forum'],['Moonlight Chat','/palace-life?room=moonlight'],['New Stars','/palace-life?room=stars'],['Introductions & highlights','/palace-life?room=highlights'],['Activities','/activity'],['Throne of Honour','/honour']
 ]},
 {id:'events',icon:'✧',label:'Events & Heritage',path:'/events',sections:[
  ['Writing calendar','/events?tab=writing'],['Heritage calendar','/events?tab=heritage'],['My calendar','/events?tab=calendar'],['Event proposals','/events?tab=proposals'],['Member ballots','/events?tab=ballots']
 ]},
 {id:'treasury',icon:'♛',label:'Royal Treasury',path:'/treasury',private:true,sections:[
  ['Badges & gifts','/treasury'],['Full catalogue · 175 badges + 600 treasures','/treasury/catalogue'],['Lucky draw & 600 treasures','/treasury?tab=draw'],['Monthly rankings','/treasury?tab=rankings']
 ]},
 {id:'settings',icon:'⚙',label:'Settings & Safety',path:'/settings',private:true,sections:[
  ['Notifications & comfort','/settings?tab=notifications'],['Storage & uploads','/settings?tab=storage'],['Quiet corners','/settings?tab=quiet'],['Privacy','/settings?tab=privacy'],['Account & downloads','/settings?tab=account'],['System status','/settings?tab=system'],['Welcome guide','/settings?tab=guide'],['Testing room','/settings?tab=testing']
 ]}
];

const PalaceFrameContext=React.createContext(false);
function Frame(props){
 const insidePalaceFrame=React.useContext(PalaceFrameContext);
 if(insidePalaceFrame)return <>{props.children}</>;
 return <PalaceFrameContext.Provider value={true}><FrameShell {...props}/></PalaceFrameContext.Provider>;
}
function FrameShell({children}){
 const {session}=useAuth();
 const [navOpen,setNavOpen]=useState(false);
 const [daylight,setDaylight]=useState(()=>safeLocalGet('palace-theme')==='daylight');
 const [search,setSearch]=useState('');
 const [commandOpen,setCommandOpen]=useState(false);
 const [mobileMoreOpen,setMobileMoreOpen]=useState(false);
 const [commandQuery,setCommandQuery]=useState('');
 const [commandIndex,setCommandIndex]=useState(0);
 const [recentPalaceRoutes,setRecentPalaceRoutes]=useState(()=>{try{const rows=JSON.parse(safeLocalGet('palace-recent-routes')||'[]');return Array.isArray(rows)?rows.slice(0,5):[]}catch{return[]}});
 const [shellProfile,setShellProfile]=useState(null);
 const [letterBadge,setLetterBadge]=useState(0);
 const [activityBadge,setActivityBadge]=useState(0);
 const location=useLocation();const navigate=useNavigate();
 React.useEffect(()=>setNavOpen(false),[location.pathname]);
 React.useEffect(()=>{setCommandOpen(false);setMobileMoreOpen(false);setCommandQuery('');setCommandIndex(0)},[location.pathname,location.search]);
 React.useEffect(()=>{safeLocalSet('palace-theme',daylight?'daylight':'night')},[daylight]);
 React.useEffect(()=>{const onKey=e=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();setCommandOpen(v=>!v)}else if(e.key==='Escape'){setCommandOpen(false);setMobileMoreOpen(false)}};window.addEventListener('keydown',onKey);return()=>window.removeEventListener('keydown',onKey)},[]);
 React.useEffect(()=>{if(!(navOpen||mobileMoreOpen||commandOpen))return;const previous=document.body.style.overflow;document.body.style.overflow='hidden';return()=>{document.body.style.overflow=previous}},[navOpen,mobileMoreOpen,commandOpen]);
 React.useEffect(()=>{let alive=true;if(!session?.user?.id){setShellProfile(null);setLetterBadge(0);setActivityBadge(0);return;}Promise.all([supabase.from('profiles').select('username,display_name,title,avatar_url,cover_url').eq('id',session.user.id).maybeSingle(),supabase.from('message_requests').select('id',{count:'exact',head:true}).eq('recipient_id',session.user.id).eq('status','pending'),supabase.from('notifications').select('id',{count:'exact',head:true}).eq('user_id',session.user.id).eq('unread',true).eq('dismissed',false)]).then(([profileReq,letterReq,activityReq])=>{if(!alive)return;setShellProfile(profileReq.data||null);setLetterBadge(letterReq.count||0);setActivityBadge(activityReq.count||0)}).catch(error=>{if(!alive)return;console.warn('Palace shell counters unavailable',error);setLetterBadge(0);setActivityBadge(0)});return()=>{alive=false}},[session?.user?.id,location.pathname]);
 const visibleRooms=fullPalaceRooms.filter(r=>!r.private||session);
 const resolveRoomPath=p=>p==='/member'?(shellProfile?.username?'/member/'+shellProfile.username:'/chamber'):p;
 const quickDoors=[
  {label:'Surprise me with a story',path:'/reading?surprise=1',icon:'✦',detail:'Open a random published world · no popularity ranking',kind:'spark'},
  ...(session?[
    {label:'Start a private draft',path:'/writing',icon:'✎',detail:'Go straight to your Writing Chamber',kind:'quick'},
    {label:'Continue from My Library',path:'/library',icon:'▧',detail:'Saved worlds, reading places and notes',kind:'quick'},
    {label:'Try the Lucky Draw',path:'/treasury?tab=draw',icon:'♛',detail:'Open the Royal Treasury draw',kind:'quick'}
  ]:[])
 ];
 const roomCommandItems=visibleRooms.flatMap(r=>[
  {label:r.label,path:r.path,icon:r.icon,detail:'Palace room',kind:'room'},
  ...r.sections.map(([label,path])=>({label,path:resolveRoomPath(path),icon:r.icon,detail:r.label+' · section',kind:'section'}))
 ]);
 const commandItems=[
  ...quickDoors,
  ...roomCommandItems,
  {label:'Search the Palace',path:'/search',icon:'⌕',detail:'Works, writers, tags and clubs',kind:'utility'},
  {label:'The Palace Code',path:'/code',icon:'§',detail:'Rights, safety and community rules',kind:'utility'},
  ...(session?[{label:'Palace Council',path:'/council',icon:'⚖',detail:'Stewardship and review',kind:'utility'}]:[])
 ];
 const commandNeedle=commandQuery.trim().toLowerCase();
 const commandMatches=commandItems.filter(item=>commandNeedle&&[item.label,item.detail].join(' ').toLowerCase().includes(commandNeedle)).slice(0,12);
 const activeRoom=visibleRooms.find(r=>location.pathname===r.path||r.sections.some(([,p])=>{const target=resolveRoomPath(p);return target&&location.pathname===target.split('?')[0]})||(r.id==='reading'&&['/comics','/comic/','/work/','/lost-works','/tags','/series'].some(p=>location.pathname.startsWith(p)))||(r.id==='writing'&&location.pathname.startsWith('/writing'))||(r.id==='life'&&['/palace-life','/club/','/search','/honour','/activity'].some(p=>location.pathname.startsWith(p))||(r.id==='life'&&location.pathname.startsWith('/member/')&&location.pathname!==('/member/'+(shellProfile?.username||''))))||(r.id==='events'&&location.pathname.startsWith('/events'))||(r.id==='treasury'&&location.pathname.startsWith('/treasury'))||(r.id==='settings'&&location.pathname.startsWith('/settings')));
 const currentHref=location.pathname+location.search;
 const activeSection=activeRoom?.sections.find(([,path])=>resolveRoomPath(path)===currentHref);
 const recentCommandItems=recentPalaceRoutes.filter(row=>row?.path&&row.path!==currentHref).slice(0,4);
 const defaultCommandItems=[...recentCommandItems,...quickDoors.filter(q=>!recentCommandItems.some(r=>r.path===q.path))].slice(0,8);
 const visibleCommandItems=commandNeedle?commandMatches:defaultCommandItems;
 React.useEffect(()=>{if(!activeRoom)return;const label=activeSection?.[0]||activeRoom.label;const item={label,path:currentHref,icon:activeRoom.icon,detail:activeSection?activeRoom.label+' · recently visited':'Recently visited',kind:'recent'};setRecentPalaceRoutes(prev=>{const next=[item,...prev.filter(x=>x.path!==item.path)].slice(0,5);safeLocalSet('palace-recent-routes',JSON.stringify(next));return next})},[currentHref,activeRoom?.id,activeSection?.[0]]);
 React.useEffect(()=>setCommandIndex(0),[commandQuery,commandOpen]);
 function submitSearch(e){e.preventDefault();if(search.trim())navigate('/search?q='+encodeURIComponent(search.trim()))}
 function chooseCommand(path){setCommandOpen(false);setCommandQuery('');setCommandIndex(0);navigate(path)}
 function searchCommand(){const q=commandQuery.trim();if(!q)return;setCommandOpen(false);setCommandQuery('');setCommandIndex(0);navigate('/search?q='+encodeURIComponent(q))}
 return <div data-palace-frame="ready" className={"palace-shell full-palace-shell "+(navOpen?'nav-open ':'')+(daylight?'daylight':'nightfall')}>
  <a className="skip-to-content" href="#palace-content">Skip to main content</a>
  <aside id="palace-sidebar" className="sidebar full-sidebar" aria-label="Palace navigation">
   <div className="palace-cover-live restored-cover dusk-gif-cover"><img src="/assets/palace/palace-belonging.gif" alt="" aria-hidden="true"/><div className="dusk-cover-glass" aria-hidden="true"/><button className="nav-close" onClick={()=>setNavOpen(false)} aria-label="Close Palace navigation">×</button></div>
   {session?<Link className="identity-card-live restored-identity" to={shellProfile?.username?"/member/"+shellProfile.username:"/chamber"}><div className={"identity-avatar "+(!shellProfile?.avatar_url?'sigil-fallback':'')}>{shellProfile?.avatar_url?<img src={shellProfile.avatar_url} alt=""/>:<span aria-hidden="true">☾<b>✦</b></span>}</div><div><strong>{shellProfile?.display_name||shellProfile?.username||'Your Chamber'}</strong><span>{shellProfile?.title||'Palace member'}</span></div></Link>:<Link className="identity-card-live guest" to="/login"><div className="identity-avatar">✦</div><div><strong>Enter the Palace</strong><span>Sign in or create your chamber</span></div></Link>}
   <p className="nav-section-label">EXPLORE THE PALACE</p>
   <nav className="full-room-nav">{visibleRooms.map(room=>{const active=activeRoom?.id===room.id;return <div className="full-nav-room" key={room.id}><NavLink className={active?'active':''} to={room.path}><i className={"room-sigil room-sigil-"+room.id}><PalaceRoomIcon name={room.id}/></i><span>{room.label}</span></NavLink>{active&&<div className="full-subnav"><small>SECTIONS</small>{room.sections.map(([label,path])=>{const target=path==='/member'?(shellProfile?.username?'/member/'+shellProfile.username:'/chamber'):path;const current=currentHref===target||(target==='/chamber'&&location.pathname==='/chamber'&&!location.search);return <Link key={label} className={current?'active':''} aria-current={current?'page':undefined} to={target}><span>{label}</span></Link>})}</div>}</div>})}</nav>
   <p className="nav-section-label stewardship-label">STEWARDSHIP</p>
   <nav className="full-room-nav secondary"><div className="full-nav-room"><NavLink to="/council"><i className="room-sigil room-sigil-council"><PalaceRoomIcon name="council"/></i><span>Palace Council</span></NavLink>{location.pathname.startsWith('/council')&&<div className="full-subnav"><small>SECTIONS</small><span className="restored-static">Council overview</span><span className="restored-static">Moderation desk</span><span className="restored-static">Palace Tidings desk</span><span className="restored-static">Cases & appeals</span></div>}</div><div className="full-nav-room"><NavLink to="/code"><i>§</i><span>The Palace Code</span></NavLink>{location.pathname.startsWith('/code')&&<div className="full-subnav"><small>SECTIONS</small><span className="restored-static">Community conduct</span><span className="restored-static">Safety & privacy</span><span className="restored-static">Member rights</span><span className="restored-static">Appeals</span></div>}</div></nav>
   <div className="sidebar-spacer"/><div className="sidebar-foot full-foot">{session&&<><Link to="/letters">✉ <span>Palace Letters</span></Link><Link to="/activity">◌ <span>Moonlight Activity</span></Link></>}<button className="sidebar-theme" onClick={()=>setDaylight(v=>!v)}>{daylight?'☾ Nightfall':'☼ Daylight'}</button></div>
  </aside>
  <button className="nav-scrim" aria-label="Close navigation" onClick={()=>setNavOpen(false)}/>
  <div className="palace-stage full-stage">
   <header className="topbar full-topbar"><div className="full-topbar-row"><div className="full-brand"><button className="nav-toggle" onClick={()=>setNavOpen(true)} aria-label="Open Palace navigation" aria-expanded={navOpen} aria-controls="palace-sidebar">☰</button><Link to="/"><span className="brandmark">☾<b>✦</b></span><strong>The Starry Palace</strong></Link><small>BETA</small>{activeRoom&&<span className="top-room-context" aria-label={'Current room: '+activeRoom.label+(activeSection?' · '+activeSection[0]:'')}><span className={"top-room-sigil top-room-sigil-"+activeRoom.id}><PalaceRoomIcon name={activeRoom.id}/></span> {activeRoom.label}{activeSection&&<><b aria-hidden="true">/</b><em>{activeSection[0]}</em></>}</span>}</div><form className="global-search-live" role="search" aria-label="Search The Starry Palace" onSubmit={submitSearch}><span aria-hidden="true">⌕</span><input aria-label="Search works, writers, tags and fandoms" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search works, writers, tags, fandoms…"/><button type="submit">Search</button></form><div className="full-top-actions"><button className="command-trigger" type="button" onClick={()=>setCommandOpen(true)} aria-label="Open Palace quick navigation" aria-expanded={commandOpen} aria-controls="palace-command-dialog" title="Quick navigation · Ctrl or Command K"><span>⌕</span><kbd>⌘K</kbd></button>{session&&<Link className="top-icon-link" to="/letters" aria-label="Palace Letters">✉</Link>}{session&&<Link className="top-icon-link" style={{position:'relative'}} to="/activity" aria-label={activityBadge?activityBadge+' unread notifications':'Notifications'}>✦{activityBadge>0&&<span className="float-unread-badge">{activityBadge>99?'99+':activityBadge}</span>}</Link>}<Link className="write-action" to={session?'/writing':'/login'}>✎ <span>Write</span></Link></div></div></header>
   <main id="palace-content" data-palace-route={currentHref} className="palace-main-stage" tabIndex="-1">{children}</main>
   <footer className="palace-footer">
    <div><span className="palace-footer-mark" aria-hidden="true">☾<b>✦</b></span><div><strong>The Starry Palace</strong><small>Gather. Have a cup of tea. Write and read with me.</small></div></div>
    <nav aria-label="Palace footer"><Link to="/code">Palace Code</Link><Link to="/council">Council</Link><Link to="/search">Search</Link>{session&&<Link to="/settings">Settings & Safety</Link>}</nav>
   </footer>
  </div>
  {commandOpen&&<div className="palace-command-backdrop" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)setCommandOpen(false)}}>
    <section id="palace-command-dialog" className="palace-command" role="dialog" aria-modal="true" aria-label="Palace quick navigation and search">
      <header><span aria-hidden="true">⌕</span><input autoFocus value={commandQuery} onChange={e=>setCommandQuery(e.target.value)} onKeyDown={e=>{if(e.key==='ArrowDown'){e.preventDefault();setCommandIndex(i=>Math.min(Math.max(visibleCommandItems.length-1,0),i+1))}else if(e.key==='ArrowUp'){e.preventDefault();setCommandIndex(i=>Math.max(0,i-1))}else if(e.key==='Enter'){e.preventDefault();visibleCommandItems[commandIndex]?chooseCommand(visibleCommandItems[commandIndex].path):searchCommand()}}} placeholder="Jump to a room, section, or search…" aria-label="Search Palace rooms, sections or content"/><kbd>ESC</kbd></header>
      <div className="palace-command-results">{commandNeedle&&<button className="command-search-all" onClick={searchCommand}><span className="command-icon">⌕</span><span><strong>Search all Palace content</strong><small>Stories, comics, writers, tags, fandoms and clubs for “{commandQuery.trim()}”</small></span><em>Search</em></button>}{!commandNeedle&&recentCommandItems.length>0&&<p className="command-group-title">RECENT DOORS</p>}{!commandNeedle&&recentCommandItems.length===0&&<p className="command-group-title">QUICK DOORS</p>}{visibleCommandItems.length?visibleCommandItems.map((item,i)=><button key={item.path+'-'+item.label} className={(i===commandIndex?'selected ':'')+(item.kind==='spark'?'command-spark ':'')+(item.kind==='recent'?'command-recent ':'')} onMouseEnter={()=>setCommandIndex(i)} onClick={()=>chooseCommand(item.path)}><span className="command-icon">{item.icon}</span><span><strong>{item.label}</strong><small>{item.detail}</small></span>{i===commandIndex&&<em>Enter</em>}</button>):commandNeedle?<div className="command-empty"><span>⌕</span><p>No room or section matches that phrase. Search all Palace content instead.</p></div>:<div className="command-empty"><span>☾</span><p>Your recently visited Palace doors will gather here.</p></div>}</div>
      <footer><span>↑ ↓ to move · Enter to open</span><span>Ctrl/⌘ K anywhere</span><span>Esc to close</span></footer>
    </section>
   </div>}
  {session&&<div className="floating-controls restored-floating-controls">
    <Link className="float-btn palace-float-sigil notification-anchor" to="/letters" aria-label="Open Palace Letters" title="Palace Letters"><span className="float-letter-art">✉</span>{letterBadge>0&&<span className="float-unread-badge">{letterBadge>99?'99+':letterBadge}</span>}</Link>
    <button className="float-btn theme-orb" onClick={()=>setDaylight(v=>!v)} aria-label={daylight?'Switch to night mode':'Switch to light mode'} title={daylight?'Night mode':'Light mode'}><span className="theme-main">{daylight?'☾':'☼'}</span><span className="theme-star">✦</span></button>
  </div>}
  <nav className="mobile-palace-dock" aria-label="Quick Palace navigation">
    {session?<><Link className={activeRoom?.id==='palace'?'active':''} aria-current={activeRoom?.id==='palace'?'page':undefined} to="/chamber"><span>☾</span><small>Palace</small></Link><Link className={activeRoom?.id==='reading'?'active':''} aria-current={activeRoom?.id==='reading'?'page':undefined} to="/reading"><span>◈</span><small>Read</small></Link><Link className={"mobile-dock-write "+(activeRoom?.id==='writing'?'active':'')} aria-current={activeRoom?.id==='writing'?'page':undefined} to="/writing"><span>✎</span><small>Write</small></Link><Link className={activeRoom?.id==='life'?'active':''} aria-current={activeRoom?.id==='life'?'page':undefined} to="/palace-life"><span>♢</span><small>Life</small></Link><button type="button" className={"mobile-palace-more "+(['library','events','treasury','settings'].includes(activeRoom?.id)||mobileMoreOpen?'active':'')} aria-expanded={mobileMoreOpen} aria-controls="mobile-palace-more-sheet" onClick={()=>setMobileMoreOpen(v=>!v)}><span>•••</span><small>More</small>{activityBadge+letterBadge>0&&<b className="mobile-dock-badge">{activityBadge+letterBadge>99?'99+':activityBadge+letterBadge}</b>}</button></>:<><Link className={location.pathname==='/'?'active':''} aria-current={location.pathname==='/'?'page':undefined} to="/"><span>☾</span><small>Home</small></Link><Link className={activeRoom?.id==='reading'?'active':''} aria-current={activeRoom?.id==='reading'?'page':undefined} to="/reading"><span>◈</span><small>Read</small></Link><Link className="mobile-dock-write" to="/search"><span>⌕</span><small>Search</small></Link><Link className={location.pathname==='/code'?'active':''} aria-current={location.pathname==='/code'?'page':undefined} to="/code"><span>§</span><small>Code</small></Link><Link to="/login"><span>✦</span><small>Enter</small></Link></>}
  </nav>
  {session&&mobileMoreOpen&&<div className="mobile-more-backdrop" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)setMobileMoreOpen(false)}}>
    <section id="mobile-palace-more-sheet" className="mobile-more-sheet" role="dialog" aria-modal="true" aria-label="More Palace rooms">
      <header className="mobile-more-hero">
        <img src="/assets/palace/palace-belonging.gif" alt="" aria-hidden="true"/>
        <div><small>MORE OF YOUR PALACE</small><strong>Choose another room.</strong><span>Everything stays one tap away without crowding the dock.</span></div>
        <button type="button" onClick={()=>setMobileMoreOpen(false)} aria-label="Close more Palace rooms">×</button>
      </header>
      <div className="mobile-more-grid">
        <Link to="/library"><span>▧</span><strong>My Library</strong><small>Saved worlds & history</small></Link>
        <Link to="/events?tab=calendar"><span>✧</span><strong>Events</strong><small>Calendars & invitations</small></Link>
        <Link to="/treasury"><span>♛</span><strong>Treasury</strong><small>Badges, gifts & draw</small></Link>
        <Link to="/letters" className={letterBadge?'has-attention':''}><span>✉</span><strong>Messages</strong><small>{letterBadge?letterBadge+' request'+(letterBadge===1?'':'s')+' waiting':'Palace Letters'}</small>{letterBadge>0&&<b>{letterBadge>99?'99+':letterBadge}</b>}</Link>
        <Link to="/activity" className={activityBadge?'has-attention':''}><span>✦</span><strong>Activity</strong><small>{activityBadge?activityBadge+' unread':'Notifications & updates'}</small>{activityBadge>0&&<b>{activityBadge>99?'99+':activityBadge}</b>}</Link>
        <Link to="/search"><span>⌕</span><strong>Search</strong><small>Works, writers & tags</small></Link>
        <Link to={shellProfile?.username?"/member/"+shellProfile.username:"/chamber"}><span>☾</span><strong>My Chamber</strong><small>Profile & public identity</small></Link>
        <Link to="/settings"><span>⚙</span><strong>Settings</strong><small>Privacy, comfort & account</small></Link>
      </div>
      <footer><button type="button" onClick={()=>setDaylight(v=>!v)}><span>{daylight?'☾':'☼'}</span>{daylight?'Switch to Nightfall':'Switch to Daylight'}</button><button type="button" onClick={()=>{setMobileMoreOpen(false);setNavOpen(true)}}><span>☰</span>Full Palace map</button></footer>
    </section>
  </div>}
 </div>
}
function Home(){
 const[latestWorlds,setLatestWorlds]=useState([]);
 useEffect(()=>{let alive=true;if(!configured)return;supabase.from('works').select('id,title,slug,summary,cover_url,last_published_at,profiles!works_author_id_fkey(username,display_name)').eq('publication_status','published').order('last_published_at',{ascending:false}).limit(4).then(({data})=>{if(alive)setLatestWorlds(data||[])}).catch(()=>{});return()=>{alive=false}},[]);
 return <Frame><section className="home-hero realised"><div className="stars" aria-hidden="true">✦　·　✧　　·　✦　　☾</div><div className="hero-copy"><p className="eyebrow">WRITE AMONG KINDRED STARS.</p><h1>There’s a place<br/>for you here.</h1><p className="lede">Read deeply. Write privately before you publish. Find people without turning creativity into a popularity contest.</p><div className="hero-actions"><Link className="button" to="/reading">Enter the Reading Rooms</Link><Link className="text-link" to="/writing">Open the Writing Chamber →</Link></div></div><aside className="hero-orbit palace-belonging-panel" aria-label="Your Palace, a place to belong"><img className="palace-belonging-art" src="/assets/palace/palace-belonging.gif" alt=""/><span>YOUR PALACE · A PLACE TO BELONG</span><strong>☾</strong><p>Stories, art, communities, heritage and creative life beneath one shared sky.</p><div><b>READ</b><b>WRITE</b><b>GATHER</b><b>KEEP</b></div></aside></section><section className="home-intro-strip"><span>NO ALGORITHM DECIDES ARTISTIC WORTH</span><span>PRIVATE BY CHOICE</span><span>CREATIVE RIGHTS FIRST</span><span>COMMUNITY WITH BOUNDARIES</span></section><section className="room-grid expanded">{rooms.map(([name,path,copy],i)=><Link className={"room-card room-"+i} to={path} key={path}><span>0{i+1}</span><div className="room-glyph">{['◈','▤','✎','♢','✧','♛','⌁'][i]}</div><h2>{name}</h2><p>{copy}</p><b>Enter room →</b></Link>)}</section>{latestWorlds.length>0&&<section className="home-live-worlds"><div className="section-heading"><div><p className="eyebrow">NEWLY OPENED WORLDS</p><h2>Fresh from the Reading Rooms.</h2><p>A small live shelf of recently published work. It is chronological—not a popularity ranking.</p></div><Link to="/reading">Browse all stories →</Link></div><div className="home-world-grid">{latestWorlds.map(w=><Link to={"/work/"+w.slug} key={w.id}><div className="home-world-cover">{w.cover_url?<img loading="lazy" decoding="async" src={w.cover_url} alt=""/>:<span>☾<b>✦</b></span>}</div><div><small>{w.last_published_at?new Date(w.last_published_at).toLocaleDateString(undefined,{month:'short',day:'numeric'}):'New'}</small><h3>{w.title}</h3><p>{w.summary||'Enter this world to begin reading.'}</p><b>by {w.profiles?.display_name||w.profiles?.username||'Palace writer'} →</b></div></Link>)}</div></section>}<section className="palace-paths"><div><p className="eyebrow">A PALACE, NOT A FEED</p><h2>Different rooms for different kinds of attention.</h2><p>Long-form reading does not need to compete with live chat. Private drafts do not need to become public before they are ready. Community, governance and creative ownership each have their own doorway.</p></div><div className="path-list"><Link to="/tags"><span>01</span><strong>Tag Constellation</strong><small>Include what you seek. Exclude what you do not.</small></Link><Link to="/honour"><span>02</span><strong>Throne of Honour</strong><small>Recognition without controlling discovery.</small></Link><Link to="/code"><span>03</span><strong>The Palace Code</strong><small>Rights, safety, moderation and appeals.</small></Link><Link to="/council"><span>04</span><strong>Palace Council</strong><small>Review with a record, not invisible power.</small></Link></div></section><section className="manifesto"><p>EVERY VOICE CARRIES A WORLD.</p><h2>Gather. Have a cup of tea.<br/>Write and read with me.</h2><div><Link to="/reading">Find a story</Link><Link to="/login">Create your chamber</Link></div></section></Frame>
}
function Login(){
 const {session,loading,error:sessionError}=useAuth(); const [mode,setMode]=useState('login'); const [email,setEmail]=useState(''); const [password,setPassword]=useState(''); const [showPassword,setShowPassword]=useState(false); const [busy,setBusy]=useState(false); const [message,setMessage]=useState(''); const location=useLocation();
 const requested=location.state?.from; const destination=typeof requested==='string'&&requested.startsWith('/')&&!requested.startsWith('//')&&requested!=='/login'?requested:'/chamber';
 if(!loading&&session)return <Navigate to={destination} replace/>;
 function friendly(error){const code=error?.code||'';if(code==='email_not_confirmed')return 'Your account exists, but the email address has not been confirmed yet.';if(code==='over_email_send_rate_limit')return 'Please wait a moment before requesting another email.';if(code==='invalid_credentials')return 'That email and password combination was not recognised.';return error?.message||'Sign-in failed. Please try again.'}
 async function submit(e){e.preventDefault();setBusy(true);setMessage('');try{const result=mode==='signup'?await supabase.auth.signUp({email,password,options:{emailRedirectTo:window.location.origin+'/auth/callback'}}):await supabase.auth.signInWithPassword({email,password});if(result.error)throw result.error;if(mode==='signup'&&!result.data.session)setMessage('Your chamber has been requested. Check your email and tap the confirmation link, then return to the Palace.')}catch(error){setMessage(friendly(error))}finally{setBusy(false)}}
 async function magic(){if(!email){setMessage('Enter your email address first, then choose Send me a magic link.');return}setBusy(true);setMessage('');try{const{error}=await supabase.auth.signInWithOtp({email,options:{emailRedirectTo:window.location.origin+'/auth/callback',shouldCreateUser:true}});if(error)throw error;setMessage('A passwordless entrance link has been sent. Check your email and tap it to enter the Palace.')}catch(error){setMessage(friendly(error))}finally{setBusy(false)}}
 return <Frame><section className="gate"><div className="gate-copy"><p className="eyebrow">THE PALACE GATES</p><h1>{mode==='signup'?'A place among the stars.':'Welcome home.'}</h1><p>Choose the doorway that suits you. If you use a Palace password, create one for this account — never enter the password for your email inbox.</p></div><div className="auth-panel">{!configured?<p role="alert">Sign-in is not configured.</p>:<><label>Email<input type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/></label><button type="button" className="magic-button" disabled={busy||loading} onClick={magic}>Email me a passwordless entrance link</button><div className="auth-divider"><span>or use a Palace password</span></div><form onSubmit={submit}><label>Password<div className="password-field"><input type={showPassword?'text':'password'} autoComplete={mode==='signup'?'new-password':'current-password'} minLength={mode==='signup'?8:undefined} required value={password} onChange={e=>setPassword(e.target.value)}/><button type="button" onClick={()=>setShowPassword(v=>!v)} aria-label={showPassword?'Hide password':'Show password'}>{showPassword?'Hide':'Show'}</button></div></label>{mode==='signup'&&<small className="password-note">Use at least 8 characters. This is a Palace password, not your email password.</small>}<button disabled={busy||loading}>{busy?'Please wait…':mode==='signup'?'Create my chamber':'Enter the Palace'}</button></form><button className="secondary" disabled={busy} onClick={()=>{setMode(mode==='signup'?'login':'signup');setMessage('');setPassword('')}}>{mode==='signup'?'Already a member? Sign in':'New beneath these stars? Create an account'}</button></>}{(message||sessionError)&&<p className="status" role="status">{message||sessionError}</p>}</div></section></Frame>
}


function Callback(){const{session,loading,error}=useAuth();const p=new URLSearchParams(window.location.search);if(p.has('error')||error)return <Frame><section className="room-title"><h1>Sign-in could not finish</h1><p role="alert">{p.get('error_description')||error||'Please try again.'}</p><Link to="/login">Return to the Palace gates</Link></section></Frame>;if(loading)return <p role="status">Completing sign-in…</p>;return <Navigate to={session?'/chamber':'/login'} replace/>}


function NavigationReset(){
 const location=useLocation();
 React.useEffect(()=>{
  const reset=()=>{try{window.scrollTo({top:0,left:0,behavior:'auto'})}catch{try{window.scrollTo(0,0)}catch{}};if(document.documentElement)document.documentElement.scrollTop=0;if(document.body)document.body.scrollTop=0};
  const frame=requestAnimationFrame(reset);
  return()=>cancelAnimationFrame(frame);
 },[location.pathname,location.search]);
 return null;
}
function RouteStateReset(){
 const location=useLocation();
 React.useLayoutEffect(()=>{
  const path=location.pathname;
  const ownsReaderFocus=/^\/work\/[^/]+\/chapter\/[^/]+/.test(path);
  const ownsWritingDesk=/^\/writing\/[^/]+/.test(path);
  if(!ownsReaderFocus)document.body.classList.remove('reader-focus-mode');
  if(!ownsWritingDesk)document.body.classList.remove('focus-editor','writing-desk-open');
 },[location.pathname]);
 return null;
}
function BlankScreenWatchdog(){
 const location=useLocation();
 React.useEffect(()=>{
  let firstTimer,secondTimer,rescueTimer;
  const removeRecovery=()=>document.querySelector('[data-palace-blank-recovery]')?.remove();
  const showRecovery=()=>{
   if(document.querySelector('[data-palace-blank-recovery]'))return;
   const layer=document.createElement('div');
   layer.className='route-recovery blank-screen-recovery';
   layer.dataset.palaceBlankRecovery='true';
   layer.setAttribute('role','alert');
   layer.innerHTML='<div><span aria-hidden="true">☾<b>✦</b></span><h1>This room lost its moonlight.</h1><p>The Palace caught an incomplete screen without discarding your live app state.</p><button type="button">Restore this room</button></div>';
   layer.querySelector('button')?.addEventListener('click',()=>window.location.reload());
   document.body.appendChild(layer);
  };
  const looksInvisible=node=>{
   if(!node)return false;
   const style=getComputedStyle(node);const rect=node.getBoundingClientRect();
   return style.display==='none'||style.visibility==='hidden'||Number(style.opacity||1)<.03||rect.width<20||rect.height<24;
  };
  const inspect=()=>{
   const root=document.getElementById('root');
   if(!root)return;
   const shell=root.querySelector('[data-palace-frame="ready"]');
   const loader=root.querySelector('.route-loading');
   const routeRecovery=root.querySelector('.route-recovery');
   const content=root.querySelector('#palace-content');
   const rootText=(root.textContent||'').trim();
   const contentText=(content?.textContent||'').trim();
   const firstRoom=content?.firstElementChild||null;
   const blankRoot=root.childElementCount===0||rootText.length<3||root.getBoundingClientRect().height<40;
   const blankRoom=!!shell&&!!content&&content.childElementCount===0&&contentText.length<3;
   const visuallyBlank=!!shell&&!!content&&!blankRoom&&(looksInvisible(content)||looksInvisible(firstRoom));
   if(!(blankRoot||blankRoom||visuallyBlank)||loader||routeRecovery){if(!blankRoot&&!blankRoom&&!visuallyBlank)removeRecovery();return}
   if(visuallyBlank&&content){
    content.classList.add('palace-visibility-rescue');
    window.clearTimeout(rescueTimer);
    rescueTimer=window.setTimeout(()=>{
     const stillBlank=looksInvisible(content)||looksInvisible(content.firstElementChild);
     if(!stillBlank){removeRecovery();return}
     showRecovery();
     schedulePalaceReload('palace-blank-screen-reload:'+location.pathname,180);
    },180);
    return
   }
   showRecovery();
   schedulePalaceReload('palace-blank-screen-reload:'+location.pathname,180);
  };
  firstTimer=window.setTimeout(inspect,1800);
  secondTimer=window.setTimeout(inspect,5200);
  const onPageShow=event=>window.setTimeout(inspect,event.persisted?120:260);
  const onVisible=()=>{if(document.visibilityState==='visible')window.setTimeout(inspect,180)};
  window.addEventListener('pageshow',onPageShow);
  document.addEventListener('visibilitychange',onVisible);
  return()=>{window.clearTimeout(firstTimer);window.clearTimeout(secondTimer);window.clearTimeout(rescueTimer);removeRecovery();window.removeEventListener('pageshow',onPageShow);document.removeEventListener('visibilitychange',onVisible)};
 },[location.pathname,location.search]);
 return null;
}

function RouteLoading(){
 const[slow,setSlow]=useState(false);
 React.useEffect(()=>{const timer=window.setTimeout(()=>setSlow(true),2200);return()=>window.clearTimeout(timer)},[]);
 return <div className="route-loading" role="status" aria-live="polite"><div className="route-loading-card"><span className="route-loading-mark" aria-hidden="true">☾<b>✦</b></span><strong>Opening this Palace room…</strong><small>{slow?'This is taking longer than usual. You can safely reload the room.':'Gathering the room beneath the stars.'}</small>{slow&&<button onClick={()=>window.location.reload()}>Reload room</button>}</div></div>
}

class RouteErrorBoundary extends React.Component{
 constructor(props){super(props);this.state={error:null}}
 static getDerivedStateFromError(error){return{error}}
 componentDidUpdate(prevProps){
  if(prevProps.resetKey!==this.props.resetKey&&this.state.error)this.setState({error:null});
 }
 componentDidCatch(error,info){
  const message=String(error?.message||error||'Unknown room error').replace(/https?:\/\/\S+/g,'[url]').slice(0,220);
  const diagnostic={message,path:this.props.path||window.location.pathname+window.location.search,at:new Date().toISOString(),component:String(info?.componentStack||'').slice(0,900)};
  console.error('Palace route failed to render',error,info);
  safeSessionSet('palace-last-route-error',JSON.stringify(diagnostic));
 }
 render(){
  if(this.state.error){
   const message=String(this.state.error?.message||this.state.error||'Unknown room error').replace(/https?:\/\/\S+/g,'[url]').slice(0,220);
   return <div className="route-recovery palace-room-recovery" role="alert"><div><span aria-hidden="true">☾<b>✦</b></span><h1>This room did not finish opening.</h1><p>The Palace shell is still running. This problem was isolated to the current room.</p><code className="palace-error-detail">{message}</code><small className="palace-error-path">Room: {this.props.path||window.location.pathname}</small><button type="button" onClick={()=>this.setState({error:null})}>Try this room again</button><Link to="/chamber">Return to My Palace</Link></div></div>;
  }
  return this.props.children
 }
}
function RouteGuard({children}){
 const location=useLocation();
 const resetKey=location.pathname+location.search;
 return <RouteErrorBoundary resetKey={resetKey} path={resetKey}>{children}</RouteErrorBoundary>
}

class PalaceRootBoundary extends React.Component{
 constructor(props){super(props);this.state={error:null}}
 static getDerivedStateFromError(error){return{error}}
 componentDidCatch(error,info){
  const message=String(error?.message||error||'Unknown shell error').replace(/https?:\/\/\S+/g,'[url]').slice(0,220);
  const diagnostic={message,path:window.location.pathname+window.location.search,at:new Date().toISOString(),component:String(info?.componentStack||'').slice(0,900)};
  console.error('The Palace shell failed safely',error,info);
  safeSessionSet('palace-last-root-error',JSON.stringify(diagnostic));
 }
 render(){
  if(this.state.error){
   const message=String(this.state.error?.message||this.state.error||'Unknown shell error').replace(/https?:\/\/\S+/g,'[url]').slice(0,220);
   return <div className="route-recovery palace-root-recovery" role="alert"><div><span aria-hidden="true">☾<b>✦</b></span><h1>The Palace caught a shell error.</h1><p>The page did not vanish. The detail below tells us which root-level failure occurred.</p><code className="palace-error-detail">{message}</code><small className="palace-error-path">Room: {window.location.pathname}</small><button type="button" onClick={()=>{try{const url=new URL(window.location.href);url.searchParams.set('__palace_recover',String(Date.now()));window.location.replace(url.toString())}catch{window.location.reload()}}}>Reopen the Palace</button></div></div>;
  }
  return this.props.children
 }
}

function App(){return <AuthProvider><PalaceBuildFreshnessWatch/><NavigationReset/><RouteStateReset/><BlankScreenWatchdog/><Frame><RouteGuard><Routes>
 <Route path="/" element={<Home/>}/><Route path="/login" element={<Login/>}/><Route path="/auth/callback" element={<Callback/>}/>
 <Route path="/welcome" element={<ProtectedRoute><OnboardingLive Frame={Frame}/></ProtectedRoute>}/>
 <Route path="/chamber" element={<ProtectedRoute><ChamberLive Frame={Frame}/></ProtectedRoute>}/>
 <Route path="/reading" element={<ReadingLive Frame={Frame}/>}/><Route path="/series" element={<SeriesLive Frame={Frame}/>}/>
 <Route path="/comics" element={<ComicsLive Frame={Frame}/>}/>
 <Route path="/comics/studio" element={<ProtectedRoute><ComicStudioLive Frame={Frame}/></ProtectedRoute>}/>
 <Route path="/comic/:slug" element={<ComicLive Frame={Frame}/>}/>
 <Route path="/comic/:slug/episode/:episodeId" element={<ComicEpisodeLive Frame={Frame}/>}/>
 <Route path="/writing" element={<ProtectedRoute><WritingLive Frame={Frame}/></ProtectedRoute>}/>
 <Route path="/writing/:slug" element={<ProtectedRoute><WorkStudioLive Frame={Frame}/></ProtectedRoute>}/>
 <Route path="/work/:slug" element={<WorkLive Frame={Frame}/>}/>
 <Route path="/work/:slug/chapter/:chapterId" element={<ChapterLive Frame={Frame}/>}/>
 <Route path="/palace-life" element={<ProtectedRoute><PalaceLifeLive Frame={Frame}/></ProtectedRoute>}/>
 <Route path="/club/:slug" element={<ProtectedRoute><ClubLive Frame={Frame}/></ProtectedRoute>}/>
 <Route path="/events" element={<EventsLive Frame={Frame}/>}/>
 <Route path="/treasury" element={<ProtectedRoute><TreasuryLive Frame={Frame}/></ProtectedRoute>}/>
 <Route path="/treasury/catalogue" element={<ProtectedRoute><React.Suspense fallback={<RouteLoading/>}><TreasuryCatalogueLazy Frame={Frame}/></React.Suspense></ProtectedRoute>}/>
 <Route path="/lost-works" element={<LostWorksLive Frame={Frame}/>}/>
 <Route path="/settings" element={<ProtectedRoute><SettingsLive Frame={Frame}/></ProtectedRoute>}/>
 <Route path="/activity" element={<ProtectedRoute><ActivityLive Frame={Frame}/></ProtectedRoute>}/>
 <Route path="/library" element={<ProtectedRoute><LibraryLive Frame={Frame}/></ProtectedRoute>}/>
 <Route path="/letters" element={<ProtectedRoute><LettersLive Frame={Frame}/></ProtectedRoute>}/>
 <Route path="/tags" element={<TagSearchLive Frame={Frame}/>}/>
 <Route path="/search" element={<SearchLive Frame={Frame}/>}/><Route path="/honour" element={<HonourLive Frame={Frame}/>}/><Route path="/council" element={<ProtectedRoute><CouncilLive Frame={Frame}/></ProtectedRoute>}/><Route path="/code" element={<CodeLive Frame={Frame}/>}/>
 <Route path="/member/:username" element={<MemberProfileLive Frame={Frame}/>}/>
 <Route path="*" element={<Frame><section className="lost-gates-page"><div className="lost-gates-orbit"><span>☾</span><i>✦</i></div><p className="eyebrow">BEYOND THE GATES</p><h1>You left palace grounds.</h1><p>The path thinned, the lamps disappeared, and somehow you wandered beyond the Palace walls.</p><div className="lost-gates-actions"><Link className="button" to="/">Return to the Palace</Link><Link to="/search">Search for a room →</Link></div></section></Frame>}/>
 </Routes></RouteGuard></Frame></AuthProvider>}

createRoot(document.getElementById('root')).render(<React.StrictMode><PalaceRootBoundary><BrowserRouter><App/></BrowserRouter></PalaceRootBoundary></React.StrictMode>);


