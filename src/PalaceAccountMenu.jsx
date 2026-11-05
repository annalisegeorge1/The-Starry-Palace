import React,{useEffect,useRef,useState} from 'react';
import {Link,useLocation,useNavigate} from 'react-router-dom';
import {supabase} from './supabase';

/** Use Supabase Auth, not a local-only UI reset, so the session really ends. */
export function PalaceSignOutButton({className='',onSignedOut,children='Sign Out'}){
 const navigate=useNavigate();
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 async function signOut(){
  if(busy)return;
  setBusy(true);setError('');
  try{
   if(!supabase)throw new Error('Authentication is not available right now.');
   const {error:authError}=await supabase.auth.signOut();
   if(authError)throw authError;
   onSignedOut?.();
   navigate('/',{replace:true});
  }catch(e){
   setError(e?.message||'Could not sign out. Please try again.');
  }finally{setBusy(false)}
 }
 return <span className="palace-sign-out-control">
  <button type="button" className={className} onClick={signOut} disabled={busy}>{busy?'Signing out…':children}</button>
  {error&&<small className="palace-sign-out-error" role="alert">{error}</small>}
 </span>;
}

/** Native disclosure supports keyboard activation without a hover-only menu. */
export function PalaceAccountMenu({profilePath='/chamber'}){
 const detailsRef=useRef(null);
 const location=useLocation();
 useEffect(()=>{if(detailsRef.current)detailsRef.current.open=false},[location.pathname,location.search]);
 useEffect(()=>{
  const closeOnOutsideClick=e=>{
   if(detailsRef.current?.open&&!detailsRef.current.contains(e.target))detailsRef.current.open=false;
  };
  const closeOnEscape=e=>{
   if(e.key==='Escape'&&detailsRef.current?.open){
    detailsRef.current.open=false;
    detailsRef.current.querySelector('summary')?.focus();
   }
  };
  document.addEventListener('pointerdown',closeOnOutsideClick);
  document.addEventListener('keydown',closeOnEscape);
  return()=>{document.removeEventListener('pointerdown',closeOnOutsideClick);document.removeEventListener('keydown',closeOnEscape)};
 },[]);
 return <details className="palace-account-menu" ref={detailsRef}>
  <summary className="top-icon-link palace-top-profile-trigger" aria-label="Account menu — profile, settings and sign out" title="Account menu · Sign Out">
   <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="3.5"/><path d="M4.5 20c.5-4.1 3.1-6.2 7.5-6.2s7 2.1 7.5 6.2"/></svg><span className="palace-account-menu-chevron" aria-hidden="true">⌄</span>
  </summary>
  <nav className="palace-account-menu-popover" aria-label="Account options">
   <span className="palace-account-menu-caption">YOUR PALACE ACCOUNT</span>
   <Link to={profilePath} onClick={()=>{detailsRef.current.open=false}}>My profile</Link>
   <Link to="/settings?tab=account" onClick={()=>{detailsRef.current.open=false}}>Account settings</Link>
   <PalaceSignOutButton className="palace-account-sign-out" onSignedOut={()=>{if(detailsRef.current)detailsRef.current.open=false}}/>
  </nav>
 </details>;
}
