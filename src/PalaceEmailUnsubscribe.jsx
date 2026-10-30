import React,{useEffect,useState} from 'react';
import {Link,useSearchParams} from 'react-router-dom';
import {supabase} from './supabase';
const UUID=/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;

/** Public opt-out path; the token can only disable emails, never reveal a user. */
export default function PalaceEmailUnsubscribe(){
 const [params]=useSearchParams();
 const [state,setState]=useState('working');
 const token=params.get('token');
 useEffect(()=>{
  let active=true;
  if(typeof window!=='undefined')window.history.replaceState(null,'','/email/unsubscribe');
  if(!token||!UUID.test(token)){setState('invalid');return()=>{active=false};}
  if(!supabase){setState('unavailable');return()=>{active=false};}
  supabase.rpc('palace_email_unsubscribe',{p_token:token})
   .then(({data,error})=>{if(active)setState(error?'unavailable':data===true?'done':'invalid')})
   .catch(()=>{if(active)setState('unavailable')});
  return()=>{active=false};
 },[token]);
 const messages={
  working:'Updating your Palace email preference…',
  done:'You have been unsubscribed from Palace activity emails. Sign-in and security emails remain separate.',
  invalid:'This unsubscribe link is invalid or has expired. You can also change email preferences in your Palace settings.',
  unavailable:'Email preferences are temporarily unavailable. Please return to Palace settings to change them.'
 };
 return <main className="palace-email-unsubscribe" style={{maxWidth:600,margin:'4rem auto',padding:'2rem',textAlign:'center'}}>
  <p className="eyebrow">THE STARRY PALACE</p><h1>Manage your Palace emails</h1>
  <p role="status">{messages[state]}</p>
  <p><Link to="/settings?tab=notifications">Notification settings</Link> · <Link to="/">Return to the Palace</Link></p>
 </main>;
}
