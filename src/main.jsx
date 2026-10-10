import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Link, NavLink, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, ProtectedRoute, useAuth } from './auth';
import { PalaceRouteSeo } from './usePalaceSeo';
import { supabase } from './supabase';
import './style.css';
import './polish.css';
import './palace-next.css';
import './palace-quality-pass.css';
import './neon-map.css';
import './grand-palaces.css';
import {PalaceStartingPath,PalaceLiveGatherings} from './PalaceFirstVisit';
import PalaceResumeReading from './PalaceResumeReading';
import {WriterWelcome} from './WriterWelcome';
import {PalaceHomeWelcome,PalaceRoomDirectory,PalaceHomeCulturePaths,PalaceHomeMore} from './PalaceHomeWelcome';
import PalaceSidebarNavigation from './PalaceSidebarNavigation';
import PalaceNewStories from './PalaceNewStories';
import PalaceChatDrawer from './PalaceChatDrawer';
import {palaceSignInDoor} from './palaceDoorway';
import {shouldOfferManualPalaceRefresh} from './palaceUpdateSafety';
import {isPalaceRoomVisuallyBlank} from './palaceBlankVisibility';
import {usePalaceDialogFocusTrap} from './usePalaceDialogFocusTrap';
import {shouldOpenPalaceQuickNavigation} from './palaceKeyboard';
import {palaceRecentDoorKey,readPalaceRecentDoors,addPalaceRecentDoor} from './palaceRecentDoors';
import './palace-inviting-polish.css';
import './palace-cohesive-experience.css';
import {
 ChamberLive,OnboardingLive,ReadingLive,ClubLive,WritingLive,SettingsLive,ActivityLive,LibraryLive,
 PalaceLifeLive,LettersLive,EventsLive,TreasuryLive,LostWorksLive,MemberProfileLive,SearchLive,
 WorkLive,ChapterLive,WorkStudioLive,TagSearchLive,HonourLive,CouncilLive,CodeLive,ComicsLive,
 ComicLive,ComicEpisodeLive,ComicStudioLive,SeriesLive
} from './liveRooms';
import './palace-editorial-finish.css';
import './palace-navigation-jewels.css';
import './palace-regalia-rooms.css';
import './palace-build-safety.css';
import './palace-moonlit-curation.css';
import './palace-creative-flow.css';
import './reading-room-wayfinding.css';
import './writer-draft-reassurance.css';
import './writer-toolbar-flow.css';
import './writer-save-find-polish.css';
import './manuscript-calm-focus.css';
import './writer-desk-drawer.css';
import './palace-life-room-clarity.css';
import './commons-conversation-path.css';
import './palace-life-history.css';
import './mobile-profile-writer-layout.css';
import './palace-writer-profile-finish.css';
import './profile-grid-restoration.css';
import './chamber-creative-shelf-polish.css';
import './reader-journey-path.css';
import './reader-chapter-flow.css';
import './work-overview-story-info.css';
import './reader-comfort-finish.css';
import './palace-prismatic-gradients.css';
import './treasury-daylight-tablet-clarity.css';
import './palace-unified-action-gradients.css';
import './palace-search-room-refinement.css';


const chunkErrorPattern=/dynamically imported module|importing a module script failed|failed to fetch|chunkloaderror|loading chunk|room load timeout|networkerror/i;
const ROOM_IMPORT_TIMEOUT_MS=12000;
function safeSessionGet(key){try{return window.sessionStorage?.getItem(key)??null}catch{return null}}
function safeSessionSet(key,value){try{window.sessionStorage?.setItem(key,String(value));return true}catch{return false}}
function safeLocalGet(key){try{return window.localStorage?.getItem(key)??null}catch{return null}}
function safeLocalSet(key,value){try{window.localStorage?.setItem(key,String(value));return true}catch{return false}}
function schedulePalaceReload(key,delay=40){
 if(typeof window==='undefined')return false;
 // All automatic recovery paths (chunk errors, preload failures and blank rooms)
 // must honor the same work-in-progress guard as the new-build notice.
 // A writer can still choose a deliberate reload after saving or exporting.
 if(shouldOfferManualPalaceRefresh(window.location.pathname))return false;
 const last=Number(safeSessionGet(key)||0);
 if(Date.now()-last<=15000)return false;
 safeSessionSet(key,Date.now());
 window.setTimeout(()=>{if(!shouldOfferManualPalaceRefresh(window.location.pathname))window.location.reload()},delay);
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
 const [updateAvailable,setUpdateAvailable]=useState(false);
 const [updateSnoozed,setUpdateSnoozed]=useState(false);
 const offeredAssetRef=React.useRef('');
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
   if(currentPath!==newestPath){
    if(shouldOfferManualPalaceRefresh(location.pathname)){
     // Only re-open a dismissed notice when a genuinely different build arrives.
     if(offeredAssetRef.current!==newestPath){
      offeredAssetRef.current=newestPath;
      setUpdateSnoozed(false);
     }
     setUpdateAvailable(true);
    }
    else schedulePalaceReload('palace-new-build-reload',80);
   }
  };
  const routeTimer=window.setTimeout(check,900);
  const onVisible=()=>{if(document.visibilityState==='visible')window.setTimeout(check,250)};
  const interval=window.setInterval(check,180000);
  document.addEventListener('visibilitychange',onVisible);
  window.addEventListener('pageshow',onVisible);
  return()=>{alive=false;window.clearTimeout(routeTimer);window.clearInterval(interval);document.removeEventListener('visibilitychange',onVisible);window.removeEventListener('pageshow',onVisible)}
 },[location.pathname,location.search]);
 if(!updateAvailable||!shouldOfferManualPalaceRefresh(location.pathname))return null;
 if(updateSnoozed)return <button type="button" className="palace-update-peek" onClick={()=>setUpdateSnoozed(false)} aria-label="Review the available Palace update">✦ Update waiting</button>;
 return <aside className="palace-update-safety" role="status" aria-live="polite"><span aria-hidden="true">✦</span><div><strong>A newer Palace is ready.</strong><p>Finish saving your work before reloading. Your current page will stay open until you choose.</p><button type="button" className="palace-update-later" onClick={()=>setUpdateSnoozed(true)}>Later · keep writing</button></div><button type="button" onClick={()=>window.location.reload()}>Reload after saving</button></aside>
}

