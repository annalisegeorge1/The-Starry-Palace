import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Link, NavLink, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, ProtectedRoute, useAuth } from './auth';
import { configured, supabase } from './supabase';
import './style.css';
import TreasuryCatalogue from './Treasury';
import { ChamberLive, ReadingLive, WritingLive, SettingsLive, ActivityLive, LibraryLive, TagsLive, PalaceLifeLive, LettersLive, EventsLive, TreasuryLive, LostWorksLive, MemberProfileLive, SearchLive, WorkLive, ChapterLive, WorkStudioLive, TagSearchLive } from './liveRooms';

const rooms=[
  ['Reading Rooms','/reading','Read, discover and return to the stories waiting for you.'],
  ['Writing Chamber','/writing','Draft, publish and tend the worlds you are creating.'],
  ['Palace Life','/palace-life','Clubs, Commons, Moonlight Chat and kindred stars.'],
  ['Events & Heritage','/events','Creative gatherings and carefully sourced heritage observances.'],
  ['Royal Treasury','/treasury','Achievements, gifts, court honours and your collection.'],
  ['Lost Works','/lost-works','A rights-conscious preservation archive for works at risk of being lost.']
];

function Frame({children,privateArea=false}){
 const {session}=useAuth();
 return <div className="palace-shell">
  <aside className="sidebar">
   <Link className="crest" to="/"><span className="moon">☾</span><strong>The Starry Palace</strong><small>INKVERSE</small></Link>
   <nav className="room-nav" aria-label="Palace rooms">
    {session&&<NavLink to="/chamber">✦ <span>My Chamber</span></NavLink>}
    {rooms.map(([name,path])=><NavLink key={path} to={path}>◇ <span>{name}</span></NavLink>)}
    {session&&<><NavLink to="/library">☾ <span>My Library</span></NavLink><NavLink to="/letters">✉ <span>Palace Letters</span></NavLink></>}
    <NavLink to="/tags">✧ <span>Tag Constellation</span></NavLink>
   </nav>
   <div className="sidebar-foot">{session?<Link to="/settings">Settings & privacy</Link>:<Link to="/login">Enter the Palace</Link>}</div>
  </aside>
  <div className="palace-stage">
   <header className="topbar"><div><p className="top-kicker">{privateArea?'YOUR PALACE':'GATHER · READ · CREATE'}</p></div><div className="top-actions"><Link to="/search">Search the Palace</Link>{session?<Link className="avatar-link" to="/chamber">{(session.user.email||'P').slice(0,1).toUpperCase()}</Link>:<Link className="pill" to="/login">Sign in</Link>}</div></header>
   <main>{children}</main>
  </div>
 </div>
}

function Home(){
 return <Frame><section className="home-hero"><div className="stars" aria-hidden="true">✦　·　✧　　·　✦</div><p className="eyebrow">WRITE AMONG KINDRED STARS.</p><h1>There’s a place<br/>for you here.</h1><p className="lede">A palace for stories, art, reading rooms and communities beneath one shared sky.</p><div className="hero-actions"><Link className="button" to="/reading">Enter the Reading Rooms</Link><Link className="text-link" to="/writing">Open the Writing Chamber →</Link></div></section><section className="room-grid">{rooms.slice(0,4).map(([name,path,copy],i)=><Link className={"room-card room-"+i} to={path} key={path}><span>0{i+1}</span><h2>{name}</h2><p>{copy}</p><b>Enter room →</b></Link>)}</section><section className="manifesto"><p>EVERY VOICE CARRIES A WORLD.</p><h2>Gather. Have a cup of tea.<br/>Write and read with me.</h2></section></Frame>
}

