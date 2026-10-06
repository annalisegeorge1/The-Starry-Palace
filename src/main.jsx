import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Link, NavLink, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, ProtectedRoute, useAuth } from './auth';
import { configured, supabase } from './supabase';
import './style.css';
import './polish.css';

const chunkErrorPattern=/dynamically imported module|importing a module script failed|failed to fetch|chunkloaderror|loading chunk/i;
function reloadForStaleChunk(error){
 const message=String(error?.message||error||'');
 if(typeof window==='undefined'||!chunkErrorPattern.test(message))throw error;
 const key='palace-chunk-auto-reload';
 const last=Number(sessionStorage.getItem(key)||0);
 if(Date.now()-last>12000){
  sessionStorage.setItem(key,String(Date.now()));
  window.setTimeout(()=>window.location.reload(),40);
  return new Promise(()=>{});
 }
 throw error;
}
function importWithRecovery(importer){return importer().catch(reloadForStaleChunk)}

if(typeof window!=='undefined'){
 window.addEventListener('vite:preloadError',event=>{
  event.preventDefault();
  const key='palace-preload-reload';
  const last=Number(sessionStorage.getItem(key)||0);
  if(Date.now()-last>12000){
   sessionStorage.setItem(key,String(Date.now()));
   window.setTimeout(()=>window.location.reload(),40);
  }
 });
 window.addEventListener('unhandledrejection',event=>{
  const message=String(event.reason?.message||event.reason||'');
  if(!chunkErrorPattern.test(message))return;
  event.preventDefault();
  const key='palace-rejected-chunk-reload';
  const last=Number(sessionStorage.getItem(key)||0);
  if(Date.now()-last>12000){
   sessionStorage.setItem(key,String(Date.now()));
   window.setTimeout(()=>window.location.reload(),60);
  }
 });
}
function roomCssMatches(mod){
 if(typeof window==='undefined'||!mod?.PALACE_ROOM_CSS_VERSION)return true;
 const cssVersion=Number(getComputedStyle(document.documentElement).getPropertyValue('--palace-room-css-version').trim()||0);
 if(cssVersion===Number(mod.PALACE_ROOM_CSS_VERSION))return true;
 const key='palace-room-css-sync-reload';
 const last=Number(sessionStorage.getItem(key)||0);
 if(Date.now()-last>12000){
  sessionStorage.setItem(key,String(Date.now()));
  window.setTimeout(()=>window.location.reload(),80);
 }
 // palace-room-css-nonblocking: never strand a route on a permanently pending lazy promise.
 return true;
}
const lazyRoom=name=>React.lazy(()=>importWithRecovery(()=>import('./liveRooms')).then(mod=>{
 roomCssMatches(mod);
 if(!mod?.[name])throw new Error('Palace room '+name+' is unavailable in this build.');
 return{default:mod[name]};
}));
const ChamberLive=lazyRoom('ChamberLive'),OnboardingLive=lazyRoom('OnboardingLive'),ReadingLive=lazyRoom('ReadingLive'),ClubLive=lazyRoom('ClubLive'),WritingLive=lazyRoom('WritingLive'),SettingsLive=lazyRoom('SettingsLive'),ActivityLive=lazyRoom('ActivityLive'),LibraryLive=lazyRoom('LibraryLive'),PalaceLifeLive=lazyRoom('PalaceLifeLive'),LettersLive=lazyRoom('LettersLive'),EventsLive=lazyRoom('EventsLive'),TreasuryLive=lazyRoom('TreasuryLive'),LostWorksLive=lazyRoom('LostWorksLive'),MemberProfileLive=lazyRoom('MemberProfileLive'),SearchLive=lazyRoom('SearchLive'),WorkLive=lazyRoom('WorkLive'),ChapterLive=lazyRoom('ChapterLive'),WorkStudioLive=lazyRoom('WorkStudioLive'),TagSearchLive=lazyRoom('TagSearchLive'),HonourLive=lazyRoom('HonourLive'),CouncilLive=lazyRoom('CouncilLive'),CodeLive=lazyRoom('CodeLive'),ComicsLive=lazyRoom('ComicsLive'),ComicLive=lazyRoom('ComicLive'),ComicEpisodeLive=lazyRoom('ComicEpisodeLive'),ComicStudioLive=lazyRoom('ComicStudioLive'),SeriesLive=lazyRoom('SeriesLive');
const TreasuryCatalogue=React.lazy(()=>importWithRecovery(()=>import('./Treasury')));