const TreasuryCatalogueLazy=React.lazy(()=>importWithRecovery(()=>import('./Treasury')));
// Secondary Palace destinations load on demand; core reader and writing rooms remain eager.
const GrandPalaceHall=React.lazy(()=>importWithRecovery(()=>import('./GrandPalaceHall')));
const PalaceGovernance=React.lazy(()=>importWithRecovery(()=>import('./PalaceGovernance')));
const PalaceBetaGuide=React.lazy(()=>importWithRecovery(()=>import('./PalaceBetaGuide')));
const PalaceFandomAtlas=React.lazy(()=>importWithRecovery(()=>import('./PalaceFandomAtlas')));
// Core Palace rooms are imported eagerly for navigation reliability.

const rooms=[
  ['Reading Rooms','/reading','Read, discover and return to the stories waiting for you.'],
  ['Comics Gallery','/comics','Sequential art with creator-controlled rights, accessibility and reading direction.'],
  ['Writing Chamber','/writing','Draft, publish and tend the worlds you are creating.'],
  ['Palace Life','/palace-life','Clubs, Commons, Moonlight Chat and kindred stars.'],
  ['Events & Heritage','/events','Creative gatherings and carefully sourced heritage observances.'],
  ['Royal Treasury','/treasury','Achievements, gifts, court honours and your collection.'],
  ['Grand Palaces','/grand-palaces','Ten Grand Palaces compete for quarterly honours and celestial prizes.'],
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
 if(name==='events')return <svg {...common} className="palace-drawn-neon-icon palace-events-neon-icon"><rect className="neon-stroke-cyan" x="3.5" y="5.5" width="17" height="15" rx="2"/><path className="neon-stroke-violet" d="M7 3.5v4M17 3.5v4M3.5 9.5h17"/><path className="neon-stroke-pink" d="m12 12.2.65 1.4 1.55.65-1.55.65L12 16.3l-.65-1.4-1.55-.65 1.55-.65Z"/></svg>;
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
  ['All works','/reading'],['Advanced search','/reading?view=search'],['Fandoms','/fandoms'],['Comics','/comics'],['Lost Works','/lost-works'],['Series','/series'],['Tags room','/tags']
 ]},
 {id:'library',icon:'▧',label:'My Library',path:'/library',private:true,sections:[
  ['Saved Stories','/library'],['Comics Shelf','/library?tab=comics'],['Collections & Readers’ Choice','/library?tab=collections'],['Reading lists','/library?tab=lists'],['History','/library?tab=history'],['Notes & Bookmarks','/library?tab=notes'],['Lost Works Shelf','/lost-works'],['Subscriptions','/library?tab=following'],['Writers I Follow','/library?tab=writers']
 ]},
 {id:'writing',icon:'✎',label:'Writing Chamber',path:'/writing',private:true,sections:[
  ['Editor & drafts','/writing'],['Comic studio','/comics/studio'],['Co-writing','/writing?tab=collab'],['Relay Writing Rooms','/writing?tab=relay'],['Ink Duels','/writing?tab=duels'],['Comment review','/writing?tab=comments'],['Requests & permissions','/writing?tab=permissions'],['For Writers','/writers']
 ]},
 {id:'life',icon:'♢',label:'Palace Life',path:'/palace-life',sections:[
  ['Grand Palace Hall','/grand-palaces'],['Commons','/palace-life?room=commons'],['Clubs','/palace-life?room=clubs'],['Forum','/palace-life?room=forum'],['Moonlight Chat','/palace-life?room=moonlight'],['New Stars','/palace-life?room=stars'],['Introductions & highlights','/palace-life?room=highlights'],['History','/palace-life?room=history'],['Activities','/activity'],['Throne of Honour','/honour']
 ]},
 {id:'events',icon:'✧',label:'Events & Heritage',path:'/events',sections:[
  ['Writing calendar','/events?tab=writing'],['Heritage calendar','/events?tab=heritage'],['My calendar','/events?tab=calendar'],['Event proposals','/events?tab=proposals'],['Member ballots','/events?tab=ballots']
 ]},
 {id:'treasury',icon:'♛',label:'Royal Treasury',path:'/treasury',private:true,sections:[
  ['Badges & achievements','/treasury'],['Celestial titles','/treasury?tab=titles'],['Gift cabinet','/treasury?tab=gifts'],['Full catalogue · 175 badges + 600 treasures','/treasury/catalogue'],['Lucky draw & 600 treasures','/treasury?tab=draw'],['Monthly rankings','/treasury?tab=rankings']
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
 const [sidebarCollapsed,setSidebarCollapsed]=useState(()=>safeLocalGet('palace-sidebar-collapsed')==='1');
 const [daylight,setDaylight]=useState(()=>safeLocalGet('palace-theme')==='daylight');
 const [search,setSearch]=useState('');
 const [commandOpen,setCommandOpen]=useState(false);
 const [mobileMoreOpen,setMobileMoreOpen]=useState(false);
 const [commandQuery,setCommandQuery]=useState('');
 const [commandIndex,setCommandIndex]=useState(0);
 const recentDoorsKey=palaceRecentDoorKey(session?.user?.id);
 const [recentPalaceRoutes,setRecentPalaceRoutes]=useState(()=>({key:recentDoorsKey,items:readPalaceRecentDoors(safeLocalGet,recentDoorsKey)}));
 const [shellProfile,setShellProfile]=useState(null);
 const [letterBadge,setLetterBadge]=useState(0);
 const [activityBadge,setActivityBadge]=useState(0);
 const location=useLocation();const navigate=useNavigate();
 usePalaceDialogFocusTrap(commandOpen,'palace-command-dialog','.command-trigger');
 usePalaceDialogFocusTrap(mobileMoreOpen,'mobile-palace-more-sheet','.mobile-palace-more');
 React.useEffect(()=>{try{window.localStorage?.removeItem('palace-recent-routes')}catch{}},[]);
 React.useEffect(()=>{setRecentPalaceRoutes({key:recentDoorsKey,items:readPalaceRecentDoors(safeLocalGet,recentDoorsKey)})},[recentDoorsKey]);
 React.useEffect(()=>{if(recentPalaceRoutes.key)safeLocalSet(recentPalaceRoutes.key,JSON.stringify(recentPalaceRoutes.items))},[recentPalaceRoutes]);
 React.useEffect(()=>setNavOpen(false),[location.pathname,location.search]);
 React.useEffect(()=>{setCommandOpen(false);setMobileMoreOpen(false);setCommandQuery('');setCommandIndex(0)},[location.pathname,location.search]);
 React.useEffect(()=>{safeLocalSet('palace-theme',daylight?'daylight':'night')},[daylight]);
 React.useEffect(()=>{safeLocalSet('palace-sidebar-collapsed',sidebarCollapsed?'1':'0')},[sidebarCollapsed]);
 React.useEffect(()=>{const onKey=e=>{if(shouldOpenPalaceQuickNavigation(e)){e.preventDefault();setCommandOpen(v=>!v)}else if(e.key==='Escape'){setCommandOpen(false);setMobileMoreOpen(false);setNavOpen(false)}};window.addEventListener('keydown',onKey);return()=>window.removeEventListener('keydown',onKey)},[]);
 React.useEffect(()=>{
  const syncTitle=event=>{
   if(event.detail?.userId!==session?.user?.id||!event.detail?.title)return;
   setShellProfile(previous=>previous?{...previous,title:event.detail.title}:previous);
  };
  window.addEventListener('palace:profile-title-changed',syncTitle);
  return()=>window.removeEventListener('palace:profile-title-changed',syncTitle);
 },[session?.user?.id]);
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
  {label:'For Writers',path:'/writers',icon:'✎',detail:'Start a private draft and find your writing community',kind:'utility'},
  {label:'The Palace Code',path:'/code',icon:'§',detail:'Rights, safety and community rules',kind:'utility'},
  ...(session?[{label:'Palace Council',path:'/council/governance',icon:'⚖',detail:'Voting, elections, petitions and review',kind:'utility'}]:[])
 ];
 const commandNeedle=commandQuery.trim().toLowerCase();
 const commandMatches=commandItems.filter(item=>commandNeedle&&[item.label,item.detail].join(' ').toLowerCase().includes(commandNeedle)).slice(0,12);
 const activeRoom=visibleRooms.find(r=>location.pathname===r.path||r.sections.some(([,p])=>{const target=resolveRoomPath(p);return target&&location.pathname===target.split('?')[0]})||(r.id==='reading'&&['/comics','/comic/','/work/','/lost-works','/tags','/series'].some(p=>location.pathname.startsWith(p)))||(r.id==='writing'&&location.pathname.startsWith('/writing'))||(r.id==='life'&&['/palace-life','/club/','/search','/honour','/activity'].some(p=>location.pathname.startsWith(p))||(r.id==='life'&&location.pathname.startsWith('/member/')&&location.pathname!==('/member/'+(shellProfile?.username||''))))||(r.id==='events'&&location.pathname.startsWith('/events'))||(r.id==='treasury'&&location.pathname.startsWith('/treasury'))||(r.id==='settings'&&location.pathname.startsWith('/settings')));
 const currentHref=location.pathname+location.search;
 const activeSection=activeRoom?.sections.find(([,path])=>resolveRoomPath(path)===currentHref);
 const passageMap={
  palace:[
   {glyph:'◈',label:'Find a story',detail:'Reading Rooms',path:'/reading'},
   {glyph:'✎',label:'Return to the page',detail:'Writing Chamber',path:session?'/writing':palaceSignInDoor('/writing')},
   {glyph:'♢',label:'See what people are saying',detail:'Palace Life',path:session?'/palace-life':palaceSignInDoor('/palace-life')}
  ],
  reading:[
   {glyph:'▧',label:'Keep what you found',detail:'My Library',path:session?'/library':palaceSignInDoor('/library')},
   {glyph:'♢',label:'Talk about stories',detail:'Palace Commons',path:session?'/palace-life?room=commons':palaceSignInDoor('/palace-life?room=commons')},
   {glyph:'✎',label:'Make something of your own',detail:'Writing Chamber',path:session?'/writing':palaceSignInDoor('/writing')}
  ],
  library:[
   {glyph:'◈',label:'Discover another world',detail:'Reading Rooms',path:'/reading'},
   {glyph:'✎',label:'Open your own manuscript',detail:'Writing Chamber',path:'/writing'},
   {glyph:'♢',label:'Visit the Commons',detail:'Palace Life',path:'/palace-life'}
  ],
  writing:[
   {glyph:'◈',label:'Read for a while',detail:'Reading Rooms',path:'/reading'},
   {glyph:'♢',label:'Bring an idea to the Commons',detail:'Palace Life',path:'/palace-life?room=commons'},
   {glyph:'✧',label:'See writing gatherings',detail:'Events & Heritage',path:'/events?tab=writing'}
  ],
  life:[
   {glyph:'◈',label:'Find something to read',detail:'Reading Rooms',path:'/reading'},
   {glyph:'✎',label:'Take an idea to the page',detail:'Writing Chamber',path:session?'/writing':palaceSignInDoor('/writing')},
   {glyph:'✧',label:'See what is gathering',detail:'Events & Heritage',path:'/events'}
  ],
  events:[
   {glyph:'♢',label:'Continue the conversation',detail:'Palace Life',path:session?'/palace-life':palaceSignInDoor('/palace-life')},
   {glyph:'✎',label:'Write something for it',detail:'Writing Chamber',path:session?'/writing':palaceSignInDoor('/writing')},
   {glyph:'◈',label:'Browse the shelves',detail:'Reading Rooms',path:'/reading'}
  ],
  treasury:[
   {glyph:'☾',label:'Wear it in your Chamber',detail:'My Palace',path:session?(shellProfile?.username?'/member/'+shellProfile.username:'/chamber'):palaceSignInDoor('/chamber')},
   {glyph:'♢',label:'Return to Palace Life',detail:'Community',path:session?'/palace-life':palaceSignInDoor('/palace-life')},
   {glyph:'✧',label:'Find the next gathering',detail:'Events',path:'/events'}
  ],
  settings:[
   {glyph:'☾',label:'Back to your Chamber',detail:'My Palace',path:session?(shellProfile?.username?'/member/'+shellProfile.username:'/chamber'):palaceSignInDoor('/chamber')},
   {glyph:'◈',label:'Reading Rooms',detail:'Return to stories',path:'/reading'},
   {glyph:'♢',label:'Palace Life',detail:'Return to community',path:session?'/palace-life':palaceSignInDoor('/palace-life')}
  ]
 };
 const passageDoors=(activeRoom?passageMap[activeRoom.id]:null)||[
  {glyph:'◈',label:'Read',detail:'Reading Rooms',path:'/reading'},
  {glyph:'♢',label:'Gather',detail:'Palace Life',path:session?'/palace-life':palaceSignInDoor('/palace-life')},
  {glyph:'✎',label:'Write',detail:'Writing Chamber',path:session?'/writing':palaceSignInDoor('/writing')}
 ];
 function wanderFromHere(){const choices=passageDoors.filter(x=>x.path!==currentHref&&!x.path.startsWith('/login'));const pick=choices[Math.floor(Math.random()*choices.length)];if(pick)navigate(pick.path)}

 const recentCommandItems=recentDoorsKey&&recentPalaceRoutes.key===recentDoorsKey?recentPalaceRoutes.items.filter(row=>row.path!==currentHref).slice(0,4):[];
 const defaultCommandItems=[...recentCommandItems,...quickDoors.filter(q=>!recentCommandItems.some(r=>r.path===q.path))].slice(0,8);
 const visibleCommandItems=commandNeedle?commandMatches:defaultCommandItems;
 React.useEffect(()=>{if(!activeRoom||!recentDoorsKey)return;const label=activeSection?.[0]||activeRoom.label;const item={label,path:currentHref,icon:activeRoom.icon,detail:activeSection?activeRoom.label+' · recently visited':'Recently visited',kind:'recent'};setRecentPalaceRoutes(prev=>({key:recentDoorsKey,items:addPalaceRecentDoor(prev.key===recentDoorsKey?prev.items:readPalaceRecentDoors(safeLocalGet,recentDoorsKey),item)}))},[currentHref,activeRoom?.id,activeSection?.[0],recentDoorsKey]);
 React.useEffect(()=>setCommandIndex(0),[commandQuery,commandOpen]);
 function togglePalaceNavigation(){
  if(typeof window!=='undefined'&&window.matchMedia('(min-width:981px)').matches){setSidebarCollapsed(v=>!v);setNavOpen(false);return}
  setNavOpen(v=>!v)
 }
 function submitSearch(e){e.preventDefault();if(search.trim())navigate('/search?q='+encodeURIComponent(search.trim()))}
 function chooseCommand(path){setCommandOpen(false);setCommandQuery('');setCommandIndex(0);navigate(path)}
 function searchCommand(){const q=commandQuery.trim();if(!q)return;setCommandOpen(false);setCommandQuery('');setCommandIndex(0);navigate('/search?q='+encodeURIComponent(q))}
 return <div data-palace-frame="ready" className={"palace-shell full-palace-shell "+(navOpen?'nav-open ':'')+(sidebarCollapsed?'sidebar-collapsed ':'')+(daylight?'daylight':'nightfall')}>
  <a className="skip-to-content" href="#palace-content">Skip to main content</a>
  <aside id="palace-sidebar" className="sidebar full-sidebar" aria-label="Palace navigation">
   <div className="palace-cover-live restored-cover dusk-gif-cover"><img src="/assets/palace/palace-belonging.gif" alt="" aria-hidden="true"/><div className="dusk-cover-glass" aria-hidden="true"/><button className="sidebar-retract" type="button" onClick={()=>setSidebarCollapsed(true)} aria-label="Retract Palace sidebar" title="Retract sidebar">‹</button><button className="nav-close" onClick={()=>setNavOpen(false)} aria-label="Close Palace navigation">×</button></div>
   {session?<Link className="identity-card-live restored-identity" to={shellProfile?.username?"/member/"+shellProfile.username:"/chamber"}><div className={"identity-avatar "+(!shellProfile?.avatar_url?'sigil-fallback':'')}>{shellProfile?.avatar_url?<img src={shellProfile.avatar_url} alt=""/>:<span aria-hidden="true">☾<b>✦</b></span>}</div><div><strong>{shellProfile?.display_name||shellProfile?.username||'Your Chamber'}</strong><span>{shellProfile?.title||'Palace member'}</span></div></Link>:<Link className="identity-card-live guest" to="/login"><div className="identity-avatar">✦</div><div><strong>Enter the Palace</strong><span>Sign in or create your chamber</span></div></Link>}
   <PalaceSidebarNavigation rooms={visibleRooms} activeRoom={activeRoom}
    currentHref={currentHref} currentPath={location.pathname}
    profilePath={shellProfile?.username?'/member/'+shellProfile.username:'/chamber'}
    renderIcon={name=><PalaceRoomIcon name={name}/>} />
   <div className="sidebar-spacer"/><div className="sidebar-foot full-foot">{session&&<><Link to="/letters">✉ <span>Palace Letters</span></Link><Link to="/activity">◌ <span>Moonlight Activity</span></Link></>}<button className="sidebar-theme" onClick={()=>setDaylight(v=>!v)}>{daylight?'☾ Nightfall':'☼ Daylight'}</button></div>
  </aside>
  <button className="nav-scrim" aria-label="Close navigation" onClick={()=>setNavOpen(false)}/>
  <div className="palace-stage full-stage">
   <header className="topbar full-topbar"><div className="full-topbar-row"><div className="full-brand"><button className="nav-toggle" onClick={togglePalaceNavigation} aria-label="Toggle Palace navigation" aria-expanded={navOpen} aria-controls="palace-sidebar">☰</button><Link to="/"><span className="brandmark">☾<b>✦</b></span><strong>The Starry Palace</strong></Link><small>BETA</small>{activeRoom&&<span className="top-room-context" aria-label={'Current room: '+activeRoom.label+(activeSection?' · '+activeSection[0]:'')}><span className={"top-room-sigil top-room-sigil-"+activeRoom.id}><PalaceRoomIcon name={activeRoom.id}/></span> {activeRoom.label}{activeSection&&<><b aria-hidden="true">/</b><em>{activeSection[0]}</em></>}</span>}</div><form className="global-search-live" role="search" aria-label="Search The Starry Palace" onSubmit={submitSearch}><span aria-hidden="true">⌕</span><input aria-label="Search works, writers, tags and fandoms" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search works, writers, tags, fandoms…"/><button type="submit">Search</button></form><div className="full-top-actions"><button className="command-trigger" type="button" onClick={()=>setCommandOpen(true)} aria-label="Open Palace quick navigation" aria-expanded={commandOpen} aria-controls="palace-command-dialog" title="Quick navigation · Ctrl or Command K"><span>⌕</span><kbd>⌘K</kbd></button>{session&&<Link className="top-icon-link" to="/letters" aria-label="Palace Letters">✉</Link>}{session&&<Link className="top-icon-link" style={{position:'relative'}} to="/activity" aria-label={activityBadge?activityBadge+' unread notifications':'Notifications'}>✦{activityBadge>0&&<span className="float-unread-badge">{activityBadge>99?'99+':activityBadge}</span>}</Link>}<Link className="write-action" to={session?'/writing':palaceSignInDoor('/writing')}>✎ <span>Write</span></Link></div></div></header>
   {activeRoom&&<nav className="palace-passage" aria-label="Nearby Palace doors"><div className="palace-passage-context"><span className={"passage-room-sigil passage-room-"+activeRoom.id}><PalaceRoomIcon name={activeRoom.id}/></span><span><small>YOU ARE IN</small><strong>{activeSection?.[0]||activeRoom.label}</strong></span></div><div className="palace-passage-doors">{passageDoors.map(door=><Link key={door.path+door.label} to={door.path}><span aria-hidden="true">{door.glyph}</span><span><strong>{door.label}</strong><small>{!session&&door.path.startsWith('/login?next=')?'Sign in to enter · '+door.detail:door.detail}</small></span></Link>)}</div><button type="button" className="palace-passage-wander" onClick={wanderFromHere} title="Open one of the nearby Palace doors">✧ <span>Wander</span></button></nav>}
   <main id="palace-content" data-palace-route={currentHref} className="palace-main-stage" tabIndex="-1">{children}</main>
   <footer className="palace-footer">
    <div><span className="palace-footer-mark" aria-hidden="true">☾<b>✦</b></span><div><strong>The Starry Palace</strong><small>Gather. Have a cup of tea. Write and read with me.</small></div></div>
    <nav aria-label="Palace footer"><Link to="/writers">For Writers</Link><Link to="/code">Palace Code</Link><Link to="/council/governance">Council</Link><Link to="/beta">Beta feedback</Link><Link to="/search">Search</Link>{session&&<Link to="/settings">Settings & Safety</Link>}</nav>
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
 const{session}=useAuth();
 return <Frame><section className="home-hero realised"><div className="stars" aria-hidden="true">✦　·　✧　　·　✦　　☾</div><div className="hero-copy"><p className="eyebrow">GATHER UNDER KINDRED STARS.</p><h1>There’s a place<br/>for you here.</h1><p className="lede">Come for a wonderful story. Stay for the people who love them. Read a little longer, write at your own pace, and make yourself at home.</p><div className="hero-actions"><Link className="button" to="/reading">Enter the Reading Rooms</Link><Link className="text-link" to={session?'/writing':'/writers'}>{session?'Return to my Writing Chamber →':'Discover the Writer’s Door →'}</Link></div></div><aside className="hero-orbit palace-belonging-panel" aria-label="Your Palace, a place to belong"><img className="palace-belonging-art" src="/assets/palace/palace-belonging.gif" alt=""/><span>YOUR PALACE · A PLACE TO BELONG</span><strong>☾</strong><p>Stories, art, communities, heritage and creative life beneath one shared sky.</p><div><b>READ</b><b>WRITE</b><b>GATHER</b><b>KEEP</b></div></aside></section><PalaceHomeWelcome member={!!session} showCulture={false}/><PalaceResumeReading memberId={session?.user?.id}/><PalaceHomeMore><PalaceStartingPath memberId={session?.user?.id}/><PalaceRoomDirectory rooms={rooms}/><PalaceHomeCulturePaths/><section className="home-intro-strip"><span>EVERY VOICE DESERVES A PLACE</span><span>PRIVATE BY CHOICE</span><span>CREATIVE RIGHTS FIRST</span><span>COMMUNITY WITH BOUNDARIES</span></section><PalaceLiveGatherings/><PalaceNewStories/><section className="palace-paths"><div><p className="eyebrow">A PALACE, NOT A FEED</p><h2>Different rooms for different kinds of attention.</h2><p>Long-form reading does not need to compete with live chat. Private drafts do not need to become public before they are ready. Community, governance and creative ownership each have their own doorway.</p></div><div className="path-list"><Link to="/tags"><span>01</span><strong>Tag Constellation</strong><small>Include what you seek. Exclude what you do not.</small></Link><Link to="/honour"><span>02</span><strong>Throne of Honour</strong><small>Recognition without controlling discovery.</small></Link><Link to="/code"><span>03</span><strong>The Palace Code</strong><small>Rights, safety, moderation and appeals.</small></Link><Link to="/council/governance"><span>04</span><strong>Palace Council</strong><small>Review with a record, not invisible power.</small></Link></div></section><section className="manifesto"><p>EVERY VOICE CARRIES A WORLD.</p><h2>Gather. Have a cup of tea.<br/>Write and read with me.</h2><div><Link to="/reading">Find a story</Link><Link to="/login?mode=signup">Create your chamber</Link></div></section></PalaceHomeMore></Frame>
}
// Keep authentication UI out of the busy Palace shell; both routes share one on-demand module.
const PalaceLogin = React.lazy(() => import('./PalaceAuthGates').then(module => ({ default: module.PalaceLogin })));
const PalaceAuthCallback = React.lazy(() => import('./PalaceAuthGates').then(module => ({ default: module.PalaceAuthCallback })));