function Login(){
 const {session,loading,error:sessionError}=useAuth(); const [mode,setMode]=useState('login'); const [email,setEmail]=useState(''); const [password,setPassword]=useState(''); const [busy,setBusy]=useState(false); const [message,setMessage]=useState(''); const location=useLocation();
 const requested=location.state?.from; const destination=typeof requested==='string'&&requested.startsWith('/')&&!requested.startsWith('//')&&requested!=='/login'?requested:'/chamber';
 if(!loading&&session)return <Navigate to={destination} replace/>;
 function friendly(error){const code=error?.code||'';if(code==='email_not_confirmed')return 'Your account exists, but the email address has not been confirmed yet.';if(code==='over_email_send_rate_limit')return 'Please wait a moment before requesting another email.';if(code==='invalid_credentials')return 'That email and password combination was not recognised.';return error?.message||'Sign-in failed. Please try again.'}
 async function submit(e){e.preventDefault();setBusy(true);setMessage('');try{const result=mode==='signup'?await supabase.auth.signUp({email,password,options:{emailRedirectTo:window.location.origin+'/auth/callback'}}):await supabase.auth.signInWithPassword({email,password});if(result.error)throw result.error;if(mode==='signup'&&!result.data.session)setMessage('Your chamber has been requested. Check your email and tap the confirmation link, then return to the Palace.')}catch(error){setMessage(friendly(error))}finally{setBusy(false)}}
 async function magic(){if(!email){setMessage('Enter your email address first, then choose Send me a magic link.');return}setBusy(true);setMessage('');try{const{error}=await supabase.auth.signInWithOtp({email,options:{emailRedirectTo:window.location.origin+'/auth/callback',shouldCreateUser:true}});if(error)throw error;setMessage('A passwordless entrance link has been sent. Check your email and tap it to enter the Palace.')}catch(error){setMessage(friendly(error))}finally{setBusy(false)}}
 async function google(){setBusy(true);setMessage('');try{const{error}=await supabase.auth.signInWithOAuth({provider:'google',options:{redirectTo:window.location.origin+'/auth/callback'}});if(error)throw error}catch(error){setMessage(friendly(error));setBusy(false)}}
 return <Frame><section className="gate"><div className="gate-copy"><p className="eyebrow">THE PALACE GATES</p><h1>{mode==='signup'?'A place among the stars.':'Welcome home.'}</h1><p>Choose the doorway that suits you. Your email password is never required by the Palace.</p></div><div className="auth-panel">{!configured?<p role="alert">Sign-in is not configured.</p>:<><button type="button" className="oauth-button" disabled={busy||loading} onClick={google}>Continue with Google</button><div className="auth-divider"><span>or</span></div><label>Email<input type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/></label><button type="button" className="magic-button" disabled={busy||loading} onClick={magic}>Send me a magic link</button><div className="auth-divider"><span>or use a Palace password</span></div><form onSubmit={submit}><label>Password<input type="password" autoComplete={mode==='signup'?'new-password':'current-password'} minLength={mode==='signup'?8:undefined} required value={password} onChange={e=>setPassword(e.target.value)}/></label><button disabled={busy||loading}>{busy?'Please wait…':mode==='signup'?'Create my chamber':'Enter the Palace'}</button></form><button className="secondary" disabled={busy} onClick={()=>{setMode(mode==='signup'?'login':'signup');setMessage('')}}>{mode==='signup'?'Already a member? Sign in':'New beneath these stars? Create an account'}</button></>}{(message||sessionError)&&<p className="status" role="status">{message||sessionError}</p>}</div></section></Frame>
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

function App(){return <AuthProvider><Routes>
 <Route path="/" element={<Home/>}/><Route path="/login" element={<Login/>}/><Route path="/auth/callback" element={<Callback/>}/>
 <Route path="/chamber" element={<ProtectedRoute><ChamberLive Frame={Frame}/></ProtectedRoute>}/>
 <Route path="/reading" element={<ReadingLive Frame={Frame}/>}/>
 <Route path="/writing" element={<ProtectedRoute><WritingLive Frame={Frame}/></ProtectedRoute>}/>
 <Route path="/writing/:slug" element={<ProtectedRoute><WorkStudioLive Frame={Frame}/></ProtectedRoute>}/>
 <Route path="/work/:slug" element={<WorkLive Frame={Frame}/>}/>
 <Route path="/work/:slug/chapter/:chapterId" element={<ChapterLive Frame={Frame}/>}/>
 <Route path="/palace-life" element={<ProtectedRoute><PalaceLifeLive Frame={Frame}/></ProtectedRoute>}/>
 <Route path="/events" element={<EventsLive Frame={Frame}/>}/>
 <Route path="/treasury" element={<ProtectedRoute><TreasuryLive Frame={Frame}/></ProtectedRoute>}/>
 <Route path="/treasury/catalogue" element={<ProtectedRoute><TreasuryCatalogue Frame={Frame}/></ProtectedRoute>}/>
 <Route path="/lost-works" element={<LostWorksLive Frame={Frame}/>}/>
 <Route path="/settings" element={<ProtectedRoute><SettingsLive Frame={Frame}/></ProtectedRoute>}/>
 <Route path="/activity" element={<ProtectedRoute><ActivityLive Frame={Frame}/></ProtectedRoute>}/>
 <Route path="/library" element={<ProtectedRoute><LibraryLive Frame={Frame}/></ProtectedRoute>}/>
 <Route path="/letters" element={<ProtectedRoute><LettersLive Frame={Frame}/></ProtectedRoute>}/>
 <Route path="/tags" element={<TagSearchLive Frame={Frame}/>}/>
 <Route path="/search" element={<SearchLive Frame={Frame}/>}/>
 <Route path="/member/:username" element={<MemberProfileLive Frame={Frame}/>}/>
 <Route path="*" element={<Frame><section className="room-title"><p className="eyebrow">BEYOND THE GATES</p><h1>You left palace grounds.</h1><Link className="button" to="/">Return to the Palace</Link></section></Frame>}/>
 </Routes></AuthProvider>}

createRoot(document.getElementById('root')).render(<React.StrictMode><BrowserRouter><App/></BrowserRouter></React.StrictMode>);