const rooms=[
  ['Reading Rooms','/reading','Read, discover and return to the stories waiting for you.'],
  ['Comics Gallery','/comics','Sequential art with creator-controlled rights, accessibility and reading direction.'],
  ['Writing Chamber','/writing','Draft, publish and tend the worlds you are creating.'],
  ['Palace Life','/palace-life','Clubs, Commons, Moonlight Chat and kindred stars.'],
  ['Events & Heritage','/events','Creative gatherings and carefully sourced heritage observances.'],
  ['Royal Treasury','/treasury','Achievements, gifts, court honours and your collection.'],
  ['Lost Works','/lost-works','A rights-conscious preservation archive for works at risk of being lost.']
];

const fullPalaceRooms=[
 {id:'palace',icon:'☾',label:'My Palace',path:'/chamber',private:true,sections:[
  ['Home','/chamber'],['My chamber','/member'],['Notifications','/activity'],['Messages','/letters'],['Invitations','/events?tab=calendar']
 ]},
 {id:'reading',icon:'◈',label:'Reading Rooms',path:'/reading',sections:[
  ['All works','/reading'],['Comics','/comics'],['Lost Works','/lost-works'],['Series','/series'],['Tags','/tags']
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

function Frame({children,privateArea=false}){
 const {session}=useAuth();
 const [navOpen,setNavOpen]=useState(false);
 const [daylight,setDaylight]=useState(()=>localStorage.getItem('palace-theme')==='daylight');
 const [search,setSearch]=useState('');
 const [commandOpen,setCommandOpen]=useState(false);
 const [commandQuery,setCommandQuery]=useState('');
 const [shellProfile,setShellProfile]=useState(null);
 const [letterBadge,setLetterBadge]=useState(0);
 const [activityBadge,setActivityBadge]=useState(0);
 const location=useLocation();const navigate=useNavigate();
 React.useEffect(()=>setNavOpen(false),[location.pathname]);
 React.useEffect(()=>{setCommandOpen(false);setCommandQuery('')},[location.pathname,location.search]);
 React.useEffect(()=>localStorage.setItem('palace-theme',daylight?'daylight':'night'),[daylight]);
 React.useEffect(()=>{const onKey=e=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();setCommandOpen(v=>!v)}else if(e.key==='Escape')setCommandOpen(false)};window.addEventListener('keydown',onKey);return()=>window.removeEventListener('keydown',onKey)},[]);
 React.useEffect(()=>{let alive=true;if(!session){setShellProfile(null);setLetterBadge(0);setActivityBadge(0);return;}Promise.all([supabase.from('profiles').select('username,display_name,title,avatar_url,cover_url').eq('id',session.user.id).maybeSingle(),supabase.from('message_requests').select('id',{count:'exact',head:true}).eq('recipient_id',session.user.id).eq('status','pending'),supabase.from('notifications').select('id',{count:'exact',head:true}).eq('user_id',session.user.id).eq('unread',true).eq('dismissed',false)]).then(([profileReq,letterReq,activityReq])=>{if(!alive)return;setShellProfile(profileReq.data||null);setLetterBadge(letterReq.count||0);setActivityBadge(activityReq.count||0)});return()=>{alive=false}},[session?.user?.id,location.pathname]);
 const visibleRooms=fullPalaceRooms.filter(r=>!r.private||session);
 const commandItems=[
  ...visibleRooms.map(r=>({label:r.label,path:r.path,icon:r.icon,detail:r.sections?.[0]?.[0]||'Palace room'})),
  {label:'Search the Palace',path:'/search',icon:'⌕',detail:'Works, writers, tags and clubs'},
  {label:'The Palace Code',path:'/code',icon:'§',detail:'Rights, safety and community rules'},
  {label:'Palace Council',path:'/council',icon:'⚖',detail:'Stewardship and review'}
 ];
 const commandMatches=commandItems.filter(item=>!commandQuery.trim()||[item.label,item.detail].join(' ').toLowerCase().includes(commandQuery.trim().toLowerCase())).slice(0,12);
 const activeRoom=visibleRooms.find(r=>location.pathname===r.path||r.sections.some(([,p])=>{const target=p==='/member'&&shellProfile?.username?'/member/'+shellProfile.username:p;return target&&location.pathname===target})||(r.id==='reading'&&['/comics','/comic/','/work/','/lost-works','/tags','/series'].some(p=>location.pathname.startsWith(p)))||(r.id==='writing'&&location.pathname.startsWith('/writing'))||(r.id==='life'&&['/palace-life','/club/','/search','/honour','/activity'].some(p=>location.pathname.startsWith(p))||(r.id==='life'&&location.pathname.startsWith('/member/')&&location.pathname!==('/member/'+(shellProfile?.username||''))))||(r.id==='events'&&location.pathname.startsWith('/events'))||(r.id==='treasury'&&location.pathname.startsWith('/treasury'))||(r.id==='settings'&&location.pathname.startsWith('/settings')));
 const currentHref=location.pathname+location.search;
 const profileInitial=(shellProfile?.display_name||shellProfile?.username||session?.user?.email||'P').slice(0,1).toUpperCase();
 function submitSearch(e){e.preventDefault();if(search.trim())navigate('/search?q='+encodeURIComponent(search.trim()))}
 function chooseCommand(path){setCommandOpen(false);setCommandQuery('');navigate(path)}
 function searchCommand(){const q=commandQuery.trim();if(!q)return;setCommandOpen(false);setCommandQuery('');navigate('/search?q='+encodeURIComponent(q))}
 return <div className={"palace-shell full-palace-shell "+(navOpen?'nav-open ':'')+(daylight?'daylight':'nightfall')}>
  <a className="skip-to-content" href="#palace-content">Skip to main content</a>
  <aside className="sidebar full-sidebar" aria-label="Palace navigation">
   <div className="palace-cover-live restored-cover dusk-gif-cover"><img src="/assets/palace/palace-belonging.gif" alt="" aria-hidden="true"/><div className="dusk-cover-glass" aria-hidden="true"/><button className="nav-close" onClick={()=>setNavOpen(false)} aria-label="Close Palace navigation">×</button></div>
   {session?<Link className="identity-card-live restored-identity" to={shellProfile?.username?"/member/"+shellProfile.username:"/chamber"}><div className={"identity-avatar "+(!shellProfile?.avatar_url?'sigil-fallback':'')}>{shellProfile?.avatar_url?<img src={shellProfile.avatar_url} alt=""/>:<span aria-hidden="true">☾<b>✦</b></span>}</div><div><strong>{shellProfile?.display_name||shellProfile?.username||'Your Chamber'}</strong><span>{shellProfile?.title||'Palace member'}</span></div></Link>:<Link className="identity-card-live guest" to="/login"><div className="identity-avatar">✦</div><div><strong>Enter the Palace</strong><span>Sign in or create your chamber</span></div></Link>}
   <p className="nav-section-label">EXPLORE THE PALACE</p>
   <nav className="full-room-nav">{visibleRooms.map(room=>{const active=activeRoom?.id===room.id;return <div className="full-nav-room" key={room.id}><NavLink className={active?'active':''} to={room.path}><i>{room.icon}</i><span>{room.label}</span></NavLink>{active&&<div className="full-subnav"><small>SECTIONS</small>{room.sections.map(([label,path])=>{const target=path==='/member'?(shellProfile?.username?'/member/'+shellProfile.username:'/chamber'):path;const current=currentHref===target||(target==='/chamber'&&location.pathname==='/chamber'&&!location.search);return <Link key={label} className={current?'active':''} aria-current={current?'page':undefined} to={target}><span>{label}</span></Link>})}</div>}</div>})}</nav>
   <p className="nav-section-label stewardship-label">STEWARDSHIP</p>
   <nav className="full-room-nav secondary"><div className="full-nav-room"><NavLink to="/council"><i>⚖</i><span>Palace Council</span></NavLink>{location.pathname.startsWith('/council')&&<div className="full-subnav"><small>SECTIONS</small><span className="restored-static">Council overview</span><span className="restored-static">Moderation desk</span><span className="restored-static">Palace Tidings desk</span><span className="restored-static">Cases & appeals</span></div>}</div><div className="full-nav-room"><NavLink to="/code"><i>§</i><span>The Palace Code</span></NavLink>{location.pathname.startsWith('/code')&&<div className="full-subnav"><small>SECTIONS</small><span className="restored-static">Community conduct</span><span className="restored-static">Safety & privacy</span><span className="restored-static">Member rights</span><span className="restored-static">Appeals</span></div>}</div></nav>
   <div className="sidebar-spacer"/><div className="sidebar-foot full-foot">{session&&<><Link to="/letters">✉ <span>Palace Letters</span></Link><Link to="/activity">◌ <span>Moonlight Activity</span></Link></>}<button className="sidebar-theme" onClick={()=>setDaylight(v=>!v)}>{daylight?'☾ Nightfall':'☼ Daylight'}</button></div>
  </aside>
  <button className="nav-scrim" aria-label="Close navigation" onClick={()=>setNavOpen(false)}/>
  <div className="palace-stage full-stage">
   <header className="topbar full-topbar"><div className="full-topbar-row"><div className="full-brand"><button className="nav-toggle" onClick={()=>setNavOpen(true)} aria-label="Open Palace navigation">☰</button><Link to="/"><span className="brandmark">☾<b>✦</b></span><strong>The Starry Palace</strong></Link><small>BETA</small>{activeRoom&&<span className="top-room-context" aria-label={'Current room: '+activeRoom.label}>{activeRoom.icon} {activeRoom.label}</span>}</div><form className="global-search-live" role="search" aria-label="Search The Starry Palace" onSubmit={submitSearch}><span aria-hidden="true">⌕</span><input aria-label="Search works, writers, tags and fandoms" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search works, writers, tags, fandoms…"/><button type="submit">Search</button></form><div className="full-top-actions"><button className="command-trigger" type="button" onClick={()=>setCommandOpen(true)} aria-label="Open Palace quick navigation" title="Quick navigation · Ctrl or Command K"><span>⌕</span><kbd>⌘K</kbd></button>{session&&<Link className="top-icon-link" to="/letters" aria-label="Palace Letters">✉</Link>}{session&&<Link className="top-icon-link" style={{position:'relative'}} to="/activity" aria-label={activityBadge?activityBadge+' unread notifications':'Notifications'}>✦{activityBadge>0&&<span className="float-unread-badge">{activityBadge>99?'99+':activityBadge}</span>}</Link>}<Link className="write-action" to={session?'/writing':'/login'}>✎ <span>Write</span></Link></div></div></header>
   <main id="palace-content" className="palace-main-stage" tabIndex="-1">{children}</main>
   <footer className="palace-footer">
    <div><span className="palace-footer-mark" aria-hidden="true">☾<b>✦</b></span><div><strong>The Starry Palace</strong><small>Gather. Have a cup of tea. Write and read with me.</small></div></div>
    <nav aria-label="Palace footer"><Link to="/code">Palace Code</Link><Link to="/council">Council</Link><Link to="/search">Search</Link>{session&&<Link to="/settings">Settings & Safety</Link>}</nav>
   </footer>
  </div>
  {commandOpen&&<div className="palace-command-backdrop" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)setCommandOpen(false)}}>
    <section className="palace-command" role="dialog" aria-modal="true" aria-label="Palace quick navigation and search">
      <header><span aria-hidden="true">⌕</span><input autoFocus value={commandQuery} onChange={e=>setCommandQuery(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();commandMatches[0]?chooseCommand(commandMatches[0].path):searchCommand()}}} placeholder="Go to a room or search the Palace…" aria-label="Search Palace rooms or content"/><kbd>ESC</kbd></header>
      <div className="palace-command-results">{commandQuery.trim()&&<button className="command-search-all" onClick={searchCommand}><span className="command-icon">⌕</span><span><strong>Search all Palace content</strong><small>Stories, comics, writers, tags, fandoms and clubs for “{commandQuery.trim()}”</small></span><em>Search</em></button>}{commandMatches.length?commandMatches.map((item,i)=><button key={item.path} onClick={()=>chooseCommand(item.path)}><span className="command-icon">{item.icon}</span><span><strong>{item.label}</strong><small>{item.detail}</small></span>{i===0&&<em>Enter</em>}</button>):!commandQuery.trim()&&<div className="command-empty"><span>☾</span><p>Begin typing to find a Palace room or search across its content.</p></div>}</div>
      <footer><span>Ctrl/⌘ K to open</span><span>Rooms first · full search available</span><span>Esc to close</span></footer>
    </section>
   </div>}
  {session&&<div className="floating-controls restored-floating-controls">
    <Link className="float-btn palace-float-sigil notification-anchor" to="/letters" aria-label="Open Palace Letters" title="Palace Letters"><span className="float-letter-art">✉</span>{letterBadge>0&&<span className="float-unread-badge">{letterBadge>99?'99+':letterBadge}</span>}</Link>
    <button className="float-btn theme-orb" onClick={()=>setDaylight(v=>!v)} aria-label={daylight?'Switch to night mode':'Switch to light mode'} title={daylight?'Night mode':'Light mode'}><span className="theme-main">{daylight?'☾':'☼'}</span><span className="theme-star">✦</span></button>
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

function LegacyChamber(){
 const {session}=useAuth(); const navigate=useNavigate(); const [busy,setBusy]=useState(false); const [error,setError]=useState('');
 async function signOut(){setBusy(true);try{const{error}=await supabase.auth.signOut();if(error)throw error;navigate('/',{replace:true})}catch(e){setError(e.message)}finally{setBusy(false)}}
 return <Frame privateArea><section className="chamber-head"><p className="eyebrow">MY CHAMBER</p><h1>Welcome home.</h1><p className="lede">Your private doorway into everything you read, write, collect and share.</p></section><section className="chamber-grid"><article className="chamber-card feature"><small>CONTINUE</small><h2>Your Palace is ready.</h2><p>Your secure session is active as <strong>{session.user.email}</strong>. Reading continuity and live shelves are the next data connection.</p><Link to="/reading">Go to Reading Rooms →</Link></article><article className="chamber-card"><small>CREATE</small><h2>Writing Chamber</h2><p>Return to drafts, chapters and collaborations.</p><Link to="/writing">Open chamber →</Link></article><article className="chamber-card"><small>COLLECT</small><h2>Royal Treasury</h2><p>Badges, gifts and court honours live here.</p><Link to="/treasury">View treasury →</Link></article><article className="chamber-card"><small>COMMUNITY</small><h2>Palace Life</h2><p>Find your clubs, Commons and Moonlight conversations.</p><Link to="/palace-life">Enter Palace Life →</Link></article></section><div className="account-strip"><span>Signed in securely</span><button className="quiet-button" onClick={signOut} disabled={busy}>{busy?'Leaving…':'Leave the Palace'}</button>{error&&<span role="alert">{error}</span>}</div></Frame>
}

function Room({title,eyebrow,description,protectedRoom=false}){
 const content=<Frame privateArea={protectedRoom}><section className="room-title"><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p className="lede">{description}</p><div className="coming"><span>PRODUCTION ROOM</span><h2>The doors are open. The furniture comes next.</h2><p>This route now belongs to the production Palace shell. Its existing prototype experience will be connected to Supabase here without pretending unfinished data is live.</p></div></section></Frame>;
 return protectedRoom?<ProtectedRoute>{content}</ProtectedRoute>:content;
}

function Callback(){const{session,loading,error}=useAuth();const p=new URLSearchParams(window.location.search);if(p.has('error')||error)return <Frame><section className="room-title"><h1>Sign-in could not finish</h1><p role="alert">{p.get('error_description')||error||'Please try again.'}</p><Link to="/login">Return to the Palace gates</Link></section></Frame>;if(loading)return <p role="status">Completing sign-in…</p>;return <Navigate to={session?'/chamber':'/login'} replace/>}


function NavigationReset(){
 const location=useLocation();
 React.useEffect(()=>{
  const reset=()=>{window.scrollTo({top:0,left:0,behavior:'auto'});document.documentElement.scrollTop=0;document.body.scrollTop=0};
  const frame=requestAnimationFrame(reset);
  return()=>cancelAnimationFrame(frame);
 },[location.pathname,location.search]);
 return null;
}
function RouteLoading(){
 const[slow,setSlow]=useState(false);
 React.useEffect(()=>{const timer=window.setTimeout(()=>setSlow(true),2200);return()=>window.clearTimeout(timer)},[]);
 return <div className="route-loading" role="status" aria-live="polite"><div className="route-loading-card"><span className="route-loading-mark" aria-hidden="true">☾<b>✦</b></span><strong>Opening this Palace room…</strong><small>{slow?'This is taking longer than usual. You can safely reload the room.':'Gathering the room beneath the stars.'}</small>{slow&&<button onClick={()=>window.location.reload()}>Reload room</button>}</div></div>
}
function RoomBundleWarmup(){
 React.useEffect(()=>{
  const connection=navigator.connection||navigator.mozConnection||navigator.webkitConnection;
  if(connection?.saveData||/2g/.test(connection?.effectiveType||''))return;
  const warm=()=>{importWithRecovery(()=>import('./liveRooms')).catch(()=>{})};
  if('requestIdleCallback'in window){
   const id=window.requestIdleCallback(warm,{timeout:2500});
   return()=>window.cancelIdleCallback?.(id);
  }
  const timer=window.setTimeout(warm,1200);
  return()=>window.clearTimeout(timer);
 },[]);
 return null
}
class RouteErrorBoundary extends React.Component{
 constructor(props){super(props);this.state={error:null}}
 static getDerivedStateFromError(error){return{error}}
 componentDidCatch(error){console.error('Palace route failed to render',error)}
 render(){
  if(this.state.error)return <div className="route-recovery" role="alert"><div><span aria-hidden="true">☾<b>✦</b></span><h1>This room did not finish opening.</h1><p>Your place is safe. Reload the room to restore the newest Palace files.</p><button onClick={()=>window.location.reload()}>Reload this room</button></div></div>;
  return this.props.children
 }
}
function RouteGuard({children}){
 const location=useLocation();
 return <RouteErrorBoundary key={location.pathname+location.search}>{children}</RouteErrorBoundary>
}

function App(){return <AuthProvider><NavigationReset/><RoomBundleWarmup/><RouteGuard><React.Suspense fallback={<RouteLoading/>}><Routes>
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
 <Route path="/treasury/catalogue" element={<ProtectedRoute><TreasuryCatalogue Frame={Frame}/></ProtectedRoute>}/>
 <Route path="/lost-works" element={<LostWorksLive Frame={Frame}/>}/>
 <Route path="/settings" element={<ProtectedRoute><SettingsLive Frame={Frame}/></ProtectedRoute>}/>
 <Route path="/activity" element={<ProtectedRoute><ActivityLive Frame={Frame}/></ProtectedRoute>}/>
 <Route path="/library" element={<ProtectedRoute><LibraryLive Frame={Frame}/></ProtectedRoute>}/>
 <Route path="/letters" element={<ProtectedRoute><LettersLive Frame={Frame}/></ProtectedRoute>}/>
 <Route path="/tags" element={<TagSearchLive Frame={Frame}/>}/>
 <Route path="/search" element={<SearchLive Frame={Frame}/>}/><Route path="/honour" element={<HonourLive Frame={Frame}/>}/><Route path="/council" element={<ProtectedRoute><CouncilLive Frame={Frame}/></ProtectedRoute>}/><Route path="/code" element={<CodeLive Frame={Frame}/>}/>
 <Route path="/member/:username" element={<MemberProfileLive Frame={Frame}/>}/>
 <Route path="*" element={<Frame><section className="lost-gates-page"><div className="lost-gates-orbit"><span>☾</span><i>✦</i></div><p className="eyebrow">BEYOND THE GATES</p><h1>You left palace grounds.</h1><p>The path thinned, the lamps disappeared, and somehow you wandered beyond the Palace walls.</p><div className="lost-gates-actions"><Link className="button" to="/">Return to the Palace</Link><Link to="/search">Search for a room →</Link></div></section></Frame>}/>
 </Routes></React.Suspense></RouteGuard></AuthProvider>}

createRoot(document.getElementById('root')).render(<React.StrictMode><BrowserRouter><App/></BrowserRouter></React.StrictMode>);