function NavigationReset(){
 const location=useLocation();
 React.useEffect(()=>{
  const reset=()=>{try{window.scrollTo({top:0,left:0,behavior:'auto'})}catch{try{window.scrollTo(0,0)}catch{}};if(document.documentElement)document.documentElement.scrollTop=0;if(document.body)document.body.scrollTop=0};
  const frame=requestAnimationFrame(reset);
  return()=>cancelAnimationFrame(frame);
 },[location.pathname]);
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
  const followupTimers=new Set();
  const removeRecovery=()=>document.querySelector('[data-palace-blank-recovery]')?.remove();
  const showRecovery=()=>{
   if(document.querySelector('[data-palace-blank-recovery]'))return;
   const layer=document.createElement('div');
   layer.className='route-recovery blank-screen-recovery';
   layer.dataset.palaceBlankRecovery='true';
   layer.setAttribute('role','alert');
   const protectDrafts=shouldOfferManualPalaceRefresh(location.pathname);
    layer.innerHTML='<div><span aria-hidden="true">☾<b>✦</b></span><h1>This room lost its moonlight.</h1><p>The Palace caught an incomplete screen without discarding your live app state.</p>'+(protectDrafts?'<p>This room may hold unfinished work. Save or export your text before choosing to reload.</p>':'')+'<button type="button">Restore this room</button></div>';
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
   const blankRoot=root.childElementCount===0||rootText.length<3||root.getBoundingClientRect().height<40;
   const blankRoom=!!shell&&!!content&&content.childElementCount===0&&contentText.length<3;
   const visuallyBlank=!!shell&&!!content&&!blankRoom&&isPalaceRoomVisuallyBlank(content,looksInvisible);
   if(!(blankRoot||blankRoom||visuallyBlank)||loader||routeRecovery){if(!blankRoot&&!blankRoom&&!visuallyBlank){content?.classList.remove('palace-visibility-rescue');removeRecovery()}return}
   if(visuallyBlank&&content){
    content.classList.add('palace-visibility-rescue');
    window.clearTimeout(rescueTimer);
    rescueTimer=window.setTimeout(()=>{
     const stillBlank=isPalaceRoomVisuallyBlank(content,looksInvisible);
     if(!stillBlank){content.classList.remove('palace-visibility-rescue');removeRecovery();return}
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
  const scheduleFollowup=delay=>{
   const timer=window.setTimeout(()=>{followupTimers.delete(timer);inspect()},delay);
   followupTimers.add(timer);
  };
  const onPageShow=event=>scheduleFollowup(event.persisted?120:260);
  const onVisible=()=>{if(document.visibilityState==='visible')scheduleFollowup(180)};
  window.addEventListener('pageshow',onPageShow);
  document.addEventListener('visibilitychange',onVisible);
  return()=>{window.clearTimeout(firstTimer);window.clearTimeout(secondTimer);window.clearTimeout(rescueTimer);followupTimers.forEach(timer=>window.clearTimeout(timer));followupTimers.clear();document.getElementById('palace-content')?.classList.remove('palace-visibility-rescue');removeRecovery();window.removeEventListener('pageshow',onPageShow);document.removeEventListener('visibilitychange',onVisible)};
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
   return <div className="route-recovery palace-room-recovery" role="alert"><div><span aria-hidden="true">☾<b>✦</b></span><h1>This room did not finish opening.</h1><p>The Palace shell is still running. This problem was isolated to the current room.</p>{shouldOfferManualPalaceRefresh(this.props.path?.split(/[?#]/)[0])&&<p>This room may hold unfinished work. Save or export your text before choosing to reload.</p>}<code className="palace-error-detail">{message}</code><small className="palace-error-path">Room: {this.props.path||window.location.pathname}</small><button type="button" onClick={()=>this.setState({error:null})}>Try this room again</button><Link to="/chamber">Return to My Palace</Link></div></div>;
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

function PalaceChatHost(){const {session}=useAuth();return <PalaceChatDrawer userId={session?.user?.id}/>}

function App(){const location=useLocation();return <AuthProvider><PalaceRouteSeo pathname={location.pathname}/><PalaceBuildFreshnessWatch/><NavigationReset/><RouteStateReset/><BlankScreenWatchdog/><Frame><RouteGuard><Routes>
 <Route path="/" element={<Home/>}/><Route path="/login" element={<React.Suspense fallback={<RouteLoading/>}><PalaceLogin Frame={Frame}/></React.Suspense>}/><Route path="/auth/callback" element={<React.Suspense fallback={<RouteLoading/>}><PalaceAuthCallback Frame={Frame}/></React.Suspense>}/>
 <Route path="/welcome" element={<ProtectedRoute><OnboardingLive Frame={Frame}/></ProtectedRoute>}/>
 <Route path="/chamber" element={<ProtectedRoute><ChamberLive Frame={Frame}/></ProtectedRoute>}/>
 <Route path="/writers" element={<WriterWelcome/>}/>
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
 <Route path="/grand-palaces" element={<ProtectedRoute><React.Suspense fallback={<RouteLoading/>}><GrandPalaceHall Frame={Frame}/></React.Suspense></ProtectedRoute>}/>
 <Route path="/treasury" element={<ProtectedRoute><TreasuryLive Frame={Frame}/></ProtectedRoute>}/>
 <Route path="/treasury/catalogue" element={<ProtectedRoute><React.Suspense fallback={<RouteLoading/>}><TreasuryCatalogueLazy Frame={Frame}/></React.Suspense></ProtectedRoute>}/>
 <Route path="/lost-works" element={<LostWorksLive Frame={Frame}/>}/>
 <Route path="/settings" element={<ProtectedRoute><SettingsLive Frame={Frame}/></ProtectedRoute>}/>
 <Route path="/activity" element={<ProtectedRoute><ActivityLive Frame={Frame}/></ProtectedRoute>}/>
 <Route path="/library" element={<ProtectedRoute><LibraryLive Frame={Frame}/></ProtectedRoute>}/>
 <Route path="/letters" element={<ProtectedRoute><LettersLive Frame={Frame}/></ProtectedRoute>}/>
 <Route path="/tags" element={<TagSearchLive Frame={Frame}/>}/>
  <Route path="/fandoms" element={<React.Suspense fallback={<RouteLoading/>}><Frame><PalaceFandomAtlas/></Frame></React.Suspense>}/>
 <Route path="/search" element={<SearchLive Frame={Frame}/>}/><Route path="/honour" element={<HonourLive Frame={Frame}/>}/><Route path="/council" element={<ProtectedRoute><CouncilLive Frame={Frame}/></ProtectedRoute>}/><Route path="/council/governance" element={<ProtectedRoute><React.Suspense fallback={<RouteLoading/>}><PalaceGovernance Frame={Frame}/></React.Suspense></ProtectedRoute>}/><Route path="/code" element={<CodeLive Frame={Frame}/>}/><Route path="/beta" element={<React.Suspense fallback={<RouteLoading/>}><PalaceBetaGuide Frame={Frame}/></React.Suspense>}/>
 <Route path="/member/:username" element={<MemberProfileLive Frame={Frame}/>}/>
 <Route path="*" element={<Frame><section className="lost-gates-page"><div className="lost-gates-orbit"><span>☾</span><i>✦</i></div><p className="eyebrow">BEYOND THE GATES</p><h1>You left palace grounds.</h1><p>The path thinned, the lamps disappeared, and somehow you wandered beyond the Palace walls.</p><div className="lost-gates-actions"><Link className="button" to="/">Return to the Palace</Link><Link to="/search">Search for a room →</Link></div></section></Frame>}/>
 </Routes></RouteGuard><PalaceChatHost/></Frame></AuthProvider>}

createRoot(document.getElementById('root')).render(<React.StrictMode><PalaceRootBoundary><BrowserRouter><App/></BrowserRouter></PalaceRootBoundary></React.StrictMode>);


