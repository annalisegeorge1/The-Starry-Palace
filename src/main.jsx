import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Link, NavLink, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, ProtectedRoute, useAuth } from './auth';
import { configured, supabase } from './supabase';
import './style.css';

if(typeof window!=='undefined'){
 window.addEventListener('vite:preloadError',event=>{
  event.preventDefault();
  const key='palace-preload-reload';
  const last=Number(sessionStorage.getItem(key)||0);
  if(Date.now()-last>15000){
   sessionStorage.setItem(key,String(Date.now()));
   window.location.reload();
  }
 });
}
const lazyRoom=name=>React.lazy(()=>import('./liveRooms').then(mod=>({default:mod[name]})));
const ChamberLive=lazyRoom('ChamberLive'),ReadingLive=lazyRoom('ReadingLive'),ClubLive=lazyRoom('ClubLive'),WritingLive=lazyRoom('WritingLive'),SettingsLive=lazyRoom('SettingsLive'),ActivityLive=lazyRoom('ActivityLive'),LibraryLive=lazyRoom('LibraryLive'),PalaceLifeLive=lazyRoom('PalaceLifeLive'),LettersLive=lazyRoom('LettersLive'),EventsLive=lazyRoom('EventsLive'),TreasuryLive=lazyRoom('TreasuryLive'),LostWorksLive=lazyRoom('LostWorksLive'),MemberProfileLive=lazyRoom('MemberProfileLive'),SearchLive=lazyRoom('SearchLive'),WorkLive=lazyRoom('WorkLive'),ChapterLive=lazyRoom('ChapterLive'),WorkStudioLive=lazyRoom('WorkStudioLive'),TagSearchLive=lazyRoom('TagSearchLive'),HonourLive=lazyRoom('HonourLive'),CouncilLive=lazyRoom('CouncilLive'),CodeLive=lazyRoom('CodeLive'),ComicsLive=lazyRoom('ComicsLive'),ComicLive=lazyRoom('ComicLive'),ComicEpisodeLive=lazyRoom('ComicEpisodeLive'),ComicStudioLive=lazyRoom('ComicStudioLive'),SeriesLive=lazyRoom('SeriesLive');
const TreasuryCatalogue=React.lazy(()=>import('./Treasury'));

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
  ['Badges & gifts','/treasury'],['Lucky draw & 520+ prizes','/treasury?tab=draw'],['Monthly rankings','/treasury?tab=rankings']
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
 const [shellProfile,setShellProfile]=useState(null);
 const [letterBadge,setLetterBadge]=useState(0);
 const location=useLocation();const navigate=useNavigate();
 React.useEffect(()=>setNavOpen(false),[location.pathname]);
 React.useEffect(()=>localStorage.setItem('palace-theme',daylight?'daylight':'night'),[daylight]);
 React.useEffect(()=>{let alive=true;if(!session){setShellProfile(null);setLetterBadge(0);return;}Promise.all([supabase.from('profiles').select('username,display_name,title,avatar_url,cover_url').eq('id',session.user.id).maybeSingle(),supabase.from('message_requests').select('id',{count:'exact',head:true}).eq('recipient_id',session.user.id).eq('status','pending')]).then(([profileReq,letterReq])=>{if(!alive)return;setShellProfile(profileReq.data||null);setLetterBadge(letterReq.count||0)});return()=>{alive=false}},[session?.user?.id,location.pathname]);
 const visibleRooms=fullPalaceRooms.filter(r=>!r.private||session);
 const activeRoom=visibleRooms.find(r=>location.pathname===r.path||r.sections.some(([,p])=>{const target=p==='/member'&&shellProfile?.username?'/member/'+shellProfile.username:p;return target&&location.pathname===target})||(r.id==='reading'&&['/comics','/lost-works','/tags'].some(p=>location.pathname.startsWith(p)))||(r.id==='writing'&&location.pathname.startsWith('/writing'))||(r.id==='life'&&['/palace-life','/search','/honour','/activity'].some(p=>location.pathname.startsWith(p)))||(r.id==='events'&&location.pathname.startsWith('/events'))||(r.id==='treasury'&&location.pathname.startsWith('/treasury'))||(r.id==='settings'&&location.pathname.startsWith('/settings')));
 const currentHref=location.pathname+location.search;
 const profileInitial=(shellProfile?.display_name||shellProfile?.username||session?.user?.email||'P').slice(0,1).toUpperCase();
 function submitSearch(e){e.preventDefault();if(search.trim())navigate('/search?q='+encodeURIComponent(search.trim()))}
 return <div className={"palace-shell full-palace-shell "+(navOpen?'nav-open ':'')+(daylight?'daylight':'nightfall')}>
  <aside className="sidebar full-sidebar" aria-label="Palace navigation">
   <div className="palace-cover-live restored-cover" style={shellProfile?.cover_url?{backgroundImage:`linear-gradient(180deg,transparent,rgba(5,8,20,.82)),url("${shellProfile.cover_url}")`}:undefined}><div className="palace-cover-stars">✦　·　✧　　☾　·　✦</div><div className="cover-sigil"><span>☾</span><i>✦</i></div><div className="cover-copy"><strong>The Starry Palace</strong><span>Your place among the stars</span></div><button className="nav-close" onClick={()=>setNavOpen(false)} aria-label="Close Palace navigation">×</button></div>
   {session?<Link className="identity-card-live restored-identity" to={shellProfile?.username?"/member/"+shellProfile.username:"/chamber"}><div className={"identity-avatar "+(!shellProfile?.avatar_url?'sigil-fallback':'')}>{shellProfile?.avatar_url?<img src={shellProfile.avatar_url} alt=""/>:<span aria-hidden="true">☾<b>✦</b></span>}</div><div><strong>{shellProfile?.display_name||shellProfile?.username||'Your Chamber'}</strong><span>{shellProfile?.title||'Palace member'}</span></div></Link>:<Link className="identity-card-live guest" to="/login"><div className="identity-avatar">✦</div><div><strong>Enter the Palace</strong><span>Sign in or create your chamber</span></div></Link>}
   <p className="nav-section-label">EXPLORE THE PALACE</p>
   <nav className="full-room-nav">{visibleRooms.map(room=>{const active=activeRoom?.id===room.id;return <div className="full-nav-room" key={room.id}><NavLink className={active?'active':''} to={room.path}><i>{room.icon}</i><span>{room.label}</span></NavLink>{active&&<div className="full-subnav"><small>SECTIONS</small>{room.sections.map(([label,path])=>{const target=path==='/member'?(shellProfile?.username?'/member/'+shellProfile.username:'/chamber'):path;return <Link key={label} className={currentHref===target||(target==='/chamber'&&location.pathname==='/chamber'&&!location.search)?'active':''} to={target}><span>{label}</span></Link>})}</div>}</div>})}</nav>
   <p className="nav-section-label stewardship-label">STEWARDSHIP</p>
   <nav className="full-room-nav secondary"><div className="full-nav-room"><NavLink to="/council"><i>⚖</i><span>Palace Council</span></NavLink>{location.pathname.startsWith('/council')&&<div className="full-subnav"><small>SECTIONS</small><span className="restored-static">Council overview</span><span className="restored-static">Moderation desk</span><span className="restored-static">Palace Tidings desk</span><span className="restored-static">Cases & appeals</span></div>}</div><div className="full-nav-room"><NavLink to="/code"><i>§</i><span>The Palace Code</span></NavLink>{location.pathname.startsWith('/code')&&<div className="full-subnav"><small>SECTIONS</small><span className="restored-static">Community conduct</span><span className="restored-static">Safety & privacy</span><span className="restored-static">Member rights</span><span className="restored-static">Appeals</span></div>}</div></nav>
   <div className="sidebar-spacer"/><div className="sidebar-foot full-foot">{session&&<><Link to="/letters">✉ <span>Palace Letters</span></Link><Link to="/activity">◌ <span>Moonlight Activity</span></Link></>}<button className="sidebar-theme" onClick={()=>setDaylight(v=>!v)}>{daylight?'☾ Nightfall':'☼ Daylight'}</button></div>
  </aside>
  <button className="nav-scrim" aria-label="Close navigation" onClick={()=>setNavOpen(false)}/>
  <div className="palace-stage full-stage">
   <header className="topbar full-topbar"><div className="full-topbar-row"><div className="full-brand"><button className="nav-toggle" onClick={()=>setNavOpen(true)} aria-label="Open Palace navigation">☰</button><Link to="/"><span className="brandmark">☾<b>✦</b></span><strong>The Starry Palace</strong></Link><small>BETA</small></div><form className="global-search-live" onSubmit={submitSearch}><span>⌕</span><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search works, writers, tags, fandoms…"/><button>Search</button></form><div className="full-top-actions">{session&&<Link className="top-icon-link" to="/letters" aria-label="Palace Letters">✉</Link>}{session&&<Link className="top-icon-link" to="/activity" aria-label="Notifications">✦</Link>}<Link className="write-action" to={session?'/writing':'/login'}>✎ <span>Write</span></Link></div></div></header>
   <main>{children}</main>
  </div>
  {session&&<div className="floating-controls restored-floating-controls">
    <Link className="float-btn palace-float-sigil notification-anchor" to="/letters" aria-label="Open Palace Letters" title="Palace Letters"><span className="float-letter-art">✉</span>{letterBadge>0&&<span className="float-unread-badge">{letterBadge>99?'99+':letterBadge}</span>}</Link>
    <button className="float-btn theme-orb" onClick={()=>setDaylight(v=>!v)} aria-label={daylight?'Switch to night mode':'Switch to light mode'} title={daylight?'Night mode':'Light mode'}><span className="theme-main">{daylight?'☾':'☼'}</span><span className="theme-star">✦</span></button>
  </div>}
 </div>
}
function Home(){
 return <Frame><section className="home-hero realised"><div className="stars" aria-hidden="true">✦　·　✧　　·　✦　　☾</div><div className="hero-copy"><p className="eyebrow">WRITE AMONG KINDRED STARS.</p><h1>There’s a place<br/>for you here.</h1><p className="lede">Read deeply. Write privately before you publish. Find people without turning creativity into a popularity contest.</p><div className="hero-actions"><Link className="button" to="/reading">Enter the Reading Rooms</Link><Link className="text-link" to="/writing">Open the Writing Chamber →</Link></div></div><aside className="hero-orbit palace-belonging-panel" aria-label="Your Palace, a place to belong"><img className="palace-belonging-art" src="/assets/palace/palace-belonging.gif" alt=""/><span>YOUR PALACE · A PLACE TO BELONG</span><strong>☾</strong><p>Stories, art, communities, heritage and creative life beneath one shared sky.</p><div><b>READ</b><b>WRITE</b><b>GATHER</b><b>KEEP</b></div></aside></section><section className="home-intro-strip"><span>NO ALGORITHM DECIDES ARTISTIC WORTH</span><span>PRIVATE BY CHOICE</span><span>CREATIVE RIGHTS FIRST</span><span>COMMUNITY WITH BOUNDARIES</span></section><section className="room-grid expanded">{rooms.map(([name,path,copy],i)=><Link className={"room-card room-"+i} to={path} key={path}><span>0{i+1}</span><div className="room-glyph">{['◈','▤','✎','♢','✧','♛','⌁'][i]}</div><h2>{name}</h2><p>{copy}</p><b>Enter room →</b></Link>)}</section><section className="palace-paths"><div><p className="eyebrow">A PALACE, NOT A FEED</p><h2>Different rooms for different kinds of attention.</h2><p>Long-form reading does not need to compete with live chat. Private drafts do not need to become public before they are ready. Community, governance and creative ownership each have their own doorway.</p></div><div className="path-list"><Link to="/tags"><span>01</span><strong>Tag Constellation</strong><small>Include what you seek. Exclude what you do not.</small></Link><Link to="/honour"><span>02</span><strong>Throne of Honour</strong><small>Recognition without controlling discovery.</small></Link><Link to="/code"><span>03</span><strong>The Palace Code</strong><small>Rights, safety, moderation and appeals.</small></Link><Link to="/council"><span>04</span><strong>Palace Council</strong><small>Review with a record, not invisible power.</small></Link></div></section><section className="manifesto"><p>EVERY VOICE CARRIES A WORLD.</p><h2>Gather. Have a cup of tea.<br/>Write and read with me.</h2><div><Link to="/reading">Find a story</Link><Link to="/login">Create your chamber</Link></div></section></Frame>
}
function Login(){
 const {session,loading,error:sessionError}=useAuth(); const [mode,setMode]=useState('login'); const [email,setEmail]=useState(''); const [password,setPassword]=useState(''); const [busy,setBusy]=useState(false); const [message,setMessage]=useState(''); const location=useLocation();
 const requested=location.state?.from; const destination=typeof requested==='string'&&requested.startsWith('/')&&!requested.startsWith('//')&&requested!=='/login'?requested:'/chamber';
 if(!loading&&session)return <Navigate to={destination} replace/>;
 function friendly(error){const code=error?.code||'';if(code==='email_not_confirmed')return 'Your account exists, but the email address has not been confirmed yet.';if(code==='over_email_send_rate_limit')return 'Please wait a moment before requesting another email.';if(code==='invalid_credentials')return 'That email and password combination was not recognised.';return error?.message||'Sign-in failed. Please try again.'}
 async function submit(e){e.preventDefault();setBusy(true);setMessage('');try{const result=mode==='signup'?await supabase.auth.signUp({email,password,options:{emailRedirectTo:window.location.origin+'/auth/callback'}}):await supabase.auth.signInWithPassword({email,password});if(result.error)throw result.error;if(mode==='signup'&&!result.data.session)setMessage('Your chamber has been requested. Check your email and tap the confirmation link, then return to the Palace.')}catch(error){setMessage(friendly(error))}finally{setBusy(false)}}
 async function magic(){if(!email){setMessage('Enter your email address first, then choose Send me a magic link.');return}setBusy(true);setMessage('');try{const{error}=await supabase.auth.signInWithOtp({email,options:{emailRedirectTo:window.location.origin+'/auth/callback',shouldCreateUser:true}});if(error)throw error;setMessage('A passwordless entrance link has been sent. Check your email and tap it to enter the Palace.')}catch(error){setMessage(friendly(error))}finally{setBusy(false)}}
 async function google(){setBusy(true);setMessage('');try{const{error}=await supabase.auth.signInWithOAuth({provider:'google',options:{redirectTo:window.location.origin+'/auth/callback'}});if(error)throw error}catch(error){setMessage(friendly(error));setBusy(false)}}
 return <Frame><section className="gate"><div className="gate-copy"><p className="eyebrow">THE PALACE GATES</p><h1>{mode==='signup'?'A place among the stars.':'Welcome home.'}</h1><p>Choose the doorway that suits you. If you use a Palace password, create one for this account — never enter the password for your email inbox.</p></div><div className="auth-panel">{!configured?<p role="alert">Sign-in is not configured.</p>:<><button type="button" className="oauth-button" disabled title="Google entrance is being prepared">Google entrance · coming soon</button><div className="auth-divider"><span>or</span></div><label>Email<input type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/></label><button type="button" className="magic-button" disabled={busy||loading} onClick={magic}>Send me a magic link</button><div className="auth-divider"><span>or use a Palace password</span></div><form onSubmit={submit}><label>Password<input type="password" autoComplete={mode==='signup'?'new-password':'current-password'} minLength={mode==='signup'?8:undefined} required value={password} onChange={e=>setPassword(e.target.value)}/></label><button disabled={busy||loading}>{busy?'Please wait…':mode==='signup'?'Create my chamber':'Enter the Palace'}</button></form><button className="secondary" disabled={busy} onClick={()=>{setMode(mode==='signup'?'login':'signup');setMessage('')}}>{mode==='signup'?'Already a member? Sign in':'New beneath these stars? Create an account'}</button></>}{(message||sessionError)&&<p className="status" role="status">{message||sessionError}</p>}</div></section></Frame>
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

function App(){return <AuthProvider><React.Suspense fallback={<div className="route-loading">Opening this Palace room…</div>}><Routes>
 <Route path="/" element={<Home/>}/><Route path="/login" element={<Login/>}/><Route path="/auth/callback" element={<Callback/>}/>
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
 </Routes></React.Suspense></AuthProvider>}

createRoot(document.getElementById('root')).render(<React.StrictMode><BrowserRouter><App/></BrowserRouter></React.StrictMode>);

